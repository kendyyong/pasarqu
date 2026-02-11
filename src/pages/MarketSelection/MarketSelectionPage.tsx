import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Loader2, Globe, ShieldCheck, Zap } from 'lucide-react';
import { useMarket } from '../../contexts/MarketContext';
import { supabase } from '../../lib/supabaseClient';
import { AppLogo } from '../../components/AppLogo';

export const MarketSelectionPage: React.FC = () => {
    const { setSelectedMarket } = useMarket();
    const [markets, setMarkets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // KONEKSI KE DATABASE: Mengambil data pasar yang dibuat Super Admin
    useEffect(() => {
        const fetchMarketsFromDB = async () => {
            try {
                // Mengambil pasar yang statusnya 'is_active' = true
                const { data, error } = await supabase
                    .from('markets')
                    .select('*')
                    .eq('is_active', true) 
                    .order('name', { ascending: true });

                if (error) throw error;
                if (data) setMarkets(data);
            } catch (error) {
                console.error("Gagal memuat data pasar:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMarketsFromDB();
    }, []);

    const handleSelect = (market: any) => {
        // Simpan ke local storage agar user tidak perlu pilih lagi saat refresh
        localStorage.setItem('selected_market_id', market.id);
        setSelectedMarket(market);
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="animate-spin text-orange-600 mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menghubungkan ke Server MJ...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-orange-600 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
            {/* Dekorasi Background */}
            <div className="absolute top-[-5%] right-[-5%] w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>

            <div className="mb-10 scale-[1.8] drop-shadow-2xl animate-in fade-in slide-in-from-top duration-1000">
                <AppLogo size="sm" regionName="MJ" className="text-white" />
            </div>
            
            <div className="bg-white w-full max-w-md rounded-[40px] p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.3)] text-left text-slate-800 relative z-10 animate-in zoom-in-95 fade-in duration-500">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-orange-50 rounded-2xl shrink-0">
                        <MapPin className="text-orange-600" size={32}/>
                   </div>
                   <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                            Pilih <span className="text-orange-600">Wilayah</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Pilih Kecamatan Anda</p>
                   </div>
                </div>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {markets.length > 0 ? (
                        markets.map((market) => (
                            <button 
                                key={market.id} 
                                onClick={() => handleSelect(market)} 
                                className="w-full p-5 bg-slate-50 rounded-[24px] font-black flex justify-between items-center hover:bg-orange-600 hover:text-white transition-all duration-300 border-2 border-transparent hover:border-orange-400 uppercase tracking-tight group shadow-sm"
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-sm">{market.name}</span>
                                    <span className="text-[9px] opacity-50 font-medium normal-case group-hover:text-white">Wilayah MJ {market.name}</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all"/>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic text-sm">Belum ada kecamatan aktif.</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-2 border-t pt-6 opacity-30">
                    <div className="flex flex-col items-center gap-1"><Zap size={14} /><span className="text-[8px] font-bold">CEPAT</span></div>
                    <div className="flex flex-col items-center gap-1"><ShieldCheck size={14} /><span className="text-[8px] font-bold">AMAN</span></div>
                    <div className="flex flex-col items-center gap-1"><Globe size={14} /><span className="text-[8px] font-bold">LOKAL</span></div>
                </div>
            </div>

            <p className="mt-8 text-[9px] text-white/50 font-black uppercase tracking-[0.3em]">
                Pasarqu Mulyojati Digital System
            </p>
        </div>
    );
};

export default MarketSelectionPage;