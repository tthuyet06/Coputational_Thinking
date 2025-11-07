import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/authAPI";
import { api } from "../services/apiClient";
import toErrorMessage from "../utils/toErrorMessage";

const AuthContext = createContext(null);
export const useAuthContext = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const t = localStorage.getItem("accessToken");
        if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
        const { data } = await authAPI.me();
        setUser(data);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const login = async (username, password) => {
    setAuthError(null);
    try {
      const { data } = await authAPI.login(username, password);
      const access = data?.access_token;
      const refresh = data?.refresh_token;
  
      if (access) {
        localStorage.setItem("accessToken", access);
        api.defaults.headers.common.Authorization = `Bearer ${access}`;
      }
      if (refresh) localStorage.setItem("refreshToken", refresh);
  
      const me = await authAPI.me().catch(() => null);
      setUser(me?.data || null);
      return { ok: true };
    } catch (e) {
      const msg = toErrorMessage(e);
      setAuthError(msg);           
      return { ok: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** 🔎 Gom mọi kiểu lỗi FastAPI về string */
function normalizeError(data) {
  if (!data) return "";
  if (typeof data === "string") return data;

  // Kiểu FastAPI validation: { detail: [ { msg, loc, type }, ... ] }
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail.map(d => d.msg || JSON.stringify(d)).join(", ");
    }
    return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  }

  // Kiểu tùy chỉnh: { email: ["..."], username: ["..."] }
  if (typeof data === "object") {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join("; ");
  }
  return String(data);
}
