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
  Database,
} from "lucide-react";

interface MerchantProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  shop_name: string | null;
  merchant_badge: string | null;
  is_shop_open: boolean | null;
}

export const AdminMerchantManager = () => {
  const { showToast } = useToast();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchMerchants = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone_number, shop_name, merchant_badge, is_shop_open",
        )
        .not("shop_name", "is", null)
        .order("shop_name", { ascending: true });

      if (error) throw error;
      setMerchants(data || []);
    } catch (err: any) {
      setDbError(err.message || "Gagal sinkronisasi database.");
      showToast("Data gagal dimuat", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleUpdateBadge = async (merchantId: string, newBadge: string) => {
    setUpdatingId(merchantId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ merchant_badge: newBadge })
        .eq("id", merchantId);

      if (error) throw error;
      showToast(`Badge diperbarui ke ${newBadge}`, "success");
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId ? { ...m, merchant_badge: newBadge } : m,
        ),
      );
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
    <div className="w-full space-y-6 animate-in fade-in duration-500">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-[11px] outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all uppercase"
          />
        </div>
        <button
          onClick={fetchMerchants}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#008080] text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-900 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          REFRESH DATA
        </button>
      </div>

      {dbError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-600 font-black text-[10px]">
          <AlertTriangle size={18} /> ERROR: {dbError}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-[#008080]" size={40} />
          <p className="text-[10px] font-black text-slate-400 tracking-[0.3em]">
            MENYINKRONKAN DATABASE...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-[11px] font-black text-slate-300 tracking-widest">
                TIDAK ADA DATA MITRA TOKO
              </p>
            </div>
          ) : (
            filteredMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-teal-50">
                    <Store
                      size={22}
                      className="text-slate-300 group-hover:text-[#008080]"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[13px] font-black text-slate-900 truncate uppercase">
                        {merchant.shop_name}
                      </h3>
                      <BadgePill type={merchant.merchant_badge || "REGULAR"} />
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 tracking-widest">
                      <span className="flex items-center gap-1">
                        <User size={10} /> {merchant.full_name || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {merchant.phone_number || "N/A"}
                      </span>
                      <span
                        className={
                          merchant.is_shop_open
                            ? "text-teal-600"
                            : "text-red-400"
                        }
                      >
                        ● {merchant.is_shop_open ? "BUKA" : "TUTUP"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <select
                    value={merchant.merchant_badge || "REGULAR"}
                    disabled={updatingId === merchant.id}
                    onChange={(e) =>
                      handleUpdateBadge(merchant.id, e.target.value)
                    }
                    className="bg-white border border-slate-200 text-[10px] font-black p-2 rounded-lg outline-none focus:border-[#008080] cursor-pointer min-w-[140px] uppercase"
                  >
                    <option value="REGULAR">⬜ REGULAR</option>
                    <option value="VERIFIED">🟦 VERIFIED</option>
                    <option value="STAR">🟧 STAR SELLER</option>
                    <option value="OFFICIAL">🟪 OFFICIAL</option>
                  </select>
                  {updatingId === merchant.id && (
                    <Loader2
                      className="animate-spin text-[#008080]"
                      size={16}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
