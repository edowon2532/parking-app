from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import easyocr
import numpy as np
import cv2
from PIL import Image
import io
import re

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models
car_model = None
lp_model = None
reader = None

def load_models():
    global car_model, lp_model, reader
    print("Loading models...")
    # Load YOLOv5 models
    # Note: We use the local path for custom model, but 'yolov5s' is loaded from hub
    # Force CPU to avoid MPS/CPU mismatch errors on Mac
    car_model = torch.hub.load("ultralytics/yolov5", 'yolov5s', force_reload=False, skip_validation=True, device='cpu')
    car_model.classes = [2, 3, 5, 7] # Car, Motorcycle, Bus, Truck

    lp_model = torch.hub.load('ultralytics/yolov5', 'custom', 'backend/lp_det.pt', device='cpu')
    
    # Load EasyOCR
    # user_network_directory needs to be absolute or relative to CWD. 
    # Since we run from parking-app root usually, or backend root. 
    # Let's assume running from parking-app root, so 'backend/lp_models/...'
    # But if we run `python backend/main.py` inside backend, it differs.
    # Let's assume we run `uvicorn backend.main:app` from `parking-app` directory.
    reader = easyocr.Reader(['ko', 'en'], 
                            detect_network='craft', 
                            user_network_directory='backend/lp_models/user_network', 
                            model_storage_directory='backend/lp_models/models',
                            gpu=False) # Force CPU
    print("Models loaded.")

@app.on_event("startup")
async def startup_event():
    load_models()

def process_image(image_bytes):
    im = Image.open(io.BytesIO(image_bytes))
    # Convert to numpy for some ops if needed, but YOLO takes PIL
    
    # 1. Detect Cars
    results = car_model(im)
    locs = results.xyxy[0]
    
    detected_texts = []

    # Helper to process plate
    def recognize_plate(plate_img_pil):
        # Convert to CV2 grayscale for EasyOCR
        open_cv_image = np.array(plate_img_pil) 
        # Convert RGB to BGR 
        open_cv_image = open_cv_image[:, :, ::-1].copy() 
        gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
        
        # Preprocessing: Histogram Equalization (Contrast)
        gray = cv2.equalizeHist(gray)
        # Preprocessing: Gaussian Blur (Noise Reduction)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Resize to match model input size (imgW: 200, imgH: 60)
        # Reverting to fixed size as requested by user (Original working version)
        gray = cv2.resize(gray, (200, 60))
        
        # License Plate Character whitelist - Official Korean LP characters
        valid_korean = '가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주아바사자배하허호'
        allowed_chars = '0123456789' + valid_korean + ' '
        
        result = reader.recognize(gray, allowlist=allowed_chars)

        if result:
            full_text = "".join([res[1] for res in result]).replace(" ", "")
            
            # Rule: Ignore left blue design area (by using regex search which skips prefix noise)
            # Rule: Finds digits(2,3) + Korean(1) + digits(4)
            match = re.search(r'([0-9]{2,3})[' + valid_korean + r']([0-9]{4})', full_text)
            
            if match:
                return match.group(0)
                
        return None

    if len(locs) == 0:
        # No car detected, try detecting plate on whole image
        lp_results = lp_model(im)
        for rslt in lp_results.xyxy[0]:
            x1, y1, x2, y2 = [int(x) for x in rslt[:4]]
            plate_crop = im.crop((x1, y1, x2, y2))
            text = recognize_plate(plate_crop)
            if text:
                detected_texts.append({"text": text, "box": [x1, y1, x2, y2]})
    else:
        # Car detected, crop car then detect plate
        for *box, conf, cls in locs:
            x1, y1, x2, y2 = [int(x) for x in box]
            car_crop = im.crop((x1, y1, x2, y2))
            
            lp_results = lp_model(car_crop)
            for rslt in lp_results.xyxy[0]:
                px1, py1, px2, py2 = [int(x) for x in rslt[:4]]
                # Calculate absolute coordinates on original image
                abs_x1 = x1 + px1
                abs_y1 = y1 + py1
                abs_x2 = x1 + px2
                abs_y2 = y1 + py2
                
                plate_crop = car_crop.crop((px1, py1, px2, py2))
                text = recognize_plate(plate_crop)
                if text:
                    detected_texts.append({"text": text, "box": [abs_x1, abs_y1, abs_x2, abs_y2]})

    return detected_texts

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    print("Analyze request received")
    contents = await file.read()
    print(f"Image received, size: {len(contents)} bytes")
    try:
        # Run CPU-intensive task in threadpool to avoid blocking the event loop
        from fastapi.concurrency import run_in_threadpool
        results = await run_in_threadpool(process_image, contents)
        
        print(f"Process results: {results}")
        # Return the first detected result or failure
        if results:
            return {"text": results[0]["text"], "box": results[0]["box"], "all_candidates": results}
        else:
            print("No text detected")
            return {"text": "인식실패", "box": None, "all_candidates": []}
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {"text": "오류발생", "error": str(e)}

