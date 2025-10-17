#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Sign Language Recognition - Backend Setup"
echo "================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo -e "${RED}❌ Python3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python3 found: $(python3 --version)${NC}"

# Check if pip is installed
if ! command -v pip3 &> /dev/null
then
    echo -e "${RED}❌ pip3 is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ pip3 found${NC}"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${RED}❌ Failed to create virtual environment${NC}"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Virtual environment activated${NC}"
else
    echo -e "${RED}❌ Failed to activate virtual environment${NC}"
    exit 1
fi

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create models directory if it doesn't exist
echo ""
echo "Creating models directory..."
mkdir -p models

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Models directory created${NC}"
else
    echo -e "${RED}❌ Failed to create models directory${NC}"
fi

# Check if model file exists
echo ""
if [ -f "models/combined_model.p" ]; then
    echo -e "${GREEN}✅ Model file found: models/combined_model.p${NC}"
else
    echo -e "${YELLOW}⚠️  Model file not found: models/combined_model.p${NC}"
    echo -e "${YELLOW}   Please copy your model file to the models/ directory${NC}"
fi

# Check if .env file exists
echo ""
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found, creating from template...${NC}"
    cat > .env << EOF
# Flask Configuration
FLASK_ENV=development
HOST=0.0.0.0
PORT=5000

# Model Configuration
MODEL_PATH=./models/combined_model.p
MIN_DETECTION_CONFIDENCE=0.3

# Timing Configuration
LETTER_CONFIRMATION_DELAY=3.0

# CORS Configuration
CORS_ORIGINS=*
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Make sure your model file (combined_model.p) is in the models/ directory"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the server: python app.py"
echo "4. Test the API: python test_api.py"
echo ""
echo "To deactivate virtual environment later, run: deactivate"
echo ""