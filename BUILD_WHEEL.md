# Building and Installing the Label Tool Wheel

This guide explains how to build and install the Label Tool as a Python wheel package.

## Quick Start

### Build the Wheel

```bash
# Option 1: Use the build script (recommended)
./build_wheel.sh

# Option 2: Manual build
cd frontend
npm run build
cd ..
python -m build --wheel
```

### Install the Wheel

```bash
python -m pip install dist/logist_labeling-0.1.0-py3-none-any.whl --break-system-packages
```

### Run the Application

```bash
# Option 1: Using CLI command (recommended)
logist-labeling start

# Option 2: With custom host and port
logist-labeling start --host 0.0.0.0 --port 9000

# Option 3: Development mode with auto-reload
logist-labeling start --reload

# Option 4: Using Python module
python -m logist_labeling

# Option 5: Using uvicorn
uvicorn logist_labeling.__main__:app --host 0.0.0.0 --port 8000
```

Access the application at http://localhost:8000

## Detailed Build Process

### Prerequisites

1. **Python 3.10+**
2. **Node.js 24+** (for building frontend)
3. **npm** (Node.js package manager)
4. **Python build tools**

**Option 1: Using virtual environment (recommended)**
```bash
# Create virtual environment (if not exists)
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Install build tool
pip install build
```

**Option 2: System-wide installation**
```bash
python -m pip install build --break-system-packages
```

### Step-by-Step Build

#### 1. Build the Frontend

The frontend must be built before creating the wheel:

```bash
cd frontend
npm install
npm run build
cd ..
```

This creates the production-ready frontend files in `frontend/dist/`.

#### 2. Prepare the Package

The build process automatically copies frontend assets to the package:

```bash
mkdir -p logist_labeling/frontend_dist
cp -r frontend/dist/* logist_labeling/frontend_dist/
```

#### 3. Build the Wheel

**Using virtual environment:**
```bash
# Activate venv (if not already activated)
source .venv/bin/activate

# Clean previous builds
rm -rf build dist *.egg-info logist_labeling.egg-info

# Build the wheel
python -m build --wheel
```

**Using system Python:**
```bash
# Clean previous builds
rm -rf build dist *.egg-info logist_labeling.egg-info

# Build the wheel
python -m build --wheel
```

The wheel will be created in the `dist/` directory.

## Package Structure

The wheel contains:

```
logist_labeling/
├── __init__.py          # Package initialization
├── __main__.py          # Entry point for `python -m logist_labeling`
├── backend/             # FastAPI backend code
│   ├── models.py
│   ├── routers/
│   ├── services/
│   └── utils/
└── frontend_dist/       # Built frontend assets
    ├── index.html
    ├── assets/
    │   ├── *.js
    │   └── *.css
    └── *.svg
```

## Installation Options

### System-wide Installation

```bash
python -m pip install dist/logist_labeling-0.1.0-py3-none-any.whl --break-system-packages
```

### User Installation

```bash
python -m pip install dist/logist_labeling-0.1.0-py3-none-any.whl --user
```

### Virtual Environment (Recommended for Development)

```bash
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows

pip install dist/logist_labeling-0.1.0-py3-none-any.whl
```

## Running the Application

After installation, you have several options to run the application:

### Option 1: CLI Command (Recommended)

```bash
logist-labeling start
```

**With custom options:**
```bash
logist-labeling start --host 0.0.0.0 --port 9000
logist-labeling start --reload  # Development mode
```

### Option 2: Python Module

```bash
python -m logist_labeling
```

### Option 3: Uvicorn Directly

```bash
uvicorn logist_labeling.__main__:app --host 0.0.0.0 --port 8000
```

### Option 3: With Reload (Development)

```bash
uvicorn logist_labeling.__main__:app --reload --host 0.0.0.0 --port 8000
```

### Option 4: Custom Port

```bash
uvicorn logist_labeling.__main__:app --host 0.0.0.0 --port 9000
```

## Configuration

### Data Storage

- **Dataset configs**: Stored in `configs/` directory (created automatically)
- **Annotations**: Stored as `annotations.csv` in each dataset root directory
- **Inference results**: Stored as `infer_{timestamp}.csv` in dataset directories

### Environment Variables

You can configure the application using environment variables:

```bash
# Set custom config directory
export logist_labeling_CONFIG_DIR=/path/to/configs

# Set custom port
export PORT=9000
```

## Troubleshooting

### Issue: Frontend not found

**Symptom**: Application starts but shows "Frontend not built" error

**Solution**:
```bash
cd frontend
npm run build
cd ..
# Rebuild the wheel
python -m build --wheel
# Reinstall
python -m pip install dist/logist_labeling-0.1.0-py3-none-any.whl --force-reinstall
```

### Issue: Import errors

**Symptom**: `ModuleNotFoundError: No module named 'logist_labeling'`

**Solution**: Ensure the wheel is properly installed:
```bash
python -m pip list | grep logist-labeling
python -c "import logist_labeling; print(logist_labeling.__file__)"
```

### Issue: Permission denied

**Symptom**: Cannot write to dataset directories

**Solution**: Check directory permissions:
```bash
chmod -R u+w /path/to/dataset/directory
```

## Uninstalling

```bash
python -m pip uninstall logist-labeling
```

## Development Mode

For development, it's recommended to use the development setup instead of the wheel:

```bash
# Backend
uv run uvicorn main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm run dev
```

See `start_dev.sh` for automated development startup.

## Distribution

To distribute the wheel to others:

1. Build the wheel: `./build_wheel.sh`
2. Share the file: `dist/logist_labeling-0.1.0-py3-none-any.whl`
3. Recipients install with: `pip install logist_labeling-0.1.0-py3-none-any.whl`

For public distribution, consider publishing to PyPI:

```bash
# Install twine
pip install twine

# Upload to PyPI
twine upload dist/*
```

## Version Management

To update the version:

1. Edit `pyproject.toml`:
   ```toml
   [project]
   version = "0.2.0"  # Update this
   ```

2. Rebuild:
   ```bash
   ./build_wheel.sh
   ```

3. The new wheel will be: `dist/logist_labeling-0.2.0-py3-none-any.whl`
