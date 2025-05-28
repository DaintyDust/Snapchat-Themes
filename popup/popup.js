import { doc } from "./scripts/utils.js";
import { showConfirmPopup, closePopup, showMessagePopup, ShowErrorMessage, ShowSuccessMessage, ShowWarningMessage, ShowInfoMessage, ShowDisclaimerMessage } from "./scripts/messagePopup.js";
import { UpdateUserData, CreateUserData } from "./scripts/Data.js";
import { openSettings, RefreshFriends, updateDataDisplay } from "./scripts/Gui.js";
import { LoadSettings, ReloadSettings, setupPopupTesters } from "./scripts/settings.js";
import { CreateProfileElement, CreateProfileDivider, EditTheme } from "./scripts/Profile.js";

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

function LoadDropdowns() {
  document.querySelectorAll("select").forEach(function (select) {
    const numberOfOptions = select.options.length;

    select.classList.add("dropdown-hidden");

    const wrapper = document.createElement("div");
    wrapper.className = "Drowpdown_Select";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const Dropdown_Select_Btn = document.createElement("div");
    Dropdown_Select_Btn.className = "Dropdown_Select_Btn";
    Dropdown_Select_Btn.textContent = select.options[0].text;
    wrapper.appendChild(Dropdown_Select_Btn);

    const list = document.createElement("ul");
    list.className = "Dropdown_Options";
    wrapper.appendChild(list);

    for (let i = 0; i < numberOfOptions; i++) {
      const option = select.options[i];
      const li = document.createElement("li");
      li.textContent = option.text;
      li.setAttribute("rel", option.value);
      list.appendChild(li);
    }

    const listItems = list.querySelectorAll("li");

    Dropdown_Select_Btn.addEventListener("click", function (e) {
      e.stopPropagation();

      document.querySelectorAll(".Dropdown_Select_Btn.active").forEach(function (active) {
        active.classList.remove("active");
        const ul = active.nextElementSibling;
        if (ul && ul.classList.contains("Dropdown_Options")) {
          ul.style.display = "none";
        }
      });

      this.classList.toggle("active");
      list.style.display = list.style.display === "block" ? "none" : "block";
    });

    listItems.forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.stopPropagation();
        Dropdown_Select_Btn.textContent = this.textContent;
        Dropdown_Select_Btn.classList.remove("active");
        select.value = this.getAttribute("rel");
        list.style.display = "none";
      });
    });

    document.addEventListener("click", function () {
      Dropdown_Select_Btn.classList.remove("active");
      list.style.display = "none";
    });
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
          // console.log("Best Friends List:", bestFriends);
          // console.log("Other Friends List:", otherFriends);

          const bestdivider = CreateProfileDivider("Best Friends", true);
          bestFriends.forEach((BestFriendData) => {
            const friendmoji = BestFriendData.friendmoji_string ? [...BestFriendData.friendmoji_string][0] : null;
            const profile = CreateProfileElement(BestFriendData.display, BestFriendData.mutable_username, BestFriendData.bitmoji_selfie_id, BestFriendData.bitmoji_avatar_id, friendmoji, BestFriendData.is_plus_subscriber);
            if (profile) {
              bestdivider.appendChild(profile);
              EditTheme(profile);
            }
          });
          doc("Friends_Container").appendChild(bestdivider);
          const otherdivider = CreateProfileDivider("Other Friends", true);

          otherFriends.forEach((friendData) => {
            const friendmoji = friendData.friendmoji_string ? [...friendData.friendmoji_string][0] : null;
            const profile = CreateProfileElement(friendData.display, friendData.mutable_username, friendData.bitmoji_selfie_id, friendData.bitmoji_avatar_id, friendmoji, friendData.is_plus_subscriber);
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
            const profile = CreateProfileElement(friendData.display, friendData.mutable_username, friendData.bitmoji_selfie_id, friendData.bitmoji_avatar_id, friendmoji, friendData.is_plus_subscriber);
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

function ThemesBackBtn() {
  document.querySelectorAll(".EditTheme").forEach((element) => {
    element.classList.remove("EditTheme");
  });
}

function InitLoad() {
  checkForFullscreenMode();
  const CreatedNewData = null;
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
  LoadDropdowns();
  setupPopupTesters();
  LoadFriendsList();
  // CheckSnapchatConnection();
  if (!CreatedNewData) {
    updateDataDisplay();
  }
}

document.addEventListener("DOMContentLoaded", InitLoad);
