// src/pages/courier/components/CourierVerification.tsx
import React from "react";
import { ShieldCheck } from "lucide-react";

interface Props {
  marketName: string;
  onLogout: () => void;
}

export const CourierVerification: React.FC<Props> = ({
  marketName,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-center">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-xl">
        <ShieldCheck
          size={40}
          className="text-teal-600 animate-pulse mx-auto mb-4"
        />
        <h1 className="text-2xl font-black text-slate-800 uppercase">
          Verifikasi Akun
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Menunggu persetujuan Admin {marketName}.
        </p>
        <div className="mt-8 space-y-3">
          <button
            onClick={() => window.open("https://wa.me/628123456789")}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Hubungi Admin
          </button>
          <button
            onClick={onLogout}
            className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
