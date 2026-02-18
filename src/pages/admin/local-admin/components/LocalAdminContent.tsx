import React from "react";
import { TrendingUp, BarChart3, AlertTriangle } from "lucide-react";

// IMPORT SEMUA TAB (Pastikan file ini ada di folder components)
import { LocalOverviewTab } from "./LocalOverviewTab";
import { LocalProductsTab } from "./LocalProductsTab";
import { LocalUsersTab } from "./LocalUsersTab";
import { LocalRadarTab } from "./LocalRadarTab";
import { LocalFinanceTab } from "./LocalFinanceTab";
import { LocalRatingsTab } from "./LocalRatingsTab";
import { LocalResolutionTab } from "./LocalResolutionTab";
import { LocalBroadcastTab } from "./LocalBroadcastTab";
import { LocalOrdersTab } from "./LocalOrdersTab";
import { LocalCourierMonitor } from "./LocalCourierMonitor";

interface Props {
  activeTab: string;
  isAlarmActive: boolean;
  data: {
    myMarket: any;
    myMerchants: any[];
    myCouriers: any[];
    myCustomers: any[];
    pendingProducts: any[];
    marketFinance: { revenue: number; serviceFees: number };
    profile: any;
    isLoaded: boolean;
  };
  actions: {
    fetchData: () => void;
    stopAlarm: () => void;
    setDetailModal: (val: any) => void;
  };
}

export const LocalAdminContent: React.FC<Props> = ({
  activeTab,
  isAlarmActive,
  data,
  actions,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. TAB OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                  Omzet Pasar (Hari Ini)
                </p>
                <h2 className="text-3xl font-black italic">
                  Rp {data.marketFinance.revenue.toLocaleString()}
                </h2>
              </div>
              <TrendingUp
                className="text-white/5 absolute right-[-10px] bottom-[-10px]"
                size={120}
              />
            </div>
            <div className="bg-teal-600 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl">
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">
                  Total Biaya Layanan
                </p>
                <h2 className="text-3xl font-black italic">
                  Rp {data.marketFinance.serviceFees.toLocaleString()}
                </h2>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <BarChart3 size={28} />
              </div>
            </div>
          </div>
          <LocalOverviewTab
            stats={{
              pendingProducts: data.pendingProducts.length,
              merchants: data.myMerchants.length,
              couriers: data.myCouriers.length,
              adminShare: data.marketFinance.serviceFees,
            }}
          />
        </div>
      )}

      {/* 2. TAB PRODUCTS */}
      {activeTab === "products" && (
        <LocalProductsTab
          products={data.pendingProducts}
          onAction={() => {
            actions.fetchData();
            actions.stopAlarm();
          }}
        />
      )}

      {/* 3. TAB ORDERS */}
      {activeTab === "orders" && (
        <LocalOrdersTab marketId={data.profile?.managed_market_id || ""} />
      )}

      {/* 4. TAB RADAR */}
      {activeTab === "radar" && (
        <LocalRadarTab
          isLoaded={data.isLoaded}
          myMarket={data.myMarket}
          merchants={data.myMerchants}
          couriers={data.myCouriers}
          customers={data.myCustomers}
        />
      )}

      {/* 5. TAB FINANCE */}
      {activeTab === "finance" && (
        <LocalFinanceTab
          merchants={data.myMerchants}
          couriers={data.myCouriers}
        />
      )}

      {/* 6. TAB RATINGS */}
      {activeTab === "ratings" && (
        <LocalRatingsTab
          merchants={data.myMerchants}
          couriers={data.myCouriers}
        />
      )}

      {/* 7. TAB RESOLUTION / HELP */}
      {activeTab === "resolution" && <LocalResolutionTab />}

      {/* 8. TAB BROADCAST */}
      {activeTab === "broadcast" && (
        <LocalBroadcastTab
          marketId={data.profile?.managed_market_id || ""}
          marketName={data.myMarket?.name || "Wilayah"}
          customerCount={data.myCustomers.length}
        />
      )}

      {/* 9. TAB COURIERS (MONITOR) */}
      {activeTab === "couriers" && <LocalCourierMonitor />}

      {/* 10. TAB USERS (MERCHANTS & CUSTOMERS) */}
      {(activeTab === "merchants" || activeTab === "customers") && (
        <LocalUsersTab
          type={activeTab}
          data={activeTab === "merchants" ? data.myMerchants : data.myCustomers}
          onViewDetail={(u: any) =>
            actions.setDetailModal({ isOpen: true, user: u })
          }
          onRefresh={actions.fetchData}
        />
      )}

      {/* --- EMERGENCY ALARM OVERLAY --- */}
      {isAlarmActive && (
        <div className="mt-10 p-16 bg-white rounded-[3rem] border border-red-100 shadow-2xl text-center animate-in zoom-in-95">
          <AlertTriangle
            size={60}
            className="mx-auto text-red-500 mb-6 animate-bounce"
          />
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Tindakan Diperlukan!
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase mt-2">
            Periksa pendaftaran mitra atau produk baru.
          </p>
          <button
            onClick={actions.stopAlarm}
            className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"
          >
            Matikan Alarm
          </button>
        </div>
      )}
    </div>
  );
};
