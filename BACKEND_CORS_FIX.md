# Backend CORS Configuration

## Problem
The frontend (running on `http://localhost:5173`) cannot connect to the backend API (`http://127.0.0.1:8000`) due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution
Add CORS middleware to your FastAPI backend server.

## Implementation

### 1. Install FastAPI CORS Middleware (if not already installed)
```bash
pip install fastapi[all]
```

### 2. Update your FastAPI main file (usually `main.py` or `app.py`)

Add the following code:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://localhost:5174",      # Alternative Vite port
    "http://127.0.0.1:5173",      # Alternative localhost
    "http://127.0.0.1:5174",
    # Add production URLs here when deploying
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Allows specific origins
    allow_credentials=True,         # Allows cookies and authorization headers
    allow_methods=["*"],            # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allows all headers
)

# Your existing routes below...
```

### 3. For Development Only (Less Secure)

If you want to allow **all origins** during development (NOT recommended for production):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # WARNING: Allows ANY origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Restart Your Backend Server

After adding CORS middleware, restart your backend server:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Why This Happens

- **Browsers** enforce CORS for security - they block cross-origin requests by default
- **Postman/Insomnia** don't enforce CORS because they're not browsers
- The frontend (`localhost:5173`) and backend (`127.0.0.1:8000`) are considered different origins

## Verification

After adding CORS middleware, the frontend should successfully connect to the backend. The browser console errors will disappear, and login will work properly.

## Production Considerations

For production deployment:

1. Replace `allow_origins=["*"]` with specific production URLs
2. Consider using environment variables for origins:

```python
import os

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
```

3. Set environment variable:
```bash
export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```
