#!/bin/bash

# Build script for Railway deployment
set -e

echo "Installing dependencies..."
npm ci

echo "Building server..."
cd apps/server
npm run build

echo "Build completed successfully!" 