import React, { useState } from "react";
import { ShieldCheck, Store, Bike, RefreshCw, CheckCircle } from "lucide-react";

// --- LOGIC & COMPONENTS ---
// Memanggil Hook Logika yang dipisah (Pastikan hook ini sudah menggunakan filter managed_market_id)
import { useAdminApproval } from "../../../hooks/useAdminApproval";
// Memanggil Baris Tabel yang dipisah
import { ApprovalTableRow } from "../components/ApprovalTableRow";

export const AdminApprovalPage: React.FC = () => {
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // Panggil semua state dan fungsi dari Hook
  // Hook ini sekarang akan secara otomatis menyaring data berdasarkan pasar yang dikelola Admin
  const { loading, requests, processingId, fetchRequests, handleAction } =
    useAdminApproval(filterRole);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-left">
      {/* --- HEADER --- */}
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

          <div className="flex items-center gap-4">
            {/* Indikator Status Koneksi/Wilayah */}
            <div className="hidden md:block text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Mode Akses
              </p>
              <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-teal-100">
                Admin Lokal Wilayah
              </span>
            </div>

            <button
              onClick={fetchRequests}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto p-6">
        {/* --- TAB FILTERS --- */}
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

        {/* --- MAIN DATA CONTAINER --- */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <RefreshCw
                className="animate-spin text-teal-600 mx-auto mb-4"
                size={40}
              />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Mensinkronkan Data Wilayah...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase italic">
                Antrean Bersih!
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Tidak ada pendaftaran baru di wilayah Anda saat ini.
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
                    <ApprovalTableRow
                      key={req.id}
                      request={req}
                      processingId={processingId}
                      onAction={handleAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <p className="mt-6 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Sistem Verifikasi Otomatis &copy; PasarKu 2026
        </p>
      </main>
    </div>
  );
};

// --- INTERNAL UI COMPONENTS ---
const FilterButton = ({ active, label, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
      active
        ? "bg-slate-900 text-white shadow-lg"
        : "bg-white text-slate-400 border border-slate-200 hover:border-teal-500 hover:text-teal-600"
    }`}
  >
    {icon} {label}
  </button>
);

export default AdminApprovalPage;
