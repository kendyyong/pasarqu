import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  Star,
  CheckCircle,
  MessageCircle,
  Store,
  Search,
  Share2,
  MoreVertical,
  ShoppingBag,
  Timer,
} from "lucide-react";

export const ShopDetail: React.FC = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (merchantId) {
      fetchShopData();
    }
  }, [merchantId]);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data profil merchant
      const { data: shopData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", merchantId)
        .single();

      if (shopData) setShop(shopData);

      // 2. Ambil produk yang sudah APPROVED (Huruf besar sesuai standar DB)
      const { data: prodData, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantId)
        .eq("status", "APPROVED") // Pastikan APPROVED huruf besar
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (prodData) setProducts(prodData);
    } catch (error) {
      console.error("Gagal mengambil data toko:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (shop?.phone_number) {
      const msg = `Halo ${shop.shop_name}, saya melihat produk Anda di Pasarqu...`;
      window.open(
        `https://wa.me/${shop.phone_number.replace(/^0/, "62")}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-teal-500"></div>
      </div>
    );

  if (!shop)
    return (
      <div className="p-10 text-center font-black text-slate-400 uppercase">
        Toko Tidak Ditemukan
      </div>
    );

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-20 font-sans text-left antialiased">
      {/* 1. TOPBAR */}
      <header className="fixed top-0 left-0 right-0 bg-teal-500 z-[100] shadow-md">
        <div className="max-w-[1200px] mx-auto h-14 px-4 flex items-center gap-3 text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-1 active:scale-90 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 bg-white/20 rounded-sm py-1.5 px-3 flex items-center gap-2 border border-white/10">
            <Search size={16} className="text-white/70" />
            <input
              type="text"
              placeholder="Cari di toko ini..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/60 w-full"
            />
          </div>
          <Share2 size={20} className="hidden md:block cursor-pointer" />
          <MoreVertical size={20} className="cursor-pointer" />
        </div>
      </header>

      {/* 2. SHOP HEADER */}
      <div className="mt-14 bg-slate-900 border-b-4 border-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/30 to-transparent"></div>
        <div className="max-w-[1200px] mx-auto p-6 md:p-10 relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="flex gap-4 items-center">
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full p-0.5 shadow-lg border-2 border-teal-400 overflow-hidden">
                {shop.avatar_url ? (
                  <img
                    src={shop.avatar_url}
                    className="w-full h-full object-cover rounded-full"
                    alt="logo"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl md:text-4xl font-black text-teal-600 uppercase">
                    {shop.shop_name?.[0]}
                  </div>
                )}
              </div>
              {shop.is_verified && (
                <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-sm">
                  <CheckCircle size={14} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-lg md:text-3xl font-black text-white uppercase tracking-tight italic">
                {shop.shop_name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-teal-100 font-bold uppercase tracking-widest opacity-80">
                  Online
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="px-5 py-1.5 bg-white/10 border border-white/30 rounded-sm text-[10px] font-black uppercase text-white hover:bg-white/20 transition-all">
                  + Ikuti
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="px-5 py-1.5 bg-orange-500 border border-orange-500 rounded-sm text-[10px] font-black uppercase text-white flex items-center gap-1.5 hover:bg-orange-600 shadow-lg"
                >
                  <MessageCircle size={12} fill="currentColor" /> Chat
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-12 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-12">
            <Stat label="Penilaian" value="4.9" />
            <Stat label="Produk" value={products.length} />
            <Stat label="Respon" value="98%" />
          </div>
        </div>
      </div>

      {/* 3. STICKY TABS */}
      <div className="bg-white sticky top-14 z-50 shadow-sm border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto flex">
          <Tab
            active={activeTab === "home"}
            label="Beranda"
            onClick={() => setActiveTab("home")}
          />
          <Tab
            active={activeTab === "all"}
            label="Semua Produk"
            onClick={() => setActiveTab("all")}
          />
          <Tab
            active={activeTab === "cat"}
            label="Kategori"
            onClick={() => setActiveTab("cat")}
          />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-2 md:px-0 mt-2">
        {/* 4. LOKASI */}
        <div className="bg-white p-4 mb-2 flex items-start gap-4 border border-slate-100 rounded-xl md:rounded-none">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-orange-500 shrink-0 border border-slate-100">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Lokasi Toko
            </p>
            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
              {shop.address || "Belum ada alamat"}
            </p>
          </div>
        </div>

        {/* 5. DAFTAR PRODUK (GRID BARU) */}
        <div className="mt-4">
          <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center rounded-t-xl md:rounded-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Etalase <span className="text-teal-600">Produk</span>
            </h3>
            <span className="text-[9px] font-black text-orange-600 uppercase">
              Total {products.length}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 p-2 md:p-0 mt-2">
            {products.length > 0 ? (
              products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="aspect-square relative bg-slate-50">
                    <img
                      src={item.image_url}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={item.name}
                    />
                    {item.is_po && (
                      <div className="absolute top-2 left-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1">
                        <Timer size={10} /> PO {item.po_days} HARI
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {item.categories?.name || "Produk"}
                    </p>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase line-clamp-2 leading-tight h-8">
                      {item.name}
                    </h4>
                    <div className="pt-2 border-t border-slate-50">
                      <p className="text-sm font-black text-orange-600 tracking-tighter">
                        Rp {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-xl border-2 border-dashed border-slate-100">
                <ShoppingBag
                  size={48}
                  className="mx-auto text-slate-200 mb-4"
                />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Etalase sedang kosong
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. FLOATING CHAT */}
      <button
        onClick={handleWhatsApp}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[90] border-4 border-white active:scale-90 transition-all"
      >
        <MessageCircle size={28} fill="currentColor" />
      </button>
    </div>
  );
};

// Sub-components
const Stat = ({ label, value }: any) => (
  <div className="text-center md:text-left">
    <p className="text-orange-400 font-black text-sm md:text-xl leading-none mb-1">
      {value}
    </p>
    <p className="text-[8px] md:text-[10px] text-white/50 uppercase font-black tracking-tighter">
      {label}
    </p>
  </div>
);

const Tab = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${active ? "text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:text-slate-600"}`}
  >
    {label}
  </button>
);
