import { doc } from './utils.js';

// Message popup utilities for handling different types of popups

function showConfirmPopup(title, content, confirmButtonText = "Confirm", onConfirm = null, showCancelButton = true, showConfirmButton = true) {
  try {
    const popup = doc("popup");
    if (!popup) {
      console.error("Popup element not found");
      return;
    }

    const popupTitle = popup.querySelector("h2");
    const popupContent = popup.querySelector("p");
    const confirmButton = doc("confirmPopup");
    const closeButton = doc("closePopup");

    if (!popupTitle || !popupContent || !confirmButton || !closeButton) {
      console.error("Popup elements not found");
      return;
    }

    popup.classList.remove("info", "success", "warning", "error", "disclaimer");

    const newConfirmButton = confirmButton.cloneNode(true);
    const newCloseButton = closeButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);

    const refreshedConfirmButton = doc("confirmPopup");
    const refreshedCloseButton = doc("closePopup");

    popupTitle.textContent = title;
    popupContent.textContent = content;
    refreshedConfirmButton.textContent = confirmButtonText;
    refreshedCloseButton.style.display = showCancelButton ? "block" : "none";
    refreshedConfirmButton.style.display = showConfirmButton ? "block" : "none";

    if (showConfirmButton && showCancelButton) {
      refreshedConfirmButton.style.width = "48%";
      refreshedCloseButton.style.width = "48%";
    } else if (showConfirmButton && !showCancelButton) {
      refreshedConfirmButton.style.width = "100%";
    } else if (!showConfirmButton && showCancelButton) {
      refreshedCloseButton.style.width = "100%";
    }

    popup.style.opacity = "1";
    popup.style.display = "flex";

    refreshedConfirmButton.onclick = function () {
      if (typeof onConfirm === "function") {
        try {
          onConfirm();
        } catch (error) {
          console.error("Error in confirm callback:", error);
        }
      }
      closePopup();
    };

    refreshedCloseButton.onclick = function () {
      closePopup();
    };
  } catch (error) {
    console.error("Error showing popup:", error);
  }
}

function closePopup() {
  try {
    const popup = doc("popup");
    if (!popup) {
      console.error("Popup element not found");
      return;
    }
    popup.style.opacity = "0";

    setTimeout(() => {
      popup.style.display = "none";
      popup.classList.remove("info", "success", "warning", "error", "disclaimer");

      const confirmButton = doc("confirmPopup");
      const closeButton = doc("closePopup");
      if (confirmButton) confirmButton.style.width = "";
      if (closeButton) closeButton.style.width = "";
    }, 300);
  } catch (error) {
    console.error("Error closing popup:", error);
  }
}

function showMessagePopup(type = "info", title, message, autoCloseDelay = 0) {
  try {
    const iconMap = {
      info: "🔵",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      disclaimer: "ℹ️",
    };

    if (!["info", "success", "warning", "error", "disclaimer"].includes(type)) {
      console.warn(`Invalid popup type: ${type}. Defaulting to 'info'.`);
      type = "info";
    }

    const iconTitle = iconMap[type] ? `${iconMap[type]} ${title}` : title;
    const showClose = true;
    const showConfirm = type !== "disclaimer";

    const popup = doc("popup");
    if (!popup) {
      console.error("Popup element not found");
      return;
    }

    popup.classList.add(type);

    showConfirmPopup(iconTitle, message, "OK", null, showClose, showConfirm);

    if (autoCloseDelay > 0 && type !== "error" && type !== "disclaimer" && type !== "warning") {
      setTimeout(() => {
        if (popup && popup.style.display === "flex" && popup.style.opacity === "1") {
          closePopup();
        }
      }, autoCloseDelay);
    }
  } catch (error) {
    console.error("Error showing message popup:", error);
  }
}

function ShowErrorMessage(errorMsg) {
  showMessagePopup("error", "Error", errorMsg);
}

function ShowSuccessMessage(message, autoCloseDelay = 0) {
  showMessagePopup("success", "Success", message, autoCloseDelay);
}

function ShowWarningMessage(message, autoCloseDelay = 0) {
  showMessagePopup("warning", "Warning", message, autoCloseDelay);
}

function ShowInfoMessage(title, message, autoCloseDelay = 0) {
  showMessagePopup("info", title, message, autoCloseDelay);
}

function ShowDisclaimerMessage(title, message) {
  showMessagePopup("disclaimer", title, message);
}

// Export functions for use in other modules
export {
  showConfirmPopup,
  closePopup,
  showMessagePopup,
  ShowErrorMessage,
  ShowSuccessMessage,
  ShowWarningMessage,
  ShowInfoMessage,
  ShowDisclaimerMessage
};