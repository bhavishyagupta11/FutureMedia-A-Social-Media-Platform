import ProfileImage from "../img/profileImg.jpg";

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

export const resolveAvatar = (user) => {
  if (!user) {
    const stored = getStoredUserProfile();
    return stored.image || ProfileImage;
  }
  
  if (typeof user === 'string') {
    if (user.startsWith('http') || user.startsWith('/uploads') || user.startsWith('data:')) {
      return user.startsWith('http') || user.startsWith('data:') ? user : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}${user}`;
    }
    return ProfileImage;
  }

  const avatar = user.profilePicture || user.image || user.avatar || user.img;
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('/uploads') || avatar.startsWith('data:'))) {
    return avatar.startsWith('http') || avatar.startsWith('data:') ? avatar : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}${avatar}`;
  }

  const stored = getStoredUserProfile();
  if (user._id && String(user._id) === String(stored.userId) && stored.image) {
    return stored.image;
  }

  return ProfileImage;
};

export const persistUserSession = (rawUser) => {
  if (!rawUser) {
    return;
  }
  
  const user = rawUser.data ? rawUser.data : rawUser;

  if (user._id || user.userId) {
    localStorage.setItem("userId", user._id || user.userId);
  }

  const avatarUrl = user.profilePicture || user.image || user.img || user.avatar || "";
  localStorage.setItem("image", avatarUrl);
  localStorage.setItem("followersList", JSON.stringify(user.followersList || user.followers || []));
  localStorage.setItem("followingList", JSON.stringify(user.followingsList || user.following || []));

  const displayName =
    user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User";

  localStorage.setItem("displayName", displayName);
  localStorage.setItem("name", displayName);
  localStorage.setItem("bio", user.bio || "");
  localStorage.setItem("website", user.website || "");
  localStorage.setItem("username", user.username || "");
  if (user.token) localStorage.setItem("token", user.token);
  if (typeof user.isPrivate === "boolean") localStorage.setItem("isPrivate", String(user.isPrivate));

  window.dispatchEvent(new CustomEvent("session:updated", { detail: user }));
  window.dispatchEvent(new CustomEvent("profile:updated", { detail: user }));
};

export const clearUserSession = () => {
  USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("session:cleared"));
  window.dispatchEvent(new Event("profile:updated"));
};
