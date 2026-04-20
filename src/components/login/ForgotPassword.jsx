import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  const submit = async (e) => {
    e.preventDefault(); setLoad(true); setError("");
    try {
      const res  = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ requestType:"PASSWORD_RESET", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      setSent(true);
    } catch (err) { setError(err.message); }
    finally { setLoad(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background:"var(--bg)" }}>
      <div className="blob w-80 h-80 -top-20 -right-20" style={{ background:"#f472b6" }} />
      <div className="blob blob2 w-64 h-64 bottom-10 -left-16" style={{ background:"#7c6ff7" }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="w-full max-w-sm z-10">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)" }}>
          ← Back to sign in
        </button>

        <div className="card p-8">
          {!sent ? (
            <>
              <div className="text-center mb-7">
                <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4 text-2xl"
                  style={{ background:"linear-gradient(135deg,#f472b6,#fbbf24)", boxShadow:"0 8px 28px rgba(244,114,182,.4)" }}>✉️</div>
                <h1 className="df text-2xl font-black" style={{ color:"var(--text)" }}>Reset Password</h1>
                <p className="text-sm mt-1" style={{ color:"var(--text2)" }}>We'll email you a reset link</p>
              </div>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color:"var(--text2)" }}>Email address</label>
                  <input className="inp" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                {error && <p className="text-xs rounded-xl px-3 py-2 font-medium" style={{ background:"rgba(248,113,113,.1)", color:"#f87171", border:"1px solid rgba(248,113,113,.2)" }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn w-full justify-center py-3.5 mt-1">
                  {loading ? "Sending…" : "Send Reset Link →"}
                </button>
              </form>
            </>
          ) : (
            <motion.div initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background:"rgba(52,211,153,.15)", border:"2px solid rgba(52,211,153,.4)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="df text-xl font-black mb-2" style={{ color:"var(--text)" }}>Check your inbox!</h2>
              <p className="text-sm mb-1" style={{ color:"var(--text2)" }}>Reset link sent to</p>
              <p className="font-semibold text-sm mb-6" style={{ color:"var(--violet)" }}>{email}</p>
              <button onClick={() => setSent(false)} className="btn w-full justify-center py-3">Try another email</button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}