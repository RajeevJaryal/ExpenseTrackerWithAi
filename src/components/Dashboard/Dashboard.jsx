import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { logout } from "../../store/AuthReducer";
import { deleteExpense, editExpense, selectAll, selectByCategory, selectMonthlyTrend, selectWeeklyComparison, selectForecast, syncExpenses } from "../../store/expensesSlice";
import { toggleTheme, activatePremium } from "../../store/themeReducer";
import { downloadCSV, getCat, formatINR } from "../../downloadCSV";
import { useDebounce } from "../../store/hooks/useDebounce";

const NAV_ITEMS = [
  { key:"overview",   label:"Overview",   icon:"⚡" },
  { key:"analytics",  label:"Analytics",  icon:"📊" },
  { key:"budget",     label:"Budget",     icon:"🎯" },
  { key:"ai",         label:"AI Insights",icon:"🤖" },
];

const PIE_COLORS = ["#7c6ff7","#f472b6","#fbbf24","#22d3ee","#34d399","#f87171","#a78bfa","#60a5fa"];

export default function Dashboard() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const expenses      = useSelector(selectAll);
  const byCategory    = useSelector(selectByCategory);
  const monthlyTrend  = useSelector(selectMonthlyTrend);
  const weeklyComp    = useSelector(selectWeeklyComparison);
  const forecast      = useSelector(selectForecast);
  const { darkMode, premium } = useSelector((s) => s.theme);
  const { isVerified, token, email } = useSelector((s) => s.auth);
  const { limits: budgetLimits }     = useSelector((s) => s.budget);
  const loading = useSelector((s) => s.expenses.loading);

  const [tab,       setTab]     = useState("overview");
  const [search,    setSearch]  = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy,    setSortBy]  = useState("newest");
  const [editItem,  setEditItem] = useState(null);
  const [verifyLoad, setVLoad]  = useState(false);
  const [syncing,   setSyncing] = useState(false);

  const dSearch = useDebounce(search, 350);

  // ── Real-time sync every 8s ──
  useEffect(() => {
    const DB_URL = import.meta.env.VITE_FIREBASE_DB_URL;
    if (!DB_URL || !token) return;
    const poll = async () => {
      setSyncing(true);
      try {
        const res  = await fetch(`${DB_URL}/expenses.json?auth=${token}`);
        const data = await res.json();
        if (data && typeof data === "object") {
          const arr = Object.keys(data).map(k => ({ id:k, ...data[k] })).reverse();
          dispatch(syncExpenses(arr));
        }
      } catch (_) {} finally { setSyncing(false); }
    };
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [dispatch, token]);

  // ── Dark mode body class ──
  useEffect(() => { document.body.classList.toggle("dark-mode", darkMode); }, [darkMode]);

  // ── Computed stats ──
  const income   = useMemo(() => expenses.filter(e=>e.category==="Salary").reduce((s,e)=>s+Number(e.money),0), [expenses]);
  const spent    = useMemo(() => expenses.filter(e=>e.category!=="Salary").reduce((s,e)=>s+Number(e.money),0), [expenses]);
  const balance  = income - spent;
  const savingRate = income > 0 ? Math.round(((income-spent)/income)*100) : 0;

  // ── Filtered + sorted list ──
  const filtered = useMemo(() => {
    let list = [...expenses];
    if (catFilter !== "All") list = list.filter(e => e.category === catFilter);
    if (dSearch)             list = list.filter(e => e.description.toLowerCase().includes(dSearch.toLowerCase()));
    if (sortBy === "newest") list.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
    if (sortBy === "highest") list.sort((a,b) => b.money - a.money);
    if (sortBy === "lowest")  list.sort((a,b) => a.money - b.money);
    return list;
  }, [expenses, catFilter, dSearch, sortBy]);

  const categories = useMemo(() => ["All", ...new Set(expenses.map(e=>e.category))], [expenses]);

  // Pie data
  const pieData = useMemo(() =>
    Object.entries(byCategory).map(([name, value]) => ({ name, value })), [byCategory]);

  // Budget alerts
  const budgetAlerts = useMemo(() =>
    Object.entries(budgetLimits).filter(([cat, limit]) => (byCategory[cat]||0) > limit), [budgetLimits, byCategory]);

  // ── Handlers ──
  const handleLogout      = useCallback(() => { dispatch(logout()); navigate("/"); }, [dispatch, navigate]);
  const handleVerify      = useCallback(async () => {
    setVLoad(true);
    try {
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ requestType:"VERIFY_EMAIL", idToken: token }),
      });
      alert("Verification email sent!");
    } catch (e) { alert(e.message); }
    setVLoad(false);
  }, [token]);

  const saveEdit = useCallback(() => {
    if (!editItem) return;
    dispatch(editExpense({ id: editItem.id, updatedExpense: { money: editItem.money, description: editItem.description, category: editItem.category, date: editItem.date } }));
    setEditItem(null);
  }, [dispatch, editItem]);

  // ── Custom tooltip ──
  const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card2 p-3 text-sm" style={{ minWidth:120 }}>
        <p style={{ color:"var(--text2)", fontSize:11 }}>{label}</p>
        <p className="font-bold" style={{ color:"var(--violet)" }}>₹{formatINR(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ background:"var(--bg)" }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col sticky top-0 h-screen border-r"
        style={{ background:"var(--surface)", borderColor:"var(--border)" }}>

        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor:"var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl btn flex items-center justify-center flex-shrink-0" style={{ padding:0, boxShadow:"0 4px 16px rgba(124,111,247,.4)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            </div>
            <div>
              <p className="df font-black text-base leading-none" style={{ color:"var(--text)" }}>Fin<span className="gt">AI</span></p>
              <p className="text-xs mt-0.5" style={{ color:"var(--text3)" }}>Smart Finance</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: tab === item.key ? "linear-gradient(135deg,rgba(124,111,247,.2),rgba(244,114,182,.1))" : "transparent",
                color:      tab === item.key ? "var(--violet)" : "var(--text2)",
                border:     tab === item.key ? "1px solid rgba(124,111,247,.25)" : "1px solid transparent",
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.key === "ai" && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold" style={{ background:"linear-gradient(135deg,#7c6ff7,#f472b6)", color:"#fff" }}>NEW</span>}
            </button>
          ))}

          <div className="mt-2 pt-2 border-t flex flex-col gap-1" style={{ borderColor:"var(--border)" }}>
            <button onClick={() => navigate("/expense-form")}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background:"transparent", color:"var(--text2)", border:"1px solid transparent" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--text)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text2)"}>
              ➕ Add Expense
            </button>
            <button onClick={() => navigate("/complete-profile")}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background:"transparent", color:"var(--text2)", border:"1px solid transparent" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--text)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--text2)"}>
              👤 Profile
            </button>
          </div>
        </nav>

        {/* Bottom user card */}
        <div className="p-3 border-t" style={{ borderColor:"var(--border)" }}>
          {premium && (
            <button onClick={() => dispatch(toggleTheme())}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-2 transition-all btn-ghost">
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          )}
          {premium && (
            <button onClick={() => downloadCSV(expenses)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-2 transition-all"
              style={{ background:"rgba(52,211,153,.1)", color:"#34d399", border:"1px solid rgba(52,211,153,.2)" }}>
              📥 Download CSV
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background:"var(--surface2)" }}>
            <div className="w-7 h-7 rounded-full btn flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ padding:0 }}>
              {email?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-xs truncate flex-1" style={{ color:"var(--text2)" }}>{email || "User"}</p>
            {syncing && <div className="w-1.5 h-1.5 rounded-full pdot flex-shrink-0" style={{ background:"#34d399" }} />}
          </div>
          <button onClick={handleLogout}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background:"rgba(248,113,113,.08)", color:"#f87171", border:"1px solid rgba(248,113,113,.2)" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-7 h-14 border-b"
          style={{ background:"rgba(8,8,16,.85)", backdropFilter:"blur(20px)", borderColor:"var(--border)" }}>
          <h2 className="df font-black text-lg" style={{ color:"var(--text)" }}>
            {NAV_ITEMS.find(n=>n.key===tab)?.icon} {NAV_ITEMS.find(n=>n.key===tab)?.label}
          </h2>
          <div className="flex items-center gap-2">
            {!isVerified && (
              <button onClick={handleVerify} disabled={verifyLoad}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background:"rgba(251,191,36,.1)", color:"#fbbf24", border:"1px solid rgba(251,191,36,.2)" }}>
                <span className="pdot">●</span> {verifyLoad ? "Sending…" : "Verify Email"}
              </button>
            )}
            {!premium && balance > 10000 && (
              <button onClick={() => dispatch(activatePremium())}
                className="btn py-1.5 px-4 text-xs">⭐ Activate Premium</button>
            )}
          </div>
        </div>

        <div className="p-7">
          <AnimatePresence mode="wait">

            {/* ══════════ OVERVIEW TAB ══════════ */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>

                {/* Budget alerts */}
                {budgetAlerts.length > 0 && (
                  <motion.div initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }}
                    className="rounded-2xl p-4 mb-6 flex items-start gap-3"
                    style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.25)" }}>
                    <span className="text-lg">🚨</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color:"#f87171" }}>Budget Exceeded!</p>
                      <p className="text-xs mt-1" style={{ color:"var(--text2)" }}>
                        {budgetAlerts.map(([cat]) => cat).join(", ")} — over your set limits
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label:"Balance",     value: balance,    color:"#7c6ff7", icon:"💰", sub:`${expenses.length} transactions` },
                    { label:"Income",      value: income,     color:"#34d399", icon:"↑",  sub:"Salary entries" },
                    { label:"Spent",       value: spent,      color:"#f472b6", icon:"↓",  sub:"All expenses" },
                    { label:"Saving Rate", value: savingRate, color:"#fbbf24", icon:"📈", sub:"of income saved", isPercent: true },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
                      className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold" style={{ color:"var(--text2)" }}>{s.label}</span>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                          style={{ background:`${s.color}18` }}>{s.icon}</div>
                      </div>
                      <p className="df text-2xl font-black tracking-tight" style={{ color: s.color }}>
                        {s.isPercent ? `${s.value}%` : `₹${formatINR(s.value)}`}
                      </p>
                      <p className="text-xs mt-1" style={{ color:"var(--text3)" }}>{s.sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Forecast banner */}
                {forecast && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
                    className="rounded-2xl p-4 mb-6 flex items-center gap-4"
                    style={{ background:"linear-gradient(135deg,rgba(124,111,247,.12),rgba(244,114,182,.08))", border:"1px solid rgba(124,111,247,.2)" }}>
                    <span className="text-2xl">🔮</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color:"var(--text)" }}>Next Month Forecast</p>
                      <p className="text-xs mt-0.5" style={{ color:"var(--text2)" }}>Based on your spending trend (linear regression)</p>
                    </div>
                    <p className="df text-xl font-black" style={{ color:"var(--violet)" }}>₹{formatINR(forecast)}</p>
                  </motion.div>
                )}

                {/* Transaction list */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="df font-black text-base" style={{ color:"var(--text)" }}>
                      Transactions <span className="text-sm font-normal ml-1" style={{ color:"var(--text3)" }}>({filtered.length})</span>
                    </h3>
                    <button onClick={() => navigate("/expense-form")} className="btn py-2 px-4 text-xs">+ Add</button>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                      <input className="inp py-2 pl-8 text-sm" placeholder="Search transactions…"
                        value={search} onChange={e=>setSearch(e.target.value)} />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color:"var(--text3)" }}>🔍</span>
                    </div>
                    <select className="inp py-2 text-sm w-36" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="highest">Highest</option>
                      <option value="lowest">Lowest</option>
                    </select>
                    <div className="flex gap-1.5 flex-wrap">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setCatFilter(cat)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                          style={{
                            borderColor: catFilter===cat ? "var(--violet)" : "var(--border)",
                            background:  catFilter===cat ? "rgba(124,111,247,.15)" : "var(--surface2)",
                            color:       catFilter===cat ? "var(--violet2)" : "var(--text2)",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading && <div className="flex justify-center py-10"><svg className="spin w-7 h-7" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(124,111,247,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--violet)" strokeWidth="3" strokeLinecap="round"/></svg></div>}

                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center py-14" style={{ color:"var(--text3)" }}>
                      <p className="text-4xl mb-3">📭</p>
                      <p className="font-semibold text-sm">No transactions found</p>
                      <button onClick={() => navigate("/expense-form")} className="btn mt-4 py-2 px-5 text-xs">+ Add first expense</button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    {filtered.map(item => {
                      const cat   = getCat(item.category);
                      const isEd  = editItem?.id === item.id;
                      return (
                        <motion.div key={item.id} layout
                          className="flex items-center gap-3 p-3 rounded-2xl group transition-all"
                          style={{ background:"transparent" }}
                          whileHover={{ background:"var(--surface2)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: cat.bg }}>{cat.icon}</div>
                          {isEd ? (
                            <div className="flex-1 flex gap-2">
                              <input className="inp py-1.5 text-xs flex-1" value={editItem.description} onChange={e=>setEditItem({...editItem,description:e.target.value})} />
                              <input className="inp py-1.5 text-xs w-24" type="number" value={editItem.money} onChange={e=>setEditItem({...editItem,money:e.target.value})} />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color:"var(--text)" }}>{item.description}</p>
                              <p className="text-xs mt-0.5" style={{ color:"var(--text3)" }}>{item.category} {item.date ? `· ${item.date}` : ""}</p>
                            </div>
                          )}
                          <span className="font-bold text-sm flex-shrink-0" style={{ color: item.category==="Salary"?"#34d399":"#f472b6" }}>
                            {item.category==="Salary"?"+":"-"}₹{formatINR(item.money)}
                          </span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isEd ? (
                              <>
                                <button onClick={saveEdit} className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background:"#34d399" }}>Save</button>
                                <button onClick={()=>setEditItem(null)} className="px-2.5 py-1 rounded-lg text-xs" style={{ background:"var(--surface3)", color:"var(--text2)" }}>✕</button>
                              </>
                            ) : (
                              <>
                                <button onClick={()=>setEditItem({...item})} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background:"rgba(124,111,247,.15)", color:"var(--violet2)" }}>Edit</button>
                                <button onClick={()=>dispatch(deleteExpense(item.id))} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background:"rgba(248,113,113,.12)", color:"#f87171" }}>Delete</button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ ANALYTICS TAB ══════════ */}
            {tab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="flex flex-col gap-6">

                <div className="grid grid-cols-2 gap-6">
                  {/* Line chart - monthly trend */}
                  <div className="card p-5">
                    <h3 className="df font-black text-sm mb-4" style={{ color:"var(--text)" }}>Monthly Spending Trend</h3>
                    {monthlyTrend.length < 2 ? (
                      <p className="text-sm text-center py-8" style={{ color:"var(--text3)" }}>Add more expenses across different months to see the trend</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" tick={{ fill:"var(--text3)", fontSize:11 }} axisLine={false} />
                          <YAxis tick={{ fill:"var(--text3)", fontSize:11 }} axisLine={false} tickFormatter={v=>`₹${formatINR(v)}`} />
                          <Tooltip content={<ChartTip />} />
                          <Line type="monotone" dataKey="total" stroke="#7c6ff7" strokeWidth={2.5} dot={{ fill:"#7c6ff7", r:4 }} activeDot={{ r:6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Pie chart */}
                  <div className="card p-5">
                    <h3 className="df font-black text-sm mb-4" style={{ color:"var(--text)" }}>Category Breakdown</h3>
                    {pieData.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color:"var(--text3)" }}>No data yet</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                            dataKey="value" nameKey="name" paddingAngle={3}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `₹${formatINR(v)}`} contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text)" }} />
                          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color:"var(--text2)", fontSize:11 }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Bar chart - weekly comparison */}
                <div className="card p-5">
                  <h3 className="df font-black text-sm mb-4" style={{ color:"var(--text)" }}>Weekly Comparison</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyComp} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill:"var(--text3)", fontSize:11 }} axisLine={false} />
                      <YAxis tick={{ fill:"var(--text3)", fontSize:11 }} axisLine={false} tickFormatter={v=>`₹${formatINR(v)}`} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="total" fill="url(#barGrad)" radius={[8,8,0,0]} />
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c6ff7" />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast card */}
                {forecast && (
                  <div className="card p-5 flex items-center gap-5">
                    <div className="text-4xl">🔮</div>
                    <div className="flex-1">
                      <p className="df font-black text-base" style={{ color:"var(--text)" }}>Next Month Predicted Spending</p>
                      <p className="text-sm mt-1" style={{ color:"var(--text2)" }}>
                        Using linear regression (y = mx + b) on your last {monthlyTrend.length} months of data
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="df text-3xl font-black gt">₹{formatINR(forecast)}</p>
                      <p className="text-xs mt-1" style={{ color:"var(--text3)" }}>Estimated</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ BUDGET TAB ══════════ */}
            {tab === "budget" && <BudgetTab byCategory={byCategory} />}

            {/* ══════════ AI TAB ══════════ */}
            {tab === "ai" && <AITab expenses={expenses} byCategory={byCategory} balance={balance} forecast={forecast} />}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );

  
}

