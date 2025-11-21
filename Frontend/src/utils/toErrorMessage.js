// Chuẩn hoá mọi kiểu lỗi về 1 chuỗi thân thiện
export default function toErrorMessage(err) {
    const d = err?.response?.data;
  
    // Trường hợp backend trả {"email":["..."]} hoặc {"username":["..."]}
    if (d && typeof d === "object" && !Array.isArray(d)) {
      for (const k of ["email", "username", "password", "detail", "message", "msg"]) {
        const v = d[k];
        if (!v) continue;
        if (Array.isArray(v)) return String(v[0]);
        if (typeof v === "string") return v;
        if (typeof v === "object") return Object.values(v)[0]?.[0] || JSON.stringify(v);
      }
      // Không rơi vào các key quen thuộc → trả JSON gọn
      try { return JSON.stringify(d); } catch { return "Unknown error."; }
    }
  
    // FastAPI/Pydantic thường để message ở d.detail (string/array)
    if (Array.isArray(d?.detail)) {
      return d.detail.map(i => i?.msg || i?.message || String(i)).join(", ");
    }
    if (typeof d?.detail === "string") return d.detail;
  
    // Axios error.message
    if (err?.message) return err.message;
  
    return "Something went wrong.";
  }
  