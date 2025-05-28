import { doc } from './utils.js';

let isSettingsOpen = false;
let originalTopHeight = 0;

function openSettings() {
  const bodyHeight = document.body.clientHeight;
  const settingsButton = doc("settingsButton");
  const Settings_Container = doc("Settings");
  const topElement = doc("top");
  
  if (originalTopHeight === 0) {
    originalTopHeight = topElement.clientHeight;
    doc("topbar").style.maxHeight = `${doc("topbar").clientHeight}px`;
    doc("profile").style.maxHeight = `${doc("profile").clientHeight}px`;
  }

  if (isSettingsOpen) {
    isSettingsOpen = false;
    topElement.style.height = `${originalTopHeight}px`;
    settingsButton.classList.remove("SettingsOpen");
    Settings_Container.classList.remove("SettingsOpen");
    setTimeout(() => {
      Settings_Container.style.display = "none";
      document.body.classList.remove("SettingsOpen");
    }, 300);
  } else {
    isSettingsOpen = true;
    document.body.classList.add("SettingsOpen");
    Settings_Container.style.display = "block";
    setTimeout(() => {
      topElement.style.height = `${bodyHeight}px`;
      settingsButton.classList.add("SettingsOpen");
      Settings_Container.classList.add("SettingsOpen");
    }, 5);
  }
}

function RefreshFriends() {
  console.log("refreshing friends list");
  const RefreshFriendsContainer = doc("RefreshFriends_Container");
  RefreshFriendsContainer.classList.add("Rotate");
  showConfirmPopup(
    "Refresh Friends",
    "Do you want to refresh your friends list? This may take a moment.",
    "Refresh",
    () => {
      ShowInfoMessage("Loading", "Refreshing your friends list...");

      setTimeout(() => {
        closePopup();
        RefreshFriendsContainer.classList.remove("Rotate");
        ShowSuccessMessage("Friends list has been refreshed successfully!");
      }, 1500);

      UpdateUserData();
      setTimeout(() => {
        LoadFriendsList();
      }, 1000);
    },
    true,
    true
  );
}

function updateDataDisplay() {
  chrome.storage.local.get("user_data", (result) => {
    const userData = result.user_data;
    if (userData) {
      const ProfilePicElement = doc("profilePicture");
      const ProfileUserName = doc("userName");
      const ProfileDisplayName = doc("displayName");
      if (ProfilePicElement && userData.bitmojiSelfieId && userData.bitmojiAvatarId) {
        ProfilePicElement.src = `https://cf-st.sc-cdn.net/3d/render/${userData.bitmojiSelfieId}-${userData.bitmojiAvatarId}-v1.webp?trim=circle&amp;scale=0&amp;ua=2`;
      }
      if (ProfileUserName && userData.username) {
        ProfileUserName.textContent = userData.username;
      }
      if (ProfileDisplayName && userData.displayName) {
        ProfileDisplayName.textContent = userData.displayName;
      }
      if (userData.hasOwnProperty("isPlusSubscriber") && userData.isPlusSubscriber === false) {
        document.querySelectorAll('[has_snapplus="true"]').forEach((element) => {
          element.setAttribute("has_snapplus", "false");
        });
      }
    }
  });
}

export {
    openSettings,
    RefreshFriends,
    updateDataDisplay
};