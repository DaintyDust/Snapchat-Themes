console.log('Content script loaded');

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: 'DOMLoaded' });
});