import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addExpense, editExpense, deleteExpense, selectAll } from "../../store/expensesSlice";
import { getCat, formatINR } from "../../downloadCSV";
import { useDebounce } from "../../store/hooks/useDebounce";

const CATEGORIES = ["Food","Petrol","Salary","Travel","Entertainment","Shopping","Health","Bills","Education","Other"];

export default function ExpenseForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const expenses = useSelector(selectAll);
  const { loading } = useSelector((s) => s.expenses);

  const [money,       setMoney]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Food");
  const [date,        setDate]        = useState(new Date().toISOString().split("T")[0]);
  const [editingId,   setEditingId]   = useState(null);
  const [toast,       setToast]       = useState("");
  const [search,      setSearch]      = useState("");

  const dSearch = useDebounce(search, 350);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const resetForm = useCallback(() => {
    setMoney(""); setDescription(""); setCategory("Food");
    setDate(new Date().toISOString().split("T")[0]); setEditingId(null);
  }, []);

  const submit = useCallback((e) => {
    e.preventDefault();
    const expense = { money: Number(money), description, category, date };
    if (editingId) {
      dispatch(editExpense({ id: editingId, updatedExpense: expense }));
      showToast(`✅ Updated ₹${formatINR(money)} expense`);
    } else {
      dispatch(addExpense(expense));
      showToast(`✅ Saved ₹${formatINR(money)} to ${category}`);
    }
    resetForm();
  }, [money, description, category, date, editingId, dispatch, resetForm]);

  const handleEdit = useCallback((item) => {
    setEditingId(item.id); setMoney(String(item.money));
    setDescription(item.description); setCategory(item.category);
    setDate(item.date || new Date().toISOString().split("T")[0]);
    window.scrollTo({ top: 0, behavior:"smooth" });
  }, []);

  const filtered = useMemo(() =>
  expenses.filter(e =>
    (e.description || "").toLowerCase().includes((dSearch || "").toLowerCase()) ||
    (e.category || "").toLowerCase().includes((dSearch || "").toLowerCase())
  ),
[expenses, dSearch]);

  const selCat = useMemo(() => getCat(category), [category]);

  
    return (
  <div className="min-h-screen bg-[var(--bg)]">

    {/* NAV */}
    <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 h-14 border-b backdrop-blur-lg bg-black/70 border-[var(--border)]">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-sm text-[var(--text2)]"
      >
        ← Dashboard
      </button>

      <span className="font-bold text-sm md:text-base text-[var(--text)]">
        {editingId ? "✏️ Edit" : "➕ Add Expense"}
      </span>

      <div className="w-16" />
    </nav>

    {/* TOAST */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm bg-[var(--surface)] border border-[var(--border)]"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>

    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-5">

      {/* FORM */}
      <div className="card p-4 sm:p-6">

        {/* Amount */}
        <div className="text-center mb-5">
          <p className="text-xs text-[var(--text3)] mb-2">
            {editingId ? "EDITING" : "AMOUNT"}
          </p>

          <div className="flex justify-center items-center">
            <span className="text-2xl text-[var(--text3)]">₹</span>

            <input
              type="number"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              placeholder="0"
              className="bg-transparent text-center outline-none font-bold"
              style={{
                fontSize: "clamp(32px,8vw,56px)",
                width: Math.max(2, money.length + 1) + "ch",
              }}
            />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">

          {/* CATEGORY */}
          <div>
            <p className="text-xs text-[var(--text2)] mb-2">Category</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {CATEGORIES.map((c) => {
                const m = getCat(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`p-2 rounded-xl border text-xs flex flex-col items-center ${
                      category === c
                        ? "border-[var(--violet)] bg-[var(--surface2)] scale-105"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INPUTS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="inp flex-1"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              type="date"
              className="inp flex-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white text-sm"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!money || !description}
              className="flex-1 py-3 rounded-xl bg-[var(--violet)] text-white text-sm disabled:opacity-50"
            >
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="card p-4 sm:p-5">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-4">
          <h2 className="font-bold text-sm text-[var(--text)]">
            Expenses ({expenses.length})
          </h2>

          <input
            className="inp text-sm w-full sm:w-44"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--text3)] py-10">
            No expenses yet
          </p>
        )}

        {/* LIST */}
        <div className="space-y-2">
          {filtered.map((item) => {
            const cat = getCat(item.category);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)]"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-lg">
                  {cat.icon}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {item.description}
                  </p>
                  <p className="text-xs text-[var(--text3)]">
                    {item.category}
                  </p>
                </div>

                <span className="text-sm font-bold">
                  ₹{formatINR(item.money)}
                </span>

                {/* ALWAYS VISIBLE ACTIONS (mobile fix) */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-xs px-2 py-1 bg-purple-500/20 rounded"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => dispatch(deleteExpense(item.id))}
                    className="text-xs px-2 py-1 bg-red-500/20 rounded"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
}