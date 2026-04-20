// src/store/budgetSlice.js — budget limits per category
import { createSlice } from "@reduxjs/toolkit";

const saved = JSON.parse(localStorage.getItem("budgets") || "{}");

const budgetSlice = createSlice({
  name: "budget",
  initialState: { limits: saved },
  reducers: {
    setBudget(state, { payload: { category, amount } }) {
      state.limits[category] = Number(amount);
      localStorage.setItem("budgets", JSON.stringify(state.limits));
    },
    removeBudget(state, { payload: category }) {
      delete state.limits[category];
      localStorage.setItem("budgets", JSON.stringify(state.limits));
    },
  },
});

export const { setBudget, removeBudget } = budgetSlice.actions;
export default budgetSlice.reducer;