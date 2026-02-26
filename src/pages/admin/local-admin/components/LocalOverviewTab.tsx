import React, { useState } from "react";
import {
  Store,
  Truck,
  Package,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

// 🚀 DISINI KUNCINYA: Menambahkan chartData & activities ke dalam Interface
interface Props {
  stats: {
    pendingProducts: number;
    merchants: number;
    couriers: number;
    adminShare: number;
  };
  chartData?: any[]; // <-- Tambahan ini
  activities?: any[]; // <-- Tambahan ini
}

export const LocalOverviewTab: React.FC<Props> = ({
  stats,
  chartData = [],
  activities = [],
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Data cadangan jika database kosong
  const safeChartData =
    chartData.length > 0
      ? chartData
      : [
          { day: "SEN", value: 0, height: "10%" },
          { day: "SEL", value: 0, height: "10%" },
          { day: "RAB", value: 0, height: "10%" },
          { day: "KAM", value: 0, height: "10%" },
          { day: "JUM", value: 0, height: "10%" },
          { day: "SAB", value: 0, height: "10%" },
          { day: "MIN", value: 0, height: "10%" },
        ];

  const totalWeekly = safeChartData.reduce(
    (acc, curr) => acc + (curr.value || 0),
    0,
  );

  const renderIcon = (iconName: string, className: string) => {
    if (iconName === "CheckCircle2")
      return <CheckCircle2 size={16} className={className} />;
    if (iconName === "AlertCircle")
      return <AlertCircle size={16} className={className} />;
    return <ShoppingBag size={16} className={className} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-10">
      {/* --- GRID STATISTIK --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="PRODUK PENDING"
          value={stats.pendingProducts}
          icon={<Package size={20} />}
          iconColor="text-[#FF6600]"
          isAlert={stats.pendingProducts > 0}
        />
        <StatCard
          label="MITRA TOKO"
          value={stats.merchants}
          icon={<Store size={20} />}
          iconColor="text-[#008080]"
        />
        <StatCard
          label="MITRA KURIR"
          value={stats.couriers}
          icon={<Truck size={20} />}
          iconColor="text-slate-900"
        />
        <StatCard
          label="PROFIT HARI INI"
          value={`RP ${stats.adminShare.toLocaleString()}`}
          icon={<DollarSign size={20} />}
          iconColor="text-[#008080]"
        />
      </div>

      {/* --- GRAFIK & AKTIVITAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-md shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-[#008080]" size={20} /> PROFIT 7
                HARI
              </h3>
              <p className="text-[10px] text-slate-400 tracking-widest mt-1 uppercase">
                TOTAL MINGGU INI:{" "}
                <span className="text-[#008080]">
                  RP {totalWeekly.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-[10px] text-slate-500 font-black">
              LIVE DATA
            </div>
          </div>
          <div className="flex-1 min-h-[200px] flex items-end justify-between gap-2 md:gap-4 relative z-10 mt-auto pt-10">
            {safeChartData.map((data, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center flex-1 h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  className={`absolute -top-10 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg transition-all duration-300 z-20 ${hoveredBar === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
                >
                  RP {data.value.toLocaleString()}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
                <div
                  style={{ height: data.height }}
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${hoveredBar === index ? "bg-[#FF6600]" : "bg-[#008080]"}`}
                ></div>
                <p
                  className={`mt-3 text-[10px] font-black ${hoveredBar === index ? "text-[#FF6600]" : "text-slate-400"}`}
                >
                  {data.day}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#008080]/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* LIVE ACTIVITY FEED */}
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg text-slate-800 flex items-center gap-2">
              <Activity className="text-[#FF6600]" size={20} /> LIVE ACTIVITY
            </h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[250px] pr-2 no-scrollbar text-left">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3 items-start group">
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${act.bgClass} border border-white shadow-sm`}
                  >
                    {renderIcon(act.iconName, act.colorClass)}
                  </div>
                  <div>
                    <h4 className="text-[11px] text-slate-800 leading-tight font-black uppercase">
                      {act.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 tracking-widest mt-0.5 uppercase">
                      {act.desc}
                    </p>
                    <p className="text-[8px] text-slate-400 flex items-center gap-1 mt-1 font-black uppercase">
                      <Clock size={10} /> {act.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[10px] text-slate-300 mt-10 font-black uppercase">
                BELUM ADA AKTIVITAS
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, iconColor, isAlert }: any) => (
  <div className="bg-white p-6 rounded-md shadow-sm relative overflow-hidden group hover:bg-slate-50 transition-all border border-slate-100 text-left">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-10 h-10 bg-slate-100 ${iconColor} flex items-center justify-center rounded-md shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all z-10 relative`}
      >
        {icon}
      </div>
      {isAlert && (
        <span className="flex h-3 w-3 relative z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6600] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6600]"></span>
        </span>
      )}
    </div>
    <div className="space-y-1 relative z-10">
      <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
        {label}
      </p>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">
          {value}
        </h3>
        <ArrowUpRight
          size={16}
          className="text-slate-200 group-hover:text-slate-900"
        />
      </div>
    </div>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity transform group-hover:scale-110 duration-500">
      {React.cloneElement(icon as React.ReactElement, { size: 100 })}
    </div>
  </div>
);
