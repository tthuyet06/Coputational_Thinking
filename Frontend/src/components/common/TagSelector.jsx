// src/components/common/TagSelector.jsx
import React, { useState, useEffect } from "react";
import "../../styles/TagSelector.css";

export default function TagSelector({
  tags = [],
  defaultSelected = [],
  onChange,
  readOnly = false, // THÊM: Thêm prop readOnly với giá trị mặc định là false để toggle giữa edit và select
}) {
  // selectedValues là list giá trị (value / tag) đã chọn
  const [selectedValues, setSelectedValues] = useState(defaultSelected || []);

  useEffect(() => {
    setSelectedValues(defaultSelected || []);
  }, [defaultSelected]);

  const getValue = (item) => {
    if (typeof item === "string") return item;
    if (item.value) return item.value;
    if (item.tag) return item.tag;
    if (item.code) return item.code;
    if (item.id) return String(item.id);
    return String(item);
  };

  const getLabel = (item) => {
    if (typeof item === "string") return item;
    return (
      item.label_en ||
      item.display_name ||
      item.name ||
      item.label ||
      item.value ||
      item.tag ||
      String(item)
    );
  };

  const toggleTag = (item) => {
    if (readOnly) { // SỬA: Nếu ở chế độ chỉ đọc (readOnly=true), DỪNG hàm lại.
      return;
    }

    const value = getValue(item);
    const isSelected = selectedValues.includes(value);

    const updated = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(updated);
    if (onChange) onChange(updated); // trả ra list value (tag)
  };

  return (
    <div className={`vibe-panel ${readOnly ? "is-readonly" : ""}`}> {/* SỬA: Thêm class CSS nếu readOnly */}
      <div className="vibe-scroll">
        <div className="vibe-grid">
          {tags.map((item, idx) => {
            const value = getValue(item);
            const label = getLabel(item);
            const active = selectedValues.includes(value);
            return (
              <div
                key={value || idx}
                className={`tag-pill ${active ? "is-active" : ""} ${readOnly ? "is-disabled" : ""}`} // SỬA: Thêm class để tạo hiệu ứng disabled/readOnly
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