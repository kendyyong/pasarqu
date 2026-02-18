import React from "react";

// --- 1. THEME HELPER (BAWAAN JURAGAN) ---
export const getTheme = (darkMode: boolean) => ({
  bg: darkMode ? "bg-slate-950" : "bg-slate-50",
  text: darkMode ? "text-slate-100" : "text-slate-900",
  subText: darkMode ? "text-slate-400" : "text-slate-500",
  border: darkMode ? "border-slate-800" : "border-slate-200", // Tambahan border agar sinkron
  card: darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200",
  input: darkMode
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
  sidebar: darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200",
  accent: "text-indigo-500",
  accentLight: darkMode
    ? "bg-indigo-500/10 text-indigo-400"
    : "bg-indigo-50 text-indigo-600",
  hover: darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50",
});

// --- 2. KOMPONEN BARU (YANG DIBUTUHKAN USERMANAGER) ---

export const Badge = ({ children, variant = "teal" }: any) => {
  const variants: any = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${variants[variant] || variants.teal}`}
    >
      {children}
    </span>
  );
};

export const Card = ({ children, theme, className = "" }: any) => (
  <div
    className={`rounded-[2rem] border shadow-sm transition-all duration-300 ${theme.card} ${className}`}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: any) => {
  const variants: any = {
    primary:
      "bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-slate-900/20",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- 3. KOMPONEN ASLI JURAGAN (DIPERTAHANKAN) ---

export const Input = ({
  label,
  val,
  set,
  type = "text",
  readOnly = false,
  theme,
  placeholder,
}: any) => (
  <div>
    <label
      className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block ${theme.subText}`}
    >
      {label}
    </label>
    <input
      type={type}
      value={val}
      onChange={(e) => set(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all ${theme.input}`}
    />
  </div>
);

export const SidebarItem = ({
  icon,
  label,
  active,
  onClick,
  theme,
  count,
  isAlert,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all font-bold text-xs uppercase tracking-wider group ${active ? theme.accentLight : `text-slate-500 ${theme.hover}`}`}
  >
    {icon}
    <span className={active ? "" : "group-hover:text-slate-500"}>{label}</span>
    {count > 0 && (
      <span
        className={`ml-auto text-white text-[10px] px-2 py-0.5 rounded-lg ${isAlert ? "bg-red-500 animate-pulse" : "bg-indigo-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

export const StatCard = ({ label, value, icon, theme, darkMode }: any) => (
  <div className={`p-6 rounded-[2.5rem] border shadow-sm ${theme.card}`}>
    <div
      className={`p-4 rounded-2xl w-fit mb-4 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
    >
      {icon}
    </div>
    <h3 className="text-3xl font-black mb-1">{value}</h3>
    <p
      className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText}`}
    >
      {label}
    </p>
  </div>
);

export const TabButton = ({
  label,
  icon,
  count,
  active,
  onClick,
  theme,
  color,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${active ? `${color} text-white shadow-lg` : `${theme.subText} hover:bg-slate-800 hover:text-white`}`}
  >
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
      {icon} {label}
    </div>
    <span className={`text-[10px] px-2 py-0.5 rounded bg-black/20 text-white`}>
      {count}
    </span>
  </button>
);

export const TabAudit = ({ label, icon, count, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full p-6 rounded-[2rem] flex items-center justify-between transition-all ${active ? "bg-indigo-600 text-white shadow-xl scale-105" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"}`}
  >
    <div className="flex items-center gap-4 font-black text-xs uppercase tracking-widest">
      {icon} {label}
    </div>
    <span
      className={`text-[10px] font-black px-3 py-1 rounded-lg ${active ? "bg-black/20" : "bg-slate-100 text-slate-400"}`}
    >
      {count}
    </span>
  </button>
);
