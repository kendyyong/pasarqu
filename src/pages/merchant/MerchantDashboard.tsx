import React, { useState, useEffect } from "react";
// PERBAIKAN IMPORT: Cukup mundur 2 langkah (../../)
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";

// Components (Pastikan komponen ini ada di folder src/pages/merchant/components/)
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { LocationPickerModal } from "./components/LocationPickerModal";

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchBaseData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Ambil data dari tabel 'merchants'
      const { data: merchantData, error: mError } = await supabase
        .from("merchants")
        .select("*, markets(name)") // Mengambil market_id dan nama pasarnya
        .eq("user_id", user.id)
        .maybeSingle();

      if (mError) {
        console.error("Database Error:", mError);
        throw mError;
      }

      if (!merchantData) {
        setMerchantProfile(null);
        return;
      }

      // 2. Ambil Produk & Transaksi secara paralel
      const [resProducts, resOrders] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("merchant_id", merchantData.id),
        supabase
          .from("transactions")
          .select("*")
          .eq("merchant_id", merchantData.id),
      ]);

      setMerchantProfile(merchantData);
      setProducts(resProducts.data || []);
      setOrders(resOrders.data || []);
    } catch (err: any) {
      console.error("Dashboard Error:", err.message);
      showToast("Gagal memuat data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Keluar dari Dashboard?")) {
      await logout();
      navigate("/portal");
    }
  };

  // Fungsi untuk toggle status buka/tutup toko
  const handleToggleStatus = async () => {
    if (!merchantProfile) return;
    const newStatus = !merchantProfile.is_shop_open;

    const { error } = await supabase
      .from("merchants")
      .update({ is_shop_open: newStatus })
      .eq("id", merchantProfile.id);

    if (!error) {
      setMerchantProfile({ ...merchantProfile, is_shop_open: newStatus });
      showToast(
        newStatus ? "Toko Berhasil DIBUKA" : "Toko Berhasil DITUTUP",
        "info",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="text-center">
          <Loader2
            className="animate-spin text-teal-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Sinkronisasi Data...
          </p>
        </div>
      </div>
    );

  // Tampilan jika profil merchant belum ada di tabel merchants
  if (!merchantProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-sm border border-orange-100">
          <AlertTriangle size={60} className="mx-auto text-orange-400 mb-6" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Toko Belum Aktif
          </h2>
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[10px] font-mono text-slate-400 break-all border border-slate-100">
            USER ID: {user?.id}
          </div>
          <p className="text-xs text-slate-500 font-bold mt-4 leading-relaxed uppercase tracking-tight">
            Akun Anda belum terdaftar di sistem pedagang. Mohon gunakan ID di
            atas untuk aktivasi ke Admin.
          </p>
          <button
            onClick={handleLogout}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-sans">
      <MerchantSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        merchantProfile={merchantProfile}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
        onToggleStatus={handleToggleStatus}
        onAddProduct={() => setActiveTab("products")}
        orderCount={orders.length}
        productCount={products.length}
      />

      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 text-left">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between lg:hidden">
          <div className="text-lg font-black text-teal-600 tracking-tighter uppercase">
            Pasarqu
          </div>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${
              merchantProfile.is_shop_open
                ? "bg-green-500 text-white shadow-lg"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {merchantProfile.is_shop_open ? "BUKA" : "TUTUP"}
          </button>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          {activeTab === "overview" && (
            <MerchantOverview
              merchantProfile={merchantProfile}
              stats={{ orders: orders.length, products: products.length }}
            />
          )}
          {activeTab === "products" && (
            <MerchantProducts merchantProfile={merchantProfile} />
          )}
          {activeTab === "orders" && (
            <MerchantOrders merchantProfile={merchantProfile} />
          )}
        </div>
      </main>

      {/* MODAL LOKASI */}
      {showLocationModal && merchantProfile && (
        <LocationPickerModal
          merchantProfile={merchantProfile}
          onClose={() => setShowLocationModal(false)}
          onUpdate={fetchBaseData}
        />
      )}
    </div>
  );
};
