/**
 * Chuẩn hoá mọi kiểu đối tượng lỗi (error object, thường từ Axios) về 1 chuỗi thông báo thân thiện.
 * @param {any} error Đối tượng lỗi.
 * @param {string} fallback Thông báo lỗi mặc định nếu không trích xuất được.
 * @returns {string} Thông báo lỗi đã được chuẩn hoá.
 */
export default function toErrorMessage(error, fallback = "Something went wrong.") {
  // 1. Lỗi mạng hoặc lỗi không có response (ví dụ: mất kết nối, timeout)
  if (!error?.response) return error?.message || "Network error";
  
  const { data, statusText } = error.response;

  // 2. Chuỗi thẳng (response là một chuỗi)
  if (typeof data === "string") return data;

  // 3. Xử lý các kiểu lỗi phổ biến từ backend/FastAPI
  
  // Lấy ra detail, hoặc data (nếu data là object)
  const detail = data?.detail || data; 

  // string
  if (typeof detail === "string") return detail;

  // array: [{msg,...}] hoặc ["..."] (Lỗi validation FastAPI)
  if (Array.isArray(detail) && detail.length) {
    // Nếu là array object (lỗi Pydantic), trích xuất msg/message
    return detail
      .map(it => {
        if (typeof it === "string") return it;
        // Ưu tiên msg (FastAPI), sau đó đến message, cuối cùng là JSON stringify
        return it?.msg || it?.message || String(it);
      })
      .join("; ");
  }

  // object: { field: ["msg1", "msg2"] } hoặc { field: "msg" }
  if (detail && typeof detail === "object") {
    const msgs = [];
    // Lặp qua các trường
    for (const v of Object.values(detail)) {
      if (Array.isArray(v)) {
        // Nếu là array, lấy tất cả msg
        msgs.push(...v.map(x => (typeof x === "string" ? x : x?.msg || String(x))));
      } else if (typeof v === "string") {
        msgs.push(v);
      } else if (v && typeof v === "object" && typeof v.message === 'string') {
          // Trường hợp { field: { message: "msg" } }
          msgs.push(v.message);
      }
    }
    if (msgs.length) return msgs.join("; ");
  }
  
  // 4. Các key phổ biến khác (message, error)
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  // 5. Fallback
  try {
    const body = JSON.stringify(data);
    // Trả về JSON nếu nó không phải là đối tượng rỗng
    if (body && body !== "{}") return body;
  } catch {}
  
  // Cuối cùng: statusText của response hoặc thông báo mặc định
  return statusText || fallback;
}