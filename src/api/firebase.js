// src/api/firebase.js
// Fully working Firebase axios instance (multi-user ready)

import axios from "axios";

const BASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

const firebaseAPI = axios.create({
  baseURL: BASE_URL,
});

// Auto attach auth token in every request
firebaseAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.params = {
      ...config.params,
      auth: token,
    };
  }

  return config;
});

export default firebaseAPI;