import React from "react";
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Activity,
  BellRing,
} from "lucide-react";

// IMPORT SEMUA TAB
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
    // 🚀 TAMBAHKAN DUA DATA BARU INI DI PROPS
    weeklyChartData?: any[];
    recentActivities?: any[];
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 font-black uppercase tracking-tighter text-left">
      {/* 1. TAB OVERVIEW - GAYA INDUSTRIAL GAHAR */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KARTU OMSET - SLATE DARK */}
            <div className="bg-slate-900 rounded-md p-6 text-white flex justify-between items-center relative overflow-hidden shadow-xl border-b-8 border-[#008080]">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">
                  OMSET PASAR (HARI INI)
                </p>
                <h2 className="text-3xl font-black text-[#008080]">
                  RP {data.marketFinance.revenue.toLocaleString()}
                </h2>
              </div>
              <TrendingUp
                className="text-white/5 absolute right-[-10px] bottom-[-10px]"
                size={140}
              />
            </div>

            {/* KARTU LAYANAN - HIJAU TOSCA */}
            <div className="bg-[#008080] rounded-md p-6 text-white flex justify-between items-center shadow-xl border-b-8 border-slate-900">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">
                  TOTAL BIAYA LAYANAN
                </p>
                <h2 className="text-3xl font-black text-white">
                  RP {data.marketFinance.serviceFees.toLocaleString()}
                </h2>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-md flex items-center justify-center backdrop-blur-sm border border-white/20">
                <BarChart3 size={32} />
              </div>
            </div>
          </div>

          {/* DETAIL STATS BAWAH */}
          <div className="bg-white border-2 border-slate-200 rounded-md shadow-sm">
            <LocalOverviewTab
              stats={{
                pendingProducts: data.pendingProducts.length,
                merchants: data.myMerchants.length,
                couriers: data.myCouriers.length,
                adminShare: data.marketFinance.serviceFees,
              }}
              // 🚀 TERUSKAN DATA ASLI KE KOMPONEN GRAFIK
              chartData={data.weeklyChartData}
              activities={data.recentActivities}
            />
          </div>
        </div>
      )}

      {/* 2. TAB PRODUCTS */}
      {activeTab === "products" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalProductsTab
            products={data.pendingProducts}
            onAction={() => {
              actions.fetchData();
              actions.stopAlarm();
            }}
          />
        </div>
      )}

      {/* 3. TAB ORDERS */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalOrdersTab marketId={data.profile?.managed_market_id || ""} />
        </div>
      )}

      {/* 4. TAB RADAR */}
      {activeTab === "radar" && (
        <div className="rounded-md overflow-hidden border-2 border-slate-200 shadow-xl">
          <LocalRadarTab
            isLoaded={data.isLoaded}
            myMarket={data.myMarket}
            merchants={data.myMerchants}
            couriers={data.myCouriers}
            customers={data.myCustomers}
          />
        </div>
      )}

      {/* 5. TAB FINANCE */}
      {activeTab === "finance" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalFinanceTab
            merchants={data.myMerchants}
            couriers={data.myCouriers}
          />
        </div>
      )}

      {/* 6. TAB RATINGS */}
      {activeTab === "ratings" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalRatingsTab
            merchants={data.myMerchants}
            couriers={data.myCouriers}
          />
        </div>
      )}

      {/* 7. TAB RESOLUTION / HELP */}
      {activeTab === "resolution" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalResolutionTab />
        </div>
      )}

      {/* 8. TAB BROADCAST */}
      {activeTab === "broadcast" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalBroadcastTab
            marketId={data.profile?.managed_market_id || ""}
            marketName={data.myMarket?.name || "WILAYAH"}
            customerCount={data.myCustomers.length}
          />
        </div>
      )}

      {/* 9. TAB COURIERS (MONITOR) */}
      {activeTab === "couriers" && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalCourierMonitor />
        </div>
      )}

      {/* 10. TAB USERS (MERCHANTS & CUSTOMERS) */}
      {(activeTab === "merchants" || activeTab === "customers") && (
        <div className="bg-white rounded-md border-2 border-slate-200 shadow-sm p-2">
          <LocalUsersTab
            type={activeTab}
            data={
              activeTab === "merchants" ? data.myMerchants : data.myCustomers
            }
            onViewDetail={(u: any) =>
              actions.setDetailModal({ isOpen: true, user: u })
            }
            onRefresh={actions.fetchData}
          />
        </div>
      )}

      {/* --- EMERGENCY ALARM OVERLAY - INDUSTRIAL RED --- */}
      {isAlarmActive && (
        <div className="mt-10 p-12 bg-white rounded-md border-4 border-[#FF6600] shadow-2xl text-center animate-in zoom-in-95 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#FF6600] animate-pulse"></div>
          <AlertTriangle
            size={64}
            className="mx-auto text-[#FF6600] mb-6 animate-bounce"
          />
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            TINDAKAN DIPERLUKAN!
          </h3>
          <p className="text-[12px] font-black text-slate-400 uppercase mt-4 tracking-widest">
            PERIKSA PENDAFTARAN MITRA ATAU PRODUK BARU SEKARANG.
          </p>
          <button
            onClick={actions.stopAlarm}
            className="mt-8 px-12 py-4 bg-slate-900 text-white rounded-md font-black uppercase text-[12px] tracking-widest shadow-xl hover:bg-[#FF6600] transition-all border-b-4 border-black/20"
          >
            MATIKAN ALARM SISTEM
          </button>
        </div>
      )}
    </div>
  );
};
