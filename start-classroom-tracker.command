#!/bin/bash

# Classroom Participation Tracker - One-Click Startup Script for Mac
# This script starts both the backend server and frontend React app

cd "$(dirname "$0")"

echo "🚀 Starting Classroom Participation Tracker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    read -p "Press any key to exit..."
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        read -p "Press any key to exit..."
        exit 1
    fi
fi

# Kill any existing processes on ports 3000 and 3001
echo "🔍 Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the application using npm run dev
echo "🌟 Launching Classroom Participation Tracker..."
echo "   - Backend server will start on port 3001"
echo "   - Frontend React app will start on port 3000"
echo "   - Your browser should open automatically"
echo ""
echo "💡 To stop the application, press Ctrl+C in this terminal"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start both services
npm run dev

echo ""
echo "👋 Application stopped. Press any key to exit..."
read -n 1