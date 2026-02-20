import React, { useState } from "react";
import {
  Shield,
  Store,
  Truck,
  Users,
  Eye,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export const MarketAuditFullView = ({ market, allUsers }: any) => {
  const [subTab, setSubTab] = useState<
    "ADMIN" | "MERCHANT" | "COURIER" | "BUYER"
  >("ADMIN");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const filtered = allUsers.filter(
    (u: any) => u.managed_market_id === market.id,
  );

  // --- AI REASON GENERATOR (BAHASA PROFESIONAL) ---
  const generateAIReason = (type: "FRAUD" | "KINERJA" | "KEAMANAN") => {
    const reasons = {
      FRAUD:
        "Terdeteksi adanya indikasi manipulasi data transaksi dan penyalahgunaan wewenang yang merugikan ekosistem operasional wilayah.",
      KINERJA:
        "Laporan audit menunjukkan performa manajemen di bawah standar minimum operasional yang telah ditetapkan secara konsisten.",
      KEAMANAN:
        "Ditemukan pelanggaran protokol keamanan data atau aktivitas akses mencurigakan yang mengancam integritas sistem wilayah.",
    };
    setSuspendReason(reasons[type]);
  };

  const getActiveList = () => {
    let list = [];
    if (subTab === "ADMIN")
      list = filtered.filter((u: any) => u.role.includes("ADMIN"));
    else if (subTab === "MERCHANT")
      list = filtered.filter((u: any) => u.role === "MERCHANT");
    else if (subTab === "COURIER")
      list = filtered.filter((u: any) => u.role === "COURIER");
    else list = filtered.filter((u: any) => u.role === "CUSTOMER");

    return list.filter(
      (u: any) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number?.includes(searchTerm),
    );
  };

  const activeList = getActiveList();

  const handleToggleStatus = (user: any) => {
    if (user.status !== "SUSPEND" && !suspendReason) {
      alert("HARAP MASUKKAN ALASAN SUSPEND TERLEBIH DAHULU!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      user.status = user.status === "SUSPEND" ? "ACTIVE" : "SUSPEND";
      user.suspend_note = user.status === "SUSPEND" ? suspendReason : "";
      setLoading(false);
      setSuspendReason("");
      setSelectedUser({ ...user });
    }, 1000);
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-2 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      {/* SIDEBAR NAVIGASI */}
      <div className="w-full lg:w-72 flex flex-col gap-1 shrink-0">
        {[
          {
            id: "ADMIN",
            label: "ADMIN WILAYAH",
            icon: Shield,
            count: filtered.filter((u: any) => u.role.includes("ADMIN")).length,
          },
          {
            id: "MERCHANT",
            label: "MERCHANT TOKO",
            icon: Store,
            count: filtered.filter((u: any) => u.role === "MERCHANT").length,
          },
          {
            id: "COURIER",
            label: "KURIR PASAR",
            icon: Truck,
            count: filtered.filter((u: any) => u.role === "COURIER").length,
          },
          {
            id: "BUYER",
            label: "WARGA / PEMBELI",
            icon: Users,
            count: filtered.filter((u: any) => u.role === "CUSTOMER").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`w-full flex items-center justify-between p-3 rounded-md border ${subTab === tab.id ? "bg-[#008080] text-white border-[#008080]" : "bg-white text-slate-400 border-slate-100"}`}
          >
            <div className="flex items-center gap-3">
              <tab.icon size={18} />
              <span className="text-[12px] font-black">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* LIST DATA */}
      <div className="flex-1 bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-2">
          <h3 className="font-black text-[12px] text-slate-800 tracking-widest">
            DATABASE {subTab}
          </h3>
          <input
            type="text"
            placeholder="CARI NAMA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-200 py-2 px-3 rounded-md text-[11px] outline-none focus:border-[#008080] font-black"
          />
        </div>

        <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 overflow-y-auto no-scrollbar max-h-[70vh]">
          {activeList.map((u: any) => (
            <div
              key={u.id}
              className="p-3 bg-slate-50 rounded-md border border-slate-100 flex justify-between items-center group hover:bg-white transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-white ${u.status === "SUSPEND" ? "bg-red-500" : "bg-[#008080]"}`}
                >
                  {u.name[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-[12px] leading-none mb-1">
                    {u.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-black ${u.status === "SUSPEND" ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-600"}`}
                    >
                      {u.status === "SUSPEND" ? "SUSPEND" : "AKTIF"}
                    </span>
                    <p className="text-[10px] text-[#FF6600] font-black">
                      {u.phone_number || "NO PHONE"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(u)}
                className="p-2.5 bg-white text-slate-400 rounded-md border border-slate-100 hover:text-[#008080] hover:border-[#008080] shadow-sm transition-all"
              >
                <Eye size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETAIL & KONTROL SUSPEND DENGAN AI */}
      {selectedUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 uppercase tracking-tighter">
          <div
            className={`bg-white w-full max-w-md rounded-md shadow-2xl overflow-hidden border-t-8 ${selectedUser.status === "SUSPEND" ? "border-red-500" : "border-[#008080]"}`}
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[12px] font-black text-slate-900">
                MANAJEMEN AKUN {subTab}
              </h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSuspendReason("");
                }}
                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 text-white rounded-lg flex items-center justify-center text-2xl font-black ${selectedUser.status === "SUSPEND" ? "bg-red-500" : "bg-[#008080]"}`}
                >
                  {selectedUser.name[0]}
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-slate-900 leading-none">
                    {selectedUser.name}
                  </h2>
                  <p
                    className={`text-[10px] mt-2 font-black flex items-center gap-1 tracking-widest ${selectedUser.status === "SUSPEND" ? "text-red-600" : "text-teal-600"}`}
                  >
                    {selectedUser.status === "SUSPEND" ? (
                      <AlertOctagon size={12} />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    STATUS:{" "}
                    {selectedUser.status === "SUSPEND"
                      ? "TERBLOKIR (SUSPEND)"
                      : "AKTIF"}
                  </p>
                </div>
              </div>

              {/* AREA FORM SUSPEND / CATATAN AI */}
              {selectedUser.status !== "SUSPEND" ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400">
                      ALASAN PENANGGUHAN (AUDIT)
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => generateAIReason("FRAUD")}
                        className="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Sparkles size={10} /> FRAUD
                      </button>
                      <button
                        onClick={() => generateAIReason("KINERJA")}
                        className="text-[8px] bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1 hover:bg-orange-600 hover:text-white transition-all"
                      >
                        <Sparkles size={10} /> KINERJA
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] font-bold outline-none focus:border-red-500 transition-all normal-case min-h-[80px] resize-none"
                    placeholder="Tulis alasan atau gunakan tombol bantuan AI di atas..."
                  />
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-md border border-red-100 space-y-1">
                  <p className="text-[9px] font-black text-red-400 uppercase">
                    CATATAN AUDIT:
                  </p>
                  <p className="text-[12px] font-bold text-red-700 leading-tight normal-case italic">
                    "
                    {selectedUser.suspend_note ||
                      "Pelanggaran kebijakan operasional wilayah."}
                    "
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-1.5 text-[12px]">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                  <Mail size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-600 lowercase">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-md border border-orange-100">
                  <Phone size={16} className="text-[#FF6600]" />
                  <span className="font-black text-[#FF6600]">
                    {selectedUser.phone_number || "TIDAK ADA NOMOR"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSuspendReason("");
                }}
                className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-md text-[11px] font-black hover:bg-slate-300"
              >
                BATAL
              </button>
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={loading}
                className={`flex-1 py-3 rounded-md text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedUser.status === "SUSPEND"
                    ? "bg-[#008080] text-white hover:bg-teal-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : selectedUser.status === "SUSPEND" ? (
                  "AKTIFKAN LAGI"
                ) : (
                  "SUSPEND SEKARANG"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
