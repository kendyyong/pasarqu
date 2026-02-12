import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { generateWALink, waTemplates } from "../../utils/whatsapp";
import { ArrowLeft, Loader2, Coins } from "lucide-react";

// --- IMPORT KOMPONEN MODULAR ---
import { LocalSidebar } from "./components/LocalSidebar";
import { ShippingRateModal } from "./components/ShippingRateModal";
import { PartnerDetailModal } from "./components/PartnerDetailModal";

// --- IMPORT TABS ---
import { LocalOverviewTab } from "./tabs/LocalOverviewTab";
import { LocalProductsTab } from "./tabs/LocalProductsTab";
import { LocalUsersTab } from "./tabs/LocalUsersTab";

type TabType =
  | "overview"
  | "merchants"
  | "products"
  | "couriers"
  | "customers"
  | "finance";

export const LocalAdminDashboard: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);

  // DATA STATE
  const [myMarket, setMyMarket] = useState<any>(null);
  const [myMerchants, setMyMerchants] = useState<any[]>([]);
  const [myCouriers, setMyCouriers] = useState<any[]>([]);
  const [myCustomers, setMyCustomers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);

  const [stats, setStats] = useState({
    adminShare: 625000,
  });

  // MODAL STATE
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // --- FETCH DATA (LOGIC) ---
  const fetchData = async () => {
    if (!profile?.managed_market_id) {
      console.warn("⚠️ ADMIN TIDAK PUNYA MARKET ID. Tidak bisa load data.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        "🔍 FETCH DATA START. Market ID Admin:",
        profile.managed_market_id,
      );

      // 1. Market & Users
      const [marketRes, usersRes] = await Promise.all([
        supabase
          .from("markets")
          .select("*")
          .eq("id", profile.managed_market_id)
          .single(),
        supabase
          .from("profiles")
          .select("*")
          .eq("managed_market_id", profile.managed_market_id)
          .order("created_at", { ascending: false }),
      ]);

      setMyMarket(marketRes.data);
      if (usersRes.data) {
        setMyMerchants(usersRes.data.filter((p) => p.role === "MERCHANT"));
        setMyCouriers(usersRes.data.filter((p) => p.role === "COURIER"));
        setMyCustomers(usersRes.data.filter((p) => p.role === "CUSTOMER"));
      }

      // 2. Products Pending (DIAGNOSTIK)
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*, merchants(name, shop_name)")
        .eq("market_id", profile.managed_market_id) // Filter sesuai pasar admin
        .eq("status", "PENDING") // Filter status
        .order("created_at", { ascending: false });

      if (prodError) {
        console.error("❌ Error Fetch Produk:", prodError);
      } else {
        console.log("✅ Produk Pending Ditemukan:", products?.length, products);
      }

      setPendingProducts(products || []);
    } catch (error) {
      console.error("❌ Critical Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  // --- ACTIONS ---

  // 1. Approve/Reject Produk
  const handleProductAction = async (
    id: string,
    action: "APPROVED" | "REJECTED",
  ) => {
    const { error } = await supabase
      .from("products")
      .update({ status: action })
      .eq("id", id);
    if (!error) {
      showToast(`Produk ${action}`, "success");
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      showToast("Gagal update produk", "error");
    }
  };

  // 2. Approve Mitra (Toko/Kurir)
  const handleApprovePartner = async (partner: any) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", partner.id);

    if (!error) {
      showToast("Mitra Disetujui", "success");

      // Kirim WA Notifikasi
      if (partner.phone_number) {
        let message = "";
        if (partner.role === "MERCHANT") {
          message = waTemplates.merchantApproval(
            partner.name,
            partner.shop_name || "Toko",
            myMarket?.name,
          );
        } else if (partner.role === "COURIER") {
          message = waTemplates.courierApproval(partner.name, myMarket?.name);
        }
        if (message)
          window.open(generateWALink(partner.phone_number, message), "_blank");
      }

      setDetailModal({ isOpen: false, user: null });
      fetchData();
    } else {
      showToast(error.message, "error");
    }
  };

  // 3. Deactivate Mitra
  const handleDeactivatePartner = async (id: string) => {
    if (confirm("Yakin nonaktifkan?")) {
      await supabase
        .from("profiles")
        .update({ is_verified: false })
        .eq("id", id);
      showToast("Mitra Nonaktif", "info");
      setDetailModal({ isOpen: false, user: null });
      fetchData();
    }
  };

  // --- RENDER ---
  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* 1. SIDEBAR MODULAR */}
      <LocalSidebar
        marketName={myMarket?.name}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={myMerchants.filter((m) => !m.is_verified).length}
        pendingCouriers={myCouriers.filter((c) => !c.is_verified).length}
        pendingProducts={pendingProducts.length}
        onLogout={logout}
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="ml-72 flex-1 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {activeTab === "products"
                ? "Verifikasi Produk"
                : activeTab === "merchants"
                  ? "Data Toko"
                  : activeTab === "overview"
                    ? "Ikhtisar Wilayah"
                    : "Manajemen Data"}
            </h1>
            <button
              onClick={() => setIsRateModalOpen(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
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

        {/* 3. SWITCH TAB CONTENT */}

        {activeTab === "overview" && (
          <LocalOverviewTab
            stats={{
              pendingProducts: pendingProducts.length,
              merchants: myMerchants.length,
              couriers: myCouriers.length,
              adminShare: stats.adminShare,
            }}
          />
        )}

        {activeTab === "products" && (
          <LocalProductsTab
            products={pendingProducts}
            onAction={handleProductAction}
          />
        )}

        {activeTab === "merchants" && (
          <LocalUsersTab
            type="merchants"
            data={myMerchants}
            onViewDetail={(u) => setDetailModal({ isOpen: true, user: u })}
          />
        )}

        {activeTab === "couriers" && (
          <LocalUsersTab
            type="couriers"
            data={myCouriers}
            onViewDetail={(u) => setDetailModal({ isOpen: true, user: u })}
          />
        )}

        {activeTab === "customers" && (
          <LocalUsersTab
            type="customers"
            data={myCustomers}
            onViewDetail={(u) => setDetailModal({ isOpen: true, user: u })}
          />
        )}

        {activeTab === "finance" && (
          <div className="bg-white p-10 rounded-[2rem] border border-slate-100 text-center">
            <h3 className="font-bold text-slate-800">Fitur Keuangan</h3>
            <p className="text-sm text-slate-500">
              Anda bisa membuat LocalFinanceTab.tsx untuk bagian ini.
            </p>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Modal Detail User */}
      <PartnerDetailModal
        user={detailModal.user}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        onApprove={handleApprovePartner}
        onDeactivate={handleDeactivatePartner}
      />

      {/* Modal Ongkir */}
      {isRateModalOpen && (
        <ShippingRateModal
          marketId={profile.managed_market_id}
          onClose={() => setIsRateModalOpen(false)}
        />
      )}
    </div>
  );
};