// ── BUDGET TAB ──
function BudgetTab({ byCategory }) {
  const dispatch = useDispatch();
  const { limits } = useSelector((s) => s.budget);
  const { setBudget, removeBudget } = require("../../store/budgetSlice");
  const CATS = ["Food","Petrol","Entertainment","Shopping","Health","Bills","Travel","Education","Other"];
  const [sel, setSel]   = useState("Food");
  const [amt, setAmt]   = useState("");

  const save = () => {
    if (!amt) return;
    dispatch(setBudget({ category: sel, amount: amt }));
    setAmt("");
  };

  return (
    <motion.div key="budget" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="flex flex-col gap-5">
      {/* Set budget */}
      <div className="card p-5">
        <h3 className="df font-black text-base mb-4" style={{ color:"var(--text)" }}>Set Budget Limits</h3>
        <div className="flex gap-3">
          <select className="inp flex-1" value={sel} onChange={e=>setSel(e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color:"var(--text3)" }}>₹</span>
            <input className="inp pl-7" type="number" placeholder="Monthly limit" value={amt} onChange={e=>setAmt(e.target.value)} />
          </div>
          <button onClick={save} className="btn px-5">Set Limit</button>
        </div>
      </div>

      {/* Budget vs actual */}
      <div className="card p-5">
        <h3 className="df font-black text-base mb-4" style={{ color:"var(--text)" }}>Budget vs Actual</h3>
        {Object.keys(limits).length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color:"var(--text3)" }}>Set budget limits above to track spending</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(limits).map(([cat, limit]) => {
              const actual = byCategory[cat] || 0;
              const pct    = Math.min((actual / limit) * 100, 100);
              const over   = actual > limit;
              const catMeta = getCat(cat);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{catMeta.icon}</span>
                      <span className="font-semibold text-sm" style={{ color:"var(--text)" }}>{cat}</span>
                      {over && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"rgba(248,113,113,.15)", color:"#f87171" }}>Over budget!</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: over?"#f87171":catMeta.color }}>₹{formatINR(actual)}</span>
                      <span className="text-xs" style={{ color:"var(--text3)" }}>/ ₹{formatINR(limit)}</span>
                      <button onClick={() => dispatch(removeBudget(cat))} className="text-xs" style={{ color:"var(--text3)", background:"none", border:"none", cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:"var(--surface2)" }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:.8, ease:"easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: over ? "#f87171" : `linear-gradient(90deg, ${catMeta.color}, ${catMeta.color}aa)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── AI INSIGHTS TAB ──
function AITab({ expenses, byCategory, balance, forecast }) {
  const [prompt,   setPrompt]   = useState("");
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const context = `
User's expense data summary:
- Total balance: ₹${formatINR(balance)}
- Spending by category: ${Object.entries(byCategory).map(([k,v])=>`${k}: ₹${formatINR(v)}`).join(", ")}
- Total transactions: ${expenses.length}
- Next month forecast: ₹${forecast ? formatINR(forecast) : "N/A"}
- Recent expenses: ${expenses.slice(0,5).map(e=>`${e.category} ₹${e.money} (${e.description})`).join("; ")}
`;

  const QUICK = [
    "Where did I overspend this month?",
    "Suggest a budget for next month",
    "Analyze my spending habits",
    "How can I save more money?",
  ];

  const ask = async (q) => {
    const userMsg = q || prompt;
    if (!userMsg.trim()) return;
    setMessages(m => [...m, { role:"user", content: userMsg }]);
    setPrompt("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a friendly AI financial advisor. Analyze the user's expense data and give concise, actionable, personalized advice. Use emojis naturally. Keep responses under 200 words. Here is their data:\n${context}`,
          messages: [{ role:"user", content: userMsg }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't generate insights right now.";
      setMessages(m => [...m, { role:"assistant", content: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role:"assistant", content: "⚠️ AI service unavailable. Make sure your Anthropic API key is configured in the backend proxy." }]);
    }
    setLoading(false);
  };

  return (
    <motion.div key="ai" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="flex flex-col gap-5">

      {/* Header */}
      <div className="card p-5 flex items-center gap-4"
        style={{ background:"linear-gradient(135deg,rgba(124,111,247,.12),rgba(244,114,182,.08))", border:"1px solid rgba(124,111,247,.2)" }}>
        <div className="text-4xl">🤖</div>
        <div>
          <h3 className="df font-black text-base" style={{ color:"var(--text)" }}>AI Financial Advisor</h3>
          <p className="text-sm mt-0.5" style={{ color:"var(--text2)" }}>Powered by Claude AI · Analyzes your real spending data</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
          style={{ background:"rgba(52,211,153,.1)", color:"#34d399", border:"1px solid rgba(52,211,153,.2)" }}>
          <span className="pdot">●</span> Live
        </div>
      </div>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK.map(q => (
          <button key={q} onClick={() => ask(q)}
            className="card2 p-3.5 text-left text-sm font-medium transition-all hover:border-violet-DEFAULT"
            style={{ color:"var(--text2)", borderColor:"var(--border)", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,111,247,.4)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}>
            💬 {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      {messages.length > 0 && (
        <div className="card p-5 flex flex-col gap-4 max-h-96 overflow-y-auto">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background:  m.role==="user" ? "var(--grad)" : "var(--surface2)",
                  color:       m.role==="user" ? "#fff" : "var(--text)",
                  borderRadius: m.role==="user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                }}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background:"var(--surface2)" }}>
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:"var(--violet)", animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input className="inp flex-1" placeholder="Ask anything about your finances…"
          value={prompt} onChange={e=>setPrompt(e.target.value)}
          onKeyDown={e => e.key==="Enter" && ask()} />
        <button onClick={() => ask()} disabled={!prompt.trim() || loading} className="btn px-5">
          {loading ? <svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg> : "Ask →"}
        </button>
      </div>
    </motion.div>
  );
}