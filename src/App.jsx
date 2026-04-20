// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchExpenses } from "./store/expensesSlice";

import "./index.css";

// Lazy load all routes for performance

const LoginForm      = lazy(() => import("./components/login/LoginForm"));
const ForgotPassword = lazy(() => import("./components/login/ForgotPassword"));
const CompleteProfile = lazy(() => import("./components/login/CompleteProfile"));
const Dashboard      = lazy(() => import("./components/Dashboard/Dashboard"));
const ExpenseForm    = lazy(() => import("./components/expenseForm/ExpenseForm"));

// Loading spinner
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg)" }}>
    <svg className="spin w-10 h-10" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(124,111,247,.2)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c6ff7" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </div>
);

// Protected route wrapper
function Protected({ children }) {
  const token = useSelector((s) => s.auth.token);
  return token ? children : <Navigate to="/" replace />;
}

// App-level expense loader
function ExpenseLoader({ children }) {
  const dispatch = useDispatch();
  const token    = useSelector((s) => s.auth.token);
  useEffect(() => { if (token) dispatch(fetchExpenses()); }, [dispatch, token]);
  return children;
}

export default function App() {
  const dark = useSelector((s) => s.theme.darkMode);

  return (
    <div className={dark ? "dark" : "light"}>
      <ExpenseLoader>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/"               element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard"      element={<Protected><Dashboard /></Protected>} />
            <Route path="/expense-form"   element={<Protected><ExpenseForm /></Protected>} />
            <Route path="/complete-profile" element={<Protected><CompleteProfile /></Protected>} />

            {/* Legacy routes redirect */}
            <Route path="/header"         element={<Navigate to="/dashboard" replace />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ExpenseLoader>
    </div>
  );
}