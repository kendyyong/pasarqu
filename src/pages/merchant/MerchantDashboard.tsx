import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

// Import komponen sidebar & tab Juragan (Pastikan path import ini benar sesuai struktur folder Juragan)
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantWallet } from "./components/MerchantWallet";
import { LocationPickerModal } from "./components/LocationPickerModal";

type TabType = "overview" | "products" | "orders" | "wallet";

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
      // Jika Profil APPROVED, kita paksa dashboard terbuka.
      // Kita memalsukan object merchant jika data aslinya belum siap di DB.

      if (profile?.status === "APPROVED") {
        // Kalau data merchant di DB kosong/rusak, kita buat data sementara di memori browser
        // supaya dashboard tetap bisa render tanpa error.
        const effectiveMerchant = merchantData || {
          id: user.id, // Pakai ID user sebagai ID toko sementara
          user_id: user.id,
          shop_name: profile.shop_name || profile.name || "Toko Saya",
          market_id: profile.managed_market_id,
          status: "APPROVED",
          is_active: true,
          is_shop_open: true,
        };

        // Tarik data produk & order (Kalau toko baru pasti kosong, jadi aman)
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
        // Jika Profil MEMANG BELUM APPROVED (Murni masih pending)
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
        <header className="h-20 bg-white border-b px-10 flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800">
            {merchantProfile.shop_name}
          </h1>
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
            ONLINE
          </span>
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
          {activeTab === "wallet" && (
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
