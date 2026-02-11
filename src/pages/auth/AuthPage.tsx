import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, Lock, ArrowRight, Loader2, Store, Bike, 
  ShieldCheck, ChevronLeft, LayoutDashboard
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });

  // --- LOGIKA DETEKSI ROLE ---
  const params = new URLSearchParams(location.search);
  const currentRole = params.get('role');

  const getRegistrationLink = () => {
    switch (currentRole) {
      case 'MERCHANT':
        return { text: "Belum punya akun Toko?", linkText: "Daftar Toko", path: "/promo/toko" };
      case 'COURIER':
        return { text: "Belum punya akun Kurir?", linkText: "Daftar Kurir", path: "/promo/kurir" };
      case 'ADMIN_CANDIDATE':
      case 'LOCAL_ADMIN':
        return { text: "Belum punya akun Mitra?", linkText: "Daftar Mitra Zona", path: "/promo/admin" };
      default:
        return { text: "Belum punya akun pelanggan?", linkText: "Daftar Sekarang", path: "/register" };
    }
  };

  const regInfo = getRegistrationLink();

  // Konfigurasi Tampilan Berdasarkan Role
  const [roleUI, setRoleUI] = useState({
    title: 'Selamat Datang',
    subtitle: 'Masuk untuk mulai bertransaksi',
    icon: <LayoutDashboard size={28} className="text-white" />
  });

  useEffect(() => {
    if (currentRole === 'MERCHANT') {
      setRoleUI({
        title: 'Login Toko',
        subtitle: 'Kelola penjualan & produk Anda',
        icon: <Store size={28} className="text-white" />
      });
    } else if (currentRole === 'COURIER') {
      setRoleUI({
        title: 'Login Kurir',
        subtitle: 'Akses orderan & pengiriman',
        icon: <Bike size={28} className="text-white" />
      });
    } else if (currentRole === 'ADMIN_CANDIDATE' || currentRole === 'LOCAL_ADMIN') {
      setRoleUI({
        title: 'Mitra Zona',
        subtitle: 'Panel kendali wilayah',
        icon: <ShieldCheck size={28} className="text-white" />
      });
    }
  }, [currentRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      let finalEmail = formData.identifier.trim();
      const isPhone = /^\d+$/.test(finalEmail);
      if (isPhone) {
        if (finalEmail.startsWith('0')) finalEmail = finalEmail.substring(1);
        finalEmail = `${finalEmail}@pasarqu.com`;
      }

      const success = await login(finalEmail, formData.password);
      
      if (success) {
          const { data: profile } = await supabase.from('profiles').select('role, is_verified, name').eq('email', finalEmail).single();
          
          if (!profile) throw new Error("Profil tidak ditemukan.");

          if ((profile.role === 'MERCHANT' || profile.role === 'COURIER' || profile.role === 'LOCAL_ADMIN') && !profile.is_verified) {
              showToast("Akun Anda sedang diverifikasi Admin.", "info");
          } else {
              showToast(`Halo, ${profile.name || 'User'}!`, "success");
          }
          
          setTimeout(() => {
            if(profile.role === 'MERCHANT') window.location.href = '/merchant-dashboard';
            else if(profile.role === 'COURIER') window.location.href = '/courier-dashboard';
            else if(profile.role === 'LOCAL_ADMIN' || profile.role === 'ADMIN_CANDIDATE') window.location.href = '/admin-wilayah';
            else window.location.href = '/customer-dashboard'; 
          }, 800);

      } else {
          showToast("Email/HP atau Password salah.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* BACKGROUND DECORATION (Subtle) */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* TOMBOL KEMBALI */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 font-bold text-[10px] uppercase tracking-widest pl-2">
            <ChevronLeft size={16}/> Kembali ke Beranda
        </Link>

        {/* CARD UTAMA */}
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
            
            {/* HEADER HIJAU TOSCA */}
            <div className="bg-teal-600 p-8 pt-10 text-center relative overflow-hidden">
                {/* Dekorasi Header */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm mb-4 border border-white/10">
                        {roleUI.icon}
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                        {roleUI.title}
                    </h1>
                    <p className="text-teal-100 text-[11px] font-bold uppercase tracking-widest">
                        {roleUI.subtitle}
                    </p>
                </div>
            </div>

            {/* FORM SECTION */}
            <div className="p-8 pt-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputGroup 
                    label="Email atau Nomor HP" 
                    icon={<Mail size={18}/>} 
                    type="text" 
                    placeholder="nama@email.com / 0812..." 
                    value={formData.identifier} 
                    onChange={(v:string)=>setFormData({...formData, identifier: v})} 
                  />
                  
                  <InputGroup 
                    label="Kata Sandi" 
                    icon={<Lock size={18}/>} 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={(v:string)=>setFormData({...formData, password: v})} 
                  />

                  {/* TOMBOL LOGIN (NAVY BLUE) */}
                  <button 
                    disabled={isLoading} 
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
                  >
                      {isLoading ? <Loader2 className="animate-spin text-teal-400"/> : (
                        <>Masuk Akun <ArrowRight size={16} className="text-teal-400 group-hover:translate-x-1 transition-transform"/></>
                      )}
                  </button>
                </form>

                {/* LINK DAFTAR (ORANGE TERANG) */}
                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">
                     {regInfo.text}
                   </p>
                   
                   <Link 
                     to={regInfo.path} 
                     className="inline-flex items-center gap-1 text-orange-500 font-black text-[11px] uppercase tracking-widest hover:text-orange-600 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-0.5"
                   >
                     {regInfo.linkText} <ArrowRight size={12}/>
                   </Link>
                </div>
            </div>
        </div>
        
        {/* Footer Copyright */}
        <p className="text-center text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest opacity-60">
            © Pasarqu Indonesia Aman & Terpercaya
        </p>
      </div>
    </div>
  );
};

// Komponen Input dengan Fokus Hijau Tosca
const InputGroup = ({ icon, label, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-1.5 text-left group">
      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-teal-600 transition-colors">{label}</label>
      <div className="relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">{icon}</div>
          <input 
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-gray-300 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" 
            required 
          />
      </div>
  </div>
);