#!/bin/bash

echo "Starting Image Labeling Tool in development mode..."
echo ""
echo "This will start two processes:"
echo "1. FastAPI backend on http://localhost:8000"
echo "2. Vite frontend dev server (check output for URL)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# 启动FastAPI后端
echo "Starting FastAPI backend..."
cd "$(dirname "$0")"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动Vite前端
echo "Starting Vite frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
