import React from "react";
import { Plus } from "lucide-react";

interface HeaderProps {
  onAdd: () => void;
}

export const HeaderSection: React.FC<HeaderProps> = ({ onAdd }) => (
  <div className="bg-slate-900 p-5 border-b-4 border-teal-600 flex justify-between items-center rounded-none shadow-md">
    <div className="text-left">
      <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">
        Etalase Saya
      </h2>
      <p className="text-[8px] font-bold text-teal-500 uppercase tracking-[0.2em] mt-1">
        Management System
      </p>
    </div>
    <button
      onClick={onAdd}
      className="bg-teal-600 text-white px-4 py-2 rounded-none font-black text-[10px] uppercase flex items-center gap-2 hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
    >
      <Plus size={14} strokeWidth={3} /> Tambah Barang
    </button>
  </div>
);
