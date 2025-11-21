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

  // Menu trái
  const [activeMenu, setActiveMenu] = useState("Profile");

  // Thông tin user
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    passwordMasked: "********",
  });

  // Edit form
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });

  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  // --- VIBES ---
  const [allHobbyTags, setAllHobbyTags] = useState([]);    // tất cả tag từ /tags/hobbies
  const [userHobbies, setUserHobbies] = useState([]);      // hobbies đã lưu trên server
  const [editingVibes, setEditingVibes] = useState([]);    // state khi edit
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [vibeLoading, setVibeLoading] = useState(true);
  const [vibeError, setVibeError] = useState("");

  // Favorites demo (giữ nguyên)
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

  // 🧠 Load user + hobbies + list tags khi mở trang Profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setVibeLoading(true);
        setVibeError("");

        const [me, tags] = await Promise.all([
          userAPI.getMe(),          // /users/me  → { username, email, hobbies }
          preferenceAPI.getHobbyTags(), // /tags/hobbies → [ "#cafe", "#chill", ... ]
        ]);

        // user
        setUserData({
          username: me.username,
          email: me.email,
          passwordMasked: "********",
        });
        setEditData({ username: me.username, email: me.email });

        // vibes
        const hobbies = me.hobbies ?? [];
        setUserHobbies(hobbies);
        setEditingVibes(hobbies);
        setAllHobbyTags(tags);
      } catch (err) {
        console.error("Load profile error:", err);
        setVibeError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load profile."
        );
      } finally {
        setVibeLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    // sau này có thể gọi logout() từ AuthContext
    navigate("/login");
  };

  // -------- Profile tab --------
  const handleEditClick = () => {
    setEditData({ username: userData.username, email: userData.email });
    setPwForm({ current: "", next: "", confirm: "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPwForm({ current: "", next: "", confirm: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const wantsChangePw =
      pwForm.current || pwForm.next || pwForm.confirm;

    if (wantsChangePw) {
      if (!pwForm.current) {
        alert("Vui lòng nhập mật khẩu hiện tại.");
        return;
      }
      if (pwForm.next !== pwForm.confirm) {
        alert("Mật khẩu mới và xác nhận không khớp.");
        return;
      }
    }

    try {
      // 1. update username/email
      const updatedUser = await userAPI.updateMe({
        username: editData.username,
        email: editData.email,
      });

      // 2. đổi password nếu có nhập
      if (wantsChangePw) {
        await userAPI.changePassword({
          current_password: pwForm.current,
          new_password: pwForm.next,
        });
      }

      setUserData((prev) => ({
        ...prev,
        username: updatedUser.username,
        email: updatedUser.email,
        passwordMasked: "********",
      }));

      setIsEditing(false);
      setPwForm({ current: "", next: "", confirm: "" });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile error:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update profile.";
      alert(msg);
    }
  };

  // -------- Favorites --------
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

  return (
    <>
      <Navbar />
      <div className="profile-page">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="avatar-section">
            <div className="avatar-circle"></div>
            <h3 className="username">Hello, {userData.username}</h3>
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
                  />

                  <label>Current Password:</label>
                  <input
                    type="password"
                    name="current"
                    placeholder="Enter your current password"
                    value={pwForm.current}
                    onChange={handlePwChange}
                  />

                  <label>New Password:</label>
                  <input
                    type="password"
                    name="next"
                    placeholder="Enter your new password"
                    value={pwForm.next}
                    onChange={handlePwChange}
                  />

                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    name="confirm"
                    placeholder="Confirm your new password"
                    value={pwForm.confirm}
                    onChange={handlePwChange}
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
              {vibeLoading && <p>Loading vibes...</p>}
              {vibeError && (
                <p className="text-red-500 text-sm">{vibeError}</p>
              )}

              {!vibeLoading && !vibeError && (
                <>
                  <p className="vibes-sub">
                    {isEditingVibes
                      ? "Edit your current vibe tags ✨"
                      : "These are your current vibes"}
                  </p>

                  {!isEditingVibes ? (
                    <>
                      {/* ⭐ Hiển thị tất cả tag, những tag trong userHobbies sẽ được TagSelector tô màu */}
                      <TagSelector
                        tags={allHobbyTags}
                        defaultSelected={userHobbies}
                        onChange={() => {}}
                      />
                      <button
                        className="edit-btn"
                        style={{ marginTop: "20px" }}
                        onClick={() => {
                          setEditingVibes(userHobbies);
                          setIsEditingVibes(true);
                        }}
                      >
                        Edit Vibes
                      </button>
                    </>
                  ) : (
                    <>
                      <TagSelector
                        tags={allHobbyTags}
                        defaultSelected={editingVibes}
                        onChange={(selected) => setEditingVibes(selected)}
                      />
                      <div className="button-group">
                        <button
                          className="cancel-btn"
                          onClick={() => {
                            setEditingVibes(userHobbies);
                            setIsEditingVibes(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="save-btn"
                          onClick={async () => {
                            try {
                              const res = await preferenceAPI.updateMyHobbies(
                                editingVibes
                              );
                              setUserHobbies(res.hobbies);
                              setIsEditingVibes(false);
                              alert("Your vibes have been updated!");
                            } catch (err) {
                              const msg =
                                err?.response?.data?.detail ||
                                err?.message ||
                                "Failed to update vibes.";
                              alert(msg);
                            }
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB: FAVORITES (giữ nguyên) */}
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
