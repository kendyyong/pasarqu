import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Lock, Phone, MapPin, 
  ArrowRight, Loader2, ChevronLeft, ShoppingBag 
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '',
    address: '', 
    phone: '',
    email: '', 
    password: '' 
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    console.log("--- MULAI VALIDASI ---");

    // 1. VALIDASI KETAT SEBELUM KIRIM KE SERVER
    try {
        if (!formData.name || formData.name.length < 3) throw new Error("Nama minimal 3 huruf.");
        if (!formData.address || formData.address.length < 5) throw new Error("Alamat harus lengkap.");
        
        // Bersihkan nomor HP dari karakter aneh
        const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
        if (!cleanPhone || cleanPhone.length < 10) throw new Error("Nomor HP harus valid (Min. 10 angka).");

        if (!formData.password || formData.password.length < 6) throw new Error("Password WAJIB minimal 6 karakter.");

        // 2. GENERATE EMAIL
        // Jika email kosong, pakai format: nomorHP@pasarqu.com
        const emailToRegister = formData.email.trim() !== '' 
            ? formData.email 
            : `${cleanPhone}@pasarqu.com`;

        console.log("Mendaftar dengan:", emailToRegister, "Pass:", formData.password);

        setIsLoading(true);

        // 3. KIRIM KE SUPABASE
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: emailToRegister,
            password: formData.password,
            options: { data: { full_name: formData.name } }
        });

        if (authError) throw authError;

        // 4. JIKA SUKSES, UPDATE PROFIL
        if (authData.user) {
            console.log("Auth sukses, menyimpan profil...");
            
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                name: formData.name,
                address: formData.address,
                phone_number: cleanPhone,
                email: emailToRegister,
                role: 'CUSTOMER', 
                is_verified: true, 
                created_at: new Date().toISOString()
            });

            if (profileError) {
                console.error("Gagal simpan profil:", profileError);
                // Kita biarkan lolos saja, karena akun auth sudah jadi
            }

            showToast("Pendaftaran Berhasil! Lanjut...", "success");
            
            setTimeout(() => {
                window.location.href = '/checkout'; 
            }, 1000);
        }

    } catch (err: any) {
        console.error("REGISTER ERROR:", err);
        
        // Terjemahkan error 422
        let msg = err.message;
        if (msg.includes("422")) msg = "Format data salah. Pastikan password min. 6 karakter.";
        if (msg.includes("already registered")) msg = "Nomor HP/Email ini sudah terdaftar.";
        
        showToast(msg, "error");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* BACKGROUND */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-orange-200/40 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 font-bold text-[10px] uppercase tracking-widest pl-2">
                <ChevronLeft size={16}/> Kembali ke Beranda
            </Link>

            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-teal-600 p-8 pt-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm mb-4 border border-white/10 text-white">
                            <ShoppingBag size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Daftar Pelanggan</h1>
                        <p className="text-teal-100 text-[11px] font-bold uppercase tracking-widest">Langsung Aktif & Bisa Belanja</p>
                    </div>
                </div>

                <div className="p-8 pt-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <InputGroup label="Nama Lengkap" icon={<User size={18}/>} placeholder="Nama Anda" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required={true}/>
                        <InputGroup label="Alamat Pengiriman" icon={<MapPin size={18}/>} type="text" placeholder="Jalan, RT/RW, Kelurahan..." value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} required={true}/>
                        <InputGroup label="Nomor WhatsApp" icon={<Phone size={18}/>} type="tel" placeholder="0812xxxx (Min 10 angka)" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} required={true}/>
                        <InputGroup label="Email (Opsional)" icon={<Mail size={18}/>} type="email" placeholder="nama@email.com (Boleh kosong)" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} required={false} />
                        
                        {/* PENTING: PASSWORD */}
                        <div className="space-y-1.5 text-left group">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-teal-600">Buat Password (Min 6)</label>
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600"><Lock size={18}/></div>
                                <input 
                                    type="password" 
                                    placeholder="Min. 6 Karakter" 
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-gray-300 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" 
                                    required
                                    minLength={6} // Validasi HTML Tambahan
                                />
                            </div>
                        </div>

                        <button disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-3 mt-6 disabled:opacity-70 group">
                            {isLoading ? <Loader2 className="animate-spin text-teal-400"/> : (<>Buat Akun & Bayar <ArrowRight size={16} className="text-teal-400 group-hover:translate-x-1 transition-transform"/></>)} 
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">Sudah punya akun?</p>
                        <Link to="/login" className="inline-flex items-center gap-1 text-orange-500 font-black text-[11px] uppercase tracking-widest hover:text-orange-600 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-0.5">Masuk Disini <ArrowRight size={12}/></Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const InputGroup = ({ icon, label, value, onChange, type = "text", placeholder, required = true }: any) => (
  <div className="space-y-1.5 text-left group">
      <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest group-focus-within:text-teal-600 transition-colors">
        {label} {!required && <span className="text-slate-300 font-normal italic lowercase">(boleh kosong)</span>}
      </label>
      <div className="relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">{icon}</div>
          <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-gray-300 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" required={required} />
      </div>
  </div>
);