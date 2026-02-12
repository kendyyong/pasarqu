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
      let query = supabase
        .from("profiles")
        .select("*, markets(name)")
        .eq("is_verified", false)
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

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(userId);
    try {
      if (action === "APPROVE") {
        const { error } = await supabase
          .from("profiles")
          .update({ is_verified: true })
          .eq("id", userId);

        if (error) throw error;
        showToast("Mitra berhasil disetujui!", "success");
      } else {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (error) throw error;
        showToast("Pendaftaran ditolak & dihapus.", "info");
      }
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                Verifikasi Mitra
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Sistem Approval Pasarqu
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
        <div className="flex flex-wrap gap-2 mb-8 text-left">
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
          <FilterButton
            active={filterRole === "LOCAL_ADMIN"}
            label="Calon Admin"
            onClick={() => setFilterRole("LOCAL_ADMIN")}
            icon={<ShieldCheck size={14} />}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden text-left">
          {loading ? (
            <div className="p-20 text-center">
              <RefreshCw
                className="animate-spin text-teal-600 mx-auto mb-4"
                size={40}
              />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Memuat Antrean...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Antrean Bersih!
              </h3>
              <p className="text-sm text-slate-400">
                Tidak ada pendaftaran mitra baru saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Mitra / Wilayah
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Detail Kontak
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Role
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-white shadow-sm">
                            {req.role === "MERCHANT" ? (
                              <Store size={18} />
                            ) : (
                              <Bike size={18} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              {req.role === "MERCHANT"
                                ? req.shop_name
                                : req.name}
                            </p>
                            <p className="text-[10px] text-teal-600 font-bold flex items-center gap-1">
                              <MapPin size={10} />{" "}
                              {req.markets?.name || "Pasar Tidak Diketahui"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-2 leading-none">
                            <Mail size={12} /> {req.email}
                          </p>
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-2 leading-none">
                            <Smartphone size={12} /> {req.phone_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            req.role === "MERCHANT"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : req.role === "COURIER"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : "bg-purple-50 text-purple-600 border-purple-100"
                          }`}
                        >
                          {req.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req.id, "REJECT")}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req.id, "APPROVE")}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
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
    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active
        ? "bg-slate-900 text-white shadow-lg"
        : "bg-white text-slate-500 border border-slate-200 hover:border-teal-500 hover:text-teal-600"
    }`}
  >
    {icon} {label}
  </button>
);
