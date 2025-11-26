#!/bin/bash

# Helper script to save Air Canada case study images
# Usage: Provide the paths to your two images as arguments

echo "Air Canada Case Study - Image Setup"
echo "===================================="
echo ""

if [ "$#" -eq 2 ]; then
    cp "$1" images/air-canada-mobile-1.jpg && echo "✓ Saved first image as air-canada-mobile-1.jpg"
    cp "$2" images/air-canada-mobile-2.jpg && echo "✓ Saved second image as air-canada-mobile-2.jpg"
    echo ""
    echo "Images saved successfully! The case study is now complete."
else
    echo "Please provide paths to your two images:"
    echo "  ./save-images.sh /path/to/first-image.jpg /path/to/second-image.jpg"
    echo ""
    echo "Or manually copy them:"
    echo "  cp /path/to/first-image.jpg images/air-canada-mobile-1.jpg"
    echo "  cp /path/to/second-image.jpg images/air-canada-mobile-2.jpg"
fi
