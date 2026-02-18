import React from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  color?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  color = "text-slate-700",
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-100 px-3 py-2 rounded-xl focus-within:bg-white focus-within:border-teal-400 focus-within:ring-4 ring-teal-50 transition-all">
      <span className="text-[9px] font-black text-slate-400 uppercase">Rp</span>
      <input
        type="number"
        defaultValue={value}
        disabled={disabled}
        onBlur={(e) => {
          const val = parseInt(e.target.value);
          onChange(isNaN(val) ? 0 : val);
        }}
        className={`bg-transparent border-none outline-none text-xs font-black w-full ${color} disabled:opacity-50`}
      />
    </div>
  );
};
