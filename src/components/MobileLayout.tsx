import React from 'react';
import { AppLogo } from './AppLogo';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'search' | 'orders' | 'account';
  onTabChange: (tab: any) => void;
  searchTerm?: string;
  onSearch: (val: string) => void;
  onCartClick: () => void;
  cartCount: number;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'home', label: 'Beranda', icon: '🏠' },
    { id: 'search', label: 'Cari', icon: '🔍' },
    { id: 'orders', label: 'Pesanan', icon: '🛍️' },
    { id: 'account', label: 'Saya', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-x-hidden">
      
      {/* AREA KONTEN UTAMA */}
      {/* Di Desktop: Lebar maksimal 1200px agar mirip Shopee Web.
          Di Mobile: Lebar otomatis 100%.
      */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto bg-white md:bg-transparent min-h-screen relative pb-20 md:pb-10">
        {children}
      </main>

      {/* NAVIGASI BAWAH: Hanya muncul di HP (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-100 flex justify-around items-center py-2 z-[2000] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === tab.id ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* FOOTER SEDERHANA ALA SHOPEE (Desktop Only) */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-10">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-4 gap-8 text-left">
          <div>
            <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs">Layanan Pelanggan</h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>Bantuan</li>
              <li>Metode Pembayaran</li>
              <li>Lacak Pesanan</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-4 uppercase text-xs">Jelajahi Pasarqu</h4>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>Tentang Kami</li>
              <li>Kebijakan Privasi</li>
              <li>Blog Resmi</li>
            </ul>
          </div>
          <div className="col-span-2 text-right">
            <AppLogo size="sm" regionName="MJ" className="justify-end mb-4" />
            <p className="text-[10px] text-slate-400">© 2026 Pasarqu Mulyojati. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};