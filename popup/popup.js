import { doc } from "./scripts/utils.js";
import { showConfirmPopup, closePopup, showMessagePopup, ShowErrorMessage, ShowSuccessMessage, ShowWarningMessage, ShowInfoMessage, ShowDisclaimerMessage } from "./scripts/messagePopup.js";
import { UpdateUserData, CreateUserData, LoadFriendsList, clearData } from "./scripts/Data.js";
import { openSettings, RefreshFriends, updateDataDisplay, LoadDropdowns, LoadRadialSliders, ThemesBackBtn, setupThemeSettingDropdowns } from "./scripts/Gui.js";
import { LoadSettings, ReloadSettings, setupPopupTesters } from "./scripts/settings.js";

function checkForFullscreenMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("fullscreen")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles/fullscreen.css";
    document.head.appendChild(link);
  }
}

function CheckSnapchatConnection(popup = true, callback = null) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const isOnSnapchat = tabs[0]?.url?.includes("snapchat.com");
    if (!isOnSnapchat && popup) {
      console.log("Not on Snapchat Web, showing popup. Show popup:", popup);
      ShowDisclaimerMessage("Extension Notice", "Please navigate to Snapchat Web to load your data.");
    }
    if (callback) {
      callback(isOnSnapchat);
    }
    return isOnSnapchat;
  });
}

function SearchUsers() {
  const search = doc("searchInput").value.toLowerCase();

  var children = doc("Friends_Container").children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.classList.contains("Profile_Divider")) {
      const innerElements = child.children;
      for (var j = 0; j < innerElements.length; j++) {
        var newchild = innerElements[j];

        if (newchild.tagName === "SUMMARY") {
          continue;
        }

        const displayNameElement = newchild.querySelector(".Display_Name");
        const userNameElement = newchild.querySelector(".User_Name");

        const displayName = displayNameElement ? displayNameElement.textContent.toLowerCase() : "";
        const userName = userNameElement ? userNameElement.textContent.toLowerCase() : "";

        const isVisible = displayName.includes(search) || userName.includes(search);
        newchild.classList.toggle("noDisplay", !isVisible);
      }
    } else {
      const displayNameElement = child.querySelector(".Display_Name");
      const userNameElement = child.querySelector(".User_Name");

      const displayName = displayNameElement ? displayNameElement.textContent.toLowerCase() : "";
      const userName = userNameElement ? userNameElement.textContent.toLowerCase() : "";

      const isVisible = displayName.includes(search) || userName.includes(search);
      child.classList.toggle("noDisplay", !isVisible);
    }
  }
}

function InitLoad() {
  checkForFullscreenMode();
  let CreatedNewData = null;
  chrome.storage.local.get(null, (result) => {
    const requiredKeys = ["snapchatUserId", "user_cookie", "user_data", "user_friends", "user_settings", "user_authorization"];
    const missingKeys = requiredKeys.filter((key) => !(key in result));

    if (missingKeys.length > 0) {
      showConfirmPopup(
        "Welcome to Snapchat Web Extension",
        "It seems like you haven't captured some data yet. Please navigate to Snapchat Web to start capturing your data.",
        "Go to Snapchat",
        () => {
          CreatedNewData = true;
          CreateUserData();
        },
        true,
        true
      );
    }
  });

  doc("RefreshFriends").addEventListener("click", RefreshFriends);
  doc("RefreshFriendsSettings").addEventListener("click", RefreshFriends);
  doc("settingsButton").addEventListener("click", openSettings);
  doc("clearData").addEventListener("click", clearData);
  doc("searchInput").addEventListener("input", SearchUsers);
  doc("ThemesBackBtn").addEventListener("click", ThemesBackBtn);
  LoadSettings();

  setupThemeSettingDropdowns()
    .then(() => {
      LoadDropdowns();
      LoadRadialSliders();
    })
    .catch((error) => {
      console.error("Failed to setup theme settings:", error);
    });

  setupPopupTesters();
  LoadFriendsList();
  // CheckSnapchatConnection();
  if (!CreatedNewData) {
    updateDataDisplay();
  }
}

document.addEventListener("DOMContentLoaded", InitLoad);
