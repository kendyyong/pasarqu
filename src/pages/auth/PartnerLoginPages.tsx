import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import { 
  Store, Bike, Shield, ArrowRight, Loader2, 
  Lock, Mail, ChevronLeft, Globe, Zap
} from 'lucide-react';

// --- TEMPLATE LOGIN UMUM (MERCHANT & COURIER) ---
// DENGAN PENJAGA PINTU KETAT (LOCKDOWN MODE)
const BaseLoginPage = ({ role, title, subtitle, icon, promoLink, dashboardUrl }: any) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Jalankan Login Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Ambil Profil User untuk Cek Jabatan (Role) secara real-time
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // 3. --- LOGIKA PENGUNCIAN KETAT ---
        // Cek apakah role user COCOK dengan pintu yang sedang ia buka
        const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
        const isCorrectRole = profile?.role === role;

        if (!isCorrectRole && !isSuperAdmin) {
            // JIKA SALAH PINTU: Langsung hancurkan session saat itu juga!
            await supabase.auth.signOut();
            
            // Tentukan identitas user tersebut untuk pesan error
            const identity = profile?.role === 'CUSTOMER' ? 'PELANGGAN' : profile?.role;
            
            // Hentikan proses dan lempar error
            setIsLoading(false);
            showToast(`DILARANG MASUK! Akun Anda adalah ${identity}. Silakan gunakan login yang sesuai.`, "error");
            return; // STOP di sini, jangan lanjut ke redirect
        }

        // 4. Jika lolos (Role benar atau Super Admin), baru izinkan pindah halaman
        showToast(`Selamat Datang, ${title}!`, "success");
        
        // Gunakan replace agar user tidak bisa tekan tombol 'back' untuk kembali ke form login
        window.location.replace(dashboardUrl);
      }
    } catch (err: any) {
      // Pastikan session bersih jika terjadi error login
      await supabase.auth.signOut();
      showToast(err.message || "Gagal Login", "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none"></div>
       <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-[100px] pointer-events-none"></div>
       
       <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 font-bold text-[10px] uppercase tracking-widest pl-2">
             <ChevronLeft size={16}/> Kembali ke Beranda
          </Link>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
             <div className="bg-teal-600 p-8 pt-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm mb-4 border border-white/10 text-white">
                        {icon}
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-1">{title}</h1>
                    <p className="text-teal-100 text-[11px] font-bold uppercase tracking-widest">{subtitle}</p>
                </div>
             </div>

             <div className="p-8 pt-8">
                <form onSubmit={handleLogin} className="space-y-5">
                   <div className="space-y-1.5 text-left group">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-teal-600 transition-colors">Email Resmi</label>
                      <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"><Mail size={18}/></div>
                          <input type="email" placeholder="contoh@email.com" className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </div>
                   </div>
                   <div className="space-y-1.5 text-left group">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-teal-600 transition-colors">Password</label>
                      <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"><Lock size={18}/></div>
                          <input type="password" placeholder="••••••" className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                      </div>
                   </div>
                   <button disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-3 mt-4 disabled:opacity-70 group">
                      {isLoading ? <Loader2 className="animate-spin text-teal-400"/> : (<>Masuk Dashboard <ArrowRight size={16} className="text-teal-400 group-hover:translate-x-1 transition-transform"/></>)} 
                   </button>
                </form>
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">Belum terdaftar sebagai mitra?</p>
                    <Link to={promoLink} className="inline-flex items-center gap-1 text-orange-500 font-black text-[11px] uppercase tracking-widest hover:text-orange-600 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-0.5">Daftar Baru Disini <ArrowRight size={12}/></Link>
                </div>
             </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest opacity-60">© Pasarqu Mitra Portal</p>
       </div>
    </div>
  );
};

