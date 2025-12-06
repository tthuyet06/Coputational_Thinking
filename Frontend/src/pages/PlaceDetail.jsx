import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/PlaceDetail.css";
// 💡 IMPORT COMPONENTS MỚI
import { DirectionButton, FavoriteButton } from "../components/common/ActionButtons"; 


export default function PlaceDetail() {
  const { id } = useParams(); // Lấy ID từ URL
  const location = useLocation();
  const navigate = useNavigate();
  
  // ⬅️ LẤY DATA TRUYỀN TỪ RESULTS (data tóm tắt)
  const data = location.state?.place;

  // ⬅️ KHÔNG CÓ DATA → F5 → TRẢ VỀ RESULTS
  if (!data) {
    navigate("/results");
    return null;
  }
  
  // Mặc định cho các trường chi tiết chưa có trong data
  // Giả định tên trường API trả về: title, image, description, hashtags, address, fav
  const place = {
      // 💡 Lưu ý: DirectionButton cần place.name hoặc place.address, 
      // ta thêm trường name và dùng title làm name tạm thời
      name: data.title, 
      title: data.title || "Tên địa điểm",
      image: data.image || data.hero, 
      description: data.overview || "Chưa có mô tả chi tiết.", 
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      address: data.address,
      coords: data.coords, // Giữ lại nếu bạn có tọa độ chi tiết hơn
      // CÁC TRƯỜNG API CHƯA CUNG CẤP (để trống/N/A)
      openingHours: "", 
      setting: "",
      priceRange: "",
      detail: data.description, 
      fav: data.fav || false
  }

  const [fav, setFav] = useState(place.fav);
  
  // 💡 openDirections không cần thiết nữa

  return (
    <>
      <Navbar />
      <main className="detail-wrap">
        <div className="detail-hero">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back to results">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Sửa data.hero thành place.image */}
          <img src={place.image} alt={place.title} />
        </div>

        <article className="detail-card">
          <header className="detail-header">
            {/* ✅ Title */}
            <h1 className="detail-title">{place.title}</h1>

            <div className="detail-actions">
              
              {/* 💡 THAY THẾ NÚT CHỈ ĐƯỜNG */}
              {/* Lưu ý: DirectionButton sử dụng buildDirectionsUrl đã chuyển, nó cần place object */}
              <DirectionButton place={place} /> 

              {/* 💡 THAY THẾ NÚT YÊU THÍCH */}
              <FavoriteButton 
                isFav={fav}
                onToggle={() => setFav((v) => !v)}
              />
            </div>
          </header>

          {/* Sửa data.detail thành place.description (nếu muốn hiển thị mô tả tóm tắt) */}
          <p className="detail-desc">{place.description}</p>

          <dl className="detail-meta">
            <div className="meta-row">
              <dt>Hashtags:</dt>
              {/* Sử dụng place.hashtags */}
              <dd className="tags">{place.hashtags.map((t) => `#${t}`).join(" ")}</dd>
            </div>
            
            <div className="meta-row">
              <dt>Opening Hours:</dt>
              {/* Trường thiếu: sẽ hiển thị trống */}
              <dd>{place.openingHours}</dd>
            </div>
            <div className="meta-row">
              <dt>Setting:</dt>
              {/* Trường thiếu: sẽ hiển thị trống */}
              <dd>{place.setting}</dd>
            </div>
            <div className="meta-row">
              <dt>Price Range:</dt>
              {/* Trường thiếu: sẽ hiển thị trống */}
              <dd>{place.priceRange}</dd>
            </div>
            <div className="meta-row">
              <dt>Address:</dt>
              {/* Trường có sẵn: sẽ hiển thị địa chỉ */}
              <dd><span className="pin">📍</span>{place.address}</dd>
            </div>
          </dl>
          
          {/* Nếu bạn có một section dài hơn cho mô tả chi tiết, nhưng hiện tại dùng description */}
          {/* <section className="detail-long-text">
            {place.detail} 
          </section> */}

        </article>
      </main>
    </>
  );
}