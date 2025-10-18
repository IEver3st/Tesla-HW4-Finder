// HW4 Tesla VIN Checker Popup Script

document.addEventListener('DOMContentLoaded', function() {
  loadHW4Status();
});

function loadHW4Status() {
  chrome.storage.local.get(['hw4Status', 'lastScan', 'url'], function(result) {
    const statusElement = document.getElementById('status');
    const vinListElement = document.getElementById('vin-list');
    const noVinsElement = document.getElementById('no-vins');
    const lastScanElement = document.getElementById('last-scan');

    if (result.hw4Status) {
      const hw4Status = result.hw4Status;

      // Update status display
      if (hw4Status.hasHW4) {
        statusElement.className = 'status hw4-yes';
        statusElement.innerHTML = '✅ HW4 DETECTED!';
      } else if (hw4Status.vins.length > 0) {
        statusElement.className = 'status hw4-no';
        statusElement.innerHTML = '❌ No HW4 Found';
      } else {
        statusElement.className = 'status hw4-unknown';
        statusElement.innerHTML = '🔍 No VINs Found';
      }

      // Show VIN details
      if (hw4Status.details && hw4Status.details.length > 0) {
        vinListElement.style.display = 'block';
        noVinsElement.style.display = 'none';

        vinListElement.innerHTML = hw4Status.details.map(detail => {
          const isHW4 = detail.toLowerCase().includes('hw4 yes') ||
                       detail.toLowerCase().includes('hw4 guaranteed');
          const cssClass = isHW4 ? 'hw4-yes' : 'hw4-no';
          return `<div class="vin-item ${cssClass}">${detail}</div>`;
        }).join('');
      } else {
        vinListElement.style.display = 'none';
        noVinsElement.style.display = 'block';
      }
    } else {
      // No data available
      statusElement.className = 'status hw4-unknown';
      statusElement.innerHTML = '🔍 No VINs Found';
      vinListElement.style.display = 'none';
      noVinsElement.style.display = 'block';
    }

    // Show last scan time
    if (result.lastScan) {
      const scanTime = new Date(result.lastScan);
      const timeString = scanTime.toLocaleTimeString();
      lastScanElement.textContent = `Last scanned: ${timeString}`;
    } else {
      lastScanElement.textContent = 'Not scanned yet';
    }
  });
}

// Refresh data when popup opens
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs[0]) {
    // Trigger a re-scan of the current tab
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js']
    }).then(() => {
      // Reload status after re-scan
      setTimeout(loadHW4Status, 500);
    }).catch(() => {
      // Content script might not be injected yet, just load existing data
      loadHW4Status();
    });
  }
});
