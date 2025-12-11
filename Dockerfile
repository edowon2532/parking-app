# Build Stage for Frontend
FROM node:20 as build-frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Set API URL to empty string so requests go to same origin (handled by FastAPI static serving)
ENV VITE_API_URL=""
RUN npm run build

# Runtime Stage for Backend
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and other libs
# Install system dependencies for OpenCV and other libs
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libx11-6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*


# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Copy built frontend from build stage
COPY --from=build-frontend /app/dist ./dist

# Create uploads directory
RUN mkdir -p backend/uploads

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
