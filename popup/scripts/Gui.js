import { showConfirmPopup, closePopup, showMessagePopup, ShowErrorMessage, ShowSuccessMessage, ShowWarningMessage, ShowInfoMessage, ShowDisclaimerMessage } from "./messagePopup.js";
import { doc } from "./utils.js";

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

function CreateSettingToggle(SettingName, SettingValue) {
  const settingElement = document.createElement("label");
  settingElement.className = "Setting_Toggle";
  settingElement.setAttribute("for", SettingName);

  settingElement.innerHTML = `
  <label class="Setting_Toggle" for="${SettingName}">
    <div class="toggle_outer">
      <input id="${SettingName}" type="checkbox" ${SettingValue ? "checked" : ""}>
      <div class="button">
        <span class="button_toggle"></span>
        <span class="button_indicator"></span>
      </div>
    </div>
  </label>`;
  return settingElement;
}

function CreateSettingDropdown(SettingName, Dropdown_Options) {
  const settingElement = document.createElement("select");
  settingElement.id = SettingName;
  settingElement.className = "Setting_Dropdown";

  Dropdown_Options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.name;
    settingElement.appendChild(optionElement);
  });

  return settingElement;
}

function CreateSettingsPreview(SettingName, DefaultValue, Dropdown_Options) {
  const optionsPreview = document.createElement("div");
  optionsPreview.className = "Setting_Options";

  Dropdown_Options.forEach((option) => {
    switch (option.value) {
      case "color":
        const colorOptionsContainer = document.createElement("div");
        colorOptionsContainer.className = "color-option";
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = DefaultValue.color;
        colorInput.id = `${SettingName}_Color`;
        colorOptionsContainer.appendChild(colorInput);
        optionsPreview.appendChild(colorOptionsContainer);
        break;
      case "gradient":
        const gradientOptionsContainer = document.createElement("div");
        gradientOptionsContainer.className = "gradient-option";
        gradientOptionsContainer.style.display = "none";

        gradientOptionsContainer.innerHTML = `
         <div class="gradient-controls">
                <input type="color" id="${SettingName}_Gradient1" value="${DefaultValue.gradient.startColor}">
                <input type="color" id="${SettingName}_Gradient2" value="${DefaultValue.gradient.endColor}">
                <div class="gradient-direction-container">
                  <input type="range" id="${SettingName}_GradientDirection" min="0" max="360" value="${DefaultValue.gradient.angle}" data-suffix="°" data-snap="5" class="gradient-direction-range radial-range">
                </div>
              </div>
              <div class="gradient-preview" id="${SettingName}_GradientPreview"></div>
          `;

        optionsPreview.appendChild(gradientOptionsContainer);
        break;
      case "image":
        const imageOptionsContainer = document.createElement("div");
        imageOptionsContainer.className = "image-option";
        imageOptionsContainer.style.display = "none";
        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.accept = "image/*";
        imageInput.id = `${SettingName}_Image`;
        imageInput.style.display = "none";
        const imageLabel = document.createElement("label");
        imageLabel.className = "file-upload-btn";
        imageLabel.textContent = "Choose Image";
        imageLabel.setAttribute("for", imageInput.id);
        imageOptionsContainer.appendChild(imageInput);
        imageOptionsContainer.appendChild(imageLabel);
        optionsPreview.appendChild(imageOptionsContainer);
        break;
    }
  });

  return optionsPreview;
}

function LoadDropdowns() {
  document.querySelectorAll("select").forEach(function (select) {
    const numberOfOptions = select.options.length;

    select.classList.add("dropdown-hidden");

    const wrapper = document.createElement("div");
    wrapper.className = "Dropdown_Select";
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

        // Trigger the change event on the original select element
        const changeEvent = new Event("change", { bubbles: true });
        select.dispatchEvent(changeEvent);
      });
    });

    document.addEventListener("click", function () {
      Dropdown_Select_Btn.classList.remove("active");
      list.style.display = "none";
    });
  });
}

