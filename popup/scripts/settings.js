import { doc } from "./utils.js";

function LoadSettings() {
  fetch("scripts/settings.json")
    .then((response) => {
      console.log("Response:", response);
      return response.json();
    })
    .then((settingsConfig) => {
      chrome.storage.local.get("user_settings", (result) => {
        let userSettings = result.user_settings || {};
        let hasChanged = false;

        for (const setting of settingsConfig.settings) {
          if (!userSettings.hasOwnProperty(setting.name)) {
            userSettings[setting.name] = setting.default;
            hasChanged = true;
          }
        }

        if (hasChanged) {
          chrome.storage.local.set({ user_settings: userSettings }, () => {
            console.log("Default settings created:", userSettings);
            setupSettingsElements(settingsConfig.settings, userSettings);
          });
        } else {
          setupSettingsElements(settingsConfig.settings, userSettings);
        }
      });
    })
    .catch((error) => {
      console.error("Error loading settings:", error);
    });
}

function setupSettingsElements(settingsArray, userSettings) {
  const Settings_Container = doc("Settings_Container");
  const elementsToRemove = Settings_Container.querySelectorAll(":not(.NoRemove):not(.NoRemove *)");
  elementsToRemove.forEach((element) => element.remove());

  settingsArray.forEach((setting) => {
    if (setting.template) {
      Settings_Container.insertAdjacentHTML("beforeend", setting.template);

      if (setting.type === "toggle") {
        const insertedSetting = Settings_Container.lastElementChild;
        const checkbox = insertedSetting.querySelector('input[type="checkbox"]');
        const label = insertedSetting.querySelector("label[for]");

        if (checkbox) {
          checkbox.id = `setting_${setting.name}`;
          checkbox.checked = userSettings[setting.name];

          if (label) {
            label.setAttribute("for", `setting_${setting.name}`);
          }

          checkbox.addEventListener("change", function () {
            const isChecked = this.checked;

            chrome.storage.local.get("user_settings", (data) => {
              const updatedSettings = data.user_settings || {};
              updatedSettings[setting.name] = isChecked;

              chrome.storage.local.set({ user_settings: updatedSettings }, () => {
                console.log(`Setting ${setting.name} updated to:`, isChecked);

                if (setting.name === "showBestFriendsOnTop") {
                  ReloadSettings();
                }
              });
            });
          });
        }
      } else if (setting.type === "color") {
        const insertedSetting = Settings_Container.lastElementChild;
        const colorInput = insertedSetting.querySelector('input[type="color"]');

        if (colorInput) {
          colorInput.id = `setting_${setting.name}`;
          colorInput.value = userSettings[setting.name];

          colorInput.addEventListener("change", function () {
            const colorValue = this.value;

            chrome.storage.local.get("user_settings", (data) => {
              const updatedSettings = data.user_settings || {};
              updatedSettings[setting.name] = colorValue;

              chrome.storage.local.set({ user_settings: updatedSettings }, () => {
                console.log(`Setting ${setting.name} updated to:`, colorValue);

                if (setting.name === "themeColor") {
                  applyThemeColor(colorValue);
                }
              });
            });
          });

          applyThemeColor(userSettings[setting.name]);
        }
      }
    }
  });
}

function applyThemeColor(color) {
  document.documentElement.style.setProperty("--theme-color", color);
}

function ReloadSettings() {
  if (typeof window.LoadFriendsList === "function") {
    window.LoadFriendsList();
  }
}

function setupPopupTesters() {
  doc("testPopupBtn")?.addEventListener("click", function () {
    const DropDown = doc("testPopupSelect");
    const Selected_Item = DropDown.value;

    if (Selected_Item === "testInfo") {
      ShowInfoMessage("Information", "This is an information message that will automatically close in a few seconds.");
    } else if (Selected_Item === "testSuccess") {
      ShowSuccessMessage("Operation completed successfully!");
    } else if (Selected_Item === "testWarning") {
      ShowWarningMessage("This action may have consequences. Please proceed with caution.");
    } else if (Selected_Item === "testError") {
      ShowErrorMessage("An error occurred while processing your request.");
    } else if (Selected_Item === "testDisclaimer") {
      ShowDisclaimerMessage("Disclaimer", "This feature requires Snapchat Premium. Please upgrade your account to access this feature.");
    } else if (Selected_Item === "testConfirm") {
      showConfirmPopup(
        "Confirmation",
        "Are you sure you want to perform this action?",
        "Yes, Continue",
        () => {
          ShowSuccessMessage("Action confirmed!");
        },
        true,
        true
      );
    }
  });
}

export { LoadSettings, setupSettingsElements, applyThemeColor, ReloadSettings, setupPopupTesters };
