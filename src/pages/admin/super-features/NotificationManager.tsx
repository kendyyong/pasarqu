import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Bell,
  Send,
  Users,
  MapPin,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper"; // <--- Import Helper Audit

export const NotificationManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // State Form
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_role: "ALL",
    target_market_id: "",
  });

  // 1. Fetch Data Awal (Pasar & History)
  const fetchData = async () => {
    try {
      const { data: mData } = await supabase.from("markets").select("id, name");
      setMarkets(mData || []);

      const { data: hData } = await supabase
        .from("broadcasts")
        .select("*, markets(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory(hData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Kirim Broadcast
  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      showToast("Judul dan Pesan wajib diisi!", "error");
      return;
    }

    setLoading(true);
    try {
      // Simpan ke Database
      const payload = {
        title: formData.title,
        message: formData.message,
        target_role: formData.target_role,
        target_market_id: formData.target_market_id || null, // Null jika Global
        status: "SENT",
      };

      const { error } = await supabase.from("broadcasts").insert([payload]);
      if (error) throw error;

      // --- OTOMATIS CATAT KE CCTV (AUDIT LOGS) ---
      await createAuditLog(
        "SEND_BROADCAST",
        "MARKETING",
        `Mengirim broadcast "${formData.title}" kepada target ${formData.target_role}`,
      );

      showToast("Notifikasi berhasil dikirim!", "success");

      setFormData({
        title: "",
        message: "",
        target_role: "ALL",
        target_market_id: "",
      }); // Reset form

      fetchData(); // Refresh history
    } catch (err: any) {
      showToast("Gagal mengirim: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Broadcast Center
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Kirim Notifikasi Massal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: FORMULIR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="space-y-6">
              {/* Target Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Users size={12} /> Target User
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={formData.target_role}
                    onChange={(e) =>
                      setFormData({ ...formData, target_role: e.target.value })
                    }
                  >
                    <option value="ALL">Semua Pengguna</option>
                    <option value="BUYER">Hanya Pembeli</option>
                    <option value="SELLER">Hanya Mitra Toko</option>
                    <option value="COURIER">Hanya Mitra Kurir</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <MapPin size={12} /> Target Wilayah
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={formData.target_market_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_market_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Global (Seluruh Indonesia)</option>
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Konten Pesan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Bell size={12} /> Judul Notifikasi
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Contoh: Promo Gajian Diskon 50%!"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Isi Pesan
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Tulis pesan menarik di sini..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
                <p className="text-[9px] text-slate-400 text-right">
                  {formData.message.length} karakter
                </p>
              </div>

              {/* Tombol Kirim */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-teal-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Kirim Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* RIWAYAT BROADCAST */}
          <div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={16} /> Riwayat Terkirim
            </h3>
            <div className="space-y-3">
              {history.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  Belum ada riwayat.
                </p>
              )}
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {item.message}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                        {item.target_role}
                      </span>
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                        {item.markets?.name || "Global"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-full mb-1">
                      <CheckCircle2 size={10} /> Terkirim
                    </span>
                    <p className="text-[9px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: PREVIEW HP */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800 max-w-[300px] mx-auto relative">
              {/* Notch HP */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

              {/* Layar HP */}
              <div className="bg-slate-100 rounded-[2.5rem] h-[550px] overflow-hidden relative flex flex-col pt-12">
                {/* Status Bar */}
                <div className="px-6 flex justify-between text-[10px] font-bold text-slate-800 mb-4">
                  <span>12:00</span>
                  <div className="flex gap-1">
                    <Smartphone size={10} />
                    <span>100%</span>
                  </div>
                </div>

                {/* Notifikasi Pop-up */}
                <div className="mx-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4 duration-700">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <h4 className="font-bold text-xs text-slate-800">
                          Pasarqu
                        </h4>
                        <span className="text-[9px] text-slate-400">
                          Baru saja
                        </span>
                      </div>
                      <p className="font-bold text-[11px] text-slate-900 mt-1 line-clamp-1">
                        {formData.title || "Judul Notifikasi"}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                        {formData.message ||
                          "Isi pesan notifikasi akan muncul di sini..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Background Wallpaper Dummy */}
                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-teal-100/50 to-transparent pointer-events-none"></div>
              </div>

              {/* Tombol Home */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-700 rounded-full"></div>
            </div>

            <div className="text-center mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Live Mobile Preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
