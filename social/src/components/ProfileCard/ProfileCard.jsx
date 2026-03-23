import React, { useEffect, useState } from "react";
import Cover from "../../img/cover.jpg";
import ProfileImage from "../../img/profileImg.jpg";
import "./ProfileCard.css";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, getSessionUserId } from "../../utils/session";

const ProfileCard = () => {
  const [profileData, setProfileData] = useState(null);
  const [storedProfile, setStoredProfile] = useState(getStoredUserProfile());

  const fetchInfo = async () => {
    try {
      const response = await apiFetch(`/api/users/${getSessionUserId()}`, {
        method: "GET",
      });

      console.log("Fetching profile info response", response);

      if (response.ok) {
        const resp = await response.json();
        setProfileData({
          user: resp,
          followers: resp.followers?.length || 0,
          followings: resp.following?.length || 0,
          posts: 0 // Simplification since backend doesn't aggregate posts here natively right now
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile info:", error);
      setProfileData(null);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  useEffect(() => {
    const syncStoredProfile = () => setStoredProfile(getStoredUserProfile());
    window.addEventListener("session:updated", syncStoredProfile);
    window.addEventListener("profile:updated", syncStoredProfile);
    return () => {
      window.removeEventListener("session:updated", syncStoredProfile);
      window.removeEventListener("profile:updated", syncStoredProfile);
    };
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setStoredProfile(getStoredUserProfile());
      fetchInfo();
    };

    window.addEventListener("profile:updated", handleRefresh);
    window.addEventListener("post:created", handleRefresh);

    return () => {
      window.removeEventListener("profile:updated", handleRefresh);
      window.removeEventListener("post:created", handleRefresh);
    };
  }, []);

  const ProfilePage = true;

  return (
    <div className="ProfileCard">
      <div className="ProfileImages">
        <img src={Cover} alt="" />
        <img src={storedProfile.image || ProfileImage} alt="" />
      </div>

      <div className="ProfileName">
        <span>{storedProfile.displayName || "FSM User"}</span>
        {storedProfile.bio ? <small>{storedProfile.bio}</small> : null}
      </div>

      <div className="followStatus">
        <div>
          <div className="follow">
            <span>{profileData?.followings || 0}</span>
            <span className="textbased">Followings</span>
          </div>

          <div className="follow">
            <span>{profileData?.followers || 0}</span>
            <span>Followers</span>
          </div>

          {ProfilePage && (
            <>
              <div className="follow">
                <span>{profileData?.posts || 0}</span>
                <span>Posts</span>
              </div>
            </>
          )}
        </div>
      </div>

      {ProfilePage ? "" : <span>My Profile</span>}
    </div>
  );
};

export default ProfileCard;
