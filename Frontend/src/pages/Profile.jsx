// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import "../styles/Profile.css";
import userAPI from "../services/userAPI";
import preferenceAPI from "../services/preferenceAPI";

export default function Profile() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Profile");

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    passwordMasked: "********",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
  });

  // Vibes from backend
  const [allHobbies, setAllHobbies] = useState([]);      // [{label,value}, ...]
  const [userHobbies, setUserHobbies] = useState([]);    // ["#cafe", ...]
  const [editingHobbies, setEditingHobbies] = useState([]);
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [hobbyError, setHobbyError] = useState("");
  const [hobbySaving, setHobbySaving] = useState(false);
  const [hobbyLoading, setHobbyLoading] = useState(true);

  // Favorites demo
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "The Running Bean Coffee",
      desc: "A modern-style café with open space and white-wood tones — perfect for a creative vibe.",
      address: "33 Mac Thi Buoi Street, District 1",
      hashtags: "#CreativeVibe #ChillMood #CoffeeGoals",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      liked: true,
    },
    {
      id: 2,
      name: "Oromia Coffee",
      desc: "Cozy space with relaxing music, ideal for working or chatting.",
      address: "193A/D3 Nam Ky Khoi Nghia, District 3",
      hashtags: "#Cozy #Chill #Relax #CoffeeTime",
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
      liked: true,
    },
  ]);
  const [fadingIds, setFadingIds] = useState([]);

  // 🔹 Load profile + hobbies
  useEffect(() => {
    const load = async () => {
      try {
        const [me, hobbyOptions, myHobbies] = await Promise.all([
          userAPI.getMe(),
          preferenceAPI.getHobbyTags(),
          preferenceAPI.getMyHobbies(),
        ]);

        setUserData({
          username: me.username,
          email: me.email,
          passwordMasked: "********",
        });

        setEditData({
          username: me.username,
          email: me.email,
        });

        setAllHobbies(hobbyOptions);
        setUserHobbies(myHobbies);
        setEditingHobbies(myHobbies);
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setHobbyLoading(false);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    // sau này có AuthContext.logout thì gọi ở đây
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEditClick = () => {
    setEditData({ username: userData.username, email: userData.email });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await userAPI.updateMe({ username: editData.username });
      setUserData((prev) => ({
        ...prev,
        username: updated.username,
      }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err?.message || "Failed to update profile");
    }
  };

  const toggleFavorite = (id) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav?.liked) {
      setFadingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setFadingIds((prev) => prev.filter((fid) => fid !== id));
      }, 300);
    }
  };

  const saveHobbies = async () => {
    try {
      setHobbySaving(true);
      setHobbyError("");
      await preferenceAPI.updateMyHobbies(editingHobbies);
      setUserHobbies(editingHobbies);
      setIsEditingVibes(false);
      alert("Your vibes have been updated!");
    } catch (err) {
      setHobbyError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to save hobbies"
      );
    } finally {
      setHobbySaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="avatar-section">
            <div className="avatar-circle"></div>
            <h3 className="username">Hello, {userData.username || "Guest"}</h3>
          </div>

          <ul className="menu">
            <li
              className={`menu-item ${
                activeMenu === "Profile" ? "active" : ""
              }`}
              onClick={() => setActiveMenu("Profile")}
            >
              Profile
            </li>
            <li
              className={`menu-item ${
                activeMenu === "Vibes" ? "active" : ""
              }`}
              onClick={() => setActiveMenu("Vibes")}
            >
              Vibes
            </li>
            <li
              className={`menu-item ${
                activeMenu === "Favorites" ? "active" : ""
              }`}
              onClick={() => setActiveMenu("Favorites")}
            >
              Favorites
            </li>
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {/* Main content */}
        <div className="profile-form-section">
          {/* TAB: PROFILE */}
          {activeMenu === "Profile" && (
            <div className="profile-container">
              <h2 className="form-title">
                {isEditing ? "EDIT PROFILE" : "PROFILE SETTINGS"}
              </h2>

              {!isEditing ? (
                <div className="profile-form">
                  <label>Username:</label>
                  <p className="static-input">{userData.username}</p>

                  <label>Email:</label>
                  <p className="static-input">{userData.email}</p>

                  <label>Password:</label>
                  <p className="static-input">{userData.passwordMasked}</p>

                  <button onClick={handleEditClick} className="edit-btn">
                    Edit profile
                  </button>
                </div>
              ) : (
                <form className="profile-form" onSubmit={handleSave}>
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={editData.username}
                    onChange={handleChange}
                  />

                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    disabled
                  />

                  <div className="button-group">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="save-btn">
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: VIBES */}
          {activeMenu === "Vibes" && (
            <div className="vibes-section">
              <h2 className="form-title">YOUR VIBES</h2>
              <p className="vibes-sub">
                {isEditingVibes
                  ? "Edit your current vibe tags ✨"
                  : "These are your current vibes"}
              </p>

              {hobbyLoading && <p>Loading vibes...</p>}
              {hobbyError && (
                <p className="text-red-500 text-sm mb-2">{hobbyError}</p>
              )}

              {!hobbyLoading && (
                <>
                  {!isEditingVibes ? (
                    <>
                      <TagSelector
                        tags={allHobbies}
                        defaultSelected={userHobbies}
                        onChange={() => {}}
                      />

                      <button
                        className="edit-btn"
                        style={{ marginTop: "20px" }}
                        onClick={() => {
                          setEditingHobbies(userHobbies);
                          setIsEditingVibes(true);
                        }}
                      >
                        Edit Vibes
                      </button>
                    </>
                  ) : (
                    <>
                      <TagSelector
                        tags={allHobbies}
                        defaultSelected={editingHobbies}
                        onChange={(selected) => setEditingHobbies(selected)}
                      />

                      <div className="button-group">
                        <button
                          className="cancel-btn"
                          onClick={() => {
                            setEditingHobbies(userHobbies);
                            setIsEditingVibes(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="save-btn"
                          onClick={saveHobbies}
                          disabled={hobbySaving}
                        >
                          {hobbySaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB: FAVORITES (demo, chưa nối API) */}
          {activeMenu === "Favorites" && (
            <div className="favorites-section">
              <h2 className="form-title">FAVORITE PLACES</h2>
              <div className="favorites-list">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className={`favorite-card ${
                      fadingIds.includes(fav.id) ? "fade-out" : ""
                    }`}
                  >
                    <img src={fav.image} alt={fav.name} className="fav-image" />
                    <div className="fav-info">
                      <h3>{fav.name}</h3>
                      <p>{fav.desc}</p>
                      <p className="address">{fav.address}</p>
                      <p className="hashtags">{fav.hashtags}</p>
                    </div>
                    <button
                      className={`heart-btn ${fav.liked ? "liked" : ""}`}
                      onClick={() => toggleFavorite(fav.id)}
                      type="button"
                    >
                      ❤️
                    </button>
                  </div>
                ))}
                {favorites.length === 0 && (
                  <p className="empty-fav">
                    You have no favorite places yet 💔
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
