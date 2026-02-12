import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, Clock, MessageCircle, Power } from "lucide-react";

// IMPORT KOMPONEN MODULAR
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { LocationPickerModal } from "./components/LocationPickerModal"; // <-- IMPORT BARU

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // STATE UNTUK MODAL LOKASI
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchBaseData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, productsRes, ordersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, markets(name)")
          .eq("id", user.id)
          .single(),
        supabase.from("products").select("*").eq("merchant_id", user.id),
        supabase.from("orders").select("*").eq("market_id", user.id),
      ]);

      setMerchantProfile(profileRes.data);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
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

  const toggleStatus = async () => {
    if (!merchantProfile) return;
    const newStatus = !merchantProfile.is_shop_open;
    const { error } = await supabase
      .from("profiles")
      .update({ is_shop_open: newStatus })
      .eq("id", user?.id);
    if (!error) {
      setMerchantProfile({ ...merchantProfile, is_shop_open: newStatus });
      showToast(newStatus ? "Toko DIBUKA" : "Toko DITUTUP", "info");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  if (merchantProfile && !merchantProfile.is_verified) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-center text-left">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
          <Clock
            size={60}
            className="text-teal-600 mx-auto mb-6 animate-pulse"
          />
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Toko Sedang Ditinjau
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-4 leading-relaxed tracking-widest px-2">
            Pendaftaran{" "}
            <span className="text-teal-600">"{merchantProfile.shop_name}"</span>{" "}
            sedang diverifikasi Admin.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => window.open("https://wa.me/628123456789")}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Chat Admin
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Keluar
            </button>
          </div>
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
        onLocationClick={() => setShowLocationModal(true)} // <-- SEKARANG BERFUNGSI
        onLogout={handleLogout}
        onToggleStatus={toggleStatus}
        onAddProduct={() => setActiveTab("products")}
        orderCount={orders.length}
        productCount={products.length}
      />

      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 text-left">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between lg:hidden text-left">
          <div className="text-lg font-black text-teal-600 tracking-tighter uppercase">
            Pasarqu
          </div>
          <button
            onClick={toggleStatus}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${merchantProfile?.is_shop_open ? "bg-green-500 text-white shadow-lg" : "bg-slate-200 text-slate-500"}`}
          >
            {merchantProfile?.is_shop_open ? "BUKA" : "TUTUP"}
          </button>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          {activeTab === "overview" && (
            <MerchantOverview merchantProfile={merchantProfile} />
          )}
          {activeTab === "products" && (
            <MerchantProducts merchantProfile={merchantProfile} />
          )}
          {activeTab === "orders" && (
            <MerchantOrders merchantProfile={merchantProfile} />
          )}
          {activeTab === "finance" && (
            <div className="p-20 text-center opacity-30">
              <h2 className="text-2xl font-black uppercase text-slate-800">
                Fitur Keuangan Segera Hadir
              </h2>
            </div>
          )}
        </div>
      </main>

      {/* TAMPILKAN MODAL LOKASI */}
      {showLocationModal && (
        <LocationPickerModal
          merchantProfile={merchantProfile}
          onClose={() => setShowLocationModal(false)}
          onUpdate={(lat, lng, addr) => {
            setMerchantProfile({
              ...merchantProfile,
              latitude: lat,
              longitude: lng,
              address: addr,
            });
            fetchBaseData(); // Refresh data agar sinkron
          }}
        />
      )}
    </div>
  );
};
