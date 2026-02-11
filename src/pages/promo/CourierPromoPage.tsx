import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import { 
  Bike, ArrowRight, Loader2, Zap, MapPin, 
  Smartphone, Mail, Lock, User, ChevronLeft, Map,
  Camera, CreditCard, UploadCloud, FileCheck, ShieldCheck, Clock, Wallet
} from 'lucide-react';

export const CourierPromoPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [detectedMarketName, setDetectedMarketName] = useState<string>("");
  
  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', phone: '', 
    vehicle: 'Motor', plat: '', market_id: '',
    address: '' 
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    ktp: null, sim: null, selfie: null,
  });

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

  const uploadImage = async (userId: string, file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${prefix}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('courier-docs').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('courier-docs').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!formData.market_id) return showToast("Area operasional wajib dipilih!", "error");
    if (!files.ktp || !files.sim || !files.selfie) return showToast("Mohon lengkapi Foto KTP, SIM, dan Selfie.", "error");

    setIsLoading(true);

    try {
        const { data, error } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
        if (error) throw error;
        await new Promise(r => setTimeout(r, 1500));

        if (data.user) {
            const userId = data.user.id;
            const ktpUrl = await uploadImage(userId, files.ktp!, 'ktp');
            const simUrl = await uploadImage(userId, files.sim!, 'sim');
            const selfieUrl = await uploadImage(userId, files.selfie!, 'selfie');

            const profileData = {
                id: userId,
                email: formData.email,
                name: formData.name,
                phone_number: formData.phone,
                address: formData.address,
                role: 'COURIER', 
                vehicle_type: formData.vehicle, 
                plat_number: formData.plat, 
                ktp_url: ktpUrl,
                sim_url: simUrl,
                selfie_url: selfieUrl,
                is_verified: false,
                managed_market_id: formData.market_id || null,
                created_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
            if (profileError) throw profileError;

            showToast("Pendaftaran Berhasil! Data diverifikasi.", "success");
            setTimeout(() => { window.location.href = '/login/kurir'; }, 800);
        }
    } catch (err: any) { 
        showToast(err.message, "error"); 
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-x-hidden flex flex-col justify-center py-10 px-4">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-[45vh] bg-teal-600 rounded-b-[4rem] shadow-xl z-0"></div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-teal-500 rounded-full blur-[90px] opacity-40 z-0 animate-pulse"></div>
        
        {/* CONTAINER UTAMA */}
        <div className="container mx-auto max-w-6xl relative z-10">
            
            {/* Header Link (Back) */}
            <div className="mb-6 px-4">
                <Link to="/" className="inline-flex items-center gap-2 text-teal-100 hover:text-white font-bold text-xs uppercase tracking-widest transition-all">
                    <ChevronLeft size={16}/> Kembali ke Beranda
                </Link>
            </div>

            {/* GRID LAYOUT - MENGGUNAKAN ITEMS-START UNTUK KEJAJARAN ATAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- KOLOM KIRI (INFO) --- */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Kartu Intro */}
                    <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 border border-white/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                        
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 relative z-10">
                            <Bike size={32}/>
                        </div>
                        
                        <h1 className="text-3xl font-black leading-tight text-slate-900 tracking-tighter mb-4 relative z-10">
                            Gabung Mitra<br/>
                            <span className="text-teal-600">Kurir Pasarqu.</span>
                        </h1>
                        
                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8 relative z-10">
                            Dapatkan penghasilan tambahan dengan mengantar pesanan di area tempat tinggalmu. Mudah, Cepat, dan Menguntungkan.
                        </p>

                        {/* Keunggulan List */}
                        <div className="space-y-3 relative z-10">
                            <FeatureRow icon={<Wallet size={16}/>} title="Cair Tiap Hari" desc="Ongkir tunai langsung dipegang." />
                            <FeatureRow icon={<MapPin size={16}/>} title="Area Tetangga" desc="Hemat bensin, rute sangat dekat." />
                            <FeatureRow icon={<Clock size={16}/>} title="Bebas Waktu" desc="Tidak ada target jam kerja." />
                        </div>
                    </div>

                    {/* Kartu Syarat */}
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-teal-500/50">
                                <ShieldCheck size={24}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Syarat Wajib</p>
                                <p className="text-sm font-bold text-white">KTP & SIM C</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Proses</p>
                            <p className="text-sm font-bold text-teal-400">Cepat</p>
                        </div>
                    </div>
                </div>

                {/* --- KOLOM KANAN (FORM) --- */}
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 relative">
                        {/* Hiasan Sudut */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-white rounded-bl-[3rem] z-0"></div>

                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 relative z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Formulir Pendaftaran</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Isi data diri dengan benar</p>
                            </div>
                            <span className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100 shadow-sm">
                                <User size={20}/>
                            </span>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
                            
                            {/* BARIS 1: NAMA & HP */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup icon={<User/>} placeholder="Nama Lengkap (KTP)" value={formData.name} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} />
                                <InputGroup icon={<Smartphone/>} placeholder="WhatsApp (08xx)" value={formData.phone} onChange={(e:any)=>setFormData({...formData, phone:e.target.value})} />
                            </div>

                            {/* BARIS 2: ALAMAT */}
                            <InputGroup icon={<MapPin/>} placeholder="Alamat Tinggal Lengkap" value={formData.address} onChange={(e:any)=>setFormData({...formData, address:e.target.value})} />

                            {/* BARIS 3: AKUN LOGIN */}
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup icon={<Mail/>} type="email" placeholder="Email Aktif" value={formData.email} onChange={(e:any)=>setFormData({...formData, email:e.target.value})} />
                                <InputGroup icon={<Lock/>} type="password" placeholder="Password Baru" value={formData.password} onChange={(e:any)=>setFormData({...formData, password:e.target.value})} />
                            </div>

                            {/* DIVIDER */}
                            <div className="py-2 flex items-center gap-4">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Detail Operasional</span>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>

                            {/* BARIS 4: PASAR, KENDARAAN, PLAT */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* PASAR */}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"><Map size={14}/></div>
                                    {detectedMarketName ? (
                                        <div className="w-full pl-9 pr-3 py-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-700 truncate cursor-not-allowed flex items-center gap-2 h-full">
                                            <Zap size={10} className="fill-teal-600"/> {detectedMarketName}
                                        </div>
                                    ) : (
                                        <select required className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-500 focus:bg-white outline-none appearance-none transition-all h-full cursor-pointer" value={formData.market_id} onChange={(e) => setFormData({...formData, market_id: e.target.value})}>
                                            <option value="">Pilih Pasar</option>
                                            {markets.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    )}
                                </div>

                                {/* KENDARAAN */}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"><Bike size={14}/></div>
                                    <select className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:border-teal-500 focus:bg-white outline-none appearance-none transition-all h-full cursor-pointer" value={formData.vehicle} onChange={(e:any)=>setFormData({...formData, vehicle:e.target.value})}>
                                        <option value="Motor">Motor</option>
                                        <option value="Bentor">Bentor</option>
                                        <option value="Mobil">Mobil</option>
                                    </select>
                                </div>

                                {/* PLAT NOMOR */}
                                <InputGroup icon={<CreditCard/>} placeholder="Plat No." value={formData.plat} onChange={(e:any)=>setFormData({...formData, plat:e.target.value})} />
                            </div>

                            {/* BARIS 5: UPLOAD DOKUMEN */}
                            <div className="pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Upload Dokumen Wajib</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FileBox label="KTP Asli" icon={<CreditCard size={20}/>} file={files.ktp} onSelect={(f)=>setFiles({...files, ktp:f})} />
                                    <FileBox label="SIM C" icon={<UploadCloud size={20}/>} file={files.sim} onSelect={(f)=>setFiles({...files, sim:f})} />
                                    <FileBox label="Selfie" icon={<Camera size={20}/>} file={files.selfie} onSelect={(f)=>setFiles({...files, selfie:f})} />
                                </div>
                            </div>

                            {/* TOMBOL SUBMIT */}
                            <button disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-teal-600 hover:shadow-teal-500/30 active:scale-95 transition-all flex justify-center items-center gap-3 mt-4 group">
                                {isLoading ? <Loader2 className="animate-spin" size={16}/> : 'Kirim Pendaftaran'} {!isLoading && <ArrowRight size={16} className="text-orange-500 group-hover:text-white transition-colors"/>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- KOMPONEN KECIL ---

const FeatureRow = ({ icon, title, desc }: any) => (
    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors group cursor-default">
        <div className="bg-white p-2.5 rounded-xl text-orange-500 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">{icon}</div>
        <div>
            <h5 className="text-xs font-black text-slate-800 uppercase">{title}</h5>
            <p className="text-[10px] text-slate-500 leading-tight mt-1">{desc}</p>
        </div>
    </div>
);

const InputGroup = ({ icon, type="text", ...props }: any) => (
    <div className="relative group w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
            {React.cloneElement(icon, { size: 14 })}
        </div>
        <input 
            type={type} 
            {...props} 
            className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:shadow-sm outline-none transition-all" 
            required 
        />
    </div>
);

const FileBox = ({ label, icon, onSelect, file }: { label: string, icon: any, onSelect: (f: File) => void, file: File | null }) => (
    <label className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all h-24 ${file ? 'bg-teal-50 border-teal-400 text-teal-700' : 'bg-white border-slate-200 text-slate-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50'}`}>
        <div className={`mb-2 transition-transform ${file ? 'scale-110' : 'scale-100'}`}>{icon}</div>
        <span className="text-[9px] font-black uppercase truncate w-full text-center tracking-wide">{file ? 'Terupload' : label}</span>
        <input type="file" className="hidden" accept="image/*" onChange={(e) => onSelect(e.target.files?.[0] as File)} />
        {file && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white shadow-sm"></div>}
    </label>
);