import { doc } from "./utils.js";

function CreateProfileElement(displayName, userName, bitmojiSelfieId, bitmojiAvatarId, friendEmoji = null, hasSnapPlus = false, userId) {
  if (!displayName || !userName || !bitmojiSelfieId || !bitmojiAvatarId) {
    return null;
  }
  const profileElement = document.createElement("div");
  profileElement.classList.add("User_Profile");
  profileElement.setAttribute("data-displayname", displayName);
  profileElement.setAttribute("data-username", userName);
  profileElement.setAttribute("data-userid", userId);

  profileElement.innerHTML = `
    <div class="Profile_Container maxWidth">
    <div class="Profile_Picture_Container">
    <div class="Profile_Picture_Container_2">
    <img src="https://cf-st.sc-cdn.net/3d/render/${bitmojiSelfieId}-${bitmojiAvatarId}-v1.webp?trim=circle&amp;scale=0&amp;ua=2" class="Profile_Picture" alt="">
    <div class="Friend_Emoji_Container ${friendEmoji ? "" : "noDisplay"}">
    <span class="Friend_Emoji">${friendEmoji}</span>
    </div>
    </div>
    </div>
    <div class="Profile_Info_Container">
    <span class="Profile_Display_Name">
    <span class="Display_Name">${displayName}</span>
    </span>
    <div class="Info_Container_1">
    <div class="Info_Container_2">
    <span class="User_Name_Container">
    <span class="User_Name">${userName}</span>
    </span>
    <span class="Dot_Separator" has_snapplus="${hasSnapPlus}">·</span>
    <img has_snapplus="${hasSnapPlus}" src="/images/SnapPlus28px.png">
    </div>
    </div>
    </div>
    <div class="Actions_Container">
    <div class="Action_Icon">
    <button class="Action_Icon_Background">
    <span>Edit Theme</span>
    </button>
    </div>
    </div>
    </div>
    `;

  return profileElement;
}

function CreateProfileDivider(Text, Devider = false) {
  if (Devider) {
    const divider = document.createElement("details");
    divider.classList.add("Profile_Divider");
    divider.open = true;
    const SpanText = document.createElement("summary");
    SpanText.setAttribute("data-content", Text);
    divider.appendChild(SpanText);
    return divider;
  } else {
    const divider = document.createElement("div");
    divider.classList.add("Profile_Divider");
    const SpanText = document.createElement("span");
    SpanText.textContent = Text;
    divider.appendChild(SpanText);
    return divider;
  }
}

export { CreateProfileElement, CreateProfileDivider };
