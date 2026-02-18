import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  Wallet,
  Search,
  Loader2,
  ShieldAlert,
  Phone,
  Trophy,
  TrendingUp,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export const LocalCourierMonitor = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    const marketId = profile?.managed_market_id;
    if (!marketId) return;

    setLoading(true);
    try {
      // 1. Ambil Data Kurir & Hitung Order
      const { data: courierData, error: courierError } = await supabase
        .from("profiles")
        .select(
          `
          *,
          orders:orders!courier_id(count) 
        `,
        )
        .eq("role", "COURIER")
        .eq("managed_market_id", marketId);

      if (courierError) throw courierError;

      // 2. Ambil Data Komplain (Try-catch internal agar tidak crash jika tabel belum ada)
      try {
        const { data: complaintData, error: compError } = await supabase
          .from("complaints")
          .select("*")
          .eq("market_id", marketId)
          .eq("status", "OPEN");

        if (!compError) {
          setComplaints(complaintData || []);
        }
      } catch (e) {
        // Jika tabel complaints tidak ada, biarkan state tetap kosong
        console.log("Tabel complaints belum tersedia di database.");
      }

      // Transformasi & Sort
      const formatted = courierData
        .map((c: any) => ({
          ...c,
          total_orders: c.orders?.[0]?.count || 0,
        }))
        .sort((a, b) => b.total_orders - a.total_orders);

      setCouriers(formatted);
    } catch (err: any) {
      console.error("Monitor Error:", err.message);
      showToast("Gagal memuat data personil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.managed_market_id]);

  // FITUR CHAT WA CEPAT
  const handleQuickChat = (courier: any) => {
    const phone = courier.phone?.replace(/\D/g, "");
    if (!phone) return showToast("Nomor HP tidak valid", "error");

    const isFrozen = (courier.wallet_balance || 0) < 5000;
    let message = `Halo ${courier.name}. `;

    if (isFrozen) {
      message += `Saldo dompetmu kritis (Rp ${courier.wallet_balance?.toLocaleString()}). Mohon segera Top Up di Admin agar akun tetap aktif.`;
    } else {
      message += `Ada hal yang ingin saya tanyakan terkait pengiriman wilayah ${profile?.managed_market_name || "Pasar"}.`;
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const filteredCouriers = couriers.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Sinkronisasi Data Personil...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left pb-20">
      {/* SEKSI ADUAN (Hanya muncul jika ada data) */}
      {complaints.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-6 shadow-sm border-l-[10px] border-l-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={24} />
              <h4 className="text-sm font-black text-orange-900 uppercase italic">
                Aduan Pelanggan Aktif
              </h4>
            </div>
            <button
              onClick={fetchData}
              className="text-orange-600 hover:rotate-180 transition-all duration-700"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="space-y-2">
            {complaints.map((comp) => (
              <div
                key={comp.id}
                className="bg-white/80 p-4 rounded-2xl text-xs font-bold text-slate-700 italic border border-orange-100 shadow-sm"
              >
                "{comp.description}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">
            Personnel <span className="text-teal-600">Ops Center</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Wilayah: {profile?.managed_market_name || "Pasar Lokal"}
          </p>
        </div>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari nama kurir..."
            className="bg-white border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold shadow-sm focus:ring-2 ring-teal-500 outline-none w-full md:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* GRID KURIR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCouriers.map((courier, index) => {
          const isFrozen = (courier.wallet_balance || 0) < 5000;
          const isTop = index === 0 && courier.total_orders > 0;

          return (
            <div
              key={courier.id}
              className={`bg-white p-6 rounded-[2.5rem] border transition-all relative overflow-hidden ${isFrozen ? "border-red-200 bg-red-50/30 shadow-lg shadow-red-100/30" : "border-slate-100 shadow-sm hover:shadow-xl"}`}
            >
              {isTop && (
                <div className="absolute -right-1 -top-1 bg-yellow-400 text-white p-4 rounded-bl-[2rem] shadow-lg">
                  <Trophy size={16} />
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${isFrozen ? "bg-red-500 shadow-lg shadow-red-200" : "bg-slate-800 shadow-lg"}`}
                >
                  {(courier.name || "K").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase leading-none mb-1">
                    {courier.name}
                  </h4>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${isFrozen ? "bg-red-600 text-white animate-pulse" : "bg-teal-500 text-white"}`}
                  >
                    {isFrozen ? "FROZEN" : "ACTIVE"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white border border-slate-50 p-4 rounded-3xl shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                    Saldo
                  </p>
                  <p
                    className={`text-xs font-black ${isFrozen ? "text-red-600" : "text-slate-800"}`}
                  >
                    Rp{" "}
                    {Number(courier.wallet_balance || 0).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>
                <div className="bg-white border border-slate-50 p-4 rounded-3xl shadow-sm">
                  <p className="text-[8px] font-black text-teal-600 uppercase mb-1">
                    Performa
                  </p>
                  <p className="text-xs font-black text-slate-800 uppercase">
                    {courier.total_orders} Order
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickChat(courier)}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isFrozen ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                >
                  <MessageCircle size={16} /> Chat WA
                </button>
                <a
                  href={`tel:${courier.phone}`}
                  className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCouriers.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
            Tidak ada personil ditemukan
          </p>
        </div>
      )}
    </div>
  );
};
