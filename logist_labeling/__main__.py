from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import sys
from importlib.resources import files

# Get the package directory
package_dir = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Image Labeling Tool")

# CORS配置(开发时需要)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# 注册路由 - use absolute imports from the package
try:
    from logist_labeling.backend.routers import dataset, images, annotations, inference
    app.include_router(dataset.router, prefix="/api")
    app.include_router(images.router, prefix="/api")
    app.include_router(annotations.router, prefix="/api")
    app.include_router(inference.router, prefix="/api")
except ImportError:
    # Fallback for development mode
    sys.path.insert(0, os.path.dirname(package_dir))
    from backend.routers import dataset, images, annotations, inference
    app.include_router(dataset.router, prefix="/api")
    app.include_router(images.router, prefix="/api")
    app.include_router(annotations.router, prefix="/api")
    app.include_router(inference.router, prefix="/api")

# 提供前端静态文件
frontend_dist = os.path.join(package_dir, "frontend_dist")
if os.path.exists(frontend_dist):
    # 挂载静态资源文件(css, js, images等)
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    # SPA路由回退 - 所有其他请求返回index.html
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # 排除API路由
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend not built"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
