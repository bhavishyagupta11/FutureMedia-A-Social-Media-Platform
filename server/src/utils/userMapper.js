const mapUserToPublic = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const source = typeof userDoc.toObject === "function" ? userDoc.toObject() : userDoc;

  return {
    _id: String(source._id),
    firstName: source.firstName || "",
    lastName: source.lastName || "",
    displayName: source.displayName || `${source.firstName || ""} ${source.lastName || ""}`.trim(),
    bio: source.bio || "",
    website: source.website || "",
    username: source.username || "",
    img: source.img || "",
    followings: Number(source.followings || 0),
    followers: Number(source.followers || 0),
    followersList: Array.isArray(source.followersList) ? source.followersList : [],
    followingsList: Array.isArray(source.followingsList) ? source.followingsList : [],
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
};

module.exports = {
  mapUserToPublic,
};
