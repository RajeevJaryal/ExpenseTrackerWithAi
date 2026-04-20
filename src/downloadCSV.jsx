export function downloadCSV(expenses) {
  const header = "Amount,Description,Category,Date\n";
  const rows   = expenses.map(e =>
    `${e.money},"${e.description}",${e.category},${e.date || ""}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `expenses-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export const CATEGORY_META = {
  Food:          { icon: "🍔", color: "#fbbf24", bg: "rgba(251,191,36,.15)"  },
  Petrol:        { icon: "⛽", color: "#22d3ee", bg: "rgba(34,211,238,.15)"  },
  Salary:        { icon: "💼", color: "#34d399", bg: "rgba(52,211,153,.15)"  },
  Travel:        { icon: "✈️", color: "#a78bfa", bg: "rgba(167,139,250,.15)" },
  Entertainment: { icon: "🎬", color: "#f472b6", bg: "rgba(244,114,182,.15)" },
  Shopping:      { icon: "🛍️", color: "#7c6ff7", bg: "rgba(124,111,247,.15)" },
  Health:        { icon: "💊", color: "#34d399", bg: "rgba(52,211,153,.15)"  },
  Bills:         { icon: "📄", color: "#f87171", bg: "rgba(248,113,113,.15)" },
  Education:     { icon: "📚", color: "#60a5fa", bg: "rgba(96,165,250,.15)"  },
  Other:         { icon: "✨", color: "#c084fc", bg: "rgba(192,132,252,.15)" },
};

export const getCat = (label) => CATEGORY_META[label] || CATEGORY_META.Other;

export const formatINR = (n) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];