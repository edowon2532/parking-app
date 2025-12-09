import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def log_error(msg):
    print(f"ERROR: {datetime.now()}: {msg}")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = None

if url and key:
    try:
        supabase = create_client(url, key)
        log_error("Supabase client initialized successfully.")
    except Exception as e:
        log_error(f"Failed to initialize Supabase client: {e}")
else:
    log_error("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

def get_vehicles():
    if not supabase: return []
    try:
        response = supabase.table("vehicles").select("*").execute()
        return response.data
    except Exception as e:
        log_error(f"Error fetching vehicles: {e}")
        print(f"Error fetching vehicles: {e}")
        return []

def add_vehicle(vehicle):
    if not supabase: 
        log_error("add_vehicle called but supabase client is None.")
        return None
    try:
        if "id" not in vehicle:
            vehicle["id"] = str(int(datetime.now().timestamp() * 1000))
        
        vehicle["registeredAt"] = datetime.now().isoformat()
        if "violations" not in vehicle:
            vehicle["violations"] = []
            
        response = supabase.table("vehicles").insert(vehicle).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        log_error(f"Error adding vehicle: {e}")
        print(f"Error adding vehicle: {e}")
        return None

def bulk_add_vehicles(vehicles):
    if not supabase: return {"added": [], "failed": []}
    added = []
    failed = []
    
    for v in vehicles:
        res = add_vehicle(v)
        if res:
            added.append(res)
        else:
            failed.append(v)
    return {"added": added, "failed": failed}

def delete_all_vehicles():
    if not supabase: return False
    try:
        # Delete all rows. Supabase requires a WHERE clause for delete.
        # id is not null is a safe bet.
        response = supabase.table("vehicles").delete().neq("id", "0").execute()
        return True
    except Exception as e:
        log_error(f"Error deleting all vehicles: {e}")
        return False

def update_vehicle(vehicle_id, updated_data):
    if not supabase: return None
    try:
        response = supabase.table("vehicles").update(updated_data).eq("id", vehicle_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        log_error(f"Error updating vehicle: {e}")
        print(f"Error updating vehicle: {e}")
        return None

def delete_vehicle(vehicle_id):
    if not supabase: return False
    try:
        response = supabase.table("vehicles").delete().eq("id", vehicle_id).execute()
        return True if response.data else False
    except Exception as e:
        log_error(f"Error deleting vehicle: {e}")
        print(f"Error deleting vehicle: {e}")
        return False

def add_violation(vehicle_id, violation):
    if not supabase: return None
    try:
        current = supabase.table("vehicles").select("violations").eq("id", vehicle_id).execute()
        if not current.data:
            return None
            
        violations = current.data[0].get("violations") or []
        
        violation["id"] = str(int(datetime.now().timestamp() * 1000))
        violation["date"] = datetime.now().isoformat()
        violations.append(violation)
        
        response = supabase.table("vehicles").update({"violations": violations}).eq("id", vehicle_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        log_error(f"Error adding violation: {e}")
        print(f"Error adding violation: {e}")
        return None

# --- History ---

def get_history():
    if not supabase: return []
    try:
        response = supabase.table("history").select("*").order("timestamp", desc=True).execute()
        data = response.data
        # Map snake_case to camelCase
        for item in data:
            if "reporter_name" in item:
                item["reporterName"] = item.pop("reporter_name")
        return data
    except Exception as e:
        log_error(f"Error fetching history: {e}")
        print(f"Error fetching history: {e}")
        return []

def add_history(item):
    if not supabase: return None
    try:
        if "id" not in item:
            item["id"] = str(int(datetime.now().timestamp() * 1000))
        item["timestamp"] = datetime.now().isoformat()
        
        # Map camelCase to snake_case for DB
        if "reporterName" in item:
            item["reporter_name"] = item.pop("reporterName")
            
        response = supabase.table("history").insert(item).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        log_error(f"Error adding history: {e}")
        print(f"Error adding history: {e}")
        return None
