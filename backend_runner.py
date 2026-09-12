import uvicorn
from backend.api.server import app

if __name__ == "__main__":
    print("Starting InternLoom backend on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
