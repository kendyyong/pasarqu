import React from "react";
import { Star, Settings, Wallet } from "lucide-react";

interface CustomerHeaderProps {
  profile: any;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ profile }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white relative overflow-hidden">
      {/* Profil Section */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">
              {profile?.full_name || "Pembeli Satu"}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[8px] md:text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Gold Member
              </span>
              <span className="px-3 py-1 bg-white/10 text-white text-[8px] md:text-[9px] font-black rounded-full uppercase tracking-widest">
                1.250 Poin
              </span>
            </div>
          </div>
        </div>
        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
          <Settings size={20} />
        </button>
      </div>

      {/* Saldo Section */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">
              Saldo Anda
            </p>
            <h3 className="text-2xl font-black tracking-tighter">Rp450.000</h3>
          </div>
        </div>
        <button className="text-[10px] font-black bg-white text-slate-900 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-teal-400 transition-all">
          Top Up
        </button>
      </div>

      {/* Background Decor */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>
  );
};
