console.log("snapchat-api.js loaded");
class SnapchatApi {
  constructor() {
    this.#initialize();
  }

  async #initialize() {
    this.cache = {};
    this.userId = await this.getFromStorage("snapchatUserId", "local");
    this.authorization = await this.getFromStorage(
      "user_authorization",
      "local"
    );
    this.cookie = await this.getFromStorage("user_cookie", "local");

    console.log("Snapchat API client initialized");
  }

  async getFromStorage(key, storageType) {
    return new Promise((resolve) => {
      chrome.storage[storageType].get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  async saveToStorage(key, value, storageType = "local") {
    return new Promise((resolve) => {
      chrome.storage[storageType].set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  async getCookies() {
    try {
      const cookieNames = [
        "EssentialSession",
        "blizzard_client_id",
        "sc-dweb-allocation",
        "sc_at",
        "sc-wcid",
        "sc-a-nonce",
        "sc-cookies-accepted",
        "Preferences",
        "Performance",
        "Marketing",
        "blizzard_web_session_id",
      ];

      // Use async/await properly here
      const cookies = await new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain: "snapchat.com" }, (cookies) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(cookies);
          }
        });
      });

      const cookieValues = {};

      cookieNames.forEach((cookieName) => {
        const cookie = cookies.find((c) => c.name === cookieName);
        if (cookie) {
          cookieValues[cookieName] = cookie.value;
        } else {
          cookieValues[cookieName] = "Not Found";
        }
      });

      return cookieValues;
    } catch (error) {
      console.error("Error retrieving cookies:", error);
      return null;
    }
  }

  async getFriendsList(userid, auth) {
    if (!userid) {
      userid = await this.getFromStorage("snapchatUserId", "local");
      console.log("Using stored userId:", userid);
    }

    if (!auth) {
      const storedAuth = await this.getFromStorage(
        "user_authorization",
        "local"
      );
      auth = storedAuth;
      console.log("Using stored auth:", auth);
    }

    if (!userid || !auth) {
      console.error("Missing required data for getFriendsList:", {
        userid,
        auth,
      });
      return null;
    }

    try {
      const url = "https://web.snapchat.com/ami/friends";

      let cookieString = this.cookie;
      if (!cookieString) {
        cookieString = await this.getFromStorage("user_cookie", "local");
      }

      const headers = {
        Host: `web.snapchat.com`,
        "X-Request-source": `SnapThemes`,
        Authorization: auth,
        Cookie: cookieString,
        "Content-Type": "application/json",
      };

      const requestBody = {
        snapchat_user_id: userid,
        timestamp: Date.now(),
        friends_request: {},
      };

    //   console.log("sending request with headerdata:", headers);
    //   console.log("sending request with bodydata:", requestBody);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No response text");
        throw new Error(
          `Failed to fetch friends list: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error retrieving friends list:", error);
      return null;
    }
  }
}

export { SnapchatApi };
