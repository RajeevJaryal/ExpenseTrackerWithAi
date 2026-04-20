// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer    from "./AuthReducer";
import expensesReducer from "./expensesSlice";
import themeReducer   from "./themeReducer";
import budgetReducer  from "./budgetSlice";

const store = configureStore({
  reducer: {
    auth:     authReducer,
    expenses: expensesReducer,
    theme:    themeReducer,
    budget:   budgetReducer,
  },
});

export default store;