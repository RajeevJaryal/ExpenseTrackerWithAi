// src/store/themeReducer.js
import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    darkMode: localStorage.getItem("theme") !== "light",
    premium:  localStorage.getItem("premium") === "true",
  },
  reducers: {
    toggleTheme(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem("theme", state.darkMode ? "dark" : "light");
    },
    activatePremium(state) {
      state.premium  = true;
      state.darkMode = true;
      localStorage.setItem("premium", "true");
    },
  },
});

export const { toggleTheme, activatePremium } = themeSlice.actions;
export default themeSlice.reducer;


