import http.server
import socketserver
import os
import argparse
import sys

def run_file_server(model_dir, port=8080):
    # Validate the directory exists
    if not os.path.exists(model_dir):
        print(f"ERROR: Directory not found: {model_dir}")
        print(f"Please make sure your model files are located at this path.")
        return False
    
    # Check if the directory has model files
    model_files = ["config.json", "pytorch_model.bin", "tokenizer.json"]
    missing_files = [f for f in model_files if not os.path.exists(os.path.join(model_dir, f))]
    
    if missing_files:
        print(f"WARNING: Some expected model files are missing: {', '.join(missing_files)}")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return False
    
    # Create handler with the specified directory
    class ModelFileHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=model_dir, **kwargs)
        
        def log_message(self, format, *args):
            print(f"[Model Server] {format % args}")
    
    try:
        # Create server
        with socketserver.TCPServer(("", port), ModelFileHandler) as httpd:
            print(f"\n✅ Model server running at http://localhost:{port}")
            print(f"📂 Serving model files from: {model_dir}")
            print(f"📋 Files available:")
            
            # List files in the directory
            for file in os.listdir(model_dir):
                file_path = os.path.join(model_dir, file)
                if os.path.isfile(file_path):
                    size_mb = os.path.getsize(file_path) / (1024 * 1024)
                    print(f"   - {file} ({size_mb:.2f} MB)")
            
            print("\n⚠️  Keep this window open and your computer running while your app accesses these files.")
            print("💡 Press Ctrl+C to stop the server\n")
            
            # Start the server
            httpd.serve_forever()
    
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serve model files from your desktop")
    parser.add_argument("--dir", type=str, default=os.path.join("/Users/derekliew/Desktop", "models/tinyllama-1b"), 
                        help="Directory containing model files")
    parser.add_argument("--port", type=int, default=8080, 
                        help="Port to run the server on")
    
    args = parser.parse_args()
    run_file_server(args.dir, args.port) 