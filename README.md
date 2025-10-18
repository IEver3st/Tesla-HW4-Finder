# HW4 Tesla VIN Checker Chrome Extension

A Chrome extension that automatically detects Tesla VINs on popular car websites and checks if they have HW4 (Hardware Version 4) capability.

## Features

- **Automatic Detection**: Scans pages on cars.com, autotrader.com, cargurus.com, carfax.com, edmunds.com, and kbb.com
- **HW4 Analysis**: Checks VINs against HW4 criteria:
  - Fremont-built (PF): Sequential numbers ≥789,500
  - Austin-built (PA): Sequential numbers ≥131,200
  - Model Y 2024+: Always HW4 guaranteed
- **Visual Indicators**: Extension icon badge shows HW4 status
- **Detailed Popup**: Click the extension icon for detailed VIN analysis

## Installation

1. **Download/Clone** this repository to your local machine

2. **Install ImageMagick** (optional, for better icons):
   - Download from: https://imagemagick.org/
   - Run `.\create_icons.ps1` to generate proper PNG icons from the SVG

3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing this extension

4. **Grant Permissions** when prompted

## Usage

1. **Browse car websites** like cars.com, autotrader.com, etc.
2. **Look for the extension icon** in your browser toolbar
3. **Check the badge**: Green "HW4" = HW4 detected, Red = No HW4
4. **Click the icon** for detailed information about found VINs

## HW4 Detection Rules

### Fremont Factory (PF prefix)
- VINs with sequential numbers **789,500 and above** have HW4
- Example: `VIN: 7SAYPF789500` = HW4 ✅

### Austin Factory (PA prefix)
- VINs with sequential numbers **131,200 and above** have HW4
- Example: `VIN: 7SAYPA131200` = HW4 ✅

### Model Y 2024+
- All Model Y vehicles from 2024 and later have HW4 guaranteed
- Detected by finding "Model Y" + year 2024+ on the page

## Files

- `manifest.json` - Extension configuration
- `content.js` - Page scanning logic
- `popup.html/popup.js` - Extension popup UI
- `background.js` - Badge management
- `icons/` - Extension icons
- `create_icons.ps1` - Icon generation script

## Privacy

This extension only:
- Scans pages on car websites for Tesla VIN patterns
- Stores temporary data locally in your browser
- Does not transmit any data externally
- Only activates on specified car websites

## Troubleshooting

- **No VINs detected**: Make sure you're on a supported website and the VIN is displayed as "VIN: 7SAY..."
- **Extension not working**: Try refreshing the page or reloading the extension
- **Icons not showing**: Run the icon generation script or manually convert the SVG

## Contributing

Feel free to submit issues or pull requests to improve VIN detection or add support for more websites.
