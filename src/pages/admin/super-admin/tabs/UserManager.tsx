import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  User,
  Store,
  Truck,
  MoreVertical,
  Users,
  MapPin,
  ChevronDown,
  FileText,
  Ban,
  Crown,
  ShieldCheck,
  X,
  RefreshCcw,
  CheckCircle2,
  ShoppingBag,
  Wallet,
  Calendar,
} from "lucide-react";
import { generateOfficialPDF } from "../../../../utils/pdfGenerator";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

interface UserManagerProps {
  allUsers: any[];
  theme: any;
}

export const UserManager: React.FC<UserManagerProps> = ({
  allUsers,
  theme,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ALL" | "CUSTOMER" | "MERCHANT" | "COURIER"
  >("ALL");
  const [selectedMarket, setSelectedMarket] = useState("GLOBAL");

  // --- STATE UNTUK PELANTIKAN ADMIN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbMarkets, setDbMarkets] = useState<any[]>([]);

  // --- STATE UNTUK DETAIL PROFIL (TITIK TIGA) ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<any>(null);

  useEffect(() => {
    const fetchDbMarkets = async () => {
      const { data } = await supabase
        .from("markets")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (data) setDbMarkets(data);
    };
    fetchDbMarkets();
  }, []);

  const marketList = useMemo(() => {
    const markets = allUsers
      .map((u) => u.markets?.name)
      .filter((name): name is string => !!name);
    return ["GLOBAL", ...Array.from(new Set(markets))];
  }, [allUsers]);

  const dataByMarket = useMemo(() => {
    if (selectedMarket === "GLOBAL") return allUsers;
    return allUsers.filter((u) => u.markets?.name === selectedMarket);
  }, [allUsers, selectedMarket]);

  const counts = useMemo(
    () => ({
      all: dataByMarket.length,
      customer: dataByMarket.filter(
        (u) => u.role === "USER" || u.role === "CUSTOMER",
      ).length,
      merchant: dataByMarket.filter((u) => u.role === "MERCHANT").length,
      courier: dataByMarket.filter(
        (u) => u.role === "COURIER" || u.role === "DRIVER",
      ).length,
    }),
    [dataByMarket],
  );

  const filteredData = useMemo(() => {
    return dataByMarket.filter((u) => {
      const nameMatch = (u.full_name || u.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const emailMatch = (u.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      if (activeTab === "ALL") return matchesSearch;
      if (activeTab === "CUSTOMER")
        return matchesSearch && (u.role === "USER" || u.role === "CUSTOMER");
      if (activeTab === "MERCHANT")
        return matchesSearch && u.role === "MERCHANT";
      if (activeTab === "COURIER")
        return matchesSearch && (u.role === "COURIER" || u.role === "DRIVER");
      return matchesSearch;
    });
  }, [dataByMarket, searchTerm, activeTab]);

  const handleExportPDF = async () => {
    const headers = [
      ["NO", "NAMA LENGKAP", "EMAIL", "ROLE", "WILAYAH", "SALDO"],
    ];
    const rows = filteredData.map((u, index) => [
      index + 1,
      (u.full_name || u.name || "-").toUpperCase(),
      u.email,
      u.role,
      u.markets?.name || "NASIONAL",
      `Rp ${(u.wallet_balance || 0).toLocaleString("id-ID")}`,
    ]);

    await generateOfficialPDF(
      "Laporan Data Pengguna Sistem",
      `Kategori: ${activeTab} | Wilayah: ${selectedMarket}`,
      headers,
      rows,
      `Laporan_User_${selectedMarket}`,
    );
  };

  const openAppointModal = (user: any) => {
    setSelectedUser(user);
    setSelectedMarketId(user.managed_market_id || "");
    setIsModalOpen(true);
  };

  const handleAppointAdmin = async () => {
    if (!selectedMarketId) {
      showToast("PILIH PASAR TERLEBIH DAHULU!", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: "LOCAL_ADMIN",
          managed_market_id: selectedMarketId,
          status: "APPROVED",
        })
        .eq("id", selectedUser.id);
      if (error) throw error;
      showToast("PELANTIKAN ADMIN BERHASIL!", "success");
      setIsModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      showToast("GAGAL MELANTIK: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNGSI BUKA DETAIL PROFIL ---
  const openUserDetail = (user: any) => {
    setViewUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-3xl">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="CARI NAMA / EMAIL / ROLE..."
              className="w-full bg-white border border-slate-200 py-2.5 pl-11 pr-4 rounded-xl text-[12px] outline-none focus:border-[#008080] font-black shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative min-w-[200px]">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6600]"
              size={16}
            />
            <select
              className="w-full bg-white border border-slate-200 py-2.5 pl-11 pr-10 rounded-xl text-[12px] outline-none focus:border-[#008080] appearance-none cursor-pointer font-black shadow-sm"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              {marketList.map((m) => (
                <option key={m} value={m}>
                  {m === "GLOBAL" ? "SEMUA WILAYAH (GLOBAL)" : m}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          className="bg-[#008080] text-white border-none px-6 py-2.5 rounded-xl flex items-center gap-2 text-[12px] hover:bg-slate-900 shadow-md transition-all font-black shrink-0"
        >
          <FileText size={16} /> PRINT PDF RESMI
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "ALL", label: "SEMUA", count: counts.all, icon: Users },
          {
            id: "CUSTOMER",
            label: "PEMBELI",
            count: counts.customer,
            icon: User,
          },
          {
            id: "MERCHANT",
            label: "TOKO",
            count: counts.merchant,
            icon: Store,
          },
          { id: "COURIER", label: "KURIR", count: counts.courier, icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#008080] text-white shadow-md shadow-teal-900/20"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} />
            <span className="text-[12px]">{tab.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-lg font-sans ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* COMPACT TABLE */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black">
                <th className="py-3 px-4 text-left">NAMA & EMAIL</th>
                <th className="py-3 px-4 text-left">ROLE</th>
                <th className="py-3 px-4 text-left">WILAYAH / PASAR</th>
                <th className="py-3 px-4 text-right">SALDO DOMPET</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-teal-50/40 transition-all group"
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 font-black ${
                          user.role === "MERCHANT"
                            ? "bg-blue-500"
                            : user.role === "COURIER" || user.role === "DRIVER"
                              ? "bg-[#FF6600]"
                              : user.role === "LOCAL_ADMIN"
                                ? "bg-purple-600"
                                : "bg-[#008080]"
                        }`}
                      >
                        {(user.full_name || user.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 font-black">
                        <span className="text-slate-900 truncate leading-tight flex items-center gap-1.5">
                          {user.full_name || user.name || "GUEST"}
                          {user.role === "LOCAL_ADMIN" && (
                            <Crown size={12} className="text-orange-500" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold lowercase">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 font-black">
                      <MapPin size={12} className="text-[#FF6600]" />
                      <span className="truncate max-w-[150px]">
                        {user.markets?.name || "NASIONAL"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-sans font-black text-slate-900 bg-slate-50/30">
                    RP {(user.wallet_balance || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <div className="flex justify-center gap-1 transition-all">
                      {user.role !== "SUPER_ADMIN" && (
                        <button
                          onClick={() => openAppointModal(user)}
                          title="Lantik Menjadi Admin Pasar"
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Crown size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Blokir User"
                      >
                        <Ban size={14} />
                      </button>
                      {/* 🚀 TOMBOL TITIK TIGA DIHUBUNGKAN KE FUNGSI DETAIL */}
                      <button
                        onClick={() => openUserDetail(user)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-[#008080] rounded-lg transition-colors"
                        title="Lihat Profil Lengkap"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 1. MODAL PELANTIKAN ADMIN --- */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden scale-in-center font-black uppercase tracking-tighter">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-[12px] text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-[#FF6600]" size={16} /> OTORISASI
                KEPALA PASAR
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-orange-100 text-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-sm">
                  <Crown size={24} />
                </div>
                <h4 className="text-[16px] text-slate-900">
                  {selectedUser.full_name || selectedUser.name}
                </h4>
                <p className="text-[10px] text-slate-400 lowercase font-medium tracking-normal font-sans">
                  {selectedUser.email}
                </p>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[9px] text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Store size={12} /> PILIH WILAYAH KEKUASAAN (PASAR)
                </label>
                <select
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[11px] outline-none focus:border-[#008080] cursor-pointer transition-colors font-black"
                >
                  <option value="" disabled>
                    -- PILIH PASAR --
                  </option>
                  {dbMarkets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-left">
                <p className="text-[9px] text-[#FF6600] leading-relaxed tracking-wider">
                  DENGAN MENYIMPAN INI, PENGGUNA AKAN MEMILIKI AKSES PENUH KE
                  DASHBOARD ADMIN LOKAL UNTUK PASAR YANG DIPILIH.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 text-[10px] text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={handleAppointAdmin}
                disabled={isSubmitting || !selectedMarketId}
                className="flex-1 py-2.5 bg-[#008080] hover:bg-slate-900 text-white text-[10px] rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCcw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}{" "}
                SAHKAN ADMIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. MODAL PROFIL LENGKAP (FITUR BARU) --- */}
      {isDetailModalOpen && viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden scale-in-center font-black uppercase tracking-tighter flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-[12px] text-slate-900 flex items-center gap-2">
                <User className="text-[#008080]" size={16} /> PROFIL LENGKAP
                PENGGUNA
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white rounded-md border border-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Konten Profil (Bisa di-scroll jika panjang) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* Seksi 1: Header Profil Singkat */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 font-black shadow-md ${
                    viewUser.role === "MERCHANT"
                      ? "bg-blue-500"
                      : viewUser.role === "COURIER" ||
                          viewUser.role === "DRIVER"
                        ? "bg-[#FF6600]"
                        : "bg-[#008080]"
                  }`}
                >
                  {(viewUser.full_name || viewUser.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg text-slate-900 leading-none mb-1">
                    {viewUser.full_name ||
                      viewUser.name ||
                      "PENGGUNA TANPA NAMA"}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-sans font-bold lowercase tracking-normal">
                    {viewUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-white text-[#008080] border border-[#008080]/30 shadow-sm">
                      {viewUser.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black shadow-sm ${viewUser.status === "APPROVED" ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-200 text-slate-600 border border-slate-300"}`}
                    >
                      {viewUser.status || "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Grid Informasi Lanjutan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Info Lokasi / Pasar */}
                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3">
                  <h4 className="text-[10px] text-slate-400 flex items-center gap-2 tracking-[0.1em] border-b pb-2">
                    <MapPin size={14} className="text-[#FF6600]" /> LOKASI &
                    PASAR
                  </h4>
                  <div>
                    <p className="text-[9px] text-slate-400 tracking-widest mb-0.5">
                      TERDAFTAR DI WILAYAH
                    </p>
                    <p className="text-[12px] text-slate-800">
                      {viewUser.markets?.name ||
                        "NASIONAL (TIDAK TERIKAT PASAR)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 tracking-widest mb-0.5">
                      NOMOR TELEPON
                    </p>
                    <p className="text-[12px] text-slate-800 font-sans tracking-normal font-bold">
                      {viewUser.phone_number || "BELUM DILENGKAPI"}
                    </p>
                  </div>
                </div>

                {/* Info Finansial */}
                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3">
                  <h4 className="text-[10px] text-slate-400 flex items-center gap-2 tracking-[0.1em] border-b pb-2">
                    <Wallet size={14} className="text-[#008080]" /> FINANSIAL
                    DOMPET
                  </h4>
                  <div>
                    <p className="text-[9px] text-slate-400 tracking-widest mb-0.5">
                      SALDO DOMPET DIGITAL
                    </p>
                    <p className="text-xl text-[#008080] font-sans font-black tracking-normal">
                      Rp{" "}
                      {(viewUser.wallet_balance || 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 tracking-widest mb-0.5">
                      BERGABUNG SEJAK
                    </p>
                    <p className="text-[11px] text-slate-800 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(viewUser.created_at).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Riwayat Transaksi (Desain UI - Siap dihubungkan Backend) */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 shadow-inner">
                <h4 className="text-[10px] text-slate-500 flex items-center gap-2 tracking-[0.1em] mb-4">
                  <ShoppingBag size={14} className="text-slate-400" /> AKTIVITAS
                  & RIWAYAT (PREVIEW)
                </h4>
                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-200 rounded-lg bg-white">
                  <ShoppingBag size={24} className="text-slate-300 mb-2" />
                  <p className="text-[11px] text-slate-500">
                    DATA TRANSAKSI SEDANG DISIAPKAN
                  </p>
                  <p className="text-[9px] text-slate-400 font-sans font-bold tracking-normal mt-1 max-w-xs leading-relaxed">
                    Panel ini sudah disiapkan untuk menampilkan riwayat
                    belanja/penjualan di update mendatang (terhubung dengan
                    tabel transactions).
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white text-[10px] rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                TUTUP PROFIL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
