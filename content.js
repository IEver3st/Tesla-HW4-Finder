// HW4 Tesla VIN Checker Content Script

class HW4Checker {
  constructor() {
    this.foundVINs = [];
    this.hw4Status = {
      hasHW4: false,
      vins: [],
      details: []
    };
    this.hasScanned = false; // Flag to prevent multiple scans
    this.processedElements = new WeakSet(); // Track which elements we've already labeled
  }

  // Check if VIN has HW4 based on factory and sequential number
  checkHW4(vin) {
    // VIN format: 7SAY + 8 characters
    // First 2 chars: factory (PF = Fremont, PA = Austin)
    // Next 6 chars: sequential number
    const factory = vin.substring(0, 2);
    const sequential = parseInt(vin.substring(2, 8));

    let hasHW4 = false;
    let reason = '';

    if (factory === 'PF') {
      // Fremont built
      hasHW4 = sequential >= 789500;
      reason = `Fremont built (PF${sequential}) - HW4 ${hasHW4 ? 'YES' : 'NO'} (need ≥789500)`;
    } else if (factory === 'PA') {
      // Austin built
      hasHW4 = sequential >= 131200;
      reason = `Austin built (PA${sequential}) - HW4 ${hasHW4 ? 'YES' : 'NO'} (need ≥131200)`;
    } else {
      reason = `Unknown factory code: ${factory}`;
    }

    return { hasHW4, reason };
  }

  // Check if this might be a Model Y 2024+
  isModelY2024Plus(text) {
    const upperText = text.toUpperCase();
    // Look for Model Y and year 2024 or higher
    const modelYMatch = upperText.includes('MODEL Y') || upperText.includes('MODEL-Y');
    const yearMatch = /\b202[4-9]\b|\b203[0-9]\b/.test(text);

    return modelYMatch && yearMatch;
  }

  // Scan the page for Tesla VINs
  scanForVINs() {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('HW4 Extension: Extension context invalidated, stopping scan');
        return;
      }

      // Only scan once per page unless manually triggered
      if (this.hasScanned) {
        console.log('HW4 Extension: Already scanned this page');
        return;
      }

      console.log('HW4 Extension: Scanning for VINs...');

      // Comprehensive document readiness checks
      if (!document || !document.body || !document.head) {
        console.log('HW4 Extension: Document not ready (document, body, or head missing)');
        return;
      }

      // Check if document is in a valid state
      if (document.readyState === 'loading' && !document.body.innerText) {
        console.log('HW4 Extension: Document still loading');
        return;
      }

      // Additional safety check - ensure we can access body properties
      let bodyText;
      try {
        bodyText = document.body.innerText || document.body.textContent || '';
      } catch (bodyError) {
        console.log('HW4 Extension: Cannot access document.body content:', bodyError.message);
        return;
      }

      console.log('Page text length:', bodyText.length);

    // Also check for dynamically loaded content in specific containers
    const dynamicSelectors = [
      '[data-vin]', '[vin]', '.vin', '.vehicle-vin',
      '.listing-vin', '.car-vin', '.tesla-vin',
      '.vehicle-details', '.car-details', '.listing-details',
      // Cars.com specific selectors
      '.vehicle-card', '.inventory-item', '.vehicle-info',
      '.specifications', '.vehicle-specs', '.details-section',
      '[data-vehicle-vin]', '[data-stock-number]',
      // Common car site patterns
      '.stock-number', '.vin-number', '.vehicle-identification'
    ];

