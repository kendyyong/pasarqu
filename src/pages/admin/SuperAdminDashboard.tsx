import React, { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

// --- COMPONENTS ---
import { Sidebar } from "../../components/super-admin/Sidebar";
import { MarketAuditFullView } from "../../components/super-admin/MarketAudit";

// --- FEATURES ---
import { DashboardOverview } from "./super-features/DashboardOverview";
import { MarketManager } from "./super-features/MarketManager";
import { FinanceManager } from "./super-features/FinanceManager";
import { UserManager } from "./super-features/UserManager";
import { VerificationCenter } from "./super-features/VerificationCenter";
import { MenuManager } from "./super-features/MenuManager";
import { GlobalConfig } from "./super-features/GlobalConfig";
import { NotificationManager } from "./super-features/NotificationManager";
import { ActivityLogs } from "./super-features/ActivityLogs";
import { RegionalFinance } from "./super-features/RegionalFinance";
import { ManageAds } from "./super-features/ManageAds"; // <-- IMPORT FITUR IKLAN BARU

const libraries: "places"[] = ["places"];

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // State activeTab harus sinkron dengan Sidebar.tsx
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [auditMarket, setAuditMarket] = useState<any>(null);

  const shopeeTheme = {
    sidebar: "bg-white",
    accent: "text-teal-600",
    text: "text-slate-800",
    subText: "text-slate-400",
  };

  const [markets, setMarkets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [finance, setFinance] = useState({
    revenue: 0,
    orders: 0,
    active_markets: 0,
  });

  // Ambil data utama dari Database
  const fetchData = async () => {
    try {
      const { data: mData } = await supabase.from("markets").select("*");
      setMarkets(mData || []);

      const { data: uData } = await supabase
        .from("profiles")
        .select("*, markets(name)");
      setAllUsers(uData || []);

      setCandidates(
        uData?.filter(
          (u: any) =>
            u.role === "ADMIN_CANDIDATE" ||
            (u.role === "LOCAL_ADMIN" && !u.is_verified),
        ) || [],
      );

      const { data: fData } = await supabase.rpc("get_financial_summary");
      if (fData?.[0]) setFinance(fData[0]);

      const { data: cData } = await supabase
        .from("complaints")
        .select("*")
        .eq("status", "open");
      setComplaints(cData || []);
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!isLoaded)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans flex text-left">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={shopeeTheme}
        setAuditMarket={setAuditMarket}
        counts={{
          users: allUsers.length,
          candidates: candidates.length,
          complaints: complaints.length,
        }}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* TOPBAR / HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Master Control /{" "}
              <span className="text-teal-600">
                {activeTab.replace("-", " ")}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-teal-600 transition-colors">
              <Bell size={20} />
              {complaints.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-slate-800 leading-none">
                  {profile?.full_name || "ROOT ADMIN"}
                </p>
                <p className="text-[9px] text-teal-600 font-bold uppercase mt-1 tracking-widest">
                  Super User
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-slate-900/20 uppercase">
                {profile?.full_name?.charAt(0) || "S"}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT RENDERER */}
        <main className="p-8">
          {auditMarket ? (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => setAuditMarket(null)}
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <ArrowLeft size={14} /> Kembali ke Peta
              </button>
              <MarketAuditFullView
                market={auditMarket}
                allUsers={allUsers}
                theme={{ bg: "bg-white", text: "text-slate-900" }}
                onViewUser={() => {}}
              />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {activeTab === "dashboard" && (
                <DashboardOverview
                  isLoaded={isLoaded}
                  markets={markets}
                  darkMode={false}
                  theme={shopeeTheme}
                  setAuditMarket={setAuditMarket}
                />
              )}

              {activeTab === "markets" && (
                <MarketManager
                  markets={markets}
                  theme={shopeeTheme}
                  darkMode={false}
                  isLoaded={isLoaded}
                  refreshData={fetchData}
                  setAuditMarket={setAuditMarket}
                />
              )}

              {activeTab === "menus" && <MenuManager />}

              {/* INTEGRASI MANAJEMEN IKLAN */}
              {activeTab === "manage-ads" && <ManageAds />}

              {activeTab === "users" && (
                <UserManager allUsers={allUsers} theme={shopeeTheme} />
              )}

              {activeTab === "verification" && (
                <VerificationCenter
                  candidates={candidates}
                  markets={markets}
                  theme={shopeeTheme}
                  refreshData={fetchData}
                />
              )}

              {/* FINANCE CENTER (Terpadu) */}
              {activeTab === "finance" && (
                <FinanceManager finance={finance} theme={shopeeTheme} />
              )}

              {/* Jika user klik tab laporan profit di sidebar, arahkan juga ke FinanceManager */}
              {activeTab === "finance-report" && (
                <FinanceManager finance={finance} theme={shopeeTheme} />
              )}

              {activeTab === "regional-finance" && <RegionalFinance />}

              {activeTab === "settings" && <GlobalConfig />}

              {activeTab === "broadcast" && <NotificationManager />}

              {activeTab === "logs" && <ActivityLogs />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
