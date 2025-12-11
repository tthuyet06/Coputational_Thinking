// src/pages/Profile.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import PlaceCard from "../components/common/PlaceCard";
import "../styles/Profile.css";
import { AuthContext } from "../context/AuthContext";

// SERVICES
import userAPI from "../services/userAPI";
import preferenceAPI from "../services/preferenceAPI";
import favoriteAPI from "../services/favoriteAPI";

export default function Profile() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Profile");

  // USER DATA
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    passwordMasked: "********",
  });

  // PASSWORD STATE
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // toast nhỏ báo success
  const [showToast, setShowToast] = useState(false);

  const { logout } = useContext(AuthContext);

  // HOBBIES
  const [allHobbies, setAllHobbies] = useState([]);
  const [userHobbies, setUserHobbies] = useState([]);
  const [editingHobbies, setEditingHobbies] = useState([]);
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [hobbyError, setHobbyError] = useState("");
  const [hobbySaving, setHobbySaving] = useState(false);
  const [hobbyLoading, setHobbyLoading] = useState(true);

  // FAVORITES
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [fadingIds, setFadingIds] = useState([]);

  // LOAD PROFILE + HOBBIES
  useEffect(() => {
    const loadInit = async () => {
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

        setAllHobbies(hobbyOptions);
        setUserHobbies(myHobbies);
        setEditingHobbies(myHobbies);
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setHobbyLoading(false);
      }
    };

    loadInit();
  }, []);

  // LOAD FAVORITES WHEN TAB ACTIVE
  useEffect(() => {
    if (activeMenu !== "Favorites") return;

    const loadFavorites = async () => {
      setFavLoading(true);
      try {
        const res = await favoriteAPI.getMyFavorites();

        let validData = [];
        if (Array.isArray(res)) validData = res;
        else if (Array.isArray(res?.data)) validData = res.data;
        else if (Array.isArray(res?.favorites)) validData = res.favorites;

        const normalized = validData.map((p) => ({
          ...p,
          id: p.id,
          title: p.name,
          description: p.summarization || p.description || "empty field",
          hashtags: Array.isArray(p.tags) ? p.tags : [],
          fav: true,
          rating:
            typeof p.rating === "number"
              ? p.rating
              : p.rating != null
              ? Number(p.rating)
              : null,
          openingHours: p.open || p.opening_hours || "N/A",
        }));

        setFavorites(normalized);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      } finally {
        setFavLoading(false);
      }
    };

    loadFavorites();
  }, [activeMenu]);

  // LOGOUT
  const handleLogout = () => {
    logout();    
    navigate("/login");
  };

  // HANDLE PASSWORD FORM CHANGE
  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // DO CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      await userAPI.changePassword({
        old_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordSuccess("Password changed successfully 🎉");
      setShowToast(true);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Ẩn toast + thoát mode edit sau 2s
      setTimeout(() => {
        setShowToast(false);
        setPasswordSuccess("");
        setIsChangingPassword(false);
      }, 2000);
    } catch (err) {
      console.error("Change password error:", err);

      // handle lỗi 422 từ FastAPI (string_too_short, v.v.)
      if (err?.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
        const first = err.response.data.detail[0];
        const field = first?.loc?.[first.loc.length - 1];

        if (first.type === "string_too_short" && field === "new_password") {
          setPasswordError("New password must be at least 8 characters long.");
        } else if (first.type === "string_too_short" && field === "old_password") {
          setPasswordError("Current password must be at least 8 characters long.");
        } else {
          setPasswordError(first.msg || "Invalid password data.");
        }
      } else {
        const msg =
          typeof err?.response?.data?.detail === "string"
            ? err.response.data.detail
            : err?.message || "Failed to change password.";
        setPasswordError(msg);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelChangePassword = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
  };

  // SAVE HOBBIES — FIXED FORMAT
  const saveHobbies = async () => {
    try {
      setHobbySaving(true);
      setHobbyError("");

      const hobbyTags = (editingHobbies || [])
        .map((h) => (typeof h === "string" ? h : h?.value))
        .filter(Boolean);

      await preferenceAPI.updateMyHobbies(hobbyTags);

      setUserHobbies(editingHobbies);
      setIsEditingVibes(false);
      alert("Your vibes have been updated!");
    } catch (err) {
      setHobbyError(err?.message || "Failed to save hobbies");
    } finally {
      setHobbySaving(false);
    }
  };

  // TOGGLE FAVORITE
  const handleToggleFavorite = (id, newStatus) => {
    if (!newStatus) {
      setFadingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setFadingIds((prev) => prev.filter((fid) => fid !== id));
      }, 100);
    } else {
      setFavorites((prev) =>
        prev.map((f) => (f.id === id ? { ...f, fav: true } : f))
      );
    }
  };

  // helper highlight input theo error message
  const isOldPasswordError =
    passwordError.toLowerCase().includes("old password") ||
    passwordError.toLowerCase().includes("current password");
  const isNewPasswordError =
    passwordError.toLowerCase().includes("new password") &&
    !passwordError.toLowerCase().includes("confirm");
  const isConfirmError =
    passwordError === "New password and confirmation do not match.";

  return (
    <>
      <Navbar />
      <div className="profile-page">
        {/* SIDEBAR */}
        <div className="sidebar">
        <div className="avatar-section">
          <div className="avatar-circle">
            <img
              src="/default-avatar.jpeg"
              alt="User avatar"
              className="avatar-img"
            />
          </div>
          <h3 className="username">Hello, {userData.username}</h3>
        </div>
          <ul className="menu">
            {["Profile", "Vibes", "Favorites"].map((item) => (
              <li
                key={item}
                className={`menu-item ${activeMenu === item ? "active" : ""}`}
                onClick={() => setActiveMenu(item)}
              >
                {item}
              </li>
            ))}
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="profile-form-section">
          {/* PROFILE TAB */}
          {activeMenu === "Profile" && (
            <div className="profile-container">
              <h2 className="form-title">
                {isChangingPassword ? "EDIT PROFILE" : "PROFILE SETTINGS"}
              </h2>

              {!isChangingPassword ? (
                <div className="profile-form">
                  <label>Username:</label>
                  <p className="static-input">{userData.username}</p>
                  <label>Email:</label>
                  <p className="static-input">{userData.email}</p>
                  <label>Password:</label>
                  <p className="static-input">{userData.passwordMasked}</p>

                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="edit-btn"
                  >
                    EDIT PROFILE
                  </button>
                </div>
              ) : (
                <form className="profile-form" onSubmit={handleChangePassword}>
                  <label>Current password:</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFieldChange}
                    placeholder="Enter current password"
                    className={isOldPasswordError ? "error" : ""}
                  />

                  <label>New password:</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                    placeholder="Enter new password"
                    className={isNewPasswordError ? "error" : ""}
                  />

                  <label>Confirm new password:</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFieldChange}
                    placeholder="Re-enter new password"
                    className={isConfirmError ? "error" : ""}
                  />

                  {passwordError && <p className="form-error">{passwordError}</p>}

                  <div className="button-group">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancelChangePassword}
                      disabled={passwordLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIBES TAB */}
          {activeMenu === "Vibes" && (
            <div className="vibes-section">
              <h2 className="form-title">YOUR VIBES</h2>
              <p className="vibes-sub">
                {isEditingVibes
                  ? "Edit your current vibe tags ✨"
                  : "These are your current vibes"}
              </p>

              {hobbyLoading && <p>Loading vibes...</p>}
              {hobbyError && <p className="form-error">{hobbyError}</p>}

              {!hobbyLoading && (
                <>
                  <TagSelector
                    tags={allHobbies}
                    defaultSelected={
                      isEditingVibes ? editingHobbies : userHobbies
                    }
                    onChange={isEditingVibes ? setEditingHobbies : () => {}}
                    readOnly={!isEditingVibes}
                  />

                  {!isEditingVibes ? (
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingHobbies(userHobbies);
                        setIsEditingVibes(true);
                      }}
                    >
                      Edit Vibes
                    </button>
                  ) : (
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
                  )}
                </>
              )}
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeMenu === "Favorites" && (
            <div className="favorites-section">
              <h2 className="form-title">FAVORITE PLACES</h2>

              {favLoading ? (
                <p style={{ textAlign: "center", marginTop: "20px" }}>
                  Loading your favorites...
                </p>
              ) : (
                <section className="results-list">
                  {favorites.map((place) => (
                    <div
                      key={place.id}
                      className={fadingIds.includes(place.id) ? "fade-out" : ""}
                    >
                      <PlaceCard
                        place={place}
                        onToggleFav={handleToggleFavorite}
                      />
                    </div>
                  ))}

                  {!favorites.length && (
                    <p className="empty-fav">
                      You have no favorite places yet 💔 <br />
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Go explore and save some vibes!
                      </span>
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="profile-toast profile-toast-visible">
          <span className="profile-toast-icon">🎉</span>
          <span>Password changed successfully!</span>
        </div>
      )}

    </>
  );
}
