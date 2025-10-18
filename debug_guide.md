# HW4 Extension Debug Guide

## Testing on cars.com

1. **Load the extension** in Chrome and reload it
2. **Go to cars.com** and search for Tesla vehicles
3. **Open Developer Tools** (F12) and go to Console tab
4. **Look for logs** like:
   ```
   HW4 Extension: Initializing...
   HW4 Extension: Scanning for VINs...
   HW4 Extension: Type hw4Checker.manualScan() in console to manually scan
   ```

## Manual Testing

If the extension doesn't detect VINs automatically, try these steps:

### 1. Manual Scan
In the console, type:
```javascript
hw4Checker.manualScan()
```

### 2. Check for VINs on Page
Look at the page source or inspect elements to see how VINs are displayed. Common patterns:
- `VIN: 7SAYXXXXXXXX`
- `VIN 7SAYXXXXXXXX`
- Just `7SAYXXXXXXXX`
- Full 17-character VINs containing `7SAY`

### 3. Inspect Elements
Right-click on VIN text and "Inspect Element" to see the HTML structure. The extension looks for:
- `[data-vin]` attributes
- `.vin` classes
- `.vehicle-vin` classes
- Other common VIN containers

## Troubleshooting

### Extension Icon Not Showing
- Make sure extension is loaded and enabled in `chrome://extensions/`
- Click the puzzle piece icon in Chrome toolbar and pin the extension

### No Console Logs
- Extension might not be running on that page
- Check if the URL matches the manifest patterns
- Try refreshing the page

### VINs Not Detected
- Cars.com might load VINs dynamically after page load
- Try scrolling down or clicking "Load More" buttons
- Use `hw4Checker.manualScan()` after content loads

### Badge Not Updating
- Badge updates might be blocked by site CSP
- Check console for "Extension badge update" messages

## VIN Parsing Logic

The extension correctly parses Tesla VINs:

**17-character full VIN format** (like `7SAYGDEF0PF647113`):
- `7SAY` = Tesla identifier
- `GDEF0` = Configuration (ignored)
- `PF647113` = Factory(PF) + Sequential(647113) ← **This is what matters for HW4**

**8-character short format** (like `PF789600`):
- `PF789600` = Factory(PF) + Sequential(789600)

## New Features: Visual HW Labels

The extension now adds visual labels directly on vehicle listings:

- **HW4** - Green label for vehicles with HW4
- **HW3/AI 3** - Red label for vehicles without HW4
- No label for non-Tesla vehicles

## Debug Commands

```javascript
// Check if extension is loaded
typeof hw4Checker

// Manual scan for VINs
hw4Checker.manualScan()

// Manual labeling of vehicles
hw4Checker.manualLabel()

// Inspect page structure to find correct selectors
hw4Checker.inspectPage()

// Remove all labels and debug borders
hw4Checker.clearLabels()

// Check current status
hw4Checker.hw4Status

// View found VINs
hw4Checker.foundVINs

// View HW status details
hw4Checker.hw4Status.details
```

## Label Visibility Issues

If labels aren't showing:

1. **Check Console** for "HW4 Extension: Found X elements with selector" messages
2. **Run `hw4Checker.inspectPage()`** to see what elements contain Tesla data
3. **Yellow borders** appear around labeled elements for debugging
4. **Labels have high z-index (10000)** and bright colors

## Common Issues

- **Wrong selectors**: Cars.com may use different CSS classes
- **Dynamic loading**: Content loads after extension runs
- **Positioning**: Parent elements may have conflicting CSS
- **CSP**: Some sites block inline styles

Try `hw4Checker.inspectPage()` on cars.com to find the correct element selectors!

## Error Handling

The extension now includes comprehensive error handling to prevent crashes:

- **"Extension context invalidated"** errors are caught and logged
- Content script errors don't crash the extension
- DOM access errors are handled gracefully
- Background script errors are contained

If you see errors in the console, they won't crash the extension anymore.
