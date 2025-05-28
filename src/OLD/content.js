// Content script to inject Fetch/XHR interceptors directly into the page

console.log('Snapchat API Interceptor content script loaded');

// Create the script to inject
function createInterceptorScript() {
  return `
  (function() {
    console.log('Snapchat API interceptor injected into page context');
    
    // Intercept fetch API
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const response = await originalFetch.apply(this, arguments);
      
      // Check if this is a request to the /ami/friends endpoint
      if (input.toString().includes('/ami/friends')) {
        try {
          // Create a clone so we can read the body without consuming it
          const responseClone = response.clone();
          const responseBody = await responseClone.json();
          console.log('Fetch response captured:', responseBody);
          
          // Dispatch a custom event that our content script can listen for
          window.dispatchEvent(new CustomEvent('snapchat_response_captured', {
            detail: {
              type: 'fetch',
              url: input.toString(),
              data: responseBody
            }
          }));
        } catch (error) {
          console.error('Error in fetch interceptor:', error);
        }
      }
      
      return response;
    };
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._snapchatInterceptUrl = url;
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      if (this._snapchatInterceptUrl && this._snapchatInterceptUrl.includes('/ami/friends')) {
        const originalOnReadyStateChange = this.onreadystatechange;
        
        this.onreadystatechange = function() {
          if (this.readyState === 4) { // 4 = DONE
            try {
              // Try to parse JSON
              const responseData = JSON.parse(this.responseText);
              console.log('XHR response captured:', responseData);
              
              // Dispatch a custom event that our content script can listen for
              window.dispatchEvent(new CustomEvent('snapchat_response_captured', {
                detail: {
                  type: 'xhr',
                  url: this._snapchatInterceptUrl,
                  data: responseData
                }
              }));
            } catch (error) {
              console.error('Error in XHR interceptor:', error);
            }
          }
          
          // Call the original handler if it exists
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
      }
      
      return originalXHRSend.apply(this, arguments);
    };
    
    console.log('Fetch and XHR interceptors installed');
  })();
  `;
}

// Function to inject script into the page
function injectScript() {
  try {
    // Create a script element
    const script = document.createElement('script');
    script.textContent = createInterceptorScript();
    
    // Add the script to the page
    (document.head || document.documentElement).appendChild(script);
    
    // Remove the script element after it's executed (optional)
    script.remove();
    
    console.log('Interceptor script injected directly into page');
  } catch (error) {
    console.error('Failed to inject interceptor script:', error);
  }
}

// Listen for the custom event from our injected script
window.addEventListener('snapchat_response_captured', function(event) {
  try {
    console.log(`Response captured by ${event.detail.type} interceptor:`, event.detail.url);
    
    // Forward to background script
    chrome.runtime.sendMessage({
      action: 'storeResponseData',
      data: event.detail.data,
      url: event.detail.url,
      captureMethod: event.detail.type
    });
  } catch (error) {
    console.error('Error handling captured response:', error);
  }
}, false);

// Inject the script as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
} else {
  injectScript();
}

// For safety, also inject on document load in case the first attempt failed
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectScript, 500); // Small delay to ensure the page is ready
});