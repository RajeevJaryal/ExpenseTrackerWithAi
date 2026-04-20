import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export default function CompleteProfile() {
  const navigate  = useNavigate();
  const nameRef   = useRef();
  const photoRef  = useRef();
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState("");

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setFetching(false); return; }
      try {
        const res  = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
          method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ idToken: token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message);
        const u = data.users[0];
        if (nameRef.current && u.displayName)  nameRef.current.value = u.displayName;
        if (photoRef.current && u.photoUrl) { photoRef.current.value = u.photoUrl; setPreview(u.photoUrl); }
      } catch (e) { setError(e.message); }
      finally { setFetching(false); }
    };
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setSuccess(false);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ idToken: token, displayName: nameRef.current.value, photoUrl: photoRef.current.value, returnSecureToken: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background:"var(--bg)" }}>
      <div className="blob w-80 h-80 -top-16 -right-12" style={{ background:"#7c6ff7" }} />
      <div className="blob blob2 w-64 h-64 bottom-10 -left-16" style={{ background:"#22d3ee" }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md z-10">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm mb-6"
          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)" }}>
          ← Back to dashboard
        </button>

        <div className="card p-8">
          <div className="flex flex-col items-center mb-7">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background:"var(--surface2)", border:"2px solid rgba(124,111,247,.4)" }}>
                {preview
                  ? <img src={preview} alt="avatar" className="w-full h-full object-cover" onError={()=>setPreview("")} />
                  : <span className="text-3xl">👤</span>
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full btn flex items-center justify-center" style={{ padding:0, fontSize:12 }}>✏️</div>
            </div>
            <h1 className="df text-2xl font-black" style={{ color:"var(--text)" }}>Your Profile</h1>
            <p className="text-sm mt-1" style={{ color:"var(--text2)" }}>Update your display name and photo</p>
          </div>

          {fetching ? (
            <div className="flex justify-center py-8">
              <svg className="spin w-8 h-8" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(124,111,247,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="var(--violet)" strokeWidth="3" strokeLinecap="round"/></svg>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"var(--text2)" }}>Full Name</label>
                <input className="inp" type="text" ref={nameRef} placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:"var(--text2)" }}>Profile Photo URL</label>
                <input className="inp" type="url" ref={photoRef} placeholder="https://..." required onChange={e=>setPreview(e.target.value)} />
                <p className="text-xs mt-1.5" style={{ color:"var(--text3)" }}>Paste a direct image URL to preview above</p>
              </div>

              {error   && <p className="text-xs rounded-xl px-3 py-2.5 font-medium" style={{ background:"rgba(248,113,113,.1)", color:"#f87171", border:"1px solid rgba(248,113,113,.2)" }}>{error}</p>}
              {success && <p className="text-xs rounded-xl px-3 py-2.5 font-medium flex items-center gap-2" style={{ background:"rgba(52,211,153,.1)", color:"#34d399", border:"1px solid rgba(52,211,153,.2)" }}>✅ Profile updated!</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => navigate("/dashboard")} className="btn-ghost flex-1 py-3.5 text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn flex-1 justify-center py-3.5">
                  {loading ? "Updating…" : "Update Profile →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}