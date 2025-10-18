// HW4 Tesla VIN Checker Background Script

try {
  // Handle badge updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'updateBadge') {
        chrome.action.setBadgeText({ text: message.text, tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: message.color, tabId: sender.tab.id });
      }
    } catch (messageError) {
      console.warn('HW4 Extension: Error handling message:', messageError);
    }
  });

  // Initialize badge for new tabs
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    try {
      if (changeInfo.status === 'complete') {
        // Clear badge initially
        chrome.action.setBadgeText({ text: '', tabId: tabId });
      }
    } catch (tabError) {
      console.warn('HW4 Extension: Error handling tab update:', tabError);
    }
  });
} catch (backgroundError) {
  console.error('HW4 Extension: Error in background script:', backgroundError);
}
