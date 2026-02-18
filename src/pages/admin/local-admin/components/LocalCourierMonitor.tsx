import React, { useState } from "react";
import { Search, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useCourierMonitor } from "../../../../hooks/useCourierMonitor";
import { CourierCard } from "./CourierCard";

export const LocalCourierMonitor = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { couriers, complaints, loading, fetchData } = useCourierMonitor(
    profile?.managed_market_id,
  );

  const handleQuickChat = (courier: any) => {
    const phone = courier.phone?.replace(/\D/g, "");
    if (!phone) return showToast("Nomor HP tidak valid", "error");

    const isFrozen = (courier.wallet_balance || 0) < 5000;
    let message = `Halo ${courier.name}. `;
    if (isFrozen) {
      message += `Saldo dompetmu kritis (Rp ${courier.wallet_balance?.toLocaleString()}). Mohon segera Top Up agar akun tetap aktif.`;
    } else {
      message += `Ada hal terkait pengiriman wilayah ${profile?.managed_market_name || "Pasar"}.`;
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Sinkronisasi Data Personil...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left pb-20">
      {/* SEKSI ADUAN */}
      {complaints.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-6 shadow-sm border-l-[10px] border-l-orange-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-orange-900 uppercase italic flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={24} /> Aduan
              Pelanggan Aktif
            </h4>
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
                className="bg-white/80 p-4 rounded-2xl text-xs font-bold italic border border-orange-100 shadow-sm"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold shadow-sm focus:ring-2 ring-teal-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* GRID KURIR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCouriers.map((courier, index) => (
          <CourierCard
            key={courier.id}
            courier={courier}
            index={index}
            onChat={handleQuickChat}
          />
        ))}
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