function LoadRadialSliders() {
  const radialInputs = document.querySelectorAll('input[type="range"].radial-range');
  radialInputs.forEach((input) => {
    const min = parseFloat(input.getAttribute("min")) || 0;
    const max = parseFloat(input.getAttribute("max")) || 100;
    const initialValue = parseFloat(input.getAttribute("value")) || 0;
    const suffix = input.getAttribute("data-suffix") || "%";
    const snap = parseFloat(input.getAttribute("data-snap")) || 1;

    const wrapper = document.createElement("div");
    wrapper.className = "Radial_Slider";
    wrapper.innerHTML = `
      <div class="outer-circle">
        <div class="inner-circle">
          <button class="button"></button>
          <div class="percent">${initialValue}${suffix}</div>
        </div>
      </div>
    `;

    input.parentNode.replaceChild(wrapper, input);
    wrapper.appendChild(input);
    input.style.display = "none";

    const button = wrapper.querySelector("button");
    const outerCircle = wrapper.querySelector(".outer-circle");
    const percent = wrapper.querySelector(".percent");

    let lastAngle = 0;
    const setAngle = (unNormalizedAngle) => {
      const angle = unNormalizedAngle < 0 ? unNormalizedAngle + 360 : unNormalizedAngle;
      const normalizedValue = (angle / 360) * (max - min) + min;
      const clampedValue = Math.max(min, Math.min(max, normalizedValue));
      const snappedValue = Math.round(clampedValue / snap) * snap;
      const finalValue = Math.max(min, Math.min(max, snappedValue));

      button.style.transform = `rotateZ(${angle}deg)`;
      percent.innerText = `${finalValue}${suffix}`;

      input.value = finalValue;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true }));

      lastAngle = angle;
    };

    const valueToAngle = (value) => {
      const normalizedValue = (value - min) / (max - min);
      return normalizedValue * 360;
    };

    setAngle(valueToAngle(initialValue));

    const handler = (event) => {
      const rect = outerCircle.getBoundingClientRect();
      const x = event.pageX - (rect.left + rect.width / 2);
      const y = -(event.pageY - (rect.top + rect.height / 2));
      const angle = (Math.atan2(y, x) * 180) / Math.PI;
      setAngle(-(angle - 90));
    };

    const stopDragging = () => {
      window.removeEventListener("pointermove", handler);
      window.removeEventListener("pointerup", stopDragging);
    };

    button.addEventListener("pointerdown", () => {
      window.addEventListener("pointermove", handler);
      window.addEventListener("pointerup", stopDragging);
    });

    outerCircle.addEventListener("click", handler);
  });
}

function ThemesBackBtn() {
  document.querySelectorAll(".EditTheme").forEach((element) => {
    element.classList.remove("EditTheme");
  });
  doc("Themes_Container").setAttribute("selected_userid", "");
}

function EditTheme(profileElement) {
  if (!profileElement) return;

  const editButton = profileElement.querySelector(".Action_Icon button");
  editButton.addEventListener("click", () => {
    profileElement.classList.add("EditTheme");
    const Themes_Container = doc("Themes_Container");
    Themes_Container.classList.add("EditTheme");

    const ProfileName = profileElement.querySelector(".Display_Name");
    const ProfilePic = profileElement.querySelector(".Profile_Picture");

    if (ProfileName && ProfilePic) {
      const ThemeProfilePic = doc("ThemeprofilePicture");
      const ThemeDisplayName = doc("ThemeDisplayName");

      ThemeProfilePic.src = ProfilePic.src;
      ThemeDisplayName.textContent = ProfileName.textContent;
      Themes_Container.setAttribute("selected_userid", profileElement.getAttribute("data-userid"));
    }
  });
}

