// Shared local-date helpers (YYYY-MM-DD in user's local timezone)
// Avoids UTC off-by-one bugs from .toISOString()

export const getLocalTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isDateBeforeToday = (value) => {
  if (!value) return false;
  return String(value) < getLocalTodayStr();
};

// For <input type="date" min=... etc.
export const getLocalTodayInputValue = getLocalTodayStr;
