import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  Bell,
  Megaphone,
  Package,
  Tag,
  Clock,
  ChevronLeft,
  Inbox,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CustomerNotifications: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    // Pastikan menggunakan profile.managed_market_id untuk memfilter wilayah
    if (!profile?.managed_market_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // MENGAMBIL NOTIFIKASI KHUSUS WILAYAH CUSTOMER
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`market_id.eq.${profile.managed_market_id},type.eq.GLOBAL`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  const getIcon = (type: string) => {
    switch (type) {
      case "BROADCAST":
        return <Megaphone className="text-orange-500" size={20} />;
      case "ORDER":
        return <Package className="text-teal-600" size={20} />;
      case "PROMO":
        return <Tag className="text-pink-500" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 text-left font-sans">
      {/* HEADER - MODE SHOPEE TEAL */}
      <div className="bg-white px-6 py-6 sticky top-0 z-50 flex items-center gap-4 border-b border-slate-100 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Kotak Masuk
          </h1>
          <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
            Notifikasi & Info Wilayah
          </p>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-teal-600" size={32} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-50">
              <Inbox className="text-slate-200" size={48} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Belum Ada Pesan
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">
              Info promo dan wilayah akan muncul di sini
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-5 transition-all active:scale-[0.97] cursor-pointer ${
                !notif.is_read ? "ring-2 ring-teal-500/10" : ""
              }`}
            >
              {/* ICON WRAPPER */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                  notif.type === "BROADCAST" ? "bg-orange-50" : "bg-teal-50"
                }`}
              >
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate pr-2">
                    {notif.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                    <Clock size={10} />{" "}
                    {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {notif.content}
                </p>

                {notif.type === "BROADCAST" && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1 h-1 bg-teal-500 rounded-full animate-ping"></div>
                    <span className="text-[8px] font-black text-teal-600 uppercase tracking-[0.2em]">
                      Pesan Resmi Admin Wilayah
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* FOOTER INFO */}
      {!loading && notifications.length > 0 && (
        <div className="px-10 mt-12 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-loose">
            Sistem Notifikasi Pasarqu v2.0
            <br />
            Terhubung ke Radar Wilayah {profile?.markets?.name}
          </p>
        </div>
      )}
    </div>
  );
};
