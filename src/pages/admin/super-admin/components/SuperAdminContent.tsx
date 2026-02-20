import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// --- 1. DEFINISI LAZY COMPONENTS (FOLDER: components) ---
const DashboardOverview = lazy(() =>
  import("./DashboardOverview").then((m) => ({ default: m.DashboardOverview })),
);
const MarketManager = lazy(() =>
  import("./MarketManager").then((m) => ({ default: m.MarketManager })),
);
const VerificationCenter = lazy(() =>
  import("./VerificationCenter").then((m) => ({
    default: m.VerificationCenter,
  })),
);
const MenuManager = lazy(() =>
  import("./MenuManager").then((m) => ({ default: m.MenuManager })),
);
const GlobalConfig = lazy(() =>
  import("./GlobalConfig").then((m) => ({ default: m.GlobalConfig })),
);
const NotificationManager = lazy(() =>
  import("./NotificationManager").then((m) => ({
    default: m.NotificationManager,
  })),
);
const ActivityLogs = lazy(() =>
  import("./ActivityLogs").then((m) => ({ default: m.ActivityLogs })),
);
const ManageAds = lazy(() =>
  import("./ManageAds").then((m) => ({ default: m.ManageAds })),
);
const ManageCategories = lazy(() =>
  import("./ManageCategories").then((m) => ({ default: m.ManageCategories })),
);
const DisputeCenter = lazy(() =>
  import("./DisputeCenter").then((m) => ({ default: m.DisputeCenter })),
);
const WithdrawalManager = lazy(() =>
  import("./WithdrawalManager").then((m) => ({ default: m.WithdrawalManager })),
);
const TopUpRequestManager = lazy(() =>
  import("./TopUpRequestManager").then((m) => ({
    default: m.TopUpRequestManager,
  })),
);
const ShippingConfig = lazy(() =>
  import("./ShippingConfig").then((m) => ({ default: m.ShippingConfig })),
);

// ✅ KOMPONEN FINANCE MANDIRI (FOLDER: components)
const FinanceDashboard = lazy(() =>
  import("./FinanceDashboard").then((m) => ({ default: m.FinanceDashboard })),
);
const FinancialLedger = lazy(() =>
  import("./FinancialLedger").then((m) => ({ default: m.FinancialLedger })),
);

// --- KOMPONEN DI FOLDER TABS ---
const UserManager = lazy(() =>
  import("../tabs/UserManager").then((m) => ({ default: m.UserManager })),
);

interface Props {
  activeTab: string;
  theme: any;
  isLoaded: boolean;
  isDark: boolean;
  data: any;
  actions: any;
}

export const SuperAdminContent: React.FC<Props> = ({
  activeTab,
  theme,
  isLoaded,
  isDark,
  data,
  actions,
}) => {
  // --- 2. LOGIKA MAPPING KONTEN ---
  const tabContent: Record<string, React.ReactNode> = {
    dashboard: (
      <DashboardOverview
        isLoaded={isLoaded}
        markets={data.markets}
        darkMode={isDark}
        theme={theme}
        setAuditMarket={actions.setAuditMarket}
      />
    ),
    markets: (
      <MarketManager
        markets={data.markets}
        theme={theme}
        darkMode={isDark}
        isLoaded={isLoaded}
        refreshData={actions.fetchData}
        setAuditMarket={actions.setAuditMarket}
      />
    ),
    users: <UserManager allUsers={data.allUsers} theme={theme} />,

    // 🚩 FINANCE SYSTEM (MANDIRI)
    "finance-master": <FinanceDashboard theme={theme} />,
    ledger: <FinancialLedger />,

    "shipping-config": <ShippingConfig theme={theme} />,
    verification: (
      <VerificationCenter
        candidates={data.candidates}
        markets={data.markets}
        theme={theme}
        refreshData={actions.fetchData}
      />
    ),
    withdrawals: <WithdrawalManager />,
    "topup-requests": <TopUpRequestManager />,
    menus: <MenuManager />,
    "manage-ads": <ManageAds />,
    categories: <ManageCategories />,
    disputes: <DisputeCenter />,
    settings: <GlobalConfig />,
    broadcast: <NotificationManager />,
    logs: <ActivityLogs />,
  };

  return (
    <div className="animate-in fade-in duration-500">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-[#008080]" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              PASARQU ENGINE IS LOADING MODULE...
            </p>
          </div>
        }
      >
        {/* Render tab yang dipilih, jika ID tidak dikenal (null/undefined) akan lari ke Dashboard */}
        {tabContent[activeTab] || tabContent["dashboard"]}
      </Suspense>
    </div>
  );
};

export default SuperAdminContent;
