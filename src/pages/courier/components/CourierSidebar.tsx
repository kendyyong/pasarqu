import React from "react";
import {
  LayoutDashboard,
  Zap,
  History,
  MapPin,
  User,
  LogOut,
  Bike,
  Power,
  CheckCircle,
  Wallet,
} from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  courierData: any;
  onLocationClick: () => void;
  onLogout: () => void;
}

export const CourierSidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  isOnline,
  onToggleOnline,
  courierData,
  onLocationClick,
  onLogout,
}) => {
  return (
    <>
      <aside className="hidden lg:flex w-72 bg-slate-900 flex-col sticky top-0 h-screen z-30 shadow-2xl">
        <div className="p-8 text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <Bike size={22} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg tracking-tighter leading-none uppercase">
                Driver
              </h2>
              <p className="text-teal-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">
                Pasarqu Partner
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-black text-slate-100 truncate uppercase tracking-tight">
                {courierData?.name}
              </p>
              <CheckCircle size={10} className="text-blue-400" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">
              Rp{courierData?.wallet_balance?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 text-left">
          <NavItem
            icon={<Zap size={18} />}
            label="Bid Area"
            active={activeTab === "bid"}
            onClick={() => setActiveTab("bid")}
          />
          <NavItem
            icon={<History size={18} />}
            label="Riwayat"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <NavItem
            icon={<Wallet size={18} />}
            label="Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
          <NavItem
            icon={<MapPin size={18} />}
            label="Lokasi Pangkalan"
            active={false}
            onClick={onLocationClick}
          />
          <NavItem
            icon={<User size={18} />}
            label="Profil Saya"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </nav>

        <div className="p-6 space-y-3">
          <button
            onClick={onToggleOnline}
            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isOnline ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-700 text-slate-400"}`}
          >
            <Power size={14} /> {isOnline ? "ONLINE" : "OFFLINE"}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900 text-white rounded-[2rem] p-2 flex justify-around items-center z-50 shadow-2xl backdrop-blur-md bg-opacity-95 border border-white/10">
        <MobileItem
          icon={<Zap size={20} />}
          active={activeTab === "bid"}
          onClick={() => setActiveTab("bid")}
        />
        <MobileItem
          icon={<Wallet size={20} />}
          active={activeTab === "finance"}
          onClick={() => setActiveTab("finance")}
        />
        <MobileItem
          icon={<History size={20} />}
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <MobileItem
          icon={<User size={20} />}
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        />
      </div>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${active ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
  >
    <div className={active ? "text-white" : "text-slate-500"}>{icon}</div>
    <span className="flex-1 text-left">{label}</span>
  </button>
);

const MobileItem = ({ icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-full transition-all ${active ? "bg-teal-600 text-white shadow-xl scale-110" : "text-slate-400"}`}
  >
    {icon}
  </button>
);
