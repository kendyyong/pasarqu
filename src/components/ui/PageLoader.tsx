import React from "react";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  bgClass?: string;
  colorClass?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  bgClass = "bg-slate-50",
  colorClass = "text-teal-600",
}) => {
  return (
    <div
      className={`h-screen w-full flex flex-col items-center justify-center ${bgClass} transition-colors duration-500`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute w-16 h-16 border-4 border-t-transparent ${colorClass} opacity-20 rounded-full animate-spin`}
        ></div>
        <Loader2 className={`animate-spin ${colorClass}`} size={40} />
      </div>
      <p
        className={`mt-4 text-[10px] font-black uppercase tracking-[0.3em] ${colorClass} animate-pulse`}
      >
        Loading System...
      </p>
    </div>
  );
};
