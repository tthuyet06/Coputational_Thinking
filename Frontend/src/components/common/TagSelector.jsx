// src/components/common/TagSelector.jsx
import React, { useState, useEffect } from "react";
import "../../styles/TagSelector.css";

export default function TagSelector({
  tags = [],
  defaultSelected = [],
  onChange,
  readOnly = false,
}) {
  const [selectedValues, setSelectedValues] = useState(defaultSelected || []);

  useEffect(() => {
    // Đảm bảo defaultSelected luôn là mảng để tránh lỗi
    setSelectedValues(Array.isArray(defaultSelected) ? defaultSelected : []);
  }, [defaultSelected]);

  // 1. Hàm lấy giá trị định danh (value) để logic so sánh
  const getValue = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    
    // Ưu tiên 'value' (chuẩn mới) -> 'tag' -> 'code' -> 'id'
    if (item.value !== undefined && item.value !== null) return item.value;
    if (item.tag) return item.tag;
    if (item.code) return item.code;
    if (item.id) return String(item.id);
    
    return ""; 
  };

  // 2. Hàm lấy nhãn hiển thị (label)
  const getLabel = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;

    // Ưu tiên các trường hiển thị phổ biến
    return (
      item.label ||            // Chuẩn mới { label, value }
      item.display_name ||     // API Duration cũ
      item.name ||             // API Activities cũ
      item.label_en ||
      item.tag || 
      item.value || 
      "Unnamed"                // Fallback text thay vì [object Object]
    );
  };

  const toggleTag = (item) => {
    if (readOnly) return;

    const value = getValue(item);
    if (!value) return; // Nếu không lấy được value thì không làm gì

    const isSelected = selectedValues.includes(value);

    const updated = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className={`vibe-panel ${readOnly ? "is-readonly" : ""}`}>
      <div className="vibe-scroll">
        <div className="vibe-grid">
          {tags.map((item, idx) => {
            const value = getValue(item);
            const label = getLabel(item);
            const active = selectedValues.includes(value);

            // 🛑 FIX LỖI KEY: 
            // 1. Dùng item.id nếu có (chuẩn nhất)
            // 2. Nếu không, dùng value (nếu value không rỗng)
            // 3. Đường cùng mới dùng index (idx)
            const uniqueKey = item.id || (value ? value : idx);

            return (
              <div
                key={uniqueKey} 
                className={`tag-pill ${active ? "is-active" : ""} ${readOnly ? "is-disabled" : ""}`}
                onClick={() => toggleTag(item)}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}