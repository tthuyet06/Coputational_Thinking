import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";
<<<<<<< HEAD
=======
import Navbar from "../components/layouts/Navbar";
>>>>>>> Gman

export default function ProfilePage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Profile");
<<<<<<< HEAD
  const [fadingIds, setFadingIds] = useState([]); // ✅ id của thẻ đang ẩn dần

  const [userData, setUserData] = useState({
    username: "LizzardMeoMeo",
    email: "lizzard@example.com",
    password: "********",
  });

  const [editData, setEditData] = useState({ ...userData });
=======
  const [fadingIds, setFadingIds] = useState([]); // id đang fade-out

  // dữ liệu demo
  const [userData, setUserData] = useState({
    username: "LizzardMeoMeo",
    email: "lizzard@example.com",
    passwordMasked: "********", // chỉ hiển thị mask
  });

  // form edit cho username/email
  const [editData, setEditData] = useState({
    username: userData.username,
    email: userData.email,
  });

  // quản lý mật khẩu tách riêng
  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
>>>>>>> Gman

  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "The Running Bean Coffee",
      desc: "A modern-style café with open space and white-wood tones — perfect for a creative vibe.",
      address: "33 Mac Thi Buoi Street, District 1",
      hashtags: "#CreativeVibe #ChillMood #CoffeeGoals",
<<<<<<< HEAD
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
=======
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
>>>>>>> Gman
      liked: true,
    },
    {
      id: 2,
      name: "Oromia Coffee",
      desc: "Cozy space with relaxing music, ideal for working or chatting.",
      address: "193A/D3 Nam Ky Khoi Nghia, District 3",
      hashtags: "#Cozy #Chill #Relax #CoffeeTime",
<<<<<<< HEAD
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
=======
      image:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
>>>>>>> Gman
      liked: true,
    },
    {
      id: 3,
      name: "Thinker & Dreamer Café",
      desc: "Rooftop café with stunning views and artistic vibes.",
      address: "42 Nguyen Hue, District 1",
      hashtags: "#Rooftop #Artistic #Vibes",
<<<<<<< HEAD
      image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/9b/dc/c4/quan-ca-phe-thinker-dreamer.jpg?w=1100&h=1100&s=1",
=======
      image:
        "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/9b/dc/c4/quan-ca-phe-thinker-dreamer.jpg?w=1100&h=1100&s=1",
>>>>>>> Gman
      liked: true,
    },
  ]);

<<<<<<< HEAD

  const handleEditClick = () => {
    setEditData({ ...userData });
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = (e) => {
    e.preventDefault();
    setUserData(editData);
=======
  const handleEditClick = () => {
    setEditData({ username: userData.username, email: userData.email });
    setPwForm({ current: "", next: "", confirm: "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPwForm({ current: "", next: "", confirm: "" });
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Validate tối thiểu cho password (nếu user nhập)
    if (pwForm.next || pwForm.confirm || pwForm.current) {
      if (!pwForm.current) {
        alert("Vui lòng nhập mật khẩu hiện tại.");
        return;
      }
      if (pwForm.next !== pwForm.confirm) {
        alert("Mật khẩu mới và xác nhận không khớp.");
        return;
      }
      // Ở bản demo này ta không kiểm tra current thực sự.
      // Khi gắn API, gọi endpoint đổi mật khẩu tại đây.
    }

    setUserData((prev) => ({
      ...prev,
      username: editData.username,
      email: editData.email,
      // Không lưu mật khẩu thật trong state demo. Luôn mask để hiển thị.
      passwordMasked: "********",
    }));

>>>>>>> Gman
    setIsEditing(false);
    alert("Thông tin đã được lưu!");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

<<<<<<< HEAD
=======
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

>>>>>>> Gman
  const handleLogout = () => {
    navigate("/login");
  };

<<<<<<< HEAD
  // ✅ Khi nhấn ❤️: bỏ thích => fade out => xóa thẻ
  const toggleFavorite = (id) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav.liked) {
=======
  // Khi nhấn ❤️: bỏ thích => fade out => xóa thẻ
  const toggleFavorite = (id) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav?.liked) {
>>>>>>> Gman
      setFadingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setFadingIds((prev) => prev.filter((fid) => fid !== id));
      }, 300); // khớp thời gian CSS transition
    }
  };

  return (
    <>
<<<<<<< HEAD
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
                <input
                  type="password"
                  placeholder="Enter your current password"
                />

                <label>New Password:</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your new password"
                  onChange={handleChange}
                />

                <label>Confirm New Password:</label>
                <input
                  type="password"
                  placeholder="Confirm your new password"
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
=======
      <Navbar />

      {/* Wrapper layout */}
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

        <div className="profile-form-section">
          <div className="profile-container">
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
            </>
          )}
        </div>

          {activeMenu === "Vibes" && (
            <>
              <h2 className="form-title">VIBES</h2>
              <p>Đang cập nhật vibe của bạn…</p>
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
                      aria-label="unfavorite"
                      title="Remove from favorites"
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
            </>
          )}
        </div>
>>>>>>> Gman
      </div>
    </>
  );
}
