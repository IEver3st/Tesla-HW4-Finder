# PowerShell script to create PNG icons from SVG
# Requires ImageMagick to be installed (https://imagemagick.org/)

if (!(Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Host "ImageMagick not found. Please install ImageMagick from https://imagemagick.org/"
    Write-Host "Or manually convert icons/icon.svg to the following PNG sizes:"
    Write-Host "  - 16x16 pixels -> icons/icon16.png"
    Write-Host "  - 48x48 pixels -> icons/icon48.png"
    Write-Host "  - 128x128 pixels -> icons/icon128.png"
    exit 1
}

Write-Host "Converting SVG to PNG icons..."

# Create 16x16 icon
magick icons/icon.svg -resize 16x16 icons/icon16.png
Write-Host "Created icons/icon16.png"

# Create 48x48 icon
magick icons/icon.svg -resize 48x48 icons/icon48.png
Write-Host "Created icons/icon48.png"

# Create 128x128 icon
magick icons/icon.svg -resize 128x128 icons/icon128.png
Write-Host "Created icons/icon128.png"

Write-Host "All icons created successfully!"
