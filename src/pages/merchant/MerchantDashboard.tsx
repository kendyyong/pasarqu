import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

// Import komponen sidebar & tab Juragan
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantWallet } from "./components/MerchantWallet";
import { MerchantMessages } from "./components/MerchantMessages"; // PERBAIKAN: Import komponen chat
import { LocationPickerModal } from "./components/LocationPickerModal";

// PERBAIKAN: Tambahkan "messages" dan "finance" (untuk kecocokan sidebar) ke dalam tipe Tab
type TabType =
  | "overview"
  | "products"
  | "orders"
  | "wallet"
  | "messages"
  | "finance";

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State data dashboard
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchBaseData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. AMBIL PROFIL (KTP)
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // 2. AMBIL DATA MERCHANT (TOKO)
      let { data: merchantData } = await supabase
        .from("merchants")
        .select("*, markets(name)")
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      // --- LOGIKA "BODO AMAT" (BYPASS) ---
      if (profile?.status === "APPROVED") {
        const effectiveMerchant = merchantData || {
          id: user.id,
          user_id: user.id,
          shop_name: profile.shop_name || profile.name || "Toko Saya",
          market_id: profile.managed_market_id,
          status: "APPROVED",
          is_active: true,
          is_shop_open: true,
        };

        const [resProducts, resOrders] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("merchant_id", effectiveMerchant.id),
          supabase
            .from("orders")
            .select("*")
            .eq("merchant_id", effectiveMerchant.id)
            .order("created_at", { ascending: false }),
        ]);

        setMerchantProfile(effectiveMerchant);
        setProducts(resProducts.data || []);
        setOrders(resOrders.data || []);
      } else {
        setMerchantProfile(null);
      }
    } catch (err: any) {
      console.error("Dashboard Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/portal");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  // TAMPILAN JIKA BELUM APPROVED SAMA SEKALI
  if (!merchantProfile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-sm border border-slate-100">
          <AlertTriangle size={50} className="text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800 uppercase mb-4 tracking-tighter leading-none">
            Menunggu Verifikasi
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase mb-8 leading-relaxed">
            Data Profil Anda masih dalam peninjauan Admin Wilayah.
          </p>
          <button
            onClick={() => fetchBaseData()}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-teal-700 transition-all"
          >
            <RefreshCw size={14} /> Cek Status
          </button>
          <button
            onClick={handleLogout}
            className="mt-4 w-full py-2 text-slate-400 font-bold text-[10px] uppercase"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  // TAMPILAN DASHBOARD (SUKSES)
  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-left overflow-hidden">
      <MerchantSidebar
        activeTab={activeTab}
        setActiveTab={(tab: any) => setActiveTab(tab)}
        merchantProfile={merchantProfile}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
        onToggleStatus={() => {}}
        onAddProduct={() => setActiveTab("products")}
        orderCount={orders.length}
        productCount={products.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
        {/* HEADER SEDERHANA */}
        <header className="h-20 bg-white border-b px-10 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800">
            {merchantProfile.shop_name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100">
              STATUS: ONLINE
            </span>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-6xl mx-auto w-full">
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

          {/* PERBAIKAN: Render Tab Pesanan/Messages */}
          {activeTab === "messages" && <MerchantMessages />}

          {/* Menyesuaikan activeTab finance ke wallet component */}
          {(activeTab === "wallet" || activeTab === "finance") && (
            <MerchantWallet merchantProfile={merchantProfile} />
          )}
        </main>
      </div>

      {showLocationModal && (
        <LocationPickerModal
          merchantProfile={merchantProfile}
          onClose={() => setShowLocationModal(false)}
          onUpdate={fetchBaseData}
        />
      )}
    </div>
  );
};
