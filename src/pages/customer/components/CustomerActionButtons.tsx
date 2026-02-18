import React from "react";
import { useNavigate } from "react-router-dom";

interface ActionButtonsProps {
  onLogout: () => void;
}

export const CustomerActionButtons: React.FC<ActionButtonsProps> = ({
  onLogout,
}) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <button
        onClick={() => navigate("/")}
        className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-teal-100 active:scale-95 transition-all"
      >
        Mulai Belanja Lagi
      </button>
      <button
        onClick={onLogout}
        className="w-full py-5 bg-white text-red-500 border border-red-100 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] active:scale-95 transition-all"
      >
        Keluar Aplikasi
      </button>
    </div>
  );
};