function CreateThemeSettingsElement(SettingName, SettingType, DefaultValue, Dropdown_Options, Dropdown_Defaults) {
  if (!SettingName || !SettingType) {
    console.error("Invalid parameters for CreateThemeSettingsElement");
    return null;
  }
  const ThemeSettingsContainer = doc("ThemeSettings");
  const SettingElement = document.createElement("div");
  SettingElement.className = "Setting";
  const SettingLabel = document.createElement("label");
  SettingLabel.textContent = SettingName;
  SettingLabel.className = "Setting_Text";
  SettingElement.appendChild(SettingLabel);

  switch (SettingType) {
    case "toggle":
      const toggleElement = CreateSettingToggle(SettingName, DefaultValue);
      SettingElement.appendChild(toggleElement);
      ThemeSettingsContainer.appendChild(SettingElement);
      break;
    case "dropdown":
      const dropdownElement = CreateSettingDropdown(SettingName, Dropdown_Options);
      SettingElement.appendChild(dropdownElement);

      ThemeSettingsContainer.appendChild(SettingElement);
      const optionsPreview = CreateSettingsPreview(SettingName, Dropdown_Defaults, Dropdown_Options);
      ThemeSettingsContainer.appendChild(optionsPreview);

      updateThemeSettingDropdown(SettingName, dropdownElement, optionsPreview);
      break;
  }
}

function setupThemeSettingDropdowns() {
  return fetch("scripts/Settings/ThemeSettings.json")
    .then((response) => {
      return response.json();
    })
    .then((settingsConfig) => {
      const settings = settingsConfig.settings[0];
      Object.keys(settings).forEach((settingKey) => {
        const setting = settings[settingKey];
        if (setting.SettingName && setting.Type) {
          CreateThemeSettingsElement(setting.SettingName, setting.Type, setting.Default, setting.DropdownOptions, setting.Dropdown_Defaults);
        } else {
          console.error("Invalid setting configuration:", setting);
        }
      });
    })
    .catch((error) => {
      console.error("Error loading Theme settings:", error);
      throw error;
    });
}

function setupGradientControlsForSetting(SettingName, optionsPreview) {
  const color1Input = document.getElementById(`${SettingName}_Gradient1`);
  const color2Input = document.getElementById(`${SettingName}_Gradient2`);
  const directionInput = document.getElementById(`${SettingName}_GradientDirection`);
  const directionValue = optionsPreview.querySelector(".gradient-direction-value");
  const preview = document.getElementById(`${SettingName}_GradientPreview`);

  if (color1Input && color2Input && directionInput && preview) {
    if (!color1Input.hasAttribute("data-gradient-setup")) {
      const updateGradientPreview = () => {
        const color1 = color1Input.value;
        const color2 = color2Input.value;
        const direction = directionInput.value;

        if (directionValue) {
          directionValue.textContent = `${direction}°`;
        }

        preview.style.background = `linear-gradient(${direction}deg, ${color1}, ${color2})`;
      };

      color1Input.addEventListener("input", updateGradientPreview);
      color2Input.addEventListener("input", updateGradientPreview);
      directionInput.addEventListener("input", updateGradientPreview);

      color1Input.setAttribute("data-gradient-setup", "true");
      color2Input.setAttribute("data-gradient-setup", "true");
      directionInput.setAttribute("data-gradient-setup", "true");

      updateGradientPreview();
    }
  }
}

function updateThemeSettingDropdown(SettingName, dropdownElement, optionsPreview) {
  const colorOption = optionsPreview.querySelector(".color-option");
  const gradientOption = optionsPreview.querySelector(".gradient-option");
  const imageOption = optionsPreview.querySelector(".image-option");

  if (!colorOption) {
    console.error("Color option not found for setting:", SettingName);
    return;
  }

  dropdownElement.addEventListener("change", () => {
    const selectedValue = dropdownElement.value;
    colorOption.style.display = "none";
    if (gradientOption) gradientOption.style.display = "none";
    if (imageOption) imageOption.style.display = "none";

    switch (selectedValue) {
      case "color":
        colorOption.style.display = "flex";
        break;
      case "gradient":
        if (gradientOption) {
          gradientOption.style.display = "flex";
          setupGradientControlsForSetting(SettingName, optionsPreview);
        }
        break;
      case "image":
        if (imageOption) {
          imageOption.style.display = "flex";
        }
        break;
      default:
        console.warn("Unknown option type:", selectedValue);
        colorOption.style.display = "flex";
    }
  });

  const initialEvent = new Event("change");
  dropdownElement.dispatchEvent(initialEvent);
}

export { openSettings, RefreshFriends, updateDataDisplay, LoadDropdowns, LoadRadialSliders, ThemesBackBtn, EditTheme, setupThemeSettingDropdowns };
