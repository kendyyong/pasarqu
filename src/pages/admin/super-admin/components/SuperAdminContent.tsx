import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// --- 1. DYNAMIC IMPORTS (Code Splitting) ---
// Komponen hanya akan di-download saat tab-nya diklik. Ini bikin load awal Admin instan!
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
const FinancialLedger = lazy(() =>
  import("./FinancialLedger").then((m) => ({ default: m.FinancialLedger })),
);
const FinanceDashboard = lazy(() =>
  import("./FinanceDashboard").then((m) => ({ default: m.FinanceDashboard })),
);
const ShippingConfig = lazy(() =>
  import("./ShippingConfig").then((m) => ({ default: m.ShippingConfig })),
);
const UserManager = lazy(() =>
  import("../tabs/UserManager").then((m) => ({ default: m.UserManager })),
);
const FinanceManager = lazy(() =>
  import("../tabs/FinanceManager").then((m) => ({ default: m.FinanceManager })),
);

interface Props {
  activeTab: string;
  theme: any;
  isLoaded: boolean;
  isDark: boolean;
  data: {
    markets: any[];
    allUsers: any[];
    finance: any;
    candidates: any[];
  };
  actions: {
    setAuditMarket: (market: any) => void;
    fetchData: () => void;
  };
}

export const SuperAdminContent: React.FC<Props> = ({
  activeTab,
  theme,
  isLoaded,
  isDark,
  data,
  actions,
}) => {
  // --- 2. OBJECT MAPPING (Pengganti If-Else Panjang) ---
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
    "finance-master": <FinanceDashboard theme={theme} />,
    users: <UserManager allUsers={data.allUsers} theme={theme} />,
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
    "shipping-config": <ShippingConfig theme={theme} />,
    menus: <MenuManager />,
    "manage-ads": <ManageAds />,
    categories: <ManageCategories />,
    verification: (
      <VerificationCenter
        candidates={data.candidates}
        markets={data.markets}
        theme={theme}
        refreshData={actions.fetchData}
      />
    ),
    ledger: <FinancialLedger />,
    withdrawals: <WithdrawalManager />,
    "topup-requests": <TopUpRequestManager />,
    finance: <FinanceManager finance={data.finance} theme={theme} />,
    disputes: <DisputeCenter />,
    settings: <GlobalConfig />,
    broadcast: <NotificationManager />,
    logs: <ActivityLogs />,
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 3. SUSPENSE (Tampilan saat komponen sedang di-download) */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-teal-600" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Menyiapkan Ruang {activeTab}...
            </p>
          </div>
        }
      >
        {/* Render konten berdasarkan key activeTab, atau fallback ke dashboard */}
        {tabContent[activeTab] || tabContent["dashboard"]}
      </Suspense>
    </div>
  );
};
