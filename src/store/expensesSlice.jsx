import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import firebaseAPI from "../api/firebase";

const getUID = () => localStorage.getItem("uid");

// ───────────────── FETCH USER EXPENSES ─────────────────
export const fetchExpenses = createAsyncThunk(
  "expenses/fetch",
  async () => {
    const uid = getUID();

    const res = await firebaseAPI.get(`/expenses/${uid}.json`);
    const data = res.data;

    if (!data) return [];

    return Object.keys(data)
      .map((k) => ({
        id: k,
        ...data[k],
        money: Number(data[k].money) || 0,
      }))
      .reverse();
  }
);

// ───────────────── ADD EXPENSE ─────────────────
export const addExpense = createAsyncThunk(
  "expenses/add",
  async (expense) => {
    const uid = getUID();

    const payload = {
      ...expense,
      money: Number(expense.money) || 0,
    };

    const res = await firebaseAPI.post(
      `/expenses/${uid}.json`,
      payload
    );

    return { id: res.data.name, ...payload };
  }
);

// ───────────────── DELETE EXPENSE ─────────────────
export const deleteExpense = createAsyncThunk(
  "expenses/delete",
  async (id) => {
    const uid = getUID();

    await firebaseAPI.delete(
      `/expenses/${uid}/${id}.json`
    );

    return id;
  }
);

// ───────────────── EDIT EXPENSE ─────────────────
export const editExpense = createAsyncThunk(
  "expenses/edit",
  async ({ id, updatedExpense }) => {
    const uid = getUID();

    const payload = {
      ...updatedExpense,
      money: Number(updatedExpense.money) || 0,
    };

    await firebaseAPI.put(
      `/expenses/${uid}/${id}.json`,
      payload
    );

    return { id, ...payload };
  }
);

// ───────────────── SLICE ─────────────────
const expensesSlice = createSlice({
  name: "expenses",

  initialState: {
    expenseData: [],
    loading: false,
    syncing: false,
  },

  reducers: {
    syncExpenses(state, action) {
      state.expenseData = action.payload;
    },

    setSyncing(state, action) {
      state.syncing = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseData = action.payload;
      })

      .addCase(fetchExpenses.rejected, (state) => {
        state.loading = false;
      })

      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenseData.unshift(action.payload);
      })

      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenseData = state.expenseData.filter(
          (e) => e.id !== action.payload
        );
      })

      .addCase(editExpense.fulfilled, (state, action) => {
        state.expenseData = state.expenseData.map((e) =>
          e.id === action.payload.id
            ? action.payload
            : e
        );
      });
  },
});

export const {
  syncExpenses,
  setSyncing,
} = expensesSlice.actions;

export default expensesSlice.reducer;

// ───────────────── BASE SELECTOR ─────────────────
const selectExpensesState = (s) =>
  s.expenses.expenseData;

// ───────────────── SELECTORS ─────────────────
export const selectAll = createSelector(
  [selectExpensesState],
  (expenses) => expenses
);

export const selectLoading = (s) =>
  s.expenses.loading;

export const selectTotalAmount = createSelector(
  [selectExpensesState],
  (expenses) =>
    expenses.reduce(
      (sum, e) => sum + (Number(e.money) || 0),
      0
    )
);

export const selectByCategory = createSelector(
  [selectExpensesState],
  (expenses) =>
    expenses.reduce((acc, e) => {
      acc[e.category] =
        (acc[e.category] || 0) +
        (Number(e.money) || 0);

      return acc;
    }, {})
);

// ───────────────── MONTHLY TREND ─────────────────
export const selectMonthlyTrend = createSelector(
  [selectExpensesState],
  (expenses) => {
    const map = {};

    expenses.forEach((e) => {
      const d = new Date(
        e.date || Date.now()
      );

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      map[key] =
        (map[key] || 0) +
        (Number(e.money) || 0);
    });

    return Object.entries(map)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .slice(-6)
      .map(([month, total]) => ({
        month: month.slice(5),
        total,
      }));
  }
);

// ───────────────── WEEKLY COMPARISON ─────────────────
export const selectWeeklyComparison =
  createSelector(
    [selectExpensesState],
    (expenses) => {
      const now = new Date();

      return [0, 1, 2, 3]
        .map((w) => {
          const start = new Date(now);
          start.setDate(
            now.getDate() - (w + 1) * 7
          );

          const end = new Date(now);
          end.setDate(
            now.getDate() - w * 7
          );

          const total = expenses
            .filter((e) => {
              const d = new Date(
                e.date || Date.now()
              );

              return (
                d >= start && d < end
              );
            })
            .reduce(
              (sum, e) =>
                sum +
                (Number(e.money) || 0),
              0
            );

          return {
            week:
              w === 0
                ? "This"
                : `W-${w}`,
            total,
          };
        })
        .reverse();
    }
  );

// ───────────────── FORECAST ─────────────────
export const selectForecast =
  createSelector(
    [selectMonthlyTrend],
    (trend) => {
      if (trend.length < 2) return null;

      const n = trend.length;

      const xs = trend.map(
        (_, i) => i
      );

      const ys = trend.map(
        (t) => t.total
      );

      const mx =
        xs.reduce(
          (a, b) => a + b,
          0
        ) / n;

      const my =
        ys.reduce(
          (a, b) => a + b,
          0
        ) / n;

      const numerator =
        xs.reduce(
          (a, x, i) =>
            a +
            (x - mx) *
              (ys[i] - my),
          0
        );

      const denominator =
        xs.reduce(
          (a, x) =>
            a + (x - mx) ** 2,
          0
        );

      const m =
        denominator === 0
          ? 0
          : numerator /
            denominator;

      const b = my - m * mx;

      return Math.round(
        m * n + b
      );
    }
  );