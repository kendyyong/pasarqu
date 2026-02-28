import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  MessageSquare,
  Save,
  ToggleLeft,
  ToggleRight,
  Bot,
  AlertCircle,
  Loader2,
  Store,
  UserCircle,
  Mail,
  LogOut,
  ShieldCheck,
  Settings,
  Camera,
  BadgeCheck,
} from "lucide-react";

interface MerchantSettingsProps {
  merchantProfile: any;
  onUpdate: () => void;
  onLogout: () => void;
}

export const MerchantSettings: React.FC<MerchantSettingsProps> = ({
  merchantProfile,
  onUpdate,
  onLogout,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [autoReply, setAutoReply] = useState({
    enabled: merchantProfile?.is_auto_reply_enabled || false,
    message:
      merchantProfile?.auto_reply_message ||
      "Halo Kak! Mohon maaf toko kami sedang tutup atau sibuk. Silakan tinggalkan pesan, kami akan membalas segera setelah kembali online. Terima kasih!",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("merchants")
        .update({
          is_auto_reply_enabled: autoReply.enabled,
          auto_reply_message: autoReply.message,
        })
        .eq("id", merchantProfile.id);

      if (error) throw error;

      showToast("PENGATURAN BERHASIL DISIMPAN", "success");
      onUpdate();
    } catch (error: any) {
      showToast("GAGAL MENYIMPAN PENGATURAN", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (window.confirm("Yakin ingin keluar dari akun Toko?")) {
      setIsLoggingOut(true);
      try {
        await onLogout();
      } catch (err) {
        showToast("Gagal keluar akun", "error");
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col text-left mb-4 md:mb-8">
        <h2 className="text-xl md:text-2xl font-[1000] text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
          <Settings className="text-[#008080]" /> Pengaturan Toko
        </h2>
        <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
          Kelola fitur otomatisasi dan profil lapak Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* KOLOM KIRI: PROFIL LAPAK & INFO AKUN (NEW PRO LOOK) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              {/* PHOTO PROFILE AREA */}
              <div className="relative group mb-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-slate-900 overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-xl">
                  {merchantProfile?.avatar_url ? (
                    <img
                      src={merchantProfile.avatar_url}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-black">
                      {merchantProfile?.shop_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-[#FF6600] text-white rounded-xl shadow-lg border-4 border-white dark:border-slate-900 active:scale-90 transition-all">
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-[1000] text-slate-800 dark:text-white uppercase tracking-tight">
                  {merchantProfile?.shop_name}
                </h3>
                {merchantProfile?.is_verified && (
                  <BadgeCheck size={20} className="text-[#008080]" />
                )}
              </div>
              <p className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em] bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-full">
                {merchantProfile?.market_name || "MITRA PASAR"}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <UserCircle size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Pemilik Lapak
                  </p>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase truncate">
                    {merchantProfile?.owner_name || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Mail size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Kontak WhatsApp
                  </p>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase truncate">
                    {merchantProfile?.phone_number || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TOMBOL KELUAR (PINDAH KESINI) */}
          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="w-full bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 py-4 rounded-[1.5rem] font-[1000] uppercase text-[11px] tracking-[0.2em] shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2 border border-red-100 dark:border-red-900/30"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <LogOut size={16} /> Keluar dari Akun Toko
              </>
            )}
          </button>
        </div>

        {/* KOLOM KANAN: AUTO REPLY & FITUR PRO */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Bot size={120} className="text-[#008080]" />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-[#008080] rounded-2xl shrink-0">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-[15px] font-black uppercase tracking-tight text-slate-800 dark:text-white">
                  Balas Otomatis
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Asisten Chat saat Anda Offline
                </p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div
                onClick={() =>
                  setAutoReply({ ...autoReply, enabled: !autoReply.enabled })
                }
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${autoReply.enabled ? "bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30" : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"}`}
              >
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                  Fitur Auto-Reply
                </span>
                {autoReply.enabled ? (
                  <div className="flex items-center gap-2 text-[#008080]">
                    <span className="text-[9px] font-black uppercase">
                      Aktif
                    </span>
                    <ToggleRight size={32} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[9px] font-black uppercase">
                      Mati
                    </span>
                    <ToggleLeft size={32} />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Pesan Otomatis Anda
                </label>
                <textarea
                  value={autoReply.message}
                  onChange={(e) =>
                    setAutoReply({ ...autoReply, message: e.target.value })
                  }
                  disabled={!autoReply.enabled}
                  rows={4}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all disabled:opacity-50"
                  placeholder="Tulis pesan ramah..."
                />
                <div className="flex items-center gap-1.5 mt-2 px-2 text-orange-500/80">
                  <AlertCircle size={12} className="shrink-0" />
                  <p className="text-[8px] font-bold uppercase italic leading-tight">
                    Pesan terkirim otomatis saat fitur aktif.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-[#008080] hover:bg-teal-600 disabled:bg-slate-400 text-white py-4 rounded-2xl font-[1000] uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-teal-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 border border-teal-400/30"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Simpan Perubahan <Save size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
