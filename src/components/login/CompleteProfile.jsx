import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [name, setName]       = useState("");
  const [photo, setPhoto]     = useState("");
  const [preview, setPreview] = useState("");
  const [email, setEmail]     = useState("");
  const [initials, setInitials] = useState("U");

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast]       = useState({ msg: "", type: "" });
  const [imgError, setImgError] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ── Fetch existing user data ──
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setFetching(false);
        return;
      }

      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to load profile");

        const u = data.users?.[0];
        if (!u) throw new Error("No user found");

        if (u.displayName) setName(u.displayName);
        if (u.email) {
          setEmail(u.email);
          setInitials(u.email[0].toUpperCase());
        }
        if (u.photoUrl) {
          setPhoto(u.photoUrl);
          setPreview(u.photoUrl);
        }
      } catch (e) {
        showToast(e.message || "Could not load profile", "error");
      } finally {
        setFetching(false);
      }
    };

    load();
  }, []);

  // ── Update initials when name changes ──
  useEffect(() => {
    if (name.trim()) {
      setInitials(
        name
          .trim()
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      );
    } else if (email) {
      setInitials(email[0].toUpperCase());
    }
  }, [name, email]);

  // ── Submit update ──
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: token,
            displayName: name.trim(),
            photoUrl: photo.trim() || "",
            returnSecureToken: true,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Update failed");

      // Persist new token if returned
      if (data.idToken) localStorage.setItem("token", data.idToken);

      showToast("✅ Profile updated successfully!", "success");
    } catch (e) {
      showToast(e.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (val) => {
    setPhoto(val);
    setImgError(false);
    setPreview(val);
  };

  const clearPhoto = () => {
    setPhoto("");
    setPreview("");
    setImgError(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* NAV */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 h-14 border-b backdrop-blur-lg"
        style={{
          background: "rgba(8,8,16,.85)",
          borderColor: "var(--border)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "var(--text2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text2)")}
        >
          ← Dashboard
        </button>

        <span
          className="font-bold text-sm"
          style={{ color: "var(--text)" }}
        >
          👤 Profile
        </span>

        <div className="w-24" />
      </nav>

      {/* TOAST */}
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10, x: "-50%" }}
            className="fixed top-4 left-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl"
            style={{
              background: "var(--surface)",
              border: `1px solid ${toast.type === "error" ? "rgba(248,113,113,.35)" : "rgba(52,211,153,.35)"}`,
              color: toast.type === "error" ? "#f87171" : "#34d399",
              whiteSpace: "nowrap",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >

          {/* AVATAR CARD */}
          <div
            className="card p-6 mb-4 flex flex-col items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg,rgba(124,111,247,.07),rgba(244,114,182,.05))",
              border: "1px solid rgba(124,111,247,.2)",
            }}
          >
            {/* Avatar */}
            <motion.div
              key={preview && !imgError ? "img" : "initials"}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              {preview && !imgError ? (
                <img
                  src={preview}
                  alt="Avatar"
                  onError={() => setImgError(true)}
                  className="w-20 h-20 rounded-full object-cover ring-2"
                  style={{ ringColor: "var(--violet)" ,
                    border: "2px solid rgba(124,111,247,.5)",
                  }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black btn"
                  style={{ padding: 0 }}
                >
                  {initials}
                </div>
              )}

              {/* Online dot */}
              <span
                className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2"
                style={{
                  background: "#34d399",
                  borderColor: "var(--bg)",
                }}
              />
            </motion.div>

            {/* Name + email */}
            <div className="text-center">
              <p
                className="font-black text-base leading-tight"
                style={{ color: "var(--text)" }}
              >
                {name || "Your Name"}
              </p>
              {email && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* FORM CARD */}
          <div className="card p-5 md:p-6">
            <h2
              className="font-black text-sm mb-5"
              style={{ color: "var(--text)" }}
            >
              Edit Profile
            </h2>

            {fetching ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <svg
                  className="spin w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="rgba(124,111,247,.3)"
                    strokeWidth="3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="var(--violet)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-xs" style={{ color: "var(--text3)" }}>
                  Loading profile…
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">

                {/* Display Name */}
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text2)" }}
                  >
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="inp w-full"
                    required
                    maxLength={50}
                  />
                </div>

                {/* Email (read-only) */}
                {email && (
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "var(--text2)" }}
                    >
                      Email
                    </label>
                    <div
                      className="inp w-full flex items-center gap-2 cursor-not-allowed select-none"
                      style={{ opacity: 0.55 }}
                    >
                      <span className="text-sm" style={{ color: "var(--text)" }}>
                        {email}
                      </span>
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-md font-semibold"
                        style={{
                          background: "rgba(124,111,247,.15)",
                          color: "var(--violet2)",
                        }}
                      >
                        read-only
                      </span>
                    </div>
                  </div>
                )}

                {/* Photo URL */}
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text2)" }}
                  >
                    Photo URL{" "}
                    <span style={{ color: "var(--text3)", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={photo}
                      onChange={(e) => handlePhotoChange(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="inp flex-1"
                    />
                    {photo && (
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="px-3 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                        style={{
                          background: "rgba(248,113,113,.1)",
                          color: "#f87171",
                          border: "1px solid rgba(248,113,113,.2)",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {imgError && preview && (
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: "#f87171" }}
                    >
                      ⚠️ Image failed to load — check the URL
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                  style={{
                    background:
                      loading || !name.trim()
                        ? "var(--surface2)"
                        : "var(--grad)",
                    color: loading || !name.trim() ? "var(--text3)" : "#fff",
                    border: "none",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(255,255,255,.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Updating…
                    </span>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Danger zone */}
          <div
            className="card p-4 mt-4"
            style={{
              border: "1px solid rgba(248,113,113,.2)",
              background: "rgba(248,113,113,.04)",
            }}
          >
            <p
              className="text-xs font-bold mb-3"
              style={{ color: "#f87171" }}
            >
              Danger Zone
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "rgba(248,113,113,.08)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,.2)",
              }}
            >
              🚪 Sign Out
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}