import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Store,
  Bike,
  ShieldCheck,
  User,
  Filter,
  RefreshCw,
  ChevronRight,
  Mail,
  Smartphone,
  MapPin,
} from "lucide-react";

export const AdminApprovalPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Kita ambil user yang statusnya PENDING atau is_verified false
      let query = supabase
        .from("profiles")
        .select("*, markets(name)")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (filterRole !== "ALL") {
        query = query.eq("role", filterRole);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterRole]);

  // --- LOGIKA APPROVE SAKTI (SINKRONISASI TABEL) ---
  const handleAction = async (user: any, action: "APPROVE" | "REJECT") => {
    setProcessingId(user.id);
    try {
      if (action === "APPROVE") {
        // 1. Update Tabel Profiles (Kunci Pintu Masuk)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            is_verified: true,
            status: "APPROVED",
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // 2. Buat/Update Tabel Operasional (Isi Perabotan Dashboard)
        if (user.role === "MERCHANT") {
          // Masukkan ke tabel merchants
          const { error: mError } = await supabase.from("merchants").upsert({
            user_id: user.id,
            shop_name: user.shop_name || user.full_name || "Toko Baru",
            name: user.full_name || user.shop_name || "Pemilik Toko",
            market_id: user.managed_market_id,
            status: "APPROVED",
            is_active: true,
            is_shop_open: true,
          });
          if (mError) console.error("Gagal buat data merchant:", mError);
        } else if (user.role === "COURIER") {
          // Masukkan ke tabel couriers
          const { error: cError } = await supabase.from("couriers").upsert({
            user_id: user.id,
            full_name: user.full_name,
            market_id: user.managed_market_id,
            status: "APPROVED",
            is_active: true,
          });
          if (cError) console.error("Gagal buat data kurir:", cError);
        }

        showToast(`Akses ${user.role} Berhasil Diaktifkan!`, "success");
      } else {
        // Jika REJECT: Ubah status jadi REJECTED (Jangan langsung delete agar ada history)
        const { error } = await supabase
          .from("profiles")
          .update({ status: "REJECTED" })
          .eq("id", user.id);

        if (error) throw error;
        showToast("Pendaftaran ditolak.", "info");
      }

      // Hapus dari list antrean di layar
      setRequests((prev) => prev.filter((r) => r.id !== user.id));
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-left">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">
                Verifikasi Mitra
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Pusat Kendali Approval Pasarqu
              </p>
            </div>
          </div>

          <button
            onClick={fetchRequests}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-all"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto p-6">
        <div className="flex flex-wrap gap-2 mb-8">
          <FilterButton
            active={filterRole === "ALL"}
            label="Semua"
            onClick={() => setFilterRole("ALL")}
          />
          <FilterButton
            active={filterRole === "MERCHANT"}
            label="Calon Toko"
            onClick={() => setFilterRole("MERCHANT")}
            icon={<Store size={14} />}
          />
          <FilterButton
            active={filterRole === "COURIER"}
            label="Calon Kurir"
            onClick={() => setFilterRole("COURIER")}
            icon={<Bike size={14} />}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <RefreshCw
                className="animate-spin text-teal-600 mx-auto mb-4"
                size={40}
              />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Mensinkronkan Data...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase italic">
                Antrean Bersih!
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Tidak ada pendaftaran baru yang menunggu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Mitra / Wilayah
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Role
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                      Aksi Validasi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                            {req.role === "MERCHANT" ? (
                              <Store size={20} />
                            ) : (
                              <Bike size={20} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              {req.role === "MERCHANT"
                                ? req.shop_name
                                : req.full_name || req.name}
                            </p>
                            <p className="text-[10px] text-teal-600 font-black uppercase flex items-center gap-1 mt-1">
                              <MapPin size={10} />{" "}
                              {req.markets?.name || "Wilayah Belum Diset"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            req.role === "MERCHANT"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                        >
                          {req.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req, "REJECT")}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <XCircle size={22} />
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req, "APPROVE")}
                            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            SETUJUI MITRA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const FilterButton = ({ active, label, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active
        ? "bg-slate-900 text-white shadow-lg"
        : "bg-white text-slate-400 border border-slate-200 hover:border-teal-500 hover:text-teal-600"
    }`}
  >
    {icon} {label}
  </button>
);
