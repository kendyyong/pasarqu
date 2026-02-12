import React, { useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ArrowLeft } from "lucide-react";
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
import { RegionalFinance } from "./super-features/RegionalFinance"; // <--- IMPORT MODUL REGIONAL

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
      console.error(err);
    }
  };

  useEffect(() => {
    const isMaster = sessionStorage.getItem("isMasterAuthenticated");
    if (isMaster !== "true") {
      navigate("/");
      return;
    }
    if (user) fetchData();
  }, [user, navigate]);

  const handleLogout = async () => {
    sessionStorage.removeItem("isMasterAuthenticated");
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans flex text-left">
      {/* 1. SIDEBAR */}
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              Master Control /{" "}
              <span className="text-teal-600">{activeTab}</span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-teal-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-slate-800 leading-none">
                  ROOT ADMIN
                </p>
                <p className="text-[9px] text-teal-600 font-bold uppercase mt-1">
                  Full Access
                </p>
              </div>
              <div className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black">
                P
              </div>
            </div>
          </div>
        </header>

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
              {activeTab === "finance" && (
                <FinanceManager finance={finance} theme={shopeeTheme} />
              )}

              {/* --- FITUR BARU: REGIONAL FINANCE --- */}
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
