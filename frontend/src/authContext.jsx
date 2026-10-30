import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:3000/userProfile/${userId}`);
      setUserProfile(res.data);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUser(userId);
      fetchUserProfile(userId).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userId, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    if (username) localStorage.setItem("username", username);
    setCurrentUser(userId);
    fetchUserProfile(userId);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setCurrentUser(null);
    setUserProfile(null);
    window.location.href = "/auth";
  };

  const refreshUser = () => {
    if (currentUser) {
      fetchUserProfile(currentUser);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    userProfile,
    setUserProfile,
    loginUser,
    logout,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
