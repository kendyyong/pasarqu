import React from "react";
import { Search } from "lucide-react";

interface SearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchInput: React.FC<SearchProps> = ({ value, onChange }) => (
  <div className="relative">
    <Search
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      size={16}
    />
    <input
      type="text"
      placeholder="CARI NAMA BARANG..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-none outline-none focus:border-teal-600 font-black text-[10px] uppercase tracking-widest transition-all"
    />
  </div>
);
