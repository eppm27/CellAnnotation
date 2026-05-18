import setproctitle
import uvicorn
import webbrowser
import threading
import time
import http.client
import sys
import socket
from app.main import app

setproctitle.setproctitle("ann-standalone")

HOST_ADDRESS = "127.0.0.1"
HOST_PORT = 5001
URL = f"http://{HOST_ADDRESS}:{HOST_PORT}"


def start_server():
    uvicorn.run(app, host=HOST_ADDRESS, port=HOST_PORT)


def is_port_in_use() -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((HOST_ADDRESS, HOST_PORT)) == 0


def wait_for_server(timeout=10):
    """
    Wait until the server is up and responding, or timeout in `timeout` seconds.
    Default timeout is 10 seconds.
    """
    start = time.time()
    while time.time() - start < timeout:
        try:
            conn = http.client.HTTPConnection(HOST_ADDRESS, HOST_PORT)
            conn.request("GET", "/")
            response = conn.getresponse()
            if response.status == 200:
                return True
        except Exception:
            time.sleep(0.5)
    return False


def open_browser(url: str):
    """Open the default web browser to the app URL."""
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Failed to open browser: {e}")


if __name__ == "__main__":
    # Check if another instance is running
    if not is_port_in_use():
        # Start FastAPI as a demon thread so it exits when main thread exits
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()

        # Wait until server is ready
        if wait_for_server():
            # Open browser to frontend (served by FastAPI)
            open_browser(URL)
        else:
            print(f"Server not ready after timeout, please open {URL} manually")

        # Keep main thread alive, waiting for keyboard interrupt
        try:
            while server_thread.is_alive():
                time.sleep(0.5)
        except KeyboardInterrupt:
            print("\n👋 Keyboard interrupt received. Terminating server...")
            sys.exit(0)
    else:
        print(f"Port {HOST_PORT} is already in use. The app might be already running.")
        open_browser(URL)
        sys.exit(1)
