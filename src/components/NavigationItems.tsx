import React from "react";

// --- KOMPONEN MENU ICON (Untuk Grid Utama) ---
interface MenuIconProps {
  icon: React.ReactElement;
  label: string;
  color: string;
  onClick?: () => void;
}

export const MenuIcon: React.FC<MenuIconProps> = ({
  icon,
  label,
  color,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-1 cursor-pointer group p-1 active:scale-95 transition-transform"
  >
    <div
      className={`w-10 h-10 md:w-11 md:h-11 ${color} rounded-[14px] flex items-center justify-center text-white shadow-sm transition-all group-hover:shadow-md`}
    >
      {/* Mengatur ukuran icon otomatis */}
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <span className="text-[10px] text-slate-600 text-center font-medium leading-tight truncate w-full px-1">
      {label}
    </span>
  </div>
);

// --- KOMPONEN PROMO BOX (Untuk 3 Kotak di Bawah Grid) ---
interface PromoBoxProps {
  icon: React.ReactElement;
  label: string;
  color: string;
  borderColor?: string;
  onClick?: () => void;
}

export const PromoBox: React.FC<PromoBoxProps> = ({
  onClick,
  icon,
  label,
  color,
  borderColor,
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-lg p-2 flex flex-col items-center justify-center ${color} border border-slate-100 shadow-sm ${borderColor || ""} transition-all cursor-pointer active:scale-95 hover:shadow-md`}
  >
    <div className="mb-1">{React.cloneElement(icon, { size: 16 })}</div>
    <span className="text-[9px] font-bold uppercase tracking-tight">
      {label}
    </span>
  </div>
);