from fastapi.staticfiles import StaticFiles
import os

# Static file mount moved to end

# --- API Endpoints ---
from pydantic import BaseModel
from typing import List, Optional
try:
    import backend.database as db
except ImportError:
    import database as db
import pandas as pd
from fastapi.responses import FileResponse
import shutil

class VehicleModel(BaseModel):
    plateNumber: str
    ownerName: str
    dong: str
    ho: str
    phoneNumber: str
    type: Optional[str] = "unidentified" # resident, staff, unidentified

class VehicleUpdateModel(BaseModel):
    id: str
    plateNumber: str
    ownerName: str
    dong: str
    ho: str
    phoneNumber: str
    type: Optional[str] = None
    violations: Optional[List[dict]] = None
    registeredAt: Optional[str] = None

class ViolationModel(BaseModel):
    reason: str

class HistoryModel(BaseModel):
    type: str # call or report
    plateNumber: str
    ownerName: str
    unitNumber: Optional[str] = ""
    note: Optional[str] = ""
    description: Optional[str] = ""
    image: Optional[str] = ""
    thumbnail: Optional[str] = ""
    reporterName: Optional[str] = ""

@app.get("/api/vehicles")
def get_vehicles_api():
    return db.get_vehicles()

@app.post("/api/vehicles")
def add_vehicle_api(vehicle: VehicleModel):
    return db.add_vehicle(vehicle.dict())

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle_api(vehicle_id: str, vehicle: VehicleUpdateModel):
    return db.update_vehicle(vehicle_id, vehicle.dict(exclude_unset=True))

@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle_api(vehicle_id: str):
    success = db.delete_vehicle(vehicle_id)
    return {"success": success}

@app.post("/api/vehicles/{vehicle_id}/violations")
def add_violation_api(vehicle_id: str, violation: ViolationModel):
    return db.add_violation(vehicle_id, violation.dict())

@app.get("/api/history")
def get_history_api():
    return db.get_history()

@app.post("/api/history")
def add_history_api(item: HistoryModel):
    return db.add_history(item.dict())

# --- Image Upload ---
import uuid

UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads directory to serve images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)
        thumb_filename = f"thumb_{filename}"
        thumb_path = os.path.join(UPLOAD_DIR, thumb_filename)
        
        # Resize main image if too large (max 1024px)
        max_size = 1024
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            
        # Convert to RGB (in case of RGBA) and save
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.save(file_path, "JPEG", quality=85)
        
        # Generate thumbnail (max 200px)
        thumb_size = 200
        thumbnail = image.copy()
        thumbnail.thumbnail((thumb_size, thumb_size))
        thumbnail.save(thumb_path, "JPEG", quality=80)
        
        # Return URLs (assuming server runs on same host/port, client will prepend base URL if needed)
        # Or return relative paths that frontend can use
        return {
            "url": f"/uploads/{filename}",
            "thumbnail": f"/uploads/{thumb_filename}"
        }
        
    except Exception as e:
        print(f"Image upload error: {e}")
        return {"error": str(e)}

# --- Excel Upload ---

@app.get("/api/vehicles/template")
def get_template():
    # Create a sample dataframe
    df = pd.DataFrame({
        "차량번호": ["12가3456", "34나5678"],
        "차주명": ["홍길동", "김철수"],
        "동": ["101", "102"],
        "호": ["1001", "202"],
        "전화번호": ["010-1234-5678", "010-9876-5432"],
        "구분": ["입주민", "직원"] # resident, staff
    })
    
    file_path = "backend/template.xlsx"
    df.to_excel(file_path, index=False)
    return FileResponse(file_path, filename="vehicle_registration_template.xlsx")

@app.post("/api/vehicles/upload")
async def upload_vehicles(file: UploadFile = File(...), replace: bool = False):
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
        
        # Map columns
        # Expected: 차량번호, 차주명, 동, 호, 전화번호, 구분
        # Map to: plateNumber, ownerName, dong, ho, phoneNumber, type
        
        vehicles_to_add = []
        
        type_map = {"입주민": "resident", "직원": "staff", "방문객": "unidentified", "미확인": "unidentified"}
        
        for _, row in df.iterrows():
            v_type = type_map.get(row.get("구분", "입주민"), "resident")
            
            vehicle = {
                "plateNumber": str(row.get("차량번호", "")),
                "ownerName": str(row.get("차주명", "")),
                "dong": str(row.get("동", "")),
                "ho": str(row.get("호", "")),
                "phoneNumber": str(row.get("전화번호", "")),
                "type": v_type
            }
            vehicles_to_add.append(vehicle)
            
        if replace:
            db.delete_all_vehicles()
            
        result = db.bulk_add_vehicles(vehicles_to_add)
        return result
        
    except Exception as e:
        print(f"Excel upload error: {e}")
        return {"error": str(e)}

# Mount static files if dist directory exists
# This must be at the end to avoid capturing API routes
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