// --- LOGIN ADMIN WILAYAH (PUBLIC) ---
export const AdminLogin = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', data.user.id).single();

      if (profile?.role === 'LOCAL_ADMIN') {
          if (!profile.is_verified) {
              await supabase.auth.signOut();
              throw new Error("Akun belum diverifikasi Pusat.");
          }
          showToast("Login Admin Wilayah Berhasil", "success");
          window.location.replace('/admin-wilayah');
      } else if (profile?.role === 'SUPER_ADMIN') {
          showToast("Selamat Datang kembali, Master.", "success");
          window.location.replace('/super-admin');
      } else {
          await supabase.auth.signOut();
          throw new Error("Portal ini khusus Admin Wilayah. Pelanggan dilarang masuk.");
      }

    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
       <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
       
       <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 font-bold text-[10px] uppercase tracking-widest pl-2">
             <ChevronLeft size={16}/> Kembali ke Beranda
          </Link>

          <div className="bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700">
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 pt-10 text-center relative border-b border-slate-700">
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 backdrop-blur-sm rounded-2xl shadow-inner mb-4 border border-slate-600 text-blue-400">
                        <Shield size={32}/>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-1">Admin Wilayah</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Portal Manajemen Zona</p>
                </div>
             </div>

             <div className="p-8 pt-8">
                <form onSubmit={handleAdminLogin} className="space-y-5">
                   <div className="space-y-1.5 text-left group">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-blue-500 transition-colors">Email Admin</label>
                      <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"><Mail size={18}/></div>
                          <input type="email" placeholder="admin@zona.com" className="w-full pl-14 pr-6 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </div>
                   </div>
                   <div className="space-y-1.5 text-left group">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-blue-500 transition-colors">Kode Akses</label>
                      <div className="relative">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"><Lock size={18}/></div>
                          <input type="password" placeholder="••••••" className="w-full pl-14 pr-6 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                      </div>
                   </div>
                   <button disabled={isLoading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-900/50 hover:bg-blue-500 active:scale-95 transition-all flex justify-center items-center gap-3 mt-4 disabled:opacity-70 group">
                      {isLoading ? <Loader2 className="animate-spin text-white"/> : (<>Masuk Sistem <ArrowRight size={16} className="text-white/70 group-hover:translate-x-1 transition-transform"/></>)} 
                   </button>
                </form>
                <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-2">Ingin mendaftar sebagai Admin Wilayah?</p>
                    <Link to="/promo/admin" className="inline-flex items-center gap-1 text-blue-400 font-black text-[11px] uppercase tracking-widest hover:text-blue-300 transition-colors border-b-2 border-transparent hover:border-blue-400 pb-0.5">Ajukan Permohonan <ArrowRight size={12}/></Link>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- LOGIN SUPER ADMIN (HIDDEN/SECRET) ---
export const SuperAdminLogin = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSuperLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

      if (profile?.role === 'SUPER_ADMIN') {
          showToast("Akses Diterima. Selamat Datang, Owner.", "success");
          window.location.replace('/super-admin');
      } else {
          await supabase.auth.signOut();
          throw new Error("Akses Ditolak! Anda bukan Super Admin.");
      }

    } catch (err: any) {
      showToast(err.message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
       <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-900/30 rounded-full blur-[150px] pointer-events-none"></div>
       
       <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
          <div className="bg-black/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-purple-900/50">
             <div className="p-10 pb-0 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-900/30 rounded-full border border-purple-500/30 text-purple-400 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-pulse">
                    <Globe size={40}/>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2">GOD MODE</h1>
                <p className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.3em]">Super Admin Access Only</p>
             </div>

             <div className="p-10">
                <form onSubmit={handleSuperLogin} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest ml-2">Secure ID</label>
                      <input type="email" placeholder="root@pasarmj.id" className="w-full px-6 py-4 bg-purple-900/10 border border-purple-900/50 rounded-xl text-white font-bold placeholder:text-purple-900/50 focus:border-purple-500 focus:bg-purple-900/20 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] outline-none transition-all text-center tracking-wider" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} autoFocus />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest ml-2">Passkey</label>
                      <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-purple-900/10 border border-purple-900/50 rounded-xl text-white font-bold placeholder:text-purple-900/50 focus:border-purple-500 focus:bg-purple-900/20 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] outline-none transition-all text-center tracking-[0.5em]" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                   </div>
                   <button disabled={isLoading} className="w-full py-5 bg-purple-700 text-white rounded-xl font-black uppercase text-xs tracking-[0.3em] shadow-lg shadow-purple-900/50 hover:bg-purple-600 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 mt-6 disabled:opacity-50">
                      {isLoading ? <Loader2 className="animate-spin"/> : <><Zap size={16}/> INITIATE</>} 
                   </button>
                </form>
             </div>
             <div className="bg-purple-900/20 p-4 text-center border-t border-purple-900/30">
                 <p className="text-[9px] text-purple-600 font-mono">ENCRYPTED CONNECTION ESTABLISHED</p>
             </div>
          </div>
          <div className="text-center mt-8">
             <Link to="/" className="text-xs font-bold text-gray-600 hover:text-white transition-colors uppercase tracking-widest">Abort Mission</Link>
          </div>
       </div>
    </div>
  );
};

// --- EXPORT HALAMAN LAINNYA ---

export const MerchantLogin = () => (
  <BaseLoginPage 
    role="MERCHANT" 
    title="Login Toko" 
    subtitle="Kelola produk & penjualan"
    icon={<Store size={32}/>} 
    promoLink="/promo/toko" 
    dashboardUrl="/merchant-dashboard" 
  />
);

export const CourierLogin = () => (
  <BaseLoginPage 
    role="COURIER" 
    title="Login Kurir" 
    subtitle="Akses pengiriman & pendapatan"
    icon={<Bike size={32}/>} 
    promoLink="/promo/kurir" 
    dashboardUrl="/courier-dashboard" 
  />
);