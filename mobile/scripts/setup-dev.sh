#!/bin/bash
#
# Development Setup Script for GNB Transfer Mobile App
#
# This script helps set up the development environment
# and configure environment variables.
#
# Usage:
#   ./setup-dev.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$SCRIPT_DIR/.."

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GNB Transfer Mobile App Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Node.js version
echo -e "${YELLOW}Checking prerequisites...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required.${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# Check for Expo CLI
if ! command -v expo &> /dev/null; then
    echo -e "  ${YELLOW}⚠${NC} Expo CLI not found globally"
    echo ""
    read -p "    Would you like to install Expo CLI globally? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "    Installing Expo CLI..."
        npm install -g @expo/cli
    else
        echo -e "    ${YELLOW}Skipping Expo CLI installation. You can use npx expo instead.${NC}"
    fi
fi
if command -v expo &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Expo CLI available"
else
    echo -e "  ${YELLOW}⚠${NC} Expo CLI not installed (use 'npx expo' commands)"
fi

echo ""

# Get local IP address
echo -e "${YELLOW}Detecting local network IP...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
else
    LOCAL_IP="localhost"
fi
echo -e "  Local IP: ${GREEN}$LOCAL_IP${NC}"
echo ""

# Create .env file if it doesn't exist
ENV_FILE="$MOBILE_DIR/.env"
ENV_EXAMPLE="$MOBILE_DIR/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
        echo "EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5000/api" > "$ENV_FILE"
    fi
    
    # Update API URL with detected IP
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|localhost|$LOCAL_IP|g" "$ENV_FILE"
    else
        sed -i "s|localhost|$LOCAL_IP|g" "$ENV_FILE"
    fi
    
    echo -e "  ${GREEN}✓${NC} Created $ENV_FILE"
    echo -e "  ${BLUE}API URL:${NC} http://$LOCAL_IP:5000/api"
else
    echo -e "  ${GREEN}✓${NC} .env file already exists"
fi
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd "$MOBILE_DIR"
npm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the backend server:"
echo "     ${BLUE}cd ../backend && npm run dev${NC}"
echo ""
echo "  2. Start the mobile app:"
echo "     ${BLUE}npm start${NC}"
echo ""
echo "  3. Scan the QR code with Expo Go app on your device"
echo "     or press 'i' for iOS simulator / 'a' for Android emulator"
echo ""
echo -e "  ${YELLOW}Note:${NC} Ensure your phone and computer are on the same WiFi network"
echo ""
