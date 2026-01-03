#!/bin/bash
#
# Icon Generator Script for GNB Transfer Mobile App
# 
# This script generates all required icon sizes from a source image.
# 
# Prerequisites:
#   - ImageMagick: brew install imagemagick (macOS) or apt install imagemagick (Linux)
#   - A source icon file (recommended: 1024x1024 PNG with transparency)
#
# Usage:
#   ./generate-icons.sh <source-icon.png>
#
# Example:
#   ./generate-icons.sh my-logo.png
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed.${NC}"
    echo ""
    echo "Install ImageMagick:"
    echo "  macOS:  brew install imagemagick"
    echo "  Ubuntu: sudo apt install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Check for source file
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <source-icon.png>${NC}"
    echo ""
    echo "This script generates all required icons for the mobile app."
    echo ""
    echo "Recommended source image:"
    echo "  - Format: PNG with transparency"
    echo "  - Size: 1024x1024 pixels"
    echo "  - Content: Centered logo with padding"
    exit 1
fi

SOURCE_FILE="$1"

if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: Source file '$SOURCE_FILE' not found.${NC}"
    exit 1
fi

# Ensure assets directory exists
mkdir -p "$ASSETS_DIR"

echo -e "${GREEN}Generating icons from: $SOURCE_FILE${NC}"
echo ""

# App Icon (1024x1024) - Used for App Store, iOS home screen
echo "  Creating icon.png (1024x1024)..."
convert "$SOURCE_FILE" -resize 1024x1024 "$ASSETS_DIR/icon.png"

# Adaptive Icon (1024x1024) - Android adaptive icon foreground
echo "  Creating adaptive-icon.png (1024x1024)..."
convert "$SOURCE_FILE" -resize 1024x1024 "$ASSETS_DIR/adaptive-icon.png"

# Splash Icon (200x200) - Used in splash screen
echo "  Creating splash-icon.png (200x200)..."
convert "$SOURCE_FILE" -resize 200x200 "$ASSETS_DIR/splash-icon.png"

# Splash Image (1284x2778) - Full splash screen (iPhone 14 Pro Max)
echo "  Creating splash.png (1284x2778)..."
convert -size 1284x2778 xc:'#1D4ED8' \
    \( "$SOURCE_FILE" -resize 400x400 \) \
    -gravity center -composite \
    "$ASSETS_DIR/splash.png"

# Favicon (48x48) - For web
echo "  Creating favicon.png (48x48)..."
convert "$SOURCE_FILE" -resize 48x48 "$ASSETS_DIR/favicon.png"

echo ""
echo -e "${GREEN}✓ All icons generated successfully!${NC}"
echo ""
echo "Generated files in $ASSETS_DIR:"
ls -la "$ASSETS_DIR"
echo ""
echo -e "${YELLOW}Note: You may need to regenerate native projects after updating icons:${NC}"
echo "  npx expo prebuild --clean"
