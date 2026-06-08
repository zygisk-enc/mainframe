#!/bin/bash

# Mainframe® AI Interview Simulator - Startup Script
# Automates Backend, Frontend, and ngrok Tunnel.

# Get the absolute path of the app directory
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR"

echo "--- Starting Mainframe Infrastructure ---"

# Kill any existing processes on the required ports
echo "[*] Clearing ports 8501 and 5173..."
fuser -k 8501/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
pkill ngrok 2>/dev/null

# 1. Start Flask Backend
echo "[1/3] Launching Flask Backend (Port 8501)..."
cd "$APP_DIR"
source venv/bin/activate
python3 app.py > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# 2. Start Vite Frontend
echo "[2/3] Launching Vite Frontend (Port 5173)..."
npm run dev -- --port 5173 --host 127.0.0.1 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# 3. Start ngrok
echo "[3/3] Initializing ngrok Tunnel..."
ngrok http 5173 --host-header=rewrite > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for services to warm up
sleep 4

# Fetch Public URL from ngrok API
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ "$PUBLIC_URL" == "null" ] || [ -z "$PUBLIC_URL" ]; then
    echo "Error: Could not retrieve ngrok URL. Check if ngrok is configured correctly."
else
    echo "------------------------------------------------"
    echo "Mainframe is now LIVE!"
    echo "Local UI:    http://localhost:5173"
    echo "Public Link: $PUBLIC_URL"
    echo "------------------------------------------------"
    echo "Logs: backend.log, frontend.log"
    echo "Press Ctrl+C to stop all services."
fi

# Trap Ctrl+C to kill background processes
trap "kill $BACKEND_PID $FRONTEND_PID $NGROK_PID; echo -e '\nStopping all services... Done.'; exit" INT

# Keep script running
wait
