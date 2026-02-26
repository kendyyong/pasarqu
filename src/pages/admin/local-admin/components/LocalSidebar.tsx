import React, { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Truck,
  Users,
  LogOut,
  Radio,
  BarChart3,
  ChevronRight,
  ShieldAlert,
  Megaphone,
  ShoppingBag,
  ClipboardCheck,
  Menu,
  X,
  UserCog, // 🚀 Tambah Icon UserCog
} from "lucide-react";

interface Props {
  marketName: string;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  pendingMerchants: number;
  pendingCouriers: number;
  pendingProducts: number;
  onLogout: () => void;
  disabled?: boolean; // 🚀 TAMBAHKAN PROPS DISABLED
}

export const LocalSidebar: React.FC<Props> = ({
  marketName,
  activeTab,
  setActiveTab,
  pendingMerchants,
  pendingCouriers,
  pendingProducts,
  onLogout,
  disabled = false, // 🚀 TERIMA PROPS DISABLED (Default False)
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 🚀 LOGIKA PROTEKSI: Cegah navigasi jika terkunci, kecuali settings
  const handleNavClick = (tab: string) => {
    if (disabled && tab !== "settings") return;
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* 📱 MOBILE HEADER BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-slate-100 z-[60] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-black border-b-2 border-[#008080]">
            P
          </div>
          <span className="font-black text-[14px] tracking-tighter uppercase">
            PASARQU
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 bg-slate-900 text-white rounded-md"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 🌑 OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[65] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 🚀 SIDEBAR CORE */}
      <aside
        className={`
        w-72 bg-white border-r-2 border-slate-200 h-screen fixed left-0 top-0 z-[70] flex flex-col font-black uppercase tracking-tighter antialiased shadow-xl text-left transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* BRANDING SECTION */}
        <div className="p-6 border-b-4 border-[#008080] bg-slate-50">
          <div className="flex items-center justify-between mb-6 lg:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg font-black text-2xl border-b-4 border-[#008080]">
                P
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-black text-[18px] text-slate-900 tracking-tighter leading-none">
                  PASARQU
                </h2>
                <p className="text-[10px] font-black text-[#008080] tracking-[0.2em] mt-1 truncate">
                  LOCAL NODE ADMIN
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          {/* WILAYAH TUGAS CARD */}
          <div className="mt-6 p-4 bg-slate-900 rounded-md border-l-4 border-[#008080] shadow-md">
            <p className="text-[9px] font-black text-[#008080] tracking-widest leading-none mb-1.5 uppercase">
              ZONA OPERASIONAL
            </p>
            <p className="text-[12px] font-black text-white uppercase truncate">
              {marketName || "PASAR WILAYAH"}
            </p>
          </div>
        </div>

        {/* NAVIGATION SECTION */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar bg-white">
          <GroupLabel label="PROFIL & OPERASIONAL" />

          {/* 🚀 MENU SETTINGS (Selalu Aktif) */}
          <NavItem
            icon={<UserCog size={20} />}
            label="PENGATURAN AKUN"
            active={activeTab === "settings"}
            onClick={() => handleNavClick("settings")}
          />

          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="OVERVIEW"
            active={activeTab === "overview"}
            onClick={() => handleNavClick("overview")}
            disabled={disabled} // 🚀 Oper status disabled
          />
          <NavItem
            icon={<ShoppingBag size={20} />}
            label="PESANAN MASUK"
            active={activeTab === "orders"}
            onClick={() => handleNavClick("orders")}
            disabled={disabled}
          />
          <NavItem
            icon={
              <Radio
                size={20}
                className={
                  activeTab === "radar" && !disabled
                    ? "animate-pulse text-[#FF6600]"
                    : ""
                }
              />
            }
            label="RADAR LIVE"
            active={activeTab === "radar"}
            onClick={() => handleNavClick("radar")}
            disabled={disabled}
          />

          <GroupLabel label="VERIFIKASI & ASSET" />
          <NavItem
            icon={<ClipboardCheck size={20} />}
            label="PRODUK BARU"
            active={activeTab === "products"}
            onClick={() => handleNavClick("products")}
            count={pendingProducts}
            isAlert={pendingProducts > 0}
            disabled={disabled}
          />
          <NavItem
            icon={<Store size={20} />}
            label="MITRA TOKO"
            active={activeTab === "merchants"}
            onClick={() => handleNavClick("merchants")}
            count={pendingMerchants}
            disabled={disabled}
          />
          <NavItem
            icon={<Truck size={20} />}
            label="MITRA KURIR"
            active={activeTab === "couriers"}
            onClick={() => handleNavClick("couriers")}
            count={pendingCouriers}
            disabled={disabled}
          />

          <GroupLabel label="LAPORAN & LAINNYA" />
          <NavItem
            icon={<BarChart3 size={20} />}
            label="KEUANGAN"
            active={activeTab === "finance"}
            onClick={() => handleNavClick("finance")}
            disabled={disabled}
          />
          <NavItem
            icon={<Megaphone size={20} />}
            label="SIARAN WARGA"
            active={activeTab === "broadcast"}
            onClick={() => handleNavClick("broadcast")}
            disabled={disabled}
          />
          <NavItem
            icon={<ShieldAlert size={20} />}
            label="PUSAT BANTUAN"
            active={activeTab === "resolution"}
            onClick={() => handleNavClick("resolution")}
            disabled={disabled}
          />
        </nav>

        {/* FOOTER SECTION */}
        <div className="p-4 border-t-2 border-slate-100 bg-slate-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-4 text-slate-500 hover:text-white hover:bg-red-500 rounded-md transition-all duration-200 group active:translate-y-0.5 shadow-sm"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-[12px] font-black uppercase tracking-widest">
              LOGOUT SYSTEM
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

// --- SUB-KOMPONEN NAV ITEM ---
const NavItem = ({
  icon,
  label,
  active,
  onClick,
  count,
  isAlert,
  disabled,
}: any) => {
  // Jika ini bukan menu settings dan sedang mode disabled
  const isLocked = disabled && label !== "PENGATURAN AKUN";

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        w-full flex items-center justify-between px-4 py-3.5 rounded-md transition-all duration-200 group
        ${
          active
            ? "bg-[#008080] text-white shadow-lg"
            : isLocked
              ? "bg-transparent text-slate-300 cursor-not-allowed opacity-50 grayscale"
              : "bg-transparent text-slate-600 hover:bg-teal-50 hover:text-[#008080]"
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-6 h-6 flex items-center justify-center transition-colors shrink-0 ${
            active
              ? "text-white"
              : isLocked
                ? "text-slate-200"
                : "text-slate-400 group-hover:text-[#008080]"
          }`}
        >
          {icon}
        </div>
        <span className="text-[12px] font-black tracking-tight text-left leading-none uppercase">
          {label}
        </span>
      </div>

      {count !== undefined && count > 0 && !isLocked && (
        <span
          className={`px-2.5 py-1 rounded-md text-[10px] font-black min-w-[24px] text-center shadow-sm ${
            isAlert
              ? "bg-[#FF6600] text-white animate-pulse"
              : "bg-white text-[#008080]"
          }`}
        >
          {count}
        </span>
      )}

      {active && !isLocked && (
        <ChevronRight size={16} className="text-white/30" />
      )}
    </button>
  );
};

const GroupLabel = ({ label }: { label: string }) => (
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mt-8 mb-2 text-left">
    {label}
  </p>
);
