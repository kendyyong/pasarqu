import React from "react";

// --- KOMPONEN MENU ICON (Navigasi Utama) ---
interface MenuIconProps {
  icon: React.ReactElement;
  label: string;
  color: string;
  badge?: string | number; // Tambahan: Untuk notifikasi
  onClick?: () => void;
}

export const MenuIcon: React.FC<MenuIconProps> = ({
  icon,
  label,
  color,
  badge,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer group p-1 active:scale-95 transition-all"
  >
    <div
      className={`w-12 h-12 md:w-14 md:h-14 ${color} rounded-xl flex items-center justify-center text-white shadow-sm relative transition-all group-hover:shadow-lg group-hover:-translate-y-1`}
    >
      {/* Icon dengan ukuran yang pas */}
      {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}

      {/* Badge Notifikasi jika ada */}
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm">
          {badge}
        </div>
      )}
    </div>

    <span className="text-[10px] font-black text-slate-500 text-center uppercase tracking-tighter leading-none w-full px-1 group-hover:text-teal-600 transition-colors">
      {label}
    </span>
  </div>
);

// --- KOMPONEN PROMO BOX (Kotak Aksi Cepat) ---
interface PromoBoxProps {
  icon: React.ReactElement;
  label: string;
  color: string;
  description?: string; // Tambahan: Agar lebih luas informasinya
  onClick?: () => void;
}

export const PromoBox: React.FC<PromoBoxProps> = ({
  onClick,
  icon,
  label,
  color,
  description,
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl p-4 flex flex-col items-start justify-center border border-slate-100 shadow-sm transition-all cursor-pointer active:scale-95 hover:shadow-xl hover:border-teal-100 group`}
  >
    <div
      className={`mb-3 p-2 rounded-lg ${color} text-white shadow-md group-hover:scale-110 transition-transform`}
    >
      {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
    </div>

    <div className="text-left">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 block">
        {label}
      </span>
      {description && (
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block mt-0.5">
          {description}
        </span>
      )}
    </div>
  </div>
);
