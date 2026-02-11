import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { generateWALink, waTemplates } from "../../utils/whatsapp";
import {
  Store,
  Users,
  DollarSign,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  LayoutDashboard,
  Search,
  TrendingUp,
  MapPin,
  ShieldCheck,
  PieChart,
  Truck,
  UserCheck,
  UserX,
  Eye,
  CreditCard,
  Camera,
  FileText,
  Coins, // Icon baru untuk Ongkir
} from "lucide-react";

export const LocalAdminDashboard: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "merchants" | "couriers" | "customers" | "finance"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);

  // DATA STATE
  const [myMarket, setMyMarket] = useState<any>(null);
  const [myMerchants, setMyMerchants] = useState<any[]>([]);
  const [myCouriers, setMyCouriers] = useState<any[]>([]);
  const [myCustomers, setMyCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    platformFee: 0,
    adminShare: 0,
  });

  // MODAL STATE
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

  // --- NEW: ONGKIR SETTING STATE ---
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rates, setRates] = useState([
    { min_km: 0, max_km: 5, price: 5000 },
    { min_km: 6, max_km: 7, price: 7000 },
    { min_km: 8, max_km: 10, price: 10000 },
  ]);
  const [isSavingRates, setIsSavingRates] = useState(false);

  const fetchData = async () => {
    if (!profile?.managed_market_id) return;

    setIsLoading(true);
    try {
      // 1. Ambil Info Pasar
      const { data: market } = await supabase
        .from("markets")
        .select("*")
        .eq("id", profile.managed_market_id)
        .single();
      setMyMarket(market);

      // 2. Ambil Semua User di Wilayah Ini
      const { data: allUsers } = await supabase
        .from("profiles")
        .select("*")
        .eq("managed_market_id", profile.managed_market_id)
        .order("created_at", { ascending: false });

      if (allUsers) {
        setMyMerchants(allUsers.filter((p) => p.role === "MERCHANT"));
        setMyCouriers(allUsers.filter((p) => p.role === "COURIER"));
        setMyCustomers(allUsers.filter((p) => p.role === "CUSTOMER"));
      }

      // 3. Ambil Setting Ongkir (Jika Ada)
      const { data: rateData } = await supabase
        .from("market_shipping_rates")
        .select("*")
        .eq("market_id", profile.managed_market_id)
        .order("min_km", { ascending: true });

      if (rateData && rateData.length > 0) {
        // Map data dari DB ke format state (hanya ambil 3 pertama untuk konsistensi UI)
        const formattedRates = rateData.slice(0, 3).map((r) => ({
          min_km: r.min_km,
          max_km: r.max_km,
          price: r.price,
        }));
        // Jika data kurang dari 3, gabungkan dengan default
        if (formattedRates.length < 3) {
          const defaultRates = [
            { min_km: 0, max_km: 5, price: 5000 },
            { min_km: 6, max_km: 7, price: 7000 },
            { min_km: 8, max_km: 10, price: 10000 },
          ];
          // Timpa default dengan data yang ada
          formattedRates.forEach((fr, i) => {
            defaultRates[i] = fr;
          });
          setRates(defaultRates);
        } else {
          setRates(formattedRates);
        }
      }

      setStats({
        totalSales: 12500000,
        platformFee: 1250000,
        adminShare: 625000,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  // --- ACTIONS ---
  const handleApprovePartner = async (partner: any) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", partner.id);
      if (error) throw error;

      showToast(`${partner.role} Berhasil Disetujui`, "success");

      if (partner.phone_number) {
        let message = "";
        if (partner.role === "MERCHANT")
          message = waTemplates.merchantApproval(
            partner.name,
            partner.shop_name || "Toko",
            myMarket?.name,
          );
        else if (partner.role === "COURIER")
          message = waTemplates.courierApproval(partner.name, myMarket?.name);

        if (message)
          window.open(generateWALink(partner.phone_number, message), "_blank");
      }
      setDetailModal({ isOpen: false, user: null });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeactivatePartner = async (partnerId: string) => {
    if (!window.confirm("Nonaktifkan mitra ini?")) return;
    await supabase
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", partnerId);
    showToast("Mitra dinonaktifkan", "info");
    setDetailModal({ isOpen: false, user: null });
    fetchData();
  };

  // --- NEW: SAVE RATES ACTION ---
  const handleSaveRates = async () => {
    setIsSavingRates(true);
    try {
      // 1. Hapus setting lama untuk pasar ini (Reset)
      await supabase
        .from("market_shipping_rates")
        .delete()
        .eq("market_id", profile.managed_market_id);

      // 2. Insert setting baru
      const toInsert = rates.map((r) => ({
        market_id: profile.managed_market_id,
        min_km: r.min_km,
        max_km: r.max_km,
        price: r.price,
      }));

      const { error } = await supabase
        .from("market_shipping_rates")
        .insert(toInsert);
      if (error) throw error;

      showToast("Tarif Ongkir Berhasil Disimpan!", "success");
      setIsRateModalOpen(false);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsSavingRates(false);
    }
  };

  const updateRate = (index: number, field: string, value: number) => {
    const newRates = [...rates];
    (newRates[index] as any)[field] = value;
    setRates(newRates);
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 fixed h-full z-20 shadow-2xl">
        <div className="mb-12 text-center">
          <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <ShieldCheck size={32} />
          </div>
          <h2 className="font-black text-lg leading-tight uppercase">
            {myMarket?.name || "ADMIN ZONA"}
          </h2>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            icon={<Store size={18} />}
            label="Kelola Toko"
            active={activeTab === "merchants"}
            onClick={() => setActiveTab("merchants")}
            count={myMerchants.filter((m) => !m.is_verified).length}
          />
          <NavItem
            icon={<Truck size={18} />}
            label="Kelola Kurir"
            active={activeTab === "couriers"}
            onClick={() => setActiveTab("couriers")}
            count={myCouriers.filter((c) => !c.is_verified).length}
          />
          <NavItem
            icon={<Users size={18} />}
            label="Data Pelanggan"
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
          />
          <NavItem
            icon={<DollarSign size={18} />}
            label="Laporan Komisi"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
        </nav>

        <button
          onClick={logout}
          className="mt-auto w-full py-4 bg-red-500/10 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={16} /> Keluar
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-72 flex-1 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {activeTab === "overview"
                ? "Wilayah Ikhtisar"
                : activeTab === "merchants"
                  ? "Otoritas Toko"
                  : activeTab === "couriers"
                    ? "Otoritas Kurir"
                    : activeTab === "customers"
                      ? "Database Pelanggan"
                      : "Keuangan"}
            </h1>

            {/* TOMBOL ATUR ONGKIR (NEW FEATURE) */}
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-500/30 hover:scale-105 transition-all"
            >
              <Coins size={18} /> Atur Tarif Ongkir
            </button>
          </div>

          <button
            onClick={onBack}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft />
          </button>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in">
            <StatCard
              label="Mitra Toko"
              value={myMerchants.length}
              icon={<Store />}
              color="bg-blue-600"
            />
            <StatCard
              label="Mitra Kurir"
              value={myCouriers.length}
              icon={<Truck />}
              color="bg-indigo-600"
            />
            <StatCard
              label="Pelanggan"
              value={myCustomers.length}
              icon={<Users />}
              color="bg-purple-600"
            />
            <StatCard
              label="Profit Wilayah"
              value={`Rp ${stats.adminShare.toLocaleString()}`}
              icon={<DollarSign />}
              color="bg-teal-600"
            />
          </div>
        )}

        {/* TAB LIST (MERCHANT / COURIER / CUSTOMER) */}
        {(activeTab === "merchants" ||
          activeTab === "couriers" ||
          activeTab === "customers") && (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
                Database {activeTab}
              </h3>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cari data..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 transition-all w-64"
                />
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                  <th className="p-8">Identitas</th>
                  <th className="p-8">Kontak & Alamat</th>
                  {activeTab !== "customers" && <th className="p-8">Status</th>}
                  <th className="p-8 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "merchants"
                  ? myMerchants
                  : activeTab === "couriers"
                    ? myCouriers
                    : myCustomers
                ).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-all"
                  >
                    <td className="p-8">
                      <h4 className="font-black text-slate-800 text-sm uppercase">
                        {item.shop_name || item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {item.vehicle_type
                          ? `${item.vehicle_type} - ${item.plat_number}`
                          : item.role}
                      </p>
                    </td>
                    <td className="p-8">
                      <p className="text-xs font-bold text-slate-600">
                        {item.phone_number}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {item.address || "Alamat tidak ada"}
                      </p>
                    </td>
                    {activeTab !== "customers" && (
                      <td className="p-8">
                        {item.is_verified ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full">
                            AKTIF
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full">
                            PENDING
                          </span>
                        )}
                      </td>
                    )}
                    <td className="p-8 text-right">
                      <button
                        onClick={() =>
                          setDetailModal({ isOpen: true, user: item })
                        }
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all flex items-center gap-2 ml-auto"
                      >
                        <Eye size={14} /> Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB FINANCE */}
        {activeTab === "finance" && (
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                <PieChart size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                  Laporan Komisi
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Pendapatan Admin Wilayah
                </p>
              </div>
            </div>
            <div className="space-y-4 max-w-2xl">
              <FinanceRow
                label="Total Volume Penjualan"
                value={`Rp ${stats.totalSales.toLocaleString()}`}
              />
              <FinanceRow
                label="Komisi Platform (10%)"
                value={`Rp ${stats.platformFee.toLocaleString()}`}
                highlight
              />
              <FinanceRow
                label="Porsi Bagi Hasil (50%)"
                value={`Rp ${stats.adminShare.toLocaleString()}`}
                success
              />
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL DETAIL USER (FITUR UTAMA) --- */}
      {detailModal.isOpen && detailModal.user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {detailModal.user.name}
                </h2>
                <p className="text-teal-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                  {detailModal.user.role}
                  <span className="text-slate-500">•</span>
                  {detailModal.user.shop_name || detailModal.user.phone_number}
                </p>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, user: null })}
                className="p-3 bg-white/10 rounded-full hover:bg-red-500 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Kiri: Data Teks */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-black text-slate-800 text-sm uppercase border-b border-slate-100 pb-3">
                      Informasi Pribadi
                    </h3>
                    <InfoRow label="Email" value={detailModal.user.email} />
                    <InfoRow
                      label="WhatsApp"
                      value={detailModal.user.phone_number}
                    />
                    <InfoRow
                      label="Alamat Domisili"
                      value={detailModal.user.address}
                    />
                    <InfoRow
                      label="Tanggal Daftar"
                      value={new Date(
                        detailModal.user.created_at,
                      ).toLocaleDateString()}
                    />
                  </div>

                  {/* Khusus Kurir */}
                  {detailModal.user.role === "COURIER" && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <h3 className="font-black text-slate-800 text-sm uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Truck size={16} /> Data Kendaraan
                      </h3>
                      <InfoRow
                        label="Jenis Kendaraan"
                        value={detailModal.user.vehicle_type}
                      />
                      <InfoRow
                        label="Plat Nomor"
                        value={detailModal.user.plat_number}
                      />
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Dokumen Foto */}
                <div className="space-y-6">
                  <h3 className="font-black text-slate-800 text-sm uppercase ml-2">
                    Dokumen Terlampir
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {detailModal.user.ktp_url ? (
                      <ImageViewer
                        label="KTP Asli"
                        url={detailModal.user.ktp_url}
                        icon={<CreditCard size={16} />}
                      />
                    ) : (
                      <NoData label="KTP Belum Diupload" />
                    )}

                    {detailModal.user.sim_url && (
                      <ImageViewer
                        label="SIM C"
                        url={detailModal.user.sim_url}
                        icon={<FileText size={16} />}
                      />
                    )}

                    {detailModal.user.selfie_url ? (
                      <ImageViewer
                        label="Selfie Verifikasi"
                        url={detailModal.user.selfie_url}
                        icon={<Camera size={16} />}
                      />
                    ) : (
                      <NoData label="Selfie Belum Diupload" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Actions) */}
            {detailModal.user.role !== "CUSTOMER" && (
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                {detailModal.user.is_verified ? (
                  <button
                    onClick={() => handleDeactivatePartner(detailModal.user.id)}
                    className="px-8 py-4 bg-red-100 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-all"
                  >
                    Bekukan Akun
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setDetailModal({ isOpen: false, user: null })
                      }
                      className="px-8 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => handleApprovePartner(detailModal.user)}
                      className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                    >
                      <UserCheck size={18} /> Validasi & Setujui
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- NEW MODAL: ATUR TARIF ONGKIR --- */}
      {isRateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg p-8 rounded-[3rem] shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-slate-800 flex items-center gap-2">
              <Coins size={24} className="text-orange-500" /> Atur Tarif Ongkir
            </h2>

            <div className="space-y-4">
              {rates.map((rate, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white transition-all"
                >
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Jarak (KM)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={rate.min_km}
                        onChange={(e) =>
                          updateRate(idx, "min_km", Number(e.target.value))
                        }
                        className="w-12 bg-transparent font-black text-slate-700 border-b border-slate-300 text-center outline-none focus:border-orange-500 transition-all"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="number"
                        value={rate.max_km}
                        onChange={(e) =>
                          updateRate(idx, "max_km", Number(e.target.value))
                        }
                        className="w-12 bg-transparent font-black text-slate-700 border-b border-slate-300 text-center outline-none focus:border-orange-500 transition-all"
                      />
                      <span className="text-xs font-bold text-slate-500 ml-1">
                        KM
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 border-l pl-4 border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      value={rate.price}
                      onChange={(e) =>
                        updateRate(idx, "price", Number(e.target.value))
                      }
                      className="w-full bg-transparent font-black text-lg text-emerald-600 outline-none placeholder:text-slate-300"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRates}
                disabled={isSavingRates}
                className="flex-1 py-4 bg-orange-500 text-white font-black text-xs uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-orange-500/30"
              >
                {isSavingRates ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group ${active ? "bg-teal-500 text-white shadow-lg" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"}`}
  >
    <div className="flex items-center gap-4">
      {icon} <span>{label}</span>
    </div>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] ${active ? "bg-white text-teal-600" : "bg-orange-500 text-white animate-pulse"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
    <div
      className={`w-12 h-12 ${color} bg-opacity-10 ${color.replace("bg-", "text-")} flex items-center justify-center rounded-2xl mb-6 shadow-sm`}
    >
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
      {value}
    </h3>
  </div>
);

const FinanceRow = ({ label, value, highlight, success }: any) => (
  <div
    className={`flex justify-between items-center p-6 rounded-2xl border transition-all ${highlight ? "bg-slate-50 border-slate-200" : success ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "border-slate-50 hover:border-slate-200"}`}
  >
    <span className="font-bold text-xs uppercase tracking-wide">{label}</span>
    <span className="font-black text-sm tracking-tight">{value}</span>
  </div>
);

const InfoRow = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
      {label}
    </p>
    <p className="text-sm font-bold text-slate-800 break-words">
      {value || "-"}
    </p>
  </div>
);

const ImageViewer = ({ label, url, icon }: any) => (
  <div className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-teal-500 transition-all cursor-pointer bg-white">
    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 shadow-sm z-10">
      {icon} {label}
    </div>
    <img
      src={url}
      alt={label}
      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
    />
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-bold text-xs uppercase tracking-widest"
    >
      Buka Ukuran Penuh
    </a>
  </div>
);

const NoData = ({ label }: any) => (
  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
    {label}
  </div>
);
