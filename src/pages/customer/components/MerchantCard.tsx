import React from "react";
import {
  ShieldCheck,
  MapPin,
  Loader2,
  MessageCircle,
  Clock,
} from "lucide-react";

interface Props {
  merchant: any;
  onGoToShop: () => void;
  onContactSeller: () => void;
  chatLoading: boolean;
}

// ⏱️ FUNGSI PENGHITUNG WAKTU MUNDUR (Kapan terakhir online)
const getTimeAgo = (dateString: string) => {
  if (!dateString) return "waktu tidak diketahui";

  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " tahun yang lalu";

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " bulan yang lalu";

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " hari yang lalu";

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " jam yang lalu";

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " menit yang lalu";

  return "Baru saja";
};

export const MerchantCard: React.FC<Props> = ({
  merchant,
  onGoToShop,
  onContactSeller,
  chatLoading,
}) => {
  // 📡 LOGIKA STATUS ONLINE
  // Mengecek is_online atau kapan terakhir update data (last_active)
  const isOnline = merchant?.is_online === true;
  const lastActive =
    merchant?.last_active || merchant?.updated_at || merchant?.created_at;

  return (
    <div className="mt-4 bg-white p-4 md:p-6 md:shadow-sm md:rounded-xl flex items-start md:items-center gap-4 border-y md:border border-slate-100">
      {/* BAGIAN FOTO PROFIL */}
      <div className="relative shrink-0 mt-1 md:mt-0">
        <img
          src={
            merchant?.avatar_url ||
            `https://ui-avatars.com/api/?name=${merchant?.shop_name || "Toko"}&background=008080&color=fff&size=100`
          }
          className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover"
          alt="Merchant"
        />

        {/* Indikator Titik Hijau Mengambang jika toko sedang Online Realtime */}
        {isOnline && (
          <div className="absolute bottom-1 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10"></div>
        )}

        {/* Lencana Verified (Digeser ke Kiri agar tidak menabrak titik online) */}
        {merchant?.is_verified && (
          <div className="absolute -bottom-1 -left-1 bg-white rounded-full p-0.5 z-10 shadow-sm">
            <ShieldCheck size={18} className="text-[#008080]" />
          </div>
        )}
      </div>

      {/* BAGIAN INFO TOKO & TOMBOL */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] md:text-base font-black text-slate-800 uppercase tracking-widest line-clamp-1">
          {merchant?.shop_name || "Toko Pasarqu"}
        </h4>

        <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-1 font-bold">
          <MapPin size={12} className="text-slate-400" />
          <span className="truncate">{merchant?.city || "Area Pasar"}</span>
        </p>

        {/* 🚀 FITUR BARU: Status Terakhir Online */}
        <p className="text-[12px] font-bold flex items-center gap-1.5 mt-0.5">
          {isOnline ? (
            <span className="text-green-600 flex items-center gap-1">
              Aktif Sekarang
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <Clock size={12} /> Aktif {getTimeAgo(lastActive)}
            </span>
          )}
        </p>

        {/* TOMBOL AKSI (Ukuran teks dinaikkan ke 12px) */}
        <div className="flex gap-2 mt-3 w-full">
          <button
            onClick={onGoToShop}
            className="flex-1 md:flex-none px-4 py-2 border-2 border-[#008080] text-[#008080] rounded-lg text-[12px] font-[1000] uppercase hover:bg-teal-50 transition-all active:scale-95 text-center"
          >
            Lihat Toko
          </button>
          <button
            onClick={onContactSeller}
            disabled={chatLoading}
            className="flex-1 md:flex-none px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-[12px] font-[1000] uppercase hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {chatLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MessageCircle size={14} />
            )}
            Chat Penjual
          </button>
        </div>
      </div>
    </div>
  );
};
