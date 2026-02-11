import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import { 
  Shield, ArrowRight, Loader2, 
  Map, User, Smartphone, Mail, Lock, ChevronLeft
} from 'lucide-react';

export const AdminPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [detectedMarketName, setDetectedMarketName] = useState<string>("");
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '', market_id: '' });

  useEffect(() => {
    const initPage = async () => {
        const savedMarketId = localStorage.getItem('selected_market_id');
        if (savedMarketId) {
            const { data } = await supabase.from('markets').select('name').eq('id', savedMarketId).single();
            if (data) {
                setDetectedMarketName(data.name);
                setFormData(prev => ({ ...prev, market_id: savedMarketId }));
            }
        } else {
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
        if (!formData.market_id) throw new Error("Pilih Pasar yang akan Anda kelola!");

        const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
        if (error) throw error;
        
        await new Promise(r => setTimeout(r, 1500));

        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email: formData.email,
                name: formData.name,
                phone_number: formData.phone,
                role: 'LOCAL_ADMIN', 
                managed_market_id: formData.market_id,
                is_verified: false,
                created_at: new Date().toISOString()
            });

            if (profileError) throw profileError;

            showToast("Permintaan Admin Terkirim!", "success");
            
            setTimeout(() => {
                window.location.href = '/login?role=ADMIN_CANDIDATE';
            }, 800);
        }
    } catch (err: any) { 
        showToast(err.message, "error"); 
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative overflow-hidden flex items-center justify-center p-4 md:p-8 text-left">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center text-left">
            <div className="space-y-8 animate-in slide-in-from-left duration-700 order-2 lg:order-1 text-left">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                    <Shield size={14} className="text-blue-600 fill-blue-50"/>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Otoritas Wilayah</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 text-slate-900 uppercase tracking-tighter">
                    Kelola Pasar <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Secara Digital.</span>
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed max-w-lg font-medium uppercase text-[12px] tracking-wide">
                    Pengajuan Anda akan ditinjau oleh Pusat. Data akan masuk ke sistem sebagai "Pending" hingga disetujui.
                </p>
            </div>

            <div className="order-1 lg:order-2">
                <div className="bg-white border border-gray-200 rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-gray-400/20 animate-in slide-in-from-bottom duration-700">
                    <div className="flex justify-between items-center mb-8 text-left">
                        <div>
                            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black uppercase text-[10px] tracking-widest mb-4"><ChevronLeft size={14}/> Kembali</Link>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Daftar Admin</h2>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner"><Shield size={28}/></div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <InputGroup label="Nama Lengkap" icon={<User/>} placeholder="Sesuai KTP" value={formData.name} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                        
                        {/* AUTO DETECT MARKET ADMIN */}
                        <div className="space-y-1 text-left group">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Wilayah Pengelolaan</label>
                            {detectedMarketName ? (
                                <div className="w-full pl-4 pr-4 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-sm font-bold text-blue-800 flex items-center gap-2">
                                    <Map size={16}/> {detectedMarketName} <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded text-blue-800 ml-auto">TERKUNCI</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Map size={16}/></div>
                                    <select 
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all shadow-inner"
                                        value={formData.market_id}
                                        onChange={(e) => setFormData({...formData, market_id: e.target.value})}
                                    >
                                        <option value="">-- Pilih Pasar --</option>
                                        {markets.map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <InputGroup label="WhatsApp" icon={<Smartphone/>} placeholder="0812..." value={formData.phone} onChange={(e:any)=>setFormData({...formData, phone:e.target.value})} />
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <InputGroup label="Email" icon={<Mail/>} placeholder="admin@pasar.com" type="email" value={formData.email} onChange={(e:any)=>setFormData({...formData, email:e.target.value})} />
                            <InputGroup label="Password" icon={<Lock/>} placeholder="Min. 6 Karakter" type="password" value={formData.password} onChange={(e:any)=>setFormData({...formData, password:e.target.value})} />
                        </div>
                        <button disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex justify-center items-center gap-2 mt-6 group">
                            {isLoading ? <Loader2 className="animate-spin"/> : 'Ajukan Akses Admin'} {!isLoading && <ArrowRight size={16}/>}
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
        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest group-focus-within:text-blue-600 transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600">{React.cloneElement(icon, { size: 16 })}</div>
            <input {...props} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" required />
        </div>
    </div>
);