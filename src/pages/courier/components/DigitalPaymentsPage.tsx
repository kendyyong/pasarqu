import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Smartphone,
  Zap,
  History,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Droplets,
  ShieldCheck,
  Wallet,
  Gamepad2,
  Tv,
  LayoutGrid,
} from "lucide-react";

// --- KOMPONEN MENU ICON UNTUK LOBI ---
const HubMenu = ({ icon, label, color, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-2 cursor-pointer group"
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg transition-all transform group-active:scale-90 group-hover:-translate-y-1`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-black text-slate-600 text-center leading-tight uppercase tracking-tighter w-full">
      {label}
    </span>
  </div>
);

export const DigitalPaymentsPage: React.FC = () => {
  const navigate = useNavigate();

  // STATE KONTROL
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // 🚀 DATA DINAMIS (Nanti disambung ke Digiflazz)
  const pulsaPackages = [
    { id: "p1", name: "Telkomsel 5.000", price: 6500, nominal: 5000 },
    { id: "p2", name: "Telkomsel 10.000", price: 11000, nominal: 10000 },
    { id: "p3", name: "Telkomsel 20.000", price: 21000, nominal: 20000 },
    { id: "p4", name: "Telkomsel 50.000", price: 50500, nominal: 50000 },
  ];

  const categories = [
    {
      id: "pulsa",
      label: "Pulsa & Data",
      icon: <Smartphone size={24} />,
      color: "bg-orange-500",
    },
    {
      id: "pln",
      label: "Listrik PLN",
      icon: <Zap size={24} />,
      color: "bg-yellow-500",
    },
    {
      id: "pdam",
      label: "Air PDAM",
      icon: <Droplets size={24} />,
      color: "bg-blue-500",
    },
    {
      id: "bpjs",
      label: "BPJS",
      icon: <ShieldCheck size={24} />,
      color: "bg-emerald-600",
    },
    {
      id: "ewallet",
      label: "Top Up",
      icon: <Wallet size={24} />,
      color: "bg-indigo-600",
    },
    {
      id: "game",
      label: "Voucher Game",
      icon: <Gamepad2 size={24} />,
      color: "bg-purple-500",
    },
    {
      id: "internet",
      label: "Internet/TV",
      icon: <Tv size={24} />,
      color: "bg-rose-500",
    },
    {
      id: "lainnya",
      label: "Lainnya",
      icon: <LayoutGrid size={24} />,
      color: "bg-slate-400",
    },
  ];

  const getProviderName = (phone: string) => {
    if (phone.startsWith("081") || phone.startsWith("0852")) return "TELKOMSEL";
    if (phone.startsWith("089") || phone.startsWith("083")) return "TRI / AXIS";
    return "UNKNOWN";
  };

  const handleCheckout = () => {
    if (!selectedProduct) return;
    if (
      window.confirm(
        `Lanjutkan pembayaran ${selectedProduct.name} seharga Rp ${selectedProduct.price.toLocaleString()}?`,
      )
    ) {
      alert("Proses Pembayaran Segera Aktif!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-left pb-24 selection:bg-[#008080] selection:text-white">
      {/* HEADER PREMIUM */}
      <div className="bg-[#008080] text-white px-5 py-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                selectedCategory ? setSelectedCategory(null) : navigate(-1)
              }
              className="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div>
              <h1 className="text-[18px] font-black uppercase tracking-widest leading-none">
                {selectedCategory
                  ? selectedCategory.replace("-", " ")
                  : "Top-Up & Tagihan"}
              </h1>
              <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-1 opacity-80">
                PasarQu Digital Service
              </p>
            </div>
          </div>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <History size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-5 pt-6">
        {/* --- KONDISI 1: TAMPILAN LOBI (PILIH MENU) --- */}
        {!selectedCategory && (
          <div className="animate-in fade-in duration-500">
            {/* BANNER PROMO */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-[2rem] shadow-lg mb-8 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FF6600] rounded-full flex items-center justify-center text-white">
                  <Zap size={20} className="fill-current" />
                </div>
                <div>
                  <p className="text-white font-black text-[12px] uppercase tracking-tighter">
                    Serbu Promo Digital!
                  </p>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                    Diskon admin s/d 50%
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 ml-2">
              Kategori Layanan
            </h2>
            <div className="grid grid-cols-4 gap-y-8 gap-x-2">
              {categories.map((cat) => (
                <HubMenu
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  onClick={() => setSelectedCategory(cat.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- KONDISI 2: TAMPILAN FORM (SETELAH PILIH MENU) --- */}
        {selectedCategory && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
              <div className="mb-6">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-2 block">
                  Masukkan Nomor Tujuan
                </label>
                <div className="relative group">
                  <div
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${phoneNumber.length > 3 ? "text-[#FF6600]" : "text-slate-300"}`}
                  >
                    <Smartphone size={20} />
                  </div>
                  <input
                    type="number"
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 text-[16px] font-[1000] text-slate-800 outline-none transition-all shadow-inner tracking-widest focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 bg-slate-50 border-slate-100"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setSelectedProduct(null);
                    }}
                  />
                  {phoneNumber.length >= 4 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase">
                      {getProviderName(phoneNumber)}
                    </div>
                  )}
                </div>
              </div>

              {phoneNumber.length >= 10 && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-3 block border-b border-slate-100 pb-2">
                    Pilih Nominal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {pulsaPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedProduct(pkg)}
                        className={`p-4 rounded-2xl text-left transition-all border-2 relative overflow-hidden ${
                          selectedProduct?.id === pkg.id
                            ? "border-[#FF6600] bg-orange-50 shadow-md"
                            : "border-slate-100 bg-white hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        {selectedProduct?.id === pkg.id && (
                          <div className="absolute top-2 right-2 text-[#FF6600]">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                        <h3
                          className={`text-[15px] font-[1000] mb-1 tracking-tight ${selectedProduct?.id === pkg.id ? "text-slate-900" : "text-slate-700"}`}
                        >
                          {pkg.nominal.toLocaleString()}
                        </h3>
                        <p
                          className={`text-[11px] font-black tracking-widest ${selectedProduct?.id === pkg.id ? "text-[#FF6600]" : "text-slate-400"}`}
                        >
                          Rp {pkg.price.toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR CHECKOUT */}
      {selectedProduct && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full z-[100]">
          <div className="max-w-[600px] mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Bayar
              </p>
              <h2 className="text-xl font-[1000] text-slate-800 tracking-tighter">
                Rp {selectedProduct.price.toLocaleString()}
              </h2>
            </div>
            <button
              onClick={handleCheckout}
              className="px-8 py-4 rounded-xl text-[12px] font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all flex items-center gap-2 bg-[#FF6600] shadow-orange-500/30"
            >
              <CreditCard size={18} /> BAYAR SEKARANG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalPaymentsPage;
