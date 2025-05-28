import { doc } from "./utils.js";
import { LoadSettings } from "./settings.js";

function CreateUserData() {
  console.log("Creating user data...");
  chrome.runtime.sendMessage({ action: "focusPage" }, (response) => {
    if (response && response.tabId) {
      const checkTabLoaded = () => {
        chrome.tabs.get(response.tabId, (tab) => {
          if (tab.status === "complete") {
            UpdateUserData();
          } else {
            setTimeout(checkTabLoaded, 100);
          }
        });
      };

      chrome.tabs.reload(response.tabId, () => {
        checkTabLoaded();
      });
    } else {
      UpdateUserData();
    }
    console.log("Loading settings...");
    LoadSettings();
  });
}

function UpdateUserData() {
  let snapchatUserId = null;
  chrome.runtime.sendMessage({ action: "getData" }, (response) => {
    if (response.snapchatUserId) {
      snapchatUserId = response.snapchatUserId;
    }
  });
  chrome.runtime.sendMessage({ action: "getFriendsList" }, (response) => {
    console.log("Response from getFriendsList in popup:", response);

    if (response.friendsList) {
      if (response.friendsList.friends) {
        const foundYourProfile = response.friendsList.friends.find((your_account) => your_account.user_id === snapchatUserId || your_account.userId === snapchatUserId);

        if (foundYourProfile) {
          console.log("Found matching friend:", foundYourProfile);
          const ProfilePicElement = doc("profilePicture");
          if (ProfilePicElement) {
            ProfilePicElement.src = `https://cf-st.sc-cdn.net/3d/render/${foundYourProfile.bitmoji_selfie_id}-${foundYourProfile.bitmoji_avatar_id}-v1.webp?trim=circle&amp;scale=0&amp;ua=2`;
          }
          const ProfileUserName = doc("userName");
          if (ProfileUserName) {
            ProfileUserName.textContent = foundYourProfile.mutable_username;
          }
          const ProfileDisplayName = doc("displayName");
          if (ProfileDisplayName) {
            ProfileDisplayName.textContent = foundYourProfile.display;
          }
          if (!foundYourProfile.is_plus_subscriber) {
            document.querySelectorAll('[has_snapplus="true"]').forEach((element) => {
              element.setAttribute("has_snapplus", "false");
            });
          }
          chrome.storage.local.set({
            user_data: {
              userId: foundYourProfile.user_id,
              displayName: foundYourProfile.display,
              username: foundYourProfile.mutable_username,
              bitmojiSelfieId: foundYourProfile.bitmoji_selfie_id,
              bitmojiAvatarId: foundYourProfile.bitmoji_avatar_id,
              bitmojiLink: `https://cf-st.sc-cdn.net/3d/render/${foundYourProfile.bitmoji_selfie_id}-${foundYourProfile.bitmoji_avatar_id}-v1.webp?trim=circle&amp;scale=0&amp;ua=2`,
              isPlusSubscriber: foundYourProfile.is_plus_subscriber,
            },
          });
        } else {
          console.log("No friend found with matching user ID:", snapchatUserId);
        }
      }
    }
  });
}

export { UpdateUserData, CreateUserData };
