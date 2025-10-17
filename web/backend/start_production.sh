#!/bin/bash
# Production server startup script with Gunicorn

echo "🚀 Starting Sign Language Backend with Gunicorn..."

# Check if gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Gunicorn not found. Installing..."
    pip install gunicorn
fi

# Check if config file exists
if [ ! -f "gunicorn.conf.py" ]; then
    echo "❌ Gunicorn config file not found!"
    exit 1
fi

# Set environment variables
export FLASK_ENV=production
export PYTHONPATH=/app

# Start Gunicorn with config
echo "✅ Starting Gunicorn server..."
gunicorn -c gunicorn.conf.py app:app

echo "🎉 Server started successfully!"
