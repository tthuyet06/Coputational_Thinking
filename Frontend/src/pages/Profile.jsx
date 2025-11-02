import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Profile");
  const [fadingIds, setFadingIds] = useState([]);
  const [userData, setUserData] = useState({
    username: "LizzardMeoMeo",
    email: "lizzard@example.com",
    password: "********",
  });
  const [editData, setEditData] = useState({ ...userData });

  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "The Running Bean Coffee",
      desc: "A modern-style café with open space and white-wood tones — perfect for a creative vibe.",
      address: "33 Mac Thi Buoi Street, District 1",
      hashtags: "#CreativeVibe #ChillMood #CoffeeGoals",
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      liked: true,
    },
    {
      id: 2,
      name: "Oromia Coffee",
      desc: "Cozy space with relaxing music, ideal for working or chatting.",
      address: "193A/D3 Nam Ky Khoi Nghia, District 3",
      hashtags: "#Cozy #Chill #Relax #CoffeeTime",
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
      liked: true,
    },
    {
      id: 3,
      name: "Thinker & Dreamer Café",
      desc: "Rooftop café with stunning views and artistic vibes.",
      address: "42 Nguyen Hue, District 1",
      hashtags: "#Rooftop #Artistic #Vibes",
      image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/9b/dc/c4/quan-ca-phe-thinker-dreamer.jpg?w=1100&h=1100&s=1",
      liked: true,
    },
  ]);

  const handleEditClick = () => {
    setEditData({ ...userData });
    setIsEditing(true);
  };
  const handleCancel = () => setIsEditing(false);
  const handleSave = (e) => {
    e.preventDefault();
    setUserData(editData);
    setIsEditing(false);
    alert("Thông tin đã được lưu!");
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLogout = () => navigate("/login");

  const toggleFavorite = (id) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav.liked) {
      setFadingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setFadingIds((prev) => prev.filter((fid) => fid !== id));
      }, 300);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="avatar-section">
          <div className="avatar-circle"></div>
          <h3 className="username">Hello, {userData.username}</h3>
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

      {/* Main Content */}
      <div className="profile-form-section">
        {activeMenu === "Profile" && (
          <>
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
                <p className="static-input">{userData.password}</p>

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
                <input type="password" placeholder="Enter your current password" />

                <label>New Password:</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your new password"
                  onChange={handleChange}
                />

                <label>Confirm New Password:</label>
                <input type="password" placeholder="Confirm your new password" />

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
          </>
        )}

        {activeMenu === "Favorites" && (
          <>
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
                  >
                    ❤️
                  </button>
                </div>
              ))}
              {favorites.length === 0 && (
                <p className="empty-fav">You have no favorite places yet 💔</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
