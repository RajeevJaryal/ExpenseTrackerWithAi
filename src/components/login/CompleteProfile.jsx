import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Fetch existing user data
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
        if (!res.ok) throw new Error(data.error?.message);

        const u = data.users[0];

        if (u.displayName) setName(u.displayName);
        if (u.photoUrl) {
          setPhoto(u.photoUrl);
          setPreview(u.photoUrl);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    };

    load();
  }, []);

  // 🔹 Submit update
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: token,
            displayName: name,
            photoUrl: photo,
            returnSecureToken: true,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md">

        <button onClick={() => navigate("/dashboard")}>
          ← Back
        </button>

        <div className="card p-8">

          {/* Avatar */}
          <div className="text-center mb-6">
            {preview ? (
              <img src={preview} className="w-20 h-20 rounded-full mx-auto" />
            ) : (
              <div className="text-4xl">👤</div>
            )}
          </div>

          {fetching ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={submit}>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="inp mb-3"
                required
              />

              <input
                type="url"
                value={photo}
                onChange={(e) => {
                  setPhoto(e.target.value);
                  setPreview(e.target.value);
                }}
                placeholder="Photo URL"
                className="inp mb-3"
                required
              />

              {error && <p style={{ color: "red" }}>{error}</p>}
              {success && <p style={{ color: "green" }}>Updated!</p>}

              <button disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </button>

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}