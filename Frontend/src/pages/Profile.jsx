import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import { DirectionButton, FavoriteButton } from "../components/common/ActionButtons";
import "../styles/Profile.css";

// Services
import userAPI from "../services/userAPI";
import preferenceAPI from "../services/preferenceAPI";
import favoriteAPI from "../services/favoriteAPI"; // 1. Import mới

// Utils
import toErrorMessage from "../utils/toErrorMessage"; // 2. Import hàm xử lý lỗi (đảm bảo đúng đường dẫn)

export default function Profile() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Profile");

  // --- USER & PROFILE STATE ---
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    passwordMasked: "********",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });

  // --- VIBES STATE ---
  const [allHobbies, setAllHobbies] = useState([]);
  const [userHobbies, setUserHobbies] = useState([]);
  const [editingHobbies, setEditingHobbies] = useState([]);
  const [isEditingVibes, setIsEditingVibes] = useState(false);
  const [hobbyError, setHobbyError] = useState("");
  const [hobbySaving, setHobbySaving] = useState(false);
  const [hobbyLoading, setHobbyLoading] = useState(true);

  // --- FAVORITES STATE ---
  const [favorites, setFavorites] = useState([]);
  const [fadingIds, setFadingIds] = useState([]);
  const [favLoading, setFavLoading] = useState(false); // Loading state cho favorite
  const [favError, setFavError] = useState("");        // Error state cho favorite

  // 🔹 Load profile + hobbies (Initial Load)
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

  // 🔹 Load Favorites khi switch sang tab "Favorites"
  useEffect(() => {
    if (activeMenu === "Favorites") {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu]);

  const fetchFavorites = async () => {
    setFavLoading(true);
    setFavError("");
    try {
      // 1. Gọi API
      const response = await favoriteAPI.getMyFavorites();
      
      // 2. LẤY DỮ LIỆU THỰC (FIX LỖI TẠI ĐÂY)
      // Kiểm tra xem response.data có phải là mảng không, nếu không thì fallback về mảng rỗng
      const rawData = response.data || []; 

      // 3. Map dữ liệu
      const formattedData = rawData.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address,
        image: item.image,
        desc: item.overview, 
        hashtags: Array.isArray(item.tags) 
          ? item.tags.map(t => `#${t}`).join(" ")
          : "", 
        liked: true,
      }));

      setFavorites(formattedData);
    } catch (err) {
      console.error(err); // Log lỗi ra để dễ debug nếu có
      const msg = toErrorMessage(err, "Failed to load favorites.");
      setFavError(msg);
    } finally {
      setFavLoading(false);
    }
  };

  const handleLogout = () => {
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
      alert(toErrorMessage(err, "Failed to update profile"));
    }
  };

  // Xử lý logic bỏ thích (Unfavorite)
  const toggleFavorite = async (id) => {
    // 1. Hiệu ứng UI (Optimistic update)
    setFadingIds((prev) => [...prev, id]);
    
    try {
      // 2. Gọi API để cập nhật backend
      await favoriteAPI.toggleFavorite(id);

      // 3. Sau khi animation xong (300ms), xóa khỏi state list
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setFadingIds((prev) => prev.filter((fid) => fid !== id));
      }, 300);

    } catch (err) {
      // Nếu lỗi, hoàn tác UI (bỏ hiệu ứng fade và hiển thị lỗi)
      setFadingIds((prev) => prev.filter((fid) => fid !== id));
      alert(toErrorMessage(err, "Failed to remove favorite."));
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
      setHobbyError(toErrorMessage(err, "Failed to save hobbies"));
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
              className={`menu-item ${activeMenu === "Profile" ? "active" : ""}`}
              onClick={() => setActiveMenu("Profile")}
            >
              Profile
            </li>
            <li
              className={`menu-item ${activeMenu === "Vibes" ? "active" : ""}`}
              onClick={() => setActiveMenu("Vibes")}
            >
              Vibes
            </li>
            <li
              className={`menu-item ${activeMenu === "Favorites" ? "active" : ""}`}
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
                    <button type="button" className="cancel-btn" onClick={handleCancel}>
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
                {isEditingVibes ? "Edit your current vibe tags ✨" : "These are your current vibes"}
              </p>

              {hobbyLoading && <p>Loading vibes...</p>}
              {hobbyError && <p className="text-red-500 text-sm mb-2">{hobbyError}</p>}

              {!hobbyLoading && (
                <>
                  {!isEditingVibes ? (
                    <>
                      <TagSelector
                        tags={allHobbies}
                        defaultSelected={userHobbies}
                        onChange={() => {}}
                        readOnly={true}
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
                        readOnly={false}
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
                        <button className="save-btn" onClick={saveHobbies} disabled={hobbySaving}>
                          {hobbySaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB: FAVORITES */}
          {activeMenu === "Favorites" && (
            <div className="favorites-section">
              <h2 className="form-title">FAVORITE PLACES</h2>
              
              {/* Error Message */}
              {favError && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{favError}</p>}
              
              {/* Loading State */}
              {favLoading ? (
                <p>Loading your favorites...</p>
              ) : (
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

                      <div className="action-buttons-group">
                        <DirectionButton
                          place={{ name: fav.name, address: fav.address, title: fav.name }}
                        />
                        <FavoriteButton
                          isFav={fav.liked}
                          onToggle={() => toggleFavorite(fav.id)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {!favLoading && favorites.length === 0 && !favError && (
                    <p className="empty-fav">
                      You have no favorite places yet 💔
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}