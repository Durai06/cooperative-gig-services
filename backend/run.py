"""
CoopConnect Standalone Server Runner
====================================
Runs the CoopConnect FastAPI backend server using uvicorn.

Usage:
    python run.py
    python run.py --host 127.0.0.1 --port 8000 --no-reload
"""

import argparse
import sys
import os

# Ensure the backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from app.config import settings

def main():
    parser = argparse.ArgumentParser(description="CoopConnect FastAPI Backend Server")
    parser.add_argument("--host", type=str, default=settings.HOST, help=f"Host interface (default: {settings.HOST})")
    parser.add_argument("--port", type=int, default=settings.PORT, help=f"Port number (default: {settings.PORT})")
    parser.add_argument("--reload", action="store_true", default=settings.DEBUG, help="Enable auto-reload on code changes")
    parser.add_argument("--no-reload", action="store_false", dest="reload", help="Disable auto-reload")
    
    args = parser.parse_args()

    print("=" * 60)
    print(f"  Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"  Listening on: http://{args.host}:{args.port}")
    print(f"  Interactive API Docs: http://{args.host}:{args.port}/docs")
    print(f"  OpenAPI JSON Spec:   http://{args.host}:{args.port}/openapi.json")
    print(f"  Auto-reload: {'Enabled' if args.reload else 'Disabled'}")
    print("=" * 60)

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )

if __name__ == "__main__":
    main()
