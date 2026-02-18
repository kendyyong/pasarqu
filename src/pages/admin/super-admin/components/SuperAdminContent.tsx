import React from "react";

// --- COMPONENTS (Berada di folder yang sama /components) ---
import { DashboardOverview } from "./DashboardOverview";
import { MarketManager } from "./MarketManager";
import { VerificationCenter } from "./VerificationCenter";
import { MenuManager } from "./MenuManager";
import { GlobalConfig } from "./GlobalConfig";
import { NotificationManager } from "./NotificationManager";
import { ActivityLogs } from "./ActivityLogs";
import { ManageAds } from "./ManageAds";
import { ManageCategories } from "./ManageCategories";
import { DisputeCenter } from "./DisputeCenter";
import { WithdrawalManager } from "./WithdrawalManager";
import { TopUpRequestManager } from "./TopUpRequestManager";
import { FinancialLedger } from "./FinancialLedger";
import { FinanceDashboard } from "./FinanceDashboard";
import { ShippingConfig } from "./ShippingConfig";

// --- TABS (Berada di folder tetangga /tabs) ---
// ✅ FIX: Mundur satu tingkat (../) lalu masuk ke folder tabs
import { UserManager } from "../tabs/UserManager";
import { FinanceManager } from "../tabs/FinanceManager";

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
  return (
    <div className="animate-in fade-in duration-500">
      {/* --- SECTION 1: DASHBOARD & MASTER --- */}
      {activeTab === "dashboard" && (
        <DashboardOverview
          isLoaded={isLoaded}
          markets={data.markets}
          darkMode={isDark}
          theme={theme}
          setAuditMarket={actions.setAuditMarket}
        />
      )}
      {activeTab === "finance-master" && <FinanceDashboard theme={theme} />}

      {/* --- SECTION 2: USER & MARKET MANAGEMENT --- */}
      {activeTab === "users" && (
        <UserManager allUsers={data.allUsers} theme={theme} />
      )}

      {activeTab === "markets" && (
        <MarketManager
          markets={data.markets}
          theme={theme}
          darkMode={isDark}
          isLoaded={isLoaded}
          refreshData={actions.fetchData}
          setAuditMarket={actions.setAuditMarket}
        />
      )}
      {activeTab === "shipping-config" && <ShippingConfig theme={theme} />}

      {/* --- SECTION 3: CONTENT MANAGEMENT --- */}
      {activeTab === "menus" && <MenuManager />}
      {activeTab === "manage-ads" && <ManageAds />}
      {activeTab === "categories" && <ManageCategories />}

      {/* --- SECTION 4: APPROVALS & VERIFICATION --- */}
      {activeTab === "verification" && (
        <VerificationCenter
          candidates={data.candidates}
          markets={data.markets}
          theme={theme}
          refreshData={actions.fetchData}
        />
      )}

      {/* --- SECTION 5: FINANCE OPERATIONS --- */}
      {activeTab === "ledger" && <FinancialLedger />}
      {activeTab === "withdrawals" && <WithdrawalManager />}
      {activeTab === "topup-requests" && <TopUpRequestManager />}

      {/* --- SECTION 6: MISC & SETTINGS --- */}
      {activeTab === "finance" && (
        <FinanceManager finance={data.finance} theme={theme} />
      )}
      {activeTab === "disputes" && <DisputeCenter />}
      {activeTab === "settings" && <GlobalConfig />}
      {activeTab === "broadcast" && <NotificationManager />}
      {activeTab === "logs" && <ActivityLogs />}
    </div>
  );
};
