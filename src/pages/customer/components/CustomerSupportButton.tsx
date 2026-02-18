import React from "react";
import { Headset, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CustomerSupportButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section>
      <button
        onClick={() => navigate("/messages")}
        className="w-full bg-yellow-400 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-yellow-200/50 active:scale-[0.98] transition-all border-4 border-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Headset size={28} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-900 uppercase text-sm leading-none tracking-tight">
              Layanan Chat Bantuan
            </h4>
            <p className="text-[10px] font-bold text-slate-800/60 uppercase mt-1">
              Solusi Cepat Tanya Toko & Kurir
            </p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
          <ChevronRight size={20} className="text-slate-900" />
        </div>
      </button>
    </section>
  );
};