    for (const selector of dynamicSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          try {
            const elementText = element.textContent || element.innerText || '';
            if (elementText.includes('7SAY')) {
              console.log('Found VIN in dynamic element:', selector, elementText);
            }
          } catch (elementError) {
            console.warn('HW4 Extension: Error accessing element text:', elementError.message);
          }
        });
      } catch (selectorError) {
        console.warn('HW4 Extension: Error with selector "' + selector + '":', selectorError.message);
      }
    }

    let textNodes = [];
    try {
      textNodes = this.getAllTextNodes(document.body);
    } catch (walkerError) {
      console.warn('HW4 Extension: Error getting text nodes:', walkerError.message);
    }

    this.foundVINs = [];
    this.hw4Status = {
      hasHW4: false,
      vins: [],
      details: []
    };

    // Look for VIN patterns - try multiple formats that real sites might use
    const vinPatterns = [
      /VIN:\s*7SAY([A-Z0-9]{8})/gi,  // "VIN: 7SAYXXXXXXXX"
      /VIN\s*7SAY([A-Z0-9]{8})/gi,   // "VIN 7SAYXXXXXXXX"
      /\b7SAY([A-Z0-9]{8})\b/gi,     // Just "7SAYXXXXXXXX" as a word
      /VIN[:\s]+([A-Z0-9]{17})/gi,   // Full 17-character VIN containing 7SAY
      /Vehicle\s+Identification\s+Number[:\s]*7SAY([A-Z0-9]{8})/gi,  // "Vehicle Identification Number: 7SAYXXXXXXXX"
      /Stock\s*#\s*7SAY([A-Z0-9]{8})/gi,  // Sometimes VINs are shown as stock numbers
    ];

    let allMatches = [];

    // Try each pattern
    for (const pattern of vinPatterns) {
      let match;
      while ((match = pattern.exec(bodyText)) !== null) {
        const vinCandidate = match[1];
        console.log('Found potential VIN with pattern:', pattern, '->', vinCandidate);

        // Extract the 7SAY part and following 8 characters
        let fullVIN = vinCandidate;
        if (vinCandidate.length === 17 && vinCandidate.startsWith('7SAY')) {
          // Full Tesla VIN format: 7SAY + config(5) + factory(2) + sequential(6)
          // Extract factory(2) + sequential(6) = positions 9-16 (0-indexed)
          fullVIN = vinCandidate.substring(9, 17);
        }

        if (fullVIN.length === 8) {
          const factory = fullVIN.substring(0, 2);
          const sequential = fullVIN.substring(2, 8);

          // Only process PF (Fremont) and PA (Austin) factory codes
          if (factory === 'PF' || factory === 'PA') {
            // Avoid duplicates
            if (!allMatches.includes(fullVIN)) {
              allMatches.push(fullVIN);
              const hw4Result = this.checkHW4(fullVIN);
              console.log('HW4 check result for', fullVIN, ':', hw4Result);

              this.foundVINs.push({
                vin: fullVIN,
                factory: factory,
                sequential: sequential,
                hasHW4: hw4Result.hasHW4,
                reason: hw4Result.reason
              });

              this.hw4Status.vins.push(fullVIN);
              this.hw4Status.details.push(hw4Result.reason);

              if (hw4Result.hasHW4) {
                this.hw4Status.hasHW4 = true;
              }
            }
          } else {
            console.log('Skipping non-PF/PA factory:', factory, 'for VIN:', fullVIN);
          }
        }
      }
    }

    // Check for Model Y 2024+ mentions (guaranteed HW4)
    const modelY2024Plus = this.isModelY2024Plus(bodyText);
    if (modelY2024Plus && this.hw4Status.vins.length === 0) {
      this.hw4Status.hasHW4 = true;
      this.hw4Status.details.push('Model Y 2024+ detected - HW4 guaranteed');
    }

    // If we found Model Y 2024+ but also have specific VINs, prioritize VIN analysis
    if (modelY2024Plus && this.hw4Status.vins.length > 0) {
      // Keep the HW4 status from VIN analysis, but add a note
      this.hw4Status.details.push('Note: Model Y 2024+ typically has HW4');
    }

    // Add HW labels to vehicle listings
    this.addHWLabels();

    // Store results for popup
    console.log('Final HW4 status:', this.hw4Status);
    try {
      chrome.storage.local.set({
        hw4Status: this.hw4Status,
        lastScan: new Date().toISOString(),
        url: window.location.href
      });
    } catch (storageError) {
      console.warn('HW4 Extension: Could not save to storage (extension may have been reloaded)');
    }

    // Update extension icon badge
    this.updateBadge();
    
    // Mark as scanned
    this.hasScanned = true;
    console.log('HW4 Extension: Scan complete');
    } catch (error) {
      console.error('HW4 Extension: Error during VIN scan:', error);
    }
  }

  // Get all text nodes in document
  getAllTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  // Update extension badge
  updateBadge() {
    const badgeText = this.hw4Status.hasHW4 ? 'HW4' : '';
    const badgeColor = this.hw4Status.hasHW4 ? '#00FF00' : '#FF0000';

    try {
      // Check if chrome.runtime is still valid
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.log('HW4 Extension: Cannot update badge - extension context invalidated');
        return;
      }

      chrome.runtime.sendMessage({
        action: 'updateBadge',
        text: badgeText,
        color: badgeColor
      }, (response) => {
        // Check for errors
        if (chrome.runtime.lastError) {
          console.log('HW4 Extension: Badge update failed (extension may have been reloaded)');
        }
      });
    } catch (e) {
      console.log('HW4 Extension: Could not update badge:', e.message);
    }
  }

  // Add HW labels to vehicle listings on the page
  addHWLabels() {
    try {
      // Safety check for document availability
      if (!document || !document.body || document.readyState === 'unloading') {
        console.log('HW4 Extension: Skipping label addition - document not ready');
        return;
      }

      console.log('HW4 Extension: Adding HW labels near mileage...');

      // Target elements that contain mileage information specifically
      const mileageSelectors = [
        // Look for elements containing mileage info
        '[data-qa*="mileage"]', '.mileage', '.odometer',
        '.miles', '.vehicle-mileage', '.car-mileage', '.listing-mileage',
        // Look for price/mileage combination areas
        '.price-mileage', '.vehicle-price-mileage',
        // Look for key specs sections that often contain mileage
        '.key-specs', '.vehicle-specs', '.specifications',
        '.vehicle-details', '.car-details',
        // Fallback to vehicle cards but be more selective
        '.vehicle-card', '.listing-card'
      ];

      let totalVehiclesFound = 0;
      mileageSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`HW4 Extension: Found ${elements.length} mileage elements with selector "${selector}"`);
            elements.forEach(element => {
              try {
                const elementText = (element.textContent || element.innerText || '').toLowerCase();
                const looksLikeMileage = elementText.includes('mi') || elementText.includes('miles') || /\d+,?\d+\s*m/i.test(elementText);
                const hasTeslaIndicator = elementText.includes('tesla') || /7say/.test(elementText);
                const haveGlobalTeslaData = (this.hw4Status && (this.hw4Status.vins && this.hw4Status.vins.length > 0)) ||
                  (this.hw4Status && this.hw4Status.hasHW4) ||
                  (this.foundVINs && this.foundVINs.length > 0);

                // Only process if it looks like mileage and we have some Tesla context
                if (looksLikeMileage && (hasTeslaIndicator || haveGlobalTeslaData)) {
                  totalVehiclesFound++;
                  this.addLabelToVehicle(element, true); // Pass true for mileage-specific positioning
                }
              } catch (elementError) {
                console.warn('HW4 Extension: Error processing mileage element:', elementError);
              }
            });
          }
        } catch (selectorError) {
          console.warn(`HW4 Extension: Error with mileage selector "${selector}":`, selectorError);
        }
      });

      console.log(`HW4 Extension: Processed ${totalVehiclesFound} Tesla vehicles for mileage labeling`);
    } catch (error) {
      console.error('HW4 Extension: Error adding HW labels:', error);
    }
  }

  // Add HW label to a specific vehicle element
  addLabelToVehicle(vehicleElement, isMileageElement = false) {
    // Skip if already processed
    // Skip if already labeled
    if (vehicleElement.querySelector('.hw4-extension-label')) {
      return;
    }

      // Skip if we've already successfully labeled this element
      if (this.processedElements.has(vehicleElement)) {
        return;
      }

    const vehicleText = vehicleElement.textContent || vehicleElement.innerText || '';
    const hasTeslaVIN = /7SAY([A-Z0-9]{8})/.test(vehicleText);
    const hasModelY2024 = this.isModelY2024Plus(vehicleText);

    let labelText = '';
    let labelClass = '';
    let shouldAddLabel = false;

    if (hasTeslaVIN) {
      // Extract and check VIN - handle both 8-char and 17-char formats
      const vinMatch8 = vehicleText.match(/7SAY([A-Z0-9]{8})/);
      const vinMatch17 = vehicleText.match(/7SAY([A-Z0-9]{17})/);

      let vin = null;
      if (vinMatch17) {
        // Full 17-char VIN: extract factory(2) + sequential(6) from positions 9-16
        vin = vinMatch17[1].substring(9, 17);
      } else if (vinMatch8) {
        // 8-char format: use as-is
        vin = vinMatch8[1];
      }

      if (vin && vin.length === 8) {
        const factory = vin.substring(0, 2);

        if (factory === 'PF' || factory === 'PA') {
          const hw4Result = this.checkHW4(vin);
          if (hw4Result.hasHW4) {
            labelText = 'HW4';
            labelClass = 'hw4-yes';
            shouldAddLabel = true;
          } else {
            labelText = 'HW3/AI 3';
            labelClass = 'hw4-no';
            shouldAddLabel = true;
          }
        }
      }
    } else if (hasModelY2024) {
      // Model Y 2024+ is HW4
      labelText = 'HW4';
      labelClass = 'hw4-yes';
      shouldAddLabel = true;
    } else if (vehicleText.toLowerCase().includes('tesla')) {
      // Tesla vehicle without detectable VIN - assume HW3/AI 3
      labelText = 'HW3/AI 3';
      labelClass = 'hw4-no';
      shouldAddLabel = true;
    }

    // If this is a mileage element and nothing triggered yet, leverage stored VIN results
    if (!shouldAddLabel && isMileageElement) {
      const primaryVIN = this.foundVINs && this.foundVINs.length > 0 ? this.foundVINs[0] : null;

      if (primaryVIN) {
        labelText = primaryVIN.hasHW4 ? 'HW4' : 'HW3/AI3';
        labelClass = primaryVIN.hasHW4 ? 'hw4-yes' : 'hw4-no';
        shouldAddLabel = true;
      } else if (this.hw4Status) {
        if (this.hw4Status.hasHW4) {
          labelText = 'HW4';
          labelClass = 'hw4-yes';
          shouldAddLabel = true;
        } else if (this.hw4Status.details && this.hw4Status.details.length > 0) {
          labelText = 'HW3/AI3';
          labelClass = 'hw4-no';
          shouldAddLabel = true;
        }
      }
    }

    if (shouldAddLabel) {
      this.createAndAddLabel(vehicleElement, labelText, labelClass, isMileageElement);
      this.processedElements.add(vehicleElement);
    }
  }

  // Create and add label element to vehicle
  createAndAddLabel(vehicleElement, text, cssClass, isMileageElement = false) {
    try {
      console.log('HW4 Extension: Creating label "' + text + '" for element:', vehicleElement);

      // Remove any existing labels first
      const existingLabels = vehicleElement.querySelectorAll('.hw4-extension-label');
      existingLabels.forEach(label => label.remove());

      const label = document.createElement('span');
      label.className = `hw4-extension-label ${cssClass}`;
      label.textContent = text;

      // Try to find the mileage text specifically and insert label next to it
      const mileagePattern = /(\d{1,3}(,\d{3})*)\s*(mi|miles)/i;
      let labelInserted = false;

      if (isMileageElement) {
        // Find the exact mileage text node
        const walker = document.createTreeWalker(
          vehicleElement,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          const match = node.textContent.match(mileagePattern);
          if (match) {
            // Found the mileage text - insert label right after it
            const parent = node.parentElement;
            if (parent) {
              // Style for inline placement
              label.style.cssText = `
                margin-left: 8px;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                vertical-align: middle;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              `;

              // Style based on HW version
              if (cssClass === 'hw4-yes') {
                label.style.backgroundColor = '#00FF00';
                label.style.color = '#000000';
                label.style.border = '2px solid #008800';
              } else {
                label.style.backgroundColor = '#FF4444';
                label.style.color = '#FFFFFF';
                label.style.border = '2px solid #CC0000';
              }

              // Insert after the text node
              if (node.nextSibling) {
                parent.insertBefore(label, node.nextSibling);
              } else {
                parent.appendChild(label);
              }
              
              labelInserted = true;
              console.log('HW4 Extension: Label inserted inline next to mileage');
              break;
            }
          }
        }
      }

      // Fallback to absolute positioning if inline insertion failed
      if (!labelInserted) {
        let positionCSS = '';
        if (isMileageElement) {
          positionCSS = `
            position: absolute;
            bottom: 5px;
            right: 5px;
          `;
        } else {
          positionCSS = `
            position: absolute;
            top: 10px;
            right: 10px;
          `;
        }

        label.style.cssText = positionCSS + `
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          z-index: 10000;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          font-family: Arial, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        `;

        // Style based on HW version
        if (cssClass === 'hw4-yes') {
          label.style.backgroundColor = '#00FF00';
          label.style.color = '#000000';
          label.style.border = '3px solid #008800';
          label.style.textShadow = '1px 1px 2px rgba(255,255,255,0.5)';
        } else {
          label.style.backgroundColor = '#FF4444';
          label.style.color = '#FFFFFF';
          label.style.border = '3px solid #CC0000';
          label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
        }

        // Make vehicle element position relative if not already
        const currentPosition = window.getComputedStyle(vehicleElement).position;
        if (currentPosition === 'static' || currentPosition === 'sticky') {
          vehicleElement.style.position = 'relative';
        }

        vehicleElement.appendChild(label);
        console.log('HW4 Extension: Label added with absolute positioning');
      }
    } catch (error) {
      console.error('HW4 Extension: Error creating label:', error);
    }
  }

  // Manual scan trigger for debugging
  manualScan() {
    console.log('HW4 Extension: Manual scan triggered');
    this.hasScanned = false; // Reset flag for manual scan
    this.processedElements = new WeakSet(); // Clear processed elements
    this.scanForVINs();
    this.addHWLabels();
  }

  // Manual label addition for debugging
  manualLabel() {
    console.log('HW4 Extension: Adding labels manually');
    this.addHWLabels();
  }

  // Debug function to inspect page structure
  inspectPage() {
    console.log('HW4 Extension: Inspecting page structure...');

    // Look for common patterns
    const patterns = [
      '[data-qa*="Listing"]', '[data-qa*="Card"]', '[data-qa*="Item"]',
      '.vehicle-card', '.listing-card', '.car-card', '.card',
      'article', '.item', '.listing', '[data-testid*="listing"]'
    ];

    patterns.forEach(pattern => {
      const elements = document.querySelectorAll(pattern);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with "${pattern}":`, elements);
        elements.forEach((el, i) => {
          const text = (el.textContent || '').substring(0, 100);
          console.log(`  ${i}: "${text}..."`);
        });
      }
    });

    // Look for Tesla content
    const allElements = document.querySelectorAll('*');
    let teslaElements = [];
    allElements.forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('tesla') || /7say/.test(text)) {
        teslaElements.push(el);
      }
    });

    console.log(`Found ${teslaElements.length} elements containing Tesla/VIN text:`, teslaElements);
  }

  // Remove all labels and debug borders
  clearLabels() {
    console.log('HW4 Extension: Removing all labels and debug borders');

    // Remove labels
    const labels = document.querySelectorAll('.hw4-extension-label');
    labels.forEach(label => label.remove());

    // Remove debug borders from mileage elements
    const mileageElements = document.querySelectorAll('[data-qa*="mileage"], .mileage, .odometer, .miles, .vehicle-mileage, .car-mileage, .key-specs, .vehicle-specs, .specifications, .vehicle-details, .car-details, .vehicle-card, .listing-card');
    mileageElements.forEach(el => {
      if (el.style.border && el.style.border.includes('rgba(255, 255, 0')) {
        el.style.border = '';
      }
    });

    console.log('HW4 Extension: All labels and debug borders removed');
  }

  // Stop periodic scanning
  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      console.log('HW4 Extension: Stopped periodic scanning');
    }
  }

  // Initialize the checker
  init() {
    try {
      console.log('HW4 Extension: Initializing...');

      // Scan immediately
      this.scanForVINs();

      // Re-scan ONCE when significant content changes (for dynamic pages)
      // This handles sites that load vehicle info via AJAX
      let mutationTimeout = null;
      const observer = new MutationObserver((mutations) => {
        try {
          // Skip if already scanned or document is not ready
          if (this.hasScanned || !document || !document.body || document.readyState === 'unloading') {
            return;
          }

          // Only scan if significant content was added
          const hasNewContent = mutations.some(mutation =>
            mutation.type === 'childList' &&
            mutation.addedNodes.length > 0
          );

          if (hasNewContent) {
            // Debounce mutations - only scan after content stops changing for 2 seconds
            if (mutationTimeout) {
              clearTimeout(mutationTimeout);
            }
            
            mutationTimeout = setTimeout(() => {
              try {
                // Check if extension context is still valid
                if (!chrome.runtime || !chrome.runtime.id) {
                  console.log('HW4 Extension: Extension context invalidated, stopping mutation observer');
                  observer.disconnect();
                  return;
                }

                if (!this.hasScanned && document && document.body && document.readyState !== 'unloading') {
                  console.log('HW4 Extension: New content detected, scanning...');
                  this.scanForVINs();
                  observer.disconnect(); // Stop observing after first scan
                }
              } catch (scanError) {
                console.warn('HW4 Extension: Error during mutation-triggered scan:', scanError);
              }
            }, 2000); // Wait 2 seconds after content stops changing
          }
        } catch (observerError) {
          console.warn('HW4 Extension: Error in mutation observer:', observerError);
        }
      });

      // Only observe if document.body exists and we haven't scanned yet
      if (document.body && !this.hasScanned) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Stop observing after 10 seconds even if no scan happened
        setTimeout(() => {
          observer.disconnect();
          console.log('HW4 Extension: Stopped mutation observer after timeout');
        }, 10000);
      }

      // Make manual functions available globally for debugging
      window.hw4Checker = this;
      console.log('HW4 Extension: Commands available:');
      console.log('  hw4Checker.manualScan() - Scan for VINs');
      console.log('  hw4Checker.manualLabel() - Add HW labels');
      console.log('  hw4Checker.inspectPage() - Inspect page structure');
      console.log('  hw4Checker.clearLabels() - Remove all labels');
    } catch (initError) {
      console.error('HW4 Extension: Error during initialization:', initError);
    }
  }
}

// Initialize when DOM is ready
try {
  // Check if extension context is valid before initializing
  if (!chrome.runtime || !chrome.runtime.id) {
    console.log('HW4 Extension: Extension context invalidated, cannot initialize');
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        // Check again when DOM loads (extension might have been reloaded)
        if (!chrome.runtime || !chrome.runtime.id) {
          console.log('HW4 Extension: Extension context invalidated during DOM load');
          return;
        }
        const checker = new HW4Checker();
        checker.init();
      } catch (error) {
        console.error('HW4 Extension: Error during DOMContentLoaded initialization:', error);
      }
    });
  } else {
    const checker = new HW4Checker();
    checker.init();
  }
} catch (error) {
  console.error('HW4 Extension: Error during script initialization:', error);
}
