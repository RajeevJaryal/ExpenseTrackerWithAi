import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

// ───────────────── LOGIN ─────────────────
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(
          data.error?.message || "Login failed"
        );
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ───────────────── SIGNUP ─────────────────
export const signUpUser = createAsyncThunk(
  "auth/signup",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(
          data.error?.message || "Signup failed"
        );
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ───────────────── VERIFY EMAIL ─────────────────
export const verifyEmail = createAsyncThunk(
  "auth/verify",
  async (token, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken: token,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return rejectWithValue(
          data.error?.message || "Verification failed"
        );
      }

      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ───────────────── SAVE USER ─────────────────
const saveUser = (payload) => {
  localStorage.setItem("token", payload.idToken);
  localStorage.setItem("email", payload.email);
  localStorage.setItem("uid", payload.localId);
  localStorage.setItem(
    "verified",
    payload.emailVerified || false
  );
};

// ───────────────── SLICE ─────────────────
const authSlice = createSlice({
  name: "auth",

  initialState: {
    token: localStorage.getItem("token") || null,
    email: localStorage.getItem("email") || null,
    uid: localStorage.getItem("uid") || null,
    isVerified:
      localStorage.getItem("verified") === "true",

    loading: false,
    error: null,
  },

  reducers: {
    logout(state) {
      state.token = null;
      state.email = null;
      state.uid = null;
      state.isVerified = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("uid");
      localStorage.removeItem("verified");
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.token = action.payload.idToken;
        state.email = action.payload.email;
        state.uid = action.payload.localId;
        state.isVerified =
          action.payload.emailVerified;

        saveUser(action.payload);
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SIGNUP
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;

        state.token = action.payload.idToken;
        state.email = action.payload.email;
        state.uid = action.payload.localId;
        state.isVerified = false;

        saveUser(action.payload);
      })

      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // VERIFY EMAIL
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
      })

      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } =
  authSlice.actions;

export default authSlice.reducer;