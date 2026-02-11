import React, { useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { getTheme } from "../../components/super-admin/SharedUI";

// --- IMPORT KOMPONEN UTAMA ---
import { Sidebar } from "../../components/super-admin/Sidebar";
import { MarketAuditFullView } from "../../components/super-admin/MarketAudit";

// --- IMPORT FITUR-FITUR (YANG SUDAH DIPISAH) ---
import { DashboardOverview } from "./super-features/DashboardOverview";
import { MarketManager } from "./super-features/MarketManager";
import { FinanceManager } from "./super-features/FinanceManager";
import { UserManager } from "./super-features/UserManager";
import { VerificationCenter } from "./super-features/VerificationCenter";
import { MenuManager } from "./super-features/MenuManager"; // Pastikan file ini ada jika sebelumnya sudah dibuat

// Placeholder untuk fitur yang belum dibuat file terpisahnya
const FeaturePlaceholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-[50vh] border-2 border-dashed border-slate-300 rounded-[3rem] text-slate-400 font-bold uppercase tracking-widest">
    Fitur {title} (Segera Hadir)
  </div>
);

const libraries: "places"[] = ["places"];

export const SuperAdminDashboard: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "finance"
    | "disputes"
    | "verification"
    | "markets"
    | "users"
    | "categories"
    | "menus"
  >("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [auditMarket, setAuditMarket] = useState<any>(null); // Mode "God View"
  const [isLoading, setIsLoading] = useState(false);

  // --- DATA STATE ---
  const [markets, setMarkets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [finance, setFinance] = useState({
    revenue: 0,
    orders: 0,
    active_markets: 0,
  });

  // Helper Tema
  const th = getTheme(darkMode);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil Pasar
      const { data: mData } = await supabase.from("markets").select("*");
      setMarkets(mData || []);

      // 2. Ambil Semua User
      const { data: uData } = await supabase
        .from("profiles")
        .select("*, markets(name)")
        .order("created_at", { ascending: false });
      setAllUsers(uData || []);

      // 3. Filter Kandidat Admin (Verification)
      setCandidates(
        uData?.filter(
          (u: any) =>
            u.role === "ADMIN_CANDIDATE" ||
            (u.role === "LOCAL_ADMIN" && !u.is_verified),
        ) || [],
      );

      // 4. Data Keuangan
      const { data: fData } = await supabase.rpc("get_financial_summary");
      if (fData?.[0])
        setFinance({
          revenue: fData[0].total_revenue,
          orders: fData[0].total_orders,
          active_markets: fData[0].active_markets,
        });

      // 5. Data Komplain (Disputes)
      const { data: cData } = await supabase
        .from("complaints")
        .select("*, profiles(name, phone_number)")
        .eq("status", "open");
      setComplaints(cData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    if (onBack) onBack();
    navigate("/");
  };

  // --- RENDER UTAMA ---
  return (
    <div
      className={`min-h-screen font-sans flex transition-colors duration-300 ${th.bg} ${th.text}`}
    >
      {/* 1. SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={th}
        setAuditMarket={setAuditMarket}
        counts={{
          users: allUsers.length,
          candidates: candidates.length,
          complaints: complaints.length,
        }}
      />

      {/* 2. AREA KONTEN */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 transition-all duration-300">
        {/* A. TAMPILAN KHUSUS: AUDIT WILAYAH (GOD MODE) */}
        {auditMarket ? (
          <div className="animate-in fade-in slide-in-from-right-4">
            <div className="mb-8 flex items-center justify-between bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setAuditMarket(null)}
                  className="p-4 bg-white/20 rounded-2xl hover:bg-white/40 transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-3xl font-black uppercase">
                    {auditMarket.name}
                  </h1>
                  <p className="text-indigo-200 text-xs font-bold uppercase">
                    God Mode: Audit Wilayah Full Access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-black/20 px-6 py-3 rounded-2xl border border-white/10">
                <Shield size={20} className="text-emerald-400" />
                <span className="font-black text-xs uppercase">
                  Monitoring Berjalan
                </span>
              </div>
            </div>
            <MarketAuditFullView
              market={auditMarket}
              allUsers={allUsers}
              theme={th}
              onViewUser={() => {}}
            />
          </div>
        ) : (
          /* B. TAMPILAN FITUR MODULAR */
          <>
            {/* 1. Dashboard Peta */}
            {activeTab === "dashboard" && (
              <DashboardOverview
                isLoaded={isLoaded}
                markets={markets}
                darkMode={darkMode}
                theme={th}
                setAuditMarket={setAuditMarket}
              />
            )}

            {/* 2. Manajemen Pasar */}
            {activeTab === "markets" && (
              <MarketManager
                markets={markets}
                theme={th}
                darkMode={darkMode}
                isLoaded={isLoaded}
                refreshData={fetchData}
                setAuditMarket={setAuditMarket}
              />
            )}

            {/* 3. Keuangan */}
            {activeTab === "finance" && (
              <FinanceManager finance={finance} theme={th} />
            )}

            {/* 4. Manajemen User */}
            {activeTab === "users" && (
              <UserManager allUsers={allUsers} theme={th} />
            )}

            {/* 5. Verifikasi Admin */}
            {activeTab === "verification" && (
              <VerificationCenter
                candidates={candidates}
                markets={markets}
                theme={th}
                refreshData={fetchData}
              />
            )}

            {/* 6. Manajemen Menu (Jika ada file MenuManager.tsx) */}
            {activeTab === "menus" && <MenuManager />}

            {/* Fitur Lain (Belum Dipisah) */}
            {activeTab === "disputes" && (
              <FeaturePlaceholder title="Resolusi Sengketa" />
            )}
            {activeTab === "categories" && (
              <FeaturePlaceholder title="Kategori Produk" />
            )}
          </>
        )}
      </main>
    </div>
  );
};
