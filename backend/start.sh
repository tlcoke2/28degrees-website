#!/bin/bash

# Exit on any error
set -e

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting server..."
node server.js
