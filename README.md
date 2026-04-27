# Image Labeling Tool

一个基于FastAPI和React的图像评分标注工具,用于逻辑模型训练数据标注。

## 功能特性

- **数据集管理**: 创建和管理多个数据集配置
- **图像列表浏览**: 递归扫描目录,支持排序和过滤
- **标注界面**: 高效的键盘快捷键支持
- **批量操作**: 对多张图像进行批量标注操作
- **推理集成**: 支持模型推理结果查看和合并
- **导入导出**: CSV格式的标注数据导入导出

## 技术栈

### 后端
- FastAPI - Python Web框架
- Pandas - CSV数据处理
- Pillow - 图像处理

### 前端
- React 18
- Ant Design - UI组件库
- Axios - HTTP客户端
- react-zoom-pan-pinch - 图像缩放/拖拽

## 安装

### 前置要求
- Python 3.10+
- Node.js 24+
- uv (Python包管理器)

### 从源码安装(开发模式)

**后端依赖安装:**

```bash
cd label-tool
uv sync
```

**前端依赖安装:**

```bash
cd frontend
npm install
```

### 从Wheel安装(生产模式)

**构建Wheel:**

```bash
# 首先构建前端
cd frontend
npm run build
cd ..

# 然后构建Python wheel
python -m pip install build --break-system-packages
python -m build --wheel
```

生成的wheel文件位于 `dist/logist_labeling-0.1.0-py3-none-any.whl`

**安装Wheel:**

```bash
python -m pip install dist/logist_labeling-0.1.0-py3-none-any.whl --break-system-packages
```

**运行应用:**

```bash
# 使用CLI命令(推荐)
logist-labeling start

# 自定义主机和端口
logist-labeling start --host 0.0.0.0 --port 9000

# 开发模式(自动重载)
logist-labeling start --reload

# 或者使用Python模块
python -m logist_labeling

# 或者使用uvicorn
uvicorn logist_labeling.__main__:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000 使用应用。

## 启动应用

### 开发模式(推荐)

**单一命令启动(前后端分离):**
```bash
./start_dev.sh
```
这会同时启动:
- FastAPI后端: http://localhost:8000 (API服务)
- Vite前端: http://localhost:5173 (开发服务器,支持热更新)

访问 http://localhost:5173 使用应用。

**或者分别启动:**

**终端1 - 后端:**
```bash
uv run uvicorn main:app --reload --port 8000
```

**终端2 - 前端:**
```bash
cd frontend
npm run dev
```

### 生产模式(单一端口)

FastAPI直接提供前端静态文件,只需一个端口:

**构建前端:**
```bash
cd frontend
npm run build
```

**启动应用:**
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000 使用应用。

**优势:**
- ✅ 单一端口,简化部署
- ✅ 无需配置反向代理
- ✅ 适合Docker容器化部署

## 使用说明

### 1. 创建数据集

1. 在"Dataset List"页面输入数据集根路径(绝对路径)
2. 配置参数:
   - Min Score: 最小分数(默认0)
   - Max Score: 最大分数(默认10)
   - Score Step: 分数步长(默认1)
   - Image Regex: 图像文件正则过滤器
   - Annotated Images Position: 已标注图像位置(top/bottom/not_set)
3. 点击"Create Dataset"

**删除数据集:**
- 在"Existing Datasets"列表中,点击数据集右侧的垃圾桶图标
- 确认删除对话框会提示这只会移除配置,不会删除磁盘上的数据

### 2. 浏览图像

在"Image List"页面:
- 选择子目录(可选)
- 选择排序方式(File Name / File Size)
- 设置已标注图像位置
- 查看图像缩略图、路径、尺寸和分数
- 使用复选框选择多张图像进行批量操作

### 3. 标注图像

点击"Annotate"按钮或图像缩略图进入标注视图:

**键盘快捷键:**
- `PageUp` / `↑`: 上一张图像
- `PageDown` / `↓`: 下一张图像
- `Backspace`: 聚焦到分数输入框并全选
- `Enter`: 提交当前标注
- `+`: 分数增加一个步长
- `-`: 分数减少一个步长

### 4. 批量操作

在Image List页面选中多张图像后,可以使用批量操作:
- Delete Selected: 标记选中图像为删除(添加.del后缀)
- Clear Annotations: 清除选中图像的标注
- Set Score to...: 设置选中图像的分数
- Add Score Step: 选中图像分数加步长
- Subtract Score Step: 选中图像分数减步长

### 5. 推理功能

**执行推理:**
```python
# 后端API
POST /api/datasets/{root_path}/infer
```

这会生成 `infer_{timestamp}.csv` 文件。

**查看推理结果:**
在"Inference Results"页面选择推理结果文件查看。

**合并推理结果:**
在"Merge Results"页面可以:
- 逐个审核并修改推理分数
- 或一键合并所有推理结果到标注文件

### 6. 导入导出标注

**导出:**
```bash
POST /api/datasets/{root_path}/annotations/export
```

**导入:**
```bash
POST /api/datasets/{root_path}/annotations/import
```
上传CSV文件,格式:
```csv
image_path,score
path/to/image1.jpg,7.5
path/to/image2.png,3.2
```

## API文档

启动后端后访问 http://localhost:8000/docs 查看完整的API文档。

## 项目结构

```
label-tool/
├── logist_labeling/              # Python包
│   ├── __init__.py         # 包初始化
│   ├── __main__.py         # 应用入口点
│   ├── backend/            # FastAPI后端
│   │   ├── models.py       # Pydantic数据模型
│   │   ├── routers/        # API路由
│   │   ├── services/       # 业务逻辑层
│   │   └── utils/          # 工具函数
│   └── frontend_dist/      # 前端构建产物(生产模式)
├── frontend/               # React前端源码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── services/       # API调用
│   │   └── App.jsx         # 主应用
│   └── package.json
├── configs/                # 数据集配置存储(自动生成)
├── pyproject.toml          # Python依赖和打包配置
├── MANIFEST.in             # 打包文件清单
└── start_dev.sh            # 开发启动脚本
```

## 数据存储

- **数据集配置**: 存储在 `configs/` 目录下的JSON文件
- **标注数据**: 存储在各数据集根目录下的 `annotations.csv`
- **推理结果**: 存储在各数据集根目录下的 `infer_{timestamp}.csv`
- **删除的图像**: 添加 `.del` 后缀,不会真正删除

## 扩展Inferencer

要使用自定义模型,创建Inferencer的子类:

```python
from backend.services.inferencer import Inferencer

class MyModelInferencer(Inferencer):
    def predict(self, image_path: str) -> float:
        # 加载模型并进行推理
        # 返回0-10之间的分数
        return score
```

然后在推理路由中使用你的Inferencer替换DummyInferencer。

## 常见问题

**Q: 图像无法预览?**
A: 检查图像路径是否正确,确保文件存在且未被删除(.del后缀)。

**Q: 标注保存失败?**
A: 检查数据集根目录是否有写权限。

**Q: 如何恢复删除的图像?**
A: 移除图像文件名的 `.del` 后缀即可。

## License

MIT
