import { SnapchatApi } from '../src/scripts/snapchat-api.js';

let snapchatUserId = null;
let authorization_key = null;

chrome.storage.local.get(["snapchatUserId", "user_authorization", "user_cookie"], (result) => {
  if (result.snapchatUserId) {
    snapchatUserId = result.snapchatUserId;
  }
  if (result.user_authorization) {
    authorization_key = result.user_authorization;
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    try {
      if (details.requestBody && details.requestBody.formData) {
        if (details.requestBody.formData.snapchat_user_id) {
          snapchatUserId = details.requestBody.formData.snapchat_user_id[0];
          chrome.storage.local.set({ snapchatUserId: snapchatUserId });
        }
      }
    } catch (error) {
      console.error("Error in request listener:", error);
    }
    return {};
  },
  { urls: ["*://*.snapchat.com/ami/friends"] },
  ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    try {
      if (details.requestHeaders) {
        const authHeader = details.requestHeaders.find((header) => header.name.toLowerCase() === "authorization");
        if (authHeader) {
          authorization_key = authHeader.value;
          chrome.storage.local.set({ user_authorization: authorization_key });
        }
      }
    } catch (error) {
      console.error("Error in request listener:", error);
    }
  },
  {
    urls: ["*://*.snapchat.com/ami/friends"],
  },
  ["requestHeaders"]
);

async function focusSnapchatPage() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      let snapchatTab = null;
      for (let tab of tabs) {
        if (tab.url && tab.url.includes("snapchat.com")) {
          snapchatTab = tab;
          break;
        }
      }
      console.log("Found Snapchat tab:", snapchatTab);
      if (snapchatTab) {
        chrome.tabs.update(snapchatTab.id, { active: true, highlighted: true });
        chrome.windows.update(snapchatTab.windowId, { focused: true });
        resolve({ tabId: snapchatTab.id, success: true });
      } else {
        chrome.tabs.create({ url: "https://web.snapchat.com", active: true }, (newTab) => {
          resolve({ tabId: newTab.id, success: true });
        });
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getData") {
    console.log("Handling getData request");
    chrome.storage.local.get(["snapchatUserId", "user_authorization", "user_cookie"], (result) => {
      sendResponse({
        snapchatUserId: result.snapchatUserId || snapchatUserId,
        user_authorization: result.user_authorization || null,
        user_cookie: result.user_cookie || null,
      });
    });
    return true;
  }
  if (request.action === "DOMLoaded") {
    getCookies();
  }
  if (request.action === "getFriendsList") {
    const userId = request.userId || snapchatUserId;
    const auth = request.auth || authorization_key;

    getFriendsList()
      .then((friendsList) => {
        sendResponse({ friendsList: friendsList });
      })
      .catch((error) => {
        console.error("Error in getFriendsList:", error);
        sendResponse({ error: error.message });
      });

    return true;
  }
  if (request.action === "focusPage") {
    focusSnapchatPage()
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({ tabId: null, success: false, message: error.message });
      });
    return true;
  }
});

async function getCookies() {
  try {
    const snapApi = new SnapchatApi();
    const cookies = await snapApi.getCookies();
    if (cookies) {
      console.log("Retrieved cookies:", cookies);
      let cookieString = "";
      for (const [name, value] of Object.entries(cookies)) {
        cookieString += `${name}=${value};`;
      }
      chrome.storage.local.set({ user_cookie: cookieString });
      return cookies;
    } else {
      console.log("No cookies found");
      return null;
    }
  } catch (error) {
    console.error("Error in getCookies function:", error);
    return null;
  }
}

async function getFriendsList() {
  try {
    const snapApi = new SnapchatApi();

    chrome.storage.local.get(["snapchatUserId", "user_authorization"], (result) => {
      const userId = result.snapchatUserId || snapchatUserId;
      const authToken = result.user_authorization || authorization_key;

      if (!userId || !authToken) {
        console.error("Missing required data for getFriendsList:", { userId, authToken });
        return null;
      }

      snapApi
        .getFriendsList(userId, authToken)
        .then((friendsList) => {
          if (friendsList) {
            chrome.storage.local.set({ user_friends: friendsList });
            console.log("Retrieved friends list:", friendsList);
            return friendsList;
          } else {
            console.log("No friends list found");
            return null;
          }
        })
        .catch((error) => {
          console.error(error);
          return null;
        });
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

console.log("Snapchat API Interceptor background script loaded");