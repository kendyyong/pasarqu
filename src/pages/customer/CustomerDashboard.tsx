import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  User, MapPin, ShoppingBag, 
  ChevronRight, LogOut, Ticket, Star, 
  Settings, Bell, CreditCard,
  Package, Truck, CheckCircle2, ArrowLeft, Heart, Wallet, ShieldCheck 
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleGoBackToMarket = () => {
    navigate('/'); 
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12 text-left selection:bg-teal-500/10">
      
      {/* --- TOP NAVIGATION --- */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-end gap-3">
          <button className="p-2.5 bg-slate-100 rounded-xl text-slate-400 relative hover:bg-slate-200 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors"><Settings size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-6 md:mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* --- LEFT COLUMN: PROFILE CARD --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 shadow-lg relative overflow-hidden group border border-teal-500/20">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/30 shadow-2xl mb-5">
                        <User size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white leading-none">
                      {profile?.name || 'User Pasarqu'}
                    </h2>
                    <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mt-3">
                      {user?.email}
                    </p>
                    <div className="mt-8 flex gap-2 w-full">
                        <div className="flex-1 bg-black/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-left text-white">
                            <p className="text-[8px] font-black text-teal-200 uppercase tracking-widest mb-1 opacity-70">Poin</p>
                            <p className="text-lg font-black leading-none">1.250</p>
                        </div>
                        <div className="flex-1 bg-black/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-left text-orange-300">
                            <p className="text-[8px] font-black text-orange-200 uppercase tracking-widest mb-1 opacity-70">Level</p>
                            <p className="text-lg font-black leading-none uppercase">Gold</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* WALLET MINI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between group hover:border-teal-500 transition-all cursor-pointer text-left shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:scale-110 transition-transform"><Wallet size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Anda</p>
                        <h4 className="text-xl font-black text-slate-800 leading-none mt-1">Rp450.000</h4>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Pesanan</h3>
                    <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">Semua Riwayat</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatusItem icon={<CreditCard size={22}/>} label="Belum Bayar" count={0} />
                    <StatusItem icon={<Package size={22}/>} label="Pengemasan" count={2} active />
                    <StatusItem icon={<Truck size={22}/>} label="Pengiriman" count={1} />
                    <StatusItem icon={<Star size={22}/>} label="Beri Ulasan" count={5} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MenuCard icon={<Ticket/>} title="Voucher Saya" desc="4 Voucher aktif tersedia" color="text-orange-500" />
                <MenuCard icon={<MapPin/>} title="Daftar Alamat" desc={profile?.address || "Atur alamat utama"} color="text-teal-500" />
                <MenuCard icon={<Heart/>} title="Favorit" desc="12 Produk disukai" color="text-rose-500" />
                <MenuCard icon={<ShieldCheck/>} title="Keamanan" desc="Update password & data" color="text-blue-500" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 pb-10">
                <button 
                    onClick={handleGoBackToMarket} 
                    className="py-4 rounded-xl bg-teal-600 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-900/20"
                >
                    <ArrowLeft size={16}/> Kembali Belanja
                </button>
                
                <button 
                    onClick={handleLogout} 
                    className="py-4 rounded-xl bg-white border border-rose-200 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
                >
                    <LogOut size={16}/> Keluar Aplikasi
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const StatusItem = ({ icon, label, count, active }: any) => (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 border ${active ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-teal-200'} group cursor-pointer`}>
        <div className={`relative ${active ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-600'}`}>
            {icon}
            {count > 0 && <span className="absolute -top-3 -right-3 bg-orange-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{count}</span>}
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight ${active ? 'text-teal-700' : 'text-slate-400 group-hover:text-teal-600'}`}>{label}</span>
    </div>
);

const MenuCard = ({ icon, title, desc, color }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-teal-500 transition-all shadow-sm">
        <div className="flex items-center gap-4 text-left min-w-0">
            <div className={`p-4 bg-slate-50 rounded-lg ${color} shrink-0 group-hover:scale-110 transition-transform`}>{React.cloneElement(icon as React.ReactElement, { size: 22 })}</div>
            <div className="min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 group-hover:text-teal-600 transition-colors truncate">{title}</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate">{desc}</p>
            </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-600 transition-all" />
    </div>
);