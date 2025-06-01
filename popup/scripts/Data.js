import { doc } from "./utils.js";
import { LoadSettings } from "./settings.js";
import { CreateProfileElement, CreateProfileDivider } from "./Profile.js";
import { updateDataDisplay, EditTheme } from "./Gui.js";
import { showConfirmPopup, ShowInfoMessage, ShowSuccessMessage, ShowErrorMessage } from "./messagePopup.js";

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
  chrome.runtime.sendMessage({ action: "getFriendsList" }, async (response) => {
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

function LoadFriendsList() {
  doc("Friends_Container").innerHTML = "";
  let PinnBestFriends = null;
  chrome.storage.local.get("user_settings", (result) => {
    if (result.user_settings && result.user_settings.showBestFriendsOnTop) {
      PinnBestFriends = result.user_settings.showBestFriendsOnTop;
    }

    chrome.storage.local.get(["user_friends", "snapchatUserId"], (result) => {
      const friendsData = result.user_friends;
      console.log("Friends List:", friendsData);
      if (friendsData && friendsData.friends) {
        if (PinnBestFriends === true && friendsData.bests_user_ids) {
          const bestFriends = friendsData.friends
            .filter((friend) => friendsData.bests_user_ids.includes(friend.user_id))
            .sort((a, b) => {
              return friendsData.bests_user_ids.indexOf(a.user_id) - friendsData.bests_user_ids.indexOf(b.user_id);
            });
          const otherFriends = friendsData.friends.filter((friend) => !friendsData.bests_user_ids.includes(friend.user_id) && friend.user_id !== result.snapchatUserId).sort((a, b) => a.display.localeCompare(b.display));

          const bestdivider = CreateProfileDivider("Best Friends", true);
          bestFriends.forEach((BestFriendData) => {
            const friendmoji = BestFriendData.friendmoji_string ? [...BestFriendData.friendmoji_string][0] : null;
            const profile = CreateProfileElement(BestFriendData.display, BestFriendData.mutable_username, BestFriendData.bitmoji_selfie_id, BestFriendData.bitmoji_avatar_id, friendmoji, BestFriendData.is_plus_subscriber, BestFriendData.user_id);
            if (profile) {
              bestdivider.appendChild(profile);
              EditTheme(profile);
            }
          });
          doc("Friends_Container").appendChild(bestdivider);
          const otherdivider = CreateProfileDivider("Other Friends", true);

          otherFriends.forEach((friendData) => {
            const friendmoji = friendData.friendmoji_string ? [...friendData.friendmoji_string][0] : null;
            const profile = CreateProfileElement(friendData.display, friendData.mutable_username, friendData.bitmoji_selfie_id, friendData.bitmoji_avatar_id, friendmoji, friendData.is_plus_subscriber, friendData.user_id);
            if (profile) {
              otherdivider.appendChild(profile);
              EditTheme(profile);
            }
          });
          doc("Friends_Container").appendChild(otherdivider);
        } else {
          const Friends = friendsData.friends.filter((friend) => friend.user_id !== result.snapchatUserId).sort((a, b) => a.display.localeCompare(b.display));
          Friends.forEach((friendData) => {
            const friendmoji = friendData.friendmoji_string ? [...friendData.friendmoji_string][0] : null;
            const profile = CreateProfileElement(friendData.display, friendData.mutable_username, friendData.bitmoji_selfie_id, friendData.bitmoji_avatar_id, friendmoji, friendData.is_plus_subscriber, friendData.user_id);
            if (profile) {
              doc("Friends_Container").appendChild(profile);
              EditTheme(profile);
            }
          });
        }
      }
    });
  });
}

function clearData() {
  showConfirmPopup(
    "⚠️ Confirm Data Deletion",
    "Are you sure you want to delete all your Snapchat data? This action cannot be undone.",
    "Delete Data",
    () => {
      ShowInfoMessage("Deleting Data", "Removing your Snapchat data...");

      const keysToDelete = ["snapchatUserId", "user_authorization", "user_cookie", "user_data"];

      chrome.storage.local.remove(keysToDelete, () => {
        if (chrome.runtime.lastError) {
          ShowErrorMessage(`Error deleting data: ${chrome.runtime.lastError.message}`);
          return;
        }

        ShowSuccessMessage("All data has been successfully deleted.");
        updateDataDisplay();
      });
    },
    true,
    true
  );

  const popup = doc("popup");
  popup.classList.add("warning");
}

export { UpdateUserData, CreateUserData, LoadFriendsList, clearData };
