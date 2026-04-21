import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, signUpUser, clearError } from "../../store/AuthReducer";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../api/firebase1"; // adjust path
export default function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const [mode, setMode] = useState("login"); // login | signup
  const [showPw, setShowPw] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const emailRef = useRef();
  const passRef = useRef();
  const email2Ref = useRef();
  const pass2Ref = useRef();
  const confirm2Ref = useRef();

  const switchMode = (m) => {
    setMode(m);
    setLocalErr("");
    dispatch(clearError());
  };

  const submit = (e) => {
    e.preventDefault();
    setLocalErr("");
    if (mode === "login") {
      dispatch(
        loginUser({
          email: emailRef.current.value,
          password: passRef.current.value,
        }),
      )
        .unwrap()
        .then(() => navigate("/dashboard"))
        .catch(setLocalErr);
    } else {
      if (pass2Ref.current.value !== confirm2Ref.current.value)
        return setLocalErr("Passwords don't match");
      dispatch(
        signUpUser({
          email: email2Ref.current.value,
          password: pass2Ref.current.value,
        }),
      )
        .unwrap()
        .then(() => {
          switchMode("login");
        })
        .catch(setLocalErr);
    }
  };
 const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const token = await user.getIdToken();

    const payload = {
      idToken: token,
      email: user.email,
      localId: user.uid,
      emailVerified: user.emailVerified,
    };

    // 🔥 IMPORTANT: update redux using same reducer logic
    dispatch(loginUser.fulfilled(payload));

    navigate("/dashboard");
  } catch (error) {
    console.error(error);
    setLocalErr("Google login failed");
  }
};

  const errMsg = localErr || error;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Blobs */}
      <div
        className="blob w-[500px] h-[500px] -top-32 -left-32"
        style={{ background: "#7c6ff7" }}
      />
      <div
        className="blob blob2 w-96 h-96 -bottom-24 -right-24"
        style={{ background: "#f472b6" }}
      />
      <div
        className="blob blob3 w-72 h-72 top-1/2 left-1/2"
        style={{ background: "#22d3ee", opacity: 0.07 }}
      />

      <div className="w-full max-w-[420px] z-10">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex w-16 h-16 rounded-3xl btn items-center justify-center mb-4"
            style={{
              padding: 0,
              boxShadow: "0 12px 40px rgba(124,111,247,.5)",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          </div>
          <h1
            className="df text-3xl font-black tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Fin<span className="gt">AI</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
            Your AI-powered financial assistant
          </p>
        </motion.div>

        {/* Mode tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex rounded-2xl p-1 mb-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === m ? "var(--grad)" : "transparent",
                color: mode === m ? "#fff" : "var(--text2)",
                boxShadow:
                  mode === m ? "0 4px 16px rgba(124,111,247,.4)" : "none",
              }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-7"
        >
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={submit}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-4"
            >
              {mode === "login" ? (
                <>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "var(--text2)" }}
                    >
                      Email
                    </label>
                    <input
                      className="inp"
                      type="email"
                      ref={emailRef}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label
                        className="text-xs font-semibold"
                        style={{ color: "var(--text2)" }}
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-xs font-semibold"
                        style={{
                          color: "var(--violet)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        className="inp pr-10"
                        type={showPw ? "text" : "password"}
                        ref={passRef}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text3)",
                        }}
                      >
                        {showPw ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "var(--text2)" }}
                    >
                      Email
                    </label>
                    <input
                      className="inp"
                      type="email"
                      ref={email2Ref}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "var(--text2)" }}
                    >
                      Password
                    </label>
                    <input
                      className="inp"
                      type="password"
                      ref={pass2Ref}
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "var(--text2)" }}
                    >
                      Confirm Password
                    </label>
                    <input
                      className="inp"
                      type="password"
                      ref={confirm2Ref}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </>
              )}

              {errMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs rounded-xl px-3 py-2.5 font-medium"
                  style={{
                    background: "rgba(248,113,113,.1)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,.2)",
                  }}
                >
                  {errMsg}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn w-full justify-center mt-1 py-3.5"
              >
                {loading ? (
                  <>
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
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>{" "}
                    Please wait…
                  </>
                ) : mode === "login" ? (
                  "Sign in →"
                ) : (
                  "Create Account →"
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
            <span className="text-xs" style={{ color: "var(--text3)" }}>
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
          </div>

          {/* Google Sign-in */}
          <button
          type="button"
            onClick={handleGoogleLogin}
            className="btn-ghost w-full flex items-center justify-center gap-3 py-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}
