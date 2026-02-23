import React from "react";
import {
  Trophy,
  MessageCircle,
  Phone,
  Wallet,
  Star,
  Clock,
  ShieldCheck,
  Eye,
  ShieldAlert, // Tambahan icon peringatan
} from "lucide-react";

interface Props {
  courier: any;
  index: number;
  onChat: (c: any) => void;
}

export const CourierCard: React.FC<Props> = ({ courier, index, onChat }) => {
  const isPending = courier.status === "PENDING" || !courier.is_verified;
  const isFrozen = (courier.wallet_balance || 0) < 5000 && !isPending;
  const isTop = index === 0 && courier.total_orders > 0;

  return (
    <div
      className={`bg-white border-2 rounded-xl transition-all relative overflow-hidden flex flex-col shadow-sm ${
        isPending
          ? "border-[#FF6600] bg-orange-50/20"
          : isFrozen
            ? "border-red-400 bg-red-50/30 shadow-red-100 shadow-lg" // Lebih mencolok saat beku
            : "border-slate-100 hover:border-[#008080]"
      }`}
    >
      {/* BADGE TOP */}
      {isTop && (
        <div className="absolute right-0 top-0 bg-yellow-500 text-white px-3 py-1.5 rounded-bl-lg shadow-md flex items-center gap-1 z-10">
          <Trophy size={14} />
          <span className="text-[9px] font-black uppercase">TOP</span>
        </div>
      )}

      {/* BANNER STATUS ATAS */}
      {isPending && (
        <div className="bg-[#FF6600] text-white px-4 py-2 flex items-center gap-2">
          <Clock size={14} className="animate-pulse" />
          <span className="text-[10px] font-black tracking-widest uppercase">
            MENUNGGU VERIFIKASI ANDA
          </span>
        </div>
      )}

      {isFrozen && !isPending && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2">
          <ShieldAlert size={14} className="animate-pulse" />
          <span className="text-[10px] font-black tracking-widest uppercase">
            STATUS: SALDO DIBEKUKAN
          </span>
        </div>
      )}

      <div className="p-5 flex-1">
        {/* IDENTITAS */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-md ${
              isPending
                ? "bg-[#FF6600]"
                : isFrozen
                  ? "bg-red-600"
                  : "bg-slate-900"
            }`}
          >
            {(courier.name || "K").charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-900 text-[14px] uppercase leading-none mb-1">
              {courier.name}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                  isPending
                    ? "bg-orange-100 text-[#FF6600] border-orange-200"
                    : isFrozen
                      ? "bg-red-100 text-red-600 border-red-200"
                      : "bg-teal-100 text-[#008080] border-teal-200"
                }`}
              >
                {isPending ? "PENDAFTAR" : isFrozen ? "DIBEKUKAN" : "AKTIF"}
              </span>
              {!isPending && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-black">
                    {courier.rating || "5.0"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOTAK SALDO & ORDER (DIPERBARUI) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className={`border p-3 rounded-lg flex flex-col justify-center ${
              isFrozen
                ? "bg-red-50 border-red-300 shadow-inner"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <p
              className={`text-[9px] font-black uppercase mb-1 flex items-center gap-1 ${
                isFrozen ? "text-red-500" : "text-slate-400"
              }`}
            >
              <Wallet size={12} /> SALDO KERJA
            </p>
            <p
              className={`text-[13px] font-black ${isFrozen ? "text-red-700 animate-pulse" : "text-slate-900"}`}
            >
              RP {Number(courier.wallet_balance || 0).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col justify-center">
            <p className="text-[9px] font-black text-[#008080] uppercase mb-1">
              TOTAL ORDER
            </p>
            <p className="text-[13px] font-black text-slate-900 uppercase">
              {courier.total_orders || 0} UNIT
            </p>
          </div>
        </div>

        {/* PERINGATAN TAMBAHAN JIKA BEKU */}
        {isFrozen && !isPending && (
          <div className="mb-5 flex items-start gap-2 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-black uppercase leading-tight">
              TIDAK BISA TERIMA ORDER BARU! HUBUNGI KURIR UNTUK SEGERA TOP UP
              SALDO.
            </p>
          </div>
        )}

        {/* STATUS AUDIT DOKUMEN */}
        <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-100 p-2 rounded-lg">
          <ShieldCheck
            size={14}
            className={isPending ? "text-[#FF6600]" : "text-[#008080]"}
          />
          <span className="text-[10px] font-black uppercase">
            {isPending ? "DOKUMEN BELUM DIAUDIT" : "IDENTITAS TERVERIFIKASI"}
          </span>
        </div>
      </div>

      {/* TOMBOL AKSI BAWAH */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
        {isPending ? (
          <button
            onClick={() => onChat(courier)}
            className="w-full py-3 bg-[#008080] text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <Eye size={16} /> LIHAT DATA & VERIFIKASI
          </button>
        ) : (
          <>
            <button
              onClick={() => onChat(courier)}
              className={`flex-[2] py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                isFrozen
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-900 text-white hover:bg-[#008080]"
              }`}
            >
              <MessageCircle size={16} />{" "}
              {isFrozen ? "TEGUR VIA WA" : "CHAT WA"}
            </button>
            <a
              href={`tel:${courier.phone}`}
              className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
            >
              <Phone size={16} />
            </a>
          </>
        )}
      </div>
    </div>
  );
};
