import axios from "axios";

const BASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

const firebaseAPI = axios.create({
  baseURL: BASE_URL,
});

// Attach Firebase ID token properly
firebaseAPI.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("firebase_token");

  if (token) {
    config.params = {
      ...(config.params || {}),
      auth: token,
    };
  }

  return config;
});

export default firebaseAPI;