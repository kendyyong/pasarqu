import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import {
  Store,
  Search,
  ShieldCheck,
  Star,
  Crown,
  Loader2,
  CheckCircle2,
  Phone,
  User,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Bell,
  BellRing,
  Clock,
} from "lucide-react";

interface MerchantProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  shop_name: string | null;
  merchant_badge: string | null;
  is_shop_open: boolean | null;
  badge_start_date: string | null;
  badge_expiry_date: string | null;
}

export const AdminMerchantManager = () => {
  const { showToast } = useToast();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      // 🚀 Jalankan fungsi pembersihan expired dulu di level database
      await supabase.rpc("handle_expired_merchant_badges");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone_number, shop_name, merchant_badge, is_shop_open, badge_start_date, badge_expiry_date",
        )
        .not("shop_name", "is", null)
        .order("shop_name", { ascending: true });

      if (error) throw error;
      setMerchants(data || []);
    } catch (err: any) {
      showToast("Gagal menyinkronkan data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleUpdateBadge = async (merchantId: string, updates: any) => {
    setUpdatingId(merchantId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", merchantId);

      if (error) throw error;
      showToast(`Data toko berhasil diperbarui`, "success");
      fetchMerchants(); // Refresh data
    } catch (err: any) {
      showToast(`Gagal update: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMerchants = merchants.filter(
    (m) =>
      m.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // LOGIKA ALARM: Cek apakah hari ini sudah melewati tanggal berakhir
  const checkIsExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    return exp < today;
  };

  const BadgePill = ({ type }: { type: string }) => {
    switch (type) {
      case "OFFICIAL":
        return (
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black border border-purple-200">
            <Crown size={10} strokeWidth={3} /> OFFICIAL
          </span>
        );
      case "STAR":
        return (
          <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black border border-orange-200">
            <Star size={10} fill="currentColor" /> STAR
          </span>
        );
      case "VERIFIED":
        return (
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black border border-blue-200">
            <ShieldCheck size={10} strokeWidth={3} /> VERIFIED
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black">
            REGULAR
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="CARI NAMA TOKO / PEMILIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-[11px] outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all uppercase"
          />
        </div>
        <button
          onClick={fetchMerchants}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-900 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          REFRESH DATABASE
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-[#008080]" size={40} />
          <p className="text-[10px] font-black text-slate-400 tracking-[0.3em]">
            MENGANALISA MASA AKTIF TOKO...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMerchants.map((merchant) => {
            const isExpired = checkIsExpired(merchant.badge_expiry_date);

            return (
              <div
                key={merchant.id}
                className={`bg-white border-2 rounded-[1.5rem] p-5 flex flex-col gap-5 transition-all shadow-sm ${isExpired ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}
              >
                {/* BARIS ATAS: INFO TOKO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isExpired ? "bg-red-100 border-red-200 text-red-500" : "bg-teal-50 border-teal-100 text-[#008080]"}`}
                    >
                      <Store size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-black text-slate-900 uppercase leading-none">
                          {merchant.shop_name}
                        </h3>
                        <BadgePill
                          type={merchant.merchant_badge || "REGULAR"}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 tracking-widest">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {merchant.full_name || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {merchant.phone_number || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STATUS BADGE SELECTOR */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 w-full md:w-auto shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 pl-2">
                      STATUS:
                    </span>
                    <select
                      value={merchant.merchant_badge || "REGULAR"}
                      disabled={updatingId === merchant.id}
                      onChange={(e) =>
                        handleUpdateBadge(merchant.id, {
                          merchant_badge: e.target.value,
                        })
                      }
                      className="bg-slate-50 border-none text-[10px] font-black p-2 rounded-lg min-w-[140px] uppercase outline-none focus:ring-2 focus:ring-[#008080]/20"
                    >
                      <option value="REGULAR">⬜ REGULAR</option>
                      <option value="VERIFIED">🟦 VERIFIED</option>
                      <option value="STAR">🟧 STAR SELLER</option>
                      <option value="OFFICIAL">🟪 OFFICIAL</option>
                    </select>
                  </div>
                </div>

                {/* BARIS BAWAH: PENGATURAN TANGGAL & ALARM */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  {/* TANGGAL MULAI */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> TANGGAL MULAI KONTRAK
                    </label>
                    <input
                      type="date"
                      value={merchant.badge_start_date || ""}
                      onChange={(e) =>
                        handleUpdateBadge(merchant.id, {
                          badge_start_date: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-[11px] font-black outline-none focus:border-[#008080]"
                    />
                  </div>

                  {/* TANGGAL BERAKHIR */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 tracking-widest flex items-center gap-1">
                      <Clock size={10} /> TANGGAL BERAKHIR KONTRAK
                    </label>
                    <input
                      type="date"
                      value={merchant.badge_expiry_date || ""}
                      onChange={(e) =>
                        handleUpdateBadge(merchant.id, {
                          badge_expiry_date: e.target.value,
                        })
                      }
                      className={`w-full border p-2.5 rounded-xl text-[11px] font-black outline-none transition-all ${isExpired ? "bg-red-50 border-red-500 text-red-600" : "bg-white border-slate-200 focus:border-[#008080]"}`}
                    />
                  </div>

                  {/* KOLOM ALARM */}
                  <div className="flex items-end">
                    {isExpired ? (
                      <div className="w-full bg-red-600 text-white p-2.5 rounded-xl flex items-center justify-center gap-3 animate-pulse shadow-lg shadow-red-900/20">
                        <BellRing size={16} />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          MASA AKTIF HABIS!
                        </span>
                      </div>
                    ) : merchant.badge_expiry_date ? (
                      <div className="w-full bg-teal-50 text-[#008080] p-2.5 rounded-xl flex items-center justify-center gap-3 border border-teal-100">
                        <Bell size={16} />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          STATUS AKTIF
                        </span>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-50 text-slate-400 p-2.5 rounded-xl flex items-center justify-center gap-3 border border-dashed border-slate-200">
                        <span className="text-[10px] font-black tracking-widest uppercase italic">
                          TANGGAL BELUM DISET
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
