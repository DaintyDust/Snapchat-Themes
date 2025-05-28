let snapchatUserId = null;

chrome.storage.local.get(['snapchatUserId'], (result) => {
  if (result.snapchatUserId) {
    snapchatUserId = result.snapchatUserId;
  }
});

// chrome.webRequest.onResponseStarted.addListener(
//   (details) => {
//       console.log('OnResponse:', details);
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] }
// );

// chrome.webRequest.onCompleted.addListener(
//   (details) => {
//       console.log('OnCompleted:', details);
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] }
// );

// EVENTS
// chrome.webRequest.onBeforeRequest.addListener(
//   function(details) {
//     console.log("onBeforeRequest triggered: ", details);
//     return {}; 
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] }
// );

// chrome.webRequest.onCompleted.addListener(
//   function(details) {
//     console.log("onCompleted triggered: ", details);
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] }
// );

// chrome.webRequest.onHeadersReceived.addListener(
//   function(details) {
//     console.log("onHeadersReceived triggered: ", details);
//     details.responseHeaders.push({ name: "X-Custom-Header", value: "Test" });
//     return { responseHeaders: details.responseHeaders };
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] },
//   ["responseHeaders"]
// );

// chrome.webRequest.onResponseStarted.addListener(
//   function(details) {
//     console.log("onResponseStarted triggered: ", details);
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] }
// );

// chrome.webRequest.onSendHeaders.addListener(
//   function(details) {
//     console.log("onSendHeaders triggered: ", details);
//     details.requestHeaders.push({ name: "X-Request-Source", value: "ChromeExtension" });
//     return { requestHeaders: details.requestHeaders };
//   },
//   { urls: ["*://*.snapchat.com/ami/friends"] },
//   ["requestHeaders"]
// );

let activeDebuggerTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("snapchat.com") && changeInfo.status === "complete") {
    if (!activeDebuggerTabs.has(tabId)) {
      attachDebugger(tabId);
    }
  }
});

function attachDebugger(tabId) {
  chrome.debugger.attach({ tabId: tabId }, "1.3", function() {
     if (chrome.runtime.lastError) {
      console.error('Error attaching debugger:', chrome.runtime.lastError);
      return;
    }

    activeDebuggerTabs.add(tabId);
   chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable", {}, () => {
      if (chrome.runtime.lastError) {
        console.error('Error enabling network tracking:', chrome.runtime.lastError);
        return;
      }
    });
    
  });
}

chrome.debugger.onEvent.addListener(function(debuggeeId, message, params) {
  if (message === 'Network.responseReceived' && params.response.url.includes('ami/friends')) {
    
    const { requestId, response } = params;

    chrome.debugger.sendCommand(
        { tabId: debuggeeId.tabId },
        "Network.getResponseBody",
        { requestId: requestId },
        (responseBody) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting response body:', chrome.runtime.lastError);
            return;
          }
          
          if (responseBody && responseBody.body) {
            try {
              const parsedData = JSON.parse(responseBody.body);
              friendsResponseData = {
                timestamp: new Date().toISOString(),
                responseUrl: response.url,
                statusCode: response.status,
                responseBody: parsedData,
                capturedBy: 'debugger_api'
              };
          
              console.log('Captured response data:', friendsResponseData);  
            } catch (error) {
              console.error('Error parsing response body:', error);
            }
          }
        }
      );
  }
});



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'storeResponseData' && request.data) {
    console.log('Received response data from content script');
    const friendsResponseData = {
      timestamp: new Date().toISOString(),
      responseUrl: request.url || 'unknown',
      responseBody: request.data,
      capturedBy: request.captureMethod || 'content_script'
    };

    chrome.storage.local.set({ 'friendsResponseData': friendsResponseData });
  }
  if (request.action === 'getData') {
    // Get the latest data from storage to ensure we have the most recent version
    chrome.storage.local.get(['snapchatUserId', 'friendsResponseData'], (result) => {
      sendResponse({ 
        snapchatUserId: result.snapchatUserId || snapchatUserId,
        friendsResponseData: result.friendsResponseData || null
      });
    });
    return true; // Keep the message channel open for async response
  }
});

console.log('Background script loaded');