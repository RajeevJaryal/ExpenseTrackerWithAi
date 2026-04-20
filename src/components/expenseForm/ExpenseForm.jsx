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
    <div className="min-h-screen" style={{ background:"var(--bg)", fontFamily:"var(--font-body)" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b"
        style={{ background:"rgba(8,8,16,.9)", backdropFilter:"blur(20px)", borderColor:"var(--border)" }}>
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)" }}>
          ← Dashboard
        </button>
        <span className="df font-black text-base" style={{ color:"var(--text)" }}>
          {editingId ? "✏️ Edit Expense" : "➕ Log Expense"}
        </span>
        <div className="w-24" />
      </nav>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
            style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-5 py-8 flex flex-col gap-5">

        {/* ── FORM ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="card p-6">
          {/* Big amount */}
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"var(--text3)" }}>
              {editingId ? "EDITING EXPENSE" : "AMOUNT SPENT"}
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="df text-3xl font-black" style={{ color:"var(--text3)" }}>₹</span>
              <input type="number" value={money} onChange={e=>setMoney(e.target.value)} placeholder="0"
                className="df font-black text-center bg-transparent border-none outline-none"
                style={{
                  fontSize: "clamp(40px,8vw,64px)", letterSpacing:"-2px",
                  color: money ? "var(--text)" : "var(--text3)",
                  width: Math.max(2, money.length+1) + "ch", minWidth:"2ch", maxWidth:"9ch",
                }} />
            </div>
            <div className="h-0.5 max-w-64 mx-auto mt-3 rounded-full transition-all duration-300"
              style={{ background: money ? "var(--grad)" : "var(--border)" }} />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold mb-2.5" style={{ color:"var(--text2)" }}>Category</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(c => {
                  const m = getCat(c);
                  return (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all"
                      style={{
                        borderColor: category===c ? m.color : "var(--border)",
                        background:  category===c ? m.bg : "var(--surface2)",
                        transform:   category===c ? "scale(1.05)" : "scale(1)",
                      }}>
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-xs font-semibold leading-tight" style={{ color: category===c ? m.color : "var(--text3)" }}>
                        {c}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"var(--text2)" }}>Description</label>
                <input className="inp" placeholder="What was this for?" value={description} onChange={e=>setDescription(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"var(--text2)" }}>Date</label>
                <input className="inp" type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-ghost flex-1 py-3.5 text-sm">
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={loading || !money || !description}
                className="btn flex-1 justify-center py-3.5 disabled:opacity-50">
                {loading
                  ? <><svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg> Saving…</>
                  : editingId
                    ? `Update ₹${money ? formatINR(money) : "0"} →`
                    : `Save ₹${money ? formatINR(money) : "0"} →`
                }
              </button>
            </div>
          </form>
        </motion.div>

        {/* ── LIST ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="df font-black text-base" style={{ color:"var(--text)" }}>
              All Expenses <span className="text-sm font-normal ml-1" style={{ color:"var(--text3)" }}>({expenses.length})</span>
            </h2>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color:"var(--text3)" }}>🔍</span>
              <input className="inp pl-7 py-2 text-sm w-44" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <svg className="spin w-7 h-7" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(124,111,247,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--violet)" strokeWidth="3" strokeLinecap="round"/></svg>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color:"var(--text3)" }}>
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-semibold">No expenses yet</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {filtered.map(item => {
              const cat = getCat(item.category);
              return (
                <motion.div key={item.id} layout
                  className="flex items-center gap-3 p-3 rounded-2xl group cursor-default"
                  whileHover={{ background:"var(--surface2)" }}
                  style={{ transition:"background 0.15s" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.bg }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color:"var(--text)" }}>{item.description}</p>
                    <p className="text-xs mt-0.5" style={{ color:"var(--text3)" }}>{item.category}{item.date ? ` · ${item.date}` : ""}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: item.category==="Salary"?"#34d399":"#f472b6" }}>
                    {item.category==="Salary"?"+":"-"}₹{formatINR(item.money)}
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background:"rgba(124,111,247,.15)", color:"var(--violet2)" }}>Edit</button>
                    <button onClick={() => dispatch(deleteExpense(item.id))} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>Delete</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}