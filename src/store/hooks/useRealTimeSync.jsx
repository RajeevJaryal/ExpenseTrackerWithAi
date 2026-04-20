import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { syncExpenses } from "../store/expensesSlice";
 
export function useRealTimeSync() {
  const dispatch = useDispatch();
 
  useEffect(() => {
    const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL;
    const token  = localStorage.getItem("token");
    if (!DB_URL || !token) return;
 
    const poll = async () => {
      try {
        const res  = await fetch(`${DB_URL}/expenses.json?auth=${token}`);
        const data = await res.json();
        if (data && typeof data === "object") {
          const arr = Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse();
          dispatch(syncExpenses(arr));
        }
      } catch (_) {}
    };
 
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [dispatch]);
}