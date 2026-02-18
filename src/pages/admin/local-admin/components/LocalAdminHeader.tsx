import React from "react";
import { Volume2, VolumeX, RefreshCw } from "lucide-react";

interface Props {
  isAlarmActive: boolean;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  onRefresh: () => void;
  adminName: string;
}

export const LocalAdminHeader: React.FC<Props> = ({
  isAlarmActive,
  isMuted,
  setIsMuted,
  onRefresh,
  adminName,
}) => {
  return (
    <header
      className={`h-20 flex items-center justify-between px-10 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-colors ${isAlarmActive ? "bg-red-600 text-white border-none" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full ${isAlarmActive ? "bg-white animate-ping" : "bg-teal-500 animate-pulse"}`}
        ></div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
          Sistem Area:{" "}
          <span
            className={isAlarmActive ? "text-white underline" : "text-teal-600"}
          >
            {isAlarmActive ? "PERLU TINDAKAN" : "NORMAL"}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-5">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${isAlarmActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={onRefresh}
          className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:rotate-180 transition-all duration-500"
        >
          <RefreshCw size={18} />
        </button>
        <div
          className={`px-4 py-1.5 rounded-2xl border font-black text-[10px] uppercase ${isAlarmActive ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-100 text-slate-800"}`}
        >
          {adminName}
        </div>
      </div>
    </header>
  );
};
