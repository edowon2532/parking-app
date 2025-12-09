# Apartment Parking App

## Project Setup

This project consists of a React frontend and a Python FastAPI backend.

### Prerequisites

- Node.js
- Python 3.8+
- Supabase account (credentials in `.env`)

### Installation

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### Running the Application

You need to run both the frontend and backend servers.

1. **Start the Backend Server:**
   ```bash
   npm run dev:backend
   ```
   This will start the FastAPI server on http://localhost:8000.

2. **Start the Frontend Server:**
   ```bash
   npm run dev
   ```
   This will start the Vite development server.

### Features

- Vehicle Registration
- Vehicle Search
- License Plate Recognition (OCR)
- History Tracking
# parking-app
