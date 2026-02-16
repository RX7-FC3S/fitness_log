import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.fitness.router import router as fitness_router

app = FastAPI(title="Fitness Log")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fitness_router)

# Serve Static Files (Vue Build)
# Define the static directory path
static_dir = os.path.join(os.path.dirname(__file__), "static")

# Catch-all route for Single Page Application (SPA)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Exclude API routes from catch-all if they weren't matched
    if full_path.startswith("api/"):
        return {"detail": "Not Found"}
        
    # Check if the requested path corresponds to a real file in the static directory
    file_path = os.path.join(static_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for Vue Router (History mode)
    index_path = os.path.join(static_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return {"detail": "Frontend not built or index.html missing"}
