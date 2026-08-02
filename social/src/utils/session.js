const USER_STORAGE_KEYS = [
  "userId",
  "image",
  "followersList",
  "followingList",
  "name",
  "displayName",
  "bio",
  "website",
  "username",
  "token",
  "isPrivate",
];

const safeJsonParse = (value, fallback = []) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getSessionUserId = () => localStorage.getItem("userId") || "";

export const getStoredUserProfile = () => ({
  userId: getSessionUserId(),
  image: localStorage.getItem("image") || "",
  displayName: localStorage.getItem("displayName") || localStorage.getItem("name") || "",
  name: localStorage.getItem("name") || localStorage.getItem("displayName") || "",
  username: localStorage.getItem("username") || "",
  bio: localStorage.getItem("bio") || "",
  website: localStorage.getItem("website") || "",
  followersList: safeJsonParse(localStorage.getItem("followersList")),
  followingList: safeJsonParse(localStorage.getItem("followingList")),
  isPrivate: localStorage.getItem("isPrivate") === "true",
});

export const persistUserSession = (rawUser) => {
  if (!rawUser) {
    return;
  }
  
  const user = rawUser.data ? rawUser.data : rawUser;

  if (user._id) {
    localStorage.setItem("userId", user._id);
  }

  localStorage.setItem("image", user.profilePicture || user.img || "");
  localStorage.setItem("followersList", JSON.stringify(user.followersList || user.followers || []));
  localStorage.setItem("followingList", JSON.stringify(user.followingsList || user.following || []));

  const displayName =
    user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User";

  localStorage.setItem("displayName", displayName);
  localStorage.setItem("name", displayName);
  localStorage.setItem("bio", user.bio || "");
  localStorage.setItem("website", user.website || "");
  localStorage.setItem("username", user.username || "");
  localStorage.setItem("token", user.token || "");
  localStorage.setItem("isPrivate", String(user.isPrivate === true));

  window.dispatchEvent(new CustomEvent("session:updated", { detail: user }));
};

export const clearUserSession = () => {
  USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("session:cleared"));
};
