import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import { 
  Store, ArrowRight, Loader2, Star, 
  ShieldCheck, MapPin, Smartphone, Mail, Lock, User, ChevronLeft, Map
} from 'lucide-react';

export const MerchantPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [detectedMarketName, setDetectedMarketName] = useState<string>("");
  
  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', phone: '', shopName: '', address: '', market_id: ''
  });

  // LOGIKA CERDAS: Cek LocalStorage dulu
  useEffect(() => {
    const initPage = async () => {
        // 1. Cek apakah user sudah memilih pasar sebelumnya
        const savedMarketId = localStorage.getItem('selected_market_id');

        if (savedMarketId) {
            // Jika ada, ambil namanya dan kunci ID-nya
            const { data } = await supabase.from('markets').select('name').eq('id', savedMarketId).single();
            if (data) {
                setDetectedMarketName(data.name);
                setFormData(prev => ({ ...prev, market_id: savedMarketId }));
            }
        } else {
            // Jika tidak ada (datang dari link share), ambil daftar semua pasar
            const { data } = await supabase.from('markets').select('id, name');
            if (data) setMarkets(data);
        }
    };
    initPage();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
        if (!formData.market_id) throw new Error("Wilayah pasar belum terdeteksi. Silakan pilih pasar.");

        // 1. DAFTAR AUTH
        const { data, error } = await supabase.auth.signUp({ 
            email: formData.email, 
            password: formData.password 
        });
        
        if (error) throw error;

        // Jeda sinkronisasi database
        await new Promise(r => setTimeout(r, 1500));

        // 2. SIMPAN PROFIL (Status Pending / is_verified: false)
        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email: formData.email,
                name: formData.name,
                phone_number: formData.phone,
                address: formData.address,
                role: 'MERCHANT', 
                shop_name: formData.shopName, 
                is_verified: false, // <-- INI KUNCINYA (Masuk DB tapi belum aktif)
                managed_market_id: formData.market_id,
                created_at: new Date().toISOString()
            });

            if (profileError) throw profileError;

            showToast("Pendaftaran Berhasil! Menunggu Verifikasi Admin.", "success");

            setTimeout(() => {
                window.location.href = '/login?role=MERCHANT';
            }, 800);
        }
    } catch (err: any) { 
        showToast(err.message, "error"); 
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative overflow-hidden flex items-center justify-center p-4 md:p-8 text-left">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
            {/* BAGIAN KIRI (PROMO) - Sama seperti sebelumnya */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 order-2 lg:order-1 text-left">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                    <Star size={14} className="text-orange-500 fill-orange-500"/>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peluang Bisnis</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 text-slate-900 uppercase tracking-tighter">
                    Ubah Toko Biasa <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500">Jadi Mesin Uang.</span>
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-lg font-medium uppercase text-[12px] tracking-wide">
                    Bergabunglah menjadi Mitra Toko Resmi dan nikmati lonjakan pesanan dari warga sekitar wilayah Anda!
                </p>
                <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-1.5 rounded-full border border-gray-200 bg-white text-[10px] font-black uppercase text-slate-500 flex items-center gap-2 shadow-sm">
                        <ShieldCheck size={12} className="text-green-500"/> Data Masuk ke Admin Lokal
                    </div>
                </div>
            </div>

            {/* BAGIAN KANAN (FORM) */}
            <div className="order-1 lg:order-2">
                <div className="bg-white border border-gray-200 rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-gray-300/50 animate-in slide-in-from-bottom duration-700">
                    <div className="flex justify-between items-center mb-8 text-left">
                        <div>
                            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest mb-4"><ChevronLeft size={14}/> Kembali</Link>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Daftar Toko</h2>
                        </div>
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><Store size={28}/></div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        
                        {/* AREA PASAR OTOMATIS */}
                        <div className="space-y-1 text-left group">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Wilayah Pasar</label>
                            {detectedMarketName ? (
                                // JIKA SUDAH PILIH PASAR (TAMPILAN TERKUNCI)
                                <div className="w-full pl-4 pr-4 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-sm font-bold text-indigo-800 flex items-center gap-2">
                                    <Map size={16}/> {detectedMarketName} <span className="text-[10px] bg-indigo-200 px-2 py-0.5 rounded text-indigo-800 ml-auto">TERKUNCI</span>
                                </div>
                            ) : (
                                // JIKA BELUM PILIH PASAR (TAMPILAN DROPDOWN)
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Map size={16}/></div>
                                    <select 
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                        value={formData.market_id}
                                        onChange={(e) => setFormData({...formData, market_id: e.target.value})}
                                    >
                                        <option value="">-- Pilih Wilayah Pasar --</option>
                                        {markets.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Nama Pemilik" icon={<User/>} placeholder="Nama Pemilik" value={formData.name} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                            <InputGroup label="WhatsApp" icon={<Smartphone/>} placeholder="0812xxxx" value={formData.phone} onChange={(e:any)=>setFormData({...formData, phone:e.target.value})} />
                        </div>
                        <InputGroup label="Nama Toko" icon={<Store/>} placeholder="Contoh: Berkah Jaya" value={formData.shopName} onChange={(e:any)=>setFormData({...formData, shopName:e.target.value})} />
                        <InputGroup label="Alamat Toko" icon={<MapPin/>} placeholder="Jalan, RT/RW, Nomor..." value={formData.address} onChange={(e:any)=>setFormData({...formData, address:e.target.value})} />
                        
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Email" icon={<Mail/>} type="email" placeholder="nama@toko.com" value={formData.email} onChange={(e:any)=>setFormData({...formData, email:e.target.value})} />
                            <InputGroup label="Password" icon={<Lock/>} type="password" placeholder="••••••" value={formData.password} onChange={(e:any)=>setFormData({...formData, password:e.target.value})} />
                        </div>
                        
                        <button disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex justify-center items-center gap-2 mt-6 group">
                            {isLoading ? <Loader2 className="animate-spin"/> : 'Daftar & Tunggu Verifikasi'} {!isLoading && <ArrowRight size={16}/>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

const InputGroup = ({ icon, label, ...props }: any) => (
    <div className="space-y-1 w-full text-left group">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest group-focus-within:text-indigo-600 transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600">{React.cloneElement(icon, { size: 16 })}</div>
            <input {...props} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" required />
        </div>
    </div>
);