import React, { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Loader2, Moon, Sun, Zap } from "lucide-react";

// ✅ FIX: Jalur import diperbaiki
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
import { ManageAds } from "./super-features/ManageAds";
import { ManageCategories } from "./super-features/ManageCategories";
import { DisputeCenter } from "./super-features/DisputeCenter";
import { ManageQuickActions } from "./super-features/ManageQuickActions"; // Jika ada
import { CourierFinanceManager } from "./super-features/CourierFinanceManager"; // Jika ada
import { WithdrawalManager } from "./super-features/WithdrawalManager";
import { TopUpRequestManager } from "./super-features/TopUpRequestManager";
import { FinancialLedger } from "./super-features/FinancialLedger";
import { RegionalFinanceReport } from "./finance/RegionalFinanceReport";
import RegionalFinance from "./finance/RegionalFinance";
import { FinanceDashboard } from "./super-features/FinanceDashboard";

// ✅ NEW: Import Logistics Engine
import { ShippingConfig } from "./super-features/ShippingConfig";

const libraries: "places"[] = ["places"];

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();

  // --- LOGIC MODE GELAP / TERANG ---
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("admin-theme") === "dark";
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("admin-theme", newTheme ? "dark" : "light");
  };

  // --- THEME OBJECT (DIKIRIM KE SEMUA SUB-KOMPONEN) ---
  const currentTheme = isDark
    ? {
        bg: "bg-[#0b0f19]",
        card: "bg-[#0f172a]",
        border: "border-white/5",
        text: "text-slate-200",
        subText: "text-slate-500",
        header: "bg-[#0f172a]/80",
        sidebar: "bg-[#0f172a]",
      }
    : {
        bg: "bg-slate-50",
        card: "bg-white",
        border: "border-slate-200",
        text: "text-slate-800",
        subText: "text-slate-400",
        header: "bg-white/90",
        sidebar: "bg-white",
      };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [auditMarket, setAuditMarket] = useState<any>(null);

  const [markets, setMarkets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [complaintsCount, setComplaintsCount] = useState(0);
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
      const { count } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      setComplaintsCount(count || 0);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (!isLoaded)
    return (
      <div
        className={`h-screen flex items-center justify-center ${currentTheme.bg}`}
      >
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div
      className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} font-sans flex text-left overflow-hidden transition-colors duration-500`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => logout().then(() => navigate("/"))}
        theme={currentTheme}
        setAuditMarket={setAuditMarket}
        counts={{
          users: allUsers.length,
          candidates: candidates.length,
          complaints: complaintsCount,
        }}
      />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden relative">
        <header
          className={`h-16 ${currentTheme.header} backdrop-blur-md border-b ${currentTheme.border} flex items-center justify-between px-8 sticky top-0 z-40 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${isDark ? "bg-teal-500/10" : "bg-teal-50"} rounded-lg`}
            >
              <Zap size={16} className="text-teal-500" />
            </div>
            <h2
              className={`text-[10px] font-black ${currentTheme.subText} uppercase tracking-[0.3em]`}
            >
              System OS /{" "}
              <span className="text-teal-500">
                {activeTab.replace("-", " ")}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 p-2 px-3 rounded-2xl border ${currentTheme.border} ${currentTheme.card} shadow-sm transition-all hover:scale-105 active:scale-95 text-teal-500`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>
            <div className={`h-6 w-[1px] ${currentTheme.border}`}></div>
            <button className="relative text-slate-400 hover:text-teal-500 transition-colors">
              <Bell size={20} />
              {complaintsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-5 border-l border-white/5">
              <div className="text-right hidden md:block text-nowrap">
                <p
                  className={`text-xs font-black tracking-tight leading-none ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  {profile?.full_name || "MASTER ADMIN"}
                </p>
                <p className="text-[8px] text-teal-500 font-bold uppercase mt-1">
                  Super User
                </p>
              </div>
              <div
                className={`w-9 h-9 ${isDark ? "bg-slate-800" : "bg-slate-900"} text-white rounded-xl flex items-center justify-center font-black shadow-lg uppercase`}
              >
                {(profile?.full_name || "S").charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 p-8 overflow-y-auto no-scrollbar`}>
          {auditMarket ? (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => setAuditMarket(null)}
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <ArrowLeft size={14} /> Back to Map
              </button>
              <MarketAuditFullView
                market={auditMarket}
                allUsers={allUsers}
                theme={currentTheme}
                onViewUser={() => {}}
              />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {activeTab === "dashboard" && (
                <DashboardOverview
                  isLoaded={isLoaded}
                  markets={markets}
                  darkMode={isDark}
                  theme={currentTheme}
                  setAuditMarket={setAuditMarket}
                />
              )}
              {activeTab === "finance-master" && (
                <FinanceDashboard theme={currentTheme} />
              )}
              {activeTab === "users" && (
                <UserManager allUsers={allUsers} theme={currentTheme} />
              )}
              {activeTab === "markets" && (
                <MarketManager
                  markets={markets}
                  theme={currentTheme}
                  darkMode={isDark}
                  isLoaded={isLoaded}
                  refreshData={fetchData}
                  setAuditMarket={setAuditMarket}
                />
              )}

              {/* ✅ LOGISTICS ENGINE ADDED HERE */}
              {activeTab === "shipping-config" && (
                <ShippingConfig theme={currentTheme} />
              )}

              {activeTab === "menus" && <MenuManager />}
              {activeTab === "manage-ads" && <ManageAds />}
              {activeTab === "categories" && <ManageCategories />}
              {activeTab === "verification" && (
                <VerificationCenter
                  candidates={candidates}
                  markets={markets}
                  theme={currentTheme}
                  refreshData={fetchData}
                />
              )}
              {activeTab === "ledger" && <FinancialLedger />}
              {activeTab === "withdrawals" && <WithdrawalManager />}
              {activeTab === "topup-requests" && <TopUpRequestManager />}
              {activeTab === "regional-finance" && <RegionalFinance />}
              {activeTab === "finance-report" && <RegionalFinanceReport />}
              {activeTab === "finance" && (
                <FinanceManager
                  finance={finance}
                  activeTab={activeTab}
                  theme={currentTheme}
                />
              )}
              {activeTab === "disputes" && <DisputeCenter />}
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
