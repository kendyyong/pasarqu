import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// --- HOOKS ---
import { useSuperAdminDashboard } from "../../../hooks/useSuperAdminDashboard";
import { useAuth } from "../../../contexts/AuthContext";

// --- COMPONENTS ---
import { Sidebar } from "./components/Sidebar";
import { MarketAuditFullView } from "./components/MarketAudit";
import { SuperAdminHeader } from "./components/SuperAdminHeader";
import { SuperAdminContent } from "./components/SuperAdminContent";

// ✅ FIX: Standarisasi ke 'ui' (huruf kecil) agar Vercel build lancar
import { PageLoader } from "../../../components/ui/PageLoader";

export const SuperAdminDashboard: React.FC = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  // PANGGIL HOOK UTAMA (LOGIKA DIPISAH)
  const {
    isDark,
    toggleTheme,
    currentTheme,
    isLoaded,
    activeTab,
    setActiveTab,
    auditMarket,
    setAuditMarket,
    markets,
    allUsers,
    candidates,
    complaintsCount,
    finance,
    fetchData,
  } = useSuperAdminDashboard();

  // --- TAMPILAN LOADING ---
  if (!isLoaded) {
    return <PageLoader bgClass={currentTheme.bg} />;
  }

  return (
    <div
      className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} font-sans flex text-left overflow-hidden transition-colors duration-500`}
    >
      {/* SIDEBAR (NAVIGASI) */}
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
        {/* HEADER (THEME TOGGLE & PROFILE) */}
        <SuperAdminHeader
          activeTab={activeTab}
          isDark={isDark}
          toggleTheme={toggleTheme}
          theme={currentTheme}
          complaintsCount={complaintsCount}
          profile={profile}
        />

        <main className={`flex-1 p-8 overflow-y-auto no-scrollbar`}>
          {auditMarket ? (
            /* VIEW AUDIT MARKET (DRILL DOWN WILAYAH) */
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
            /* KONTEN UTAMA (ROUTING FITUR BERDASARKAN TAB) */
            <SuperAdminContent
              activeTab={activeTab}
              theme={currentTheme}
              isLoaded={isLoaded}
              isDark={isDark}
              data={{ markets, allUsers, finance, candidates }}
              actions={{ setAuditMarket, fetchData }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
