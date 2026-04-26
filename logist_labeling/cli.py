"""Command-line interface for logist-labeling"""
import argparse
import sys
import os


def start_server(args):
    """Start the labeling tool server"""
    import uvicorn
    from logist_labeling.__main__ import app
    
    host = args.host if hasattr(args, 'host') and args.host else "0.0.0.0"
    port = args.port if hasattr(args, 'port') and args.port else 8000
    reload = args.reload if hasattr(args, 'reload') and args.reload else False
    
    print(f"Starting logist-labeling server...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Reload: {'enabled' if reload else 'disabled'}")
    print(f"Access the application at: http://localhost:{port}")
    print("-" * 50)
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload
    )


def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(
        prog='logist-labeling',
        description='Image Labeling Tool for logistic model training data annotation'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Start server command
    start_parser = subparsers.add_parser(
        'start',
        help='Start the labeling tool server'
    )
    start_parser.add_argument(
        '--host',
        type=str,
        default='0.0.0.0',
        help='Host to bind to (default: 0.0.0.0)'
    )
    start_parser.add_argument(
        '--port',
        type=int,
        default=8000,
        help='Port to listen on (default: 8000)'
    )
    start_parser.add_argument(
        '--reload',
        action='store_true',
        help='Enable auto-reload on code changes (development mode)'
    )
    start_parser.set_defaults(func=start_server)
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command provided, show help
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Execute the command
    args.func(args)


if __name__ == '__main__':
    main()
