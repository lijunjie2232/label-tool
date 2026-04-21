from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(__file__))

app = FastAPI(title="Image Labeling Tool")

# CORS配置(开发时需要)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# 注册路由
from backend.routers import dataset, images, annotations, inference
app.include_router(dataset.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(annotations.router, prefix="/api")
app.include_router(inference.router, prefix="/api")

# 提供前端静态文件
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    # 挂载静态资源文件(css, js, images等)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
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
