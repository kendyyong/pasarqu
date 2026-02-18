// src/pages/courier/components/CourierHeader.tsx
import React from "react";

interface Props {
  isOnline: boolean;
  name: string;
  marketName: string;
  initial: string;
}

export const CourierHeader: React.FC<Props> = ({
  isOnline,
  name,
  marketName,
  initial,
}) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
        ></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Status:{" "}
          <span className={isOnline ? "text-green-600" : "text-red-600"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black text-slate-800 uppercase">
            {name}
          </p>
          <p className="text-[8px] font-bold text-teal-600 uppercase mt-1">
            {marketName}
          </p>
        </div>
        <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg uppercase">
          {initial}
        </div>
      </div>
    </header>
  );
};
