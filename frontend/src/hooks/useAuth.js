import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [loading, setLoading] = useState(false);

  const updateUser = (nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    updateUser(data.data);
    return data.data;
  };

  const register = async (name, email, password, phone) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      phone,
    });
    localStorage.setItem("token", data.token);
    updateUser(data.data);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin: user?.role === "admin",
        canManagePlaces: user?.role === "owner",
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
