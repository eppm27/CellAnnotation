import uvicorn
import sys
from app.main import app

HOST_ADDRESS = "127.0.0.1"
HOST_PORT = 5001
URL = f"http://{HOST_ADDRESS}:{HOST_PORT}"


def start_server():
    uvicorn.run(app, host=HOST_ADDRESS, port=HOST_PORT)


if __name__ == "__main__":
    # Start server process with keyboard interrupt
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n👋 Keyboard interrupt received. Terminating server...")
        sys.exit(0)
