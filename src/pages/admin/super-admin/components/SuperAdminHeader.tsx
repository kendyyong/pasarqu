import React from "react";
import { Zap, Sun, Moon, Bell } from "lucide-react";

interface Props {
  activeTab: string;
  isDark: boolean;
  toggleTheme: () => void;
  theme: any;
  complaintsCount: number;
  profile: any;
}

export const SuperAdminHeader: React.FC<Props> = ({
  activeTab,
  isDark,
  toggleTheme,
  theme,
  complaintsCount,
  profile,
}) => {
  return (
    <header
      className={`h-16 ${theme.header} backdrop-blur-md border-b ${theme.border} flex items-center justify-between px-8 sticky top-0 z-40 transition-all`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 ${isDark ? "bg-teal-500/10" : "bg-teal-50"} rounded-lg`}
        >
          <Zap size={16} className="text-teal-500" />
        </div>
        <h2
          className={`text-[10px] font-black ${theme.subText} uppercase tracking-[0.3em]`}
        >
          System OS /{" "}
          <span className="text-teal-500">{activeTab.replace("-", " ")}</span>
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 p-2 px-3 rounded-2xl border ${theme.border} ${theme.card} shadow-sm transition-all hover:scale-105 active:scale-95 text-teal-500`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isDark ? "Light" : "Dark"}
          </span>
        </button>
        <div className={`h-6 w-[1px] ${theme.border}`}></div>
        <button className="relative text-slate-400 hover:text-teal-500 transition-colors">
          <Bell size={20} />
          {complaintsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
        <div className="flex items-center gap-3 pl-5 border-l border-white/5">
          <div className="text-right hidden md:block text-nowrap">
            <p
              className={`text-xs font-black tracking-tight leading-none ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {profile?.full_name || "MASTER ADMIN"}
            </p>
            <p className="text-[8px] text-teal-500 font-bold uppercase mt-1">
              Super User
            </p>
          </div>
          <div
            className={`w-9 h-9 ${isDark ? "bg-slate-800" : "bg-slate-900"} text-white rounded-xl flex items-center justify-center font-black shadow-lg uppercase`}
          >
            {(profile?.full_name || "S").charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
