import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../../contexts/MarketContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
// IMPORT UTILITAS GEO
import { calculateDistance, calculateShippingFee, formatDistanceText } from '../../utils/geo';
import { 
  CreditCard, Truck, Store, X, 
  ChevronRight, MapPin, Wallet, Receipt,
  ShieldCheck, Loader2
} from 'lucide-react';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage: React.FC<CheckoutProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cart, clearCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [deliveryMethod, setDeliveryMethod] = useState<'KURIR' | 'AMBIL_SENDIRI'>('KURIR');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isProcessing, setIsProcessing] = useState(false);

  // STATE DATA
  const [distance, setDistance] = useState<number>(0);
  const [autoOngkir, setAutoOngkir] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 1. AMBIL DATA PROFIL
  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
      };
      fetchProfile();
    }
  }, [isOpen, user]);

  // 2. HITUNG ONGKIR
  useEffect(() => {
    if (deliveryMethod === 'KURIR' && userProfile && selectedMarket) {
      const d = calculateDistance(
        userProfile.latitude || 0, 
        userProfile.longitude || 0,
        selectedMarket.latitude || 0,
        selectedMarket.longitude || 0
      );
      const finalDist = d > 0 ? d : 1.5; 
      
      setDistance(finalDist);
      setAutoOngkir(calculateShippingFee(finalDist));
    } else {
      setAutoOngkir(0);
    }
  }, [deliveryMethod, userProfile, selectedMarket]);

  if (!isOpen) return null;

  // HITUNG TOTAL
  const totalBelanja = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const biayaLayanan = 1000; 
  const ongkir = deliveryMethod === 'KURIR' ? autoOngkir : 0; 
  const totalBayar = totalBelanja + ongkir + biayaLayanan;

  const handleFinishOrder = async () => {
    setIsProcessing(true);
    
    // SIMULASI PROSES ORDER
    setTimeout(() => {
      if (deliveryMethod === 'KURIR') {
        showToast("Pesanan Berhasil! Kurir akan segera meluncur.", "success");
      } else {
        const pinAmbil = Math.floor(1000 + Math.random() * 9000); 
        showToast(`Pesanan Berhasil! PIN Ambil: ${pinAmbil}`, "success");
      }
      
      setIsProcessing(false);
      clearCart();
      onClose(); 
      navigate('/customer-dashboard');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* CARD UTAMA */}
      <div className="bg-[#F5F5F5] w-full max-w-md h-[95vh] md:h-auto md:max-h-[90vh] md:rounded-[20px] rounded-t-[20px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* HEADER (TOSCA) */}
        <div className="bg-white p-4 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
             <ShieldCheck size={18} className="text-teal-600"/> Checkout Aman
           </h2>
           <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
             <X size={20} />
           </button>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto pb-24">
           
           {/* 1. ALAMAT PENGIRIMAN (Airmail Style tetap dipertahankan karena standar logistik) */}
           <div className="bg-white p-4 relative mb-2">
              <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-teal-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800">{userProfile?.name || 'Penerima'}</span>
                          <span className="text-xs text-slate-500">| {userProfile?.phone_number || '-'}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                          {userProfile?.address || "Alamat belum diatur. Silakan edit profil."}
                      </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 mt-2"/>
              </div>
              {/* Garis Airmail (Merah Biru - Standar Pos) */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[repeating-linear-gradient(45deg,#ff5a5a,#ff5a5a_10px,transparent_10px,transparent_20px,#3b82f6_20px,#3b82f6_30px,transparent_30px,transparent_40px)]"></div>
           </div>

           {/* 2. DAFTAR PRODUK */}
           <div className="bg-white p-4 mb-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <Store size={14} className="text-slate-800"/>
                  <span className="text-xs font-bold text-slate-800">{selectedMarket?.name || 'Toko Pilihan'}</span>
              </div>
              
              <div className="space-y-4">
                  {cart.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                          <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded border border-slate-100 bg-slate-50" />
                          <div className="flex-1">
                              <h4 className="text-xs font-medium text-slate-800 line-clamp-1 mb-1">{item.name}</h4>
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-500">x{item.quantity}</span>
                                  <span className="text-xs font-bold text-slate-800">Rp{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>

           {/* 3. OPSI PENGIRIMAN (TOSCA THEME) */}
           <div className="bg-white p-4 mb-2">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
                      <Truck size={14}/> Opsi Pengiriman
                  </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <SelectionBox 
                      active={deliveryMethod === 'KURIR'} 
                      onClick={()=>setDeliveryMethod('KURIR')}
                      label="Reguler (Kurir)"
                      subLabel={`Rp${autoOngkir.toLocaleString()}`}
                  />
                  <SelectionBox 
                      active={deliveryMethod === 'AMBIL_SENDIRI'} 
                      onClick={()=>setDeliveryMethod('AMBIL_SENDIRI')}
                      label="Ambil Sendiri"
                      subLabel="Rp0 (Gratis)"
                  />
              </div>
              {deliveryMethod === 'KURIR' && (
                  <p className="text-[10px] text-slate-400 mt-2 text-right">Estimasi tiba: Hari ini (Jarak {formatDistanceText(distance)})</p>
              )}
           </div>

           {/* 4. METODE PEMBAYARAN (TOSCA THEME) */}
           <div className="bg-white p-4 mb-2">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
                      <Wallet size={14}/> Metode Pembayaran
                  </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <SelectionBox 
                      active={paymentMethod === 'COD'} 
                      onClick={()=>setPaymentMethod('COD')}
                      label="COD"
                      subLabel="Bayar di Tempat"
                  />
                  <SelectionBox 
                      active={paymentMethod === 'ONLINE'} 
                      onClick={()=>setPaymentMethod('ONLINE')}
                      label="Transfer / QRIS"
                      subLabel="Verifikasi Otomatis"
                  />
              </div>
           </div>

           {/* 5. RINCIAN PEMBAYARAN (TOSCA ACCENT) */}
           <div className="bg-white p-4 mb-4">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1"><Receipt size={14}/> Rincian Pembayaran</h3>
              <div className="space-y-2">
                  <RowSummary label="Subtotal Produk" value={totalBelanja} />
                  <RowSummary label="Subtotal Pengiriman" value={ongkir} />
                  <RowSummary label="Biaya Layanan" value={biayaLayanan} />
                  <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">Total Pembayaran</span>
                      <span className="text-lg font-black text-teal-600 tracking-tight">Rp{totalBayar.toLocaleString()}</span>
                  </div>
              </div>
           </div>

        </div>

        {/* BOTTOM BAR (FIXED) - BACKGROUND PUTIH, TOMBOL TOSCA */}
        <div className="bg-white border-t border-slate-200 p-0 flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <div className="flex-1 flex flex-col justify-center items-end px-4">
                <span className="text-[10px] text-slate-500">Total Tagihan</span>
                <span className="text-base font-black text-teal-600">Rp{totalBayar.toLocaleString()}</span>
            </div>
            <button 
                onClick={handleFinishOrder}
                disabled={isProcessing}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : "Buat Pesanan"}
            </button>
        </div>

      </div>
    </div>
  );
};

// Helper Components
const SelectionBox = ({ active, onClick, label, subLabel }: any) => (
    <div 
        onClick={onClick}
        className={`p-2.5 rounded border cursor-pointer transition-all ${
            active 
            ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500' // ACTIVE STATE: HIJAU TOSCA
            : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300'
        }`}
    >
        <div className="text-[11px] font-bold">{label}</div>
        <div className="text-[10px] opacity-80">{subLabel}</div>
    </div>
);

const RowSummary = ({ label, value }: any) => (
    <div className="flex justify-between items-center text-[11px] text-slate-500">
        <span>{label}</span>
        <span>Rp{value.toLocaleString()}</span>
    </div>
);