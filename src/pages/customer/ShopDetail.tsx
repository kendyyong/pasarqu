import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  MessageCircle,
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
      // 1. Ambil data profil DAN status merchant menggunakan Join Table
      const { data: shopData, error: shopError } = await supabase
        .from("merchants")
        .select(
          `
          status,
          profiles:user_id (
            name,
            address,
            avatar_url,
            phone
          )
        `,
        )
        .eq("user_id", merchantId)
        .single();

      if (shopError || !shopData || shopData.status !== "APPROVED") {
        console.warn("Toko tidak aktif atau tidak ditemukan");
        setShop(null);
      } else {
        // FIX: Casting ke 'any' untuk menghindari error TypeScript pada Join Table
        const profileData: any = shopData.profiles;

        setShop({
          shop_name: profileData?.name || "Toko Pasarqu",
          avatar_url: profileData?.avatar_url,
          address: profileData?.address,
          phone_number: profileData?.phone,
          is_verified: true,
        });
      }

      // 2. Ambil produk yang sudah APPROVED
      const { data: prodData, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantId)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(prodData || []);
    } catch (error) {
      console.error("Gagal mengambil data toko:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (shop?.phone_number) {
      const msg = `Halo ${shop.shop_name}, saya melihat produk Anda di Pasarqu...`;
      const cleanPhone = shop.phone_number.replace(/\D/g, "");
      const finalPhone = cleanPhone.startsWith("0")
        ? "62" + cleanPhone.slice(1)
        : cleanPhone;
      window.open(
        `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`,
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
      <div className="p-20 text-center flex flex-col items-center justify-center">
        <ShoppingBag size={64} className="text-slate-200 mb-4" />
        <h2 className="font-black text-slate-400 uppercase tracking-widest leading-none">
          Toko Sedang Libur / Tidak Aktif
        </h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-teal-600 font-bold text-sm uppercase tracking-tighter hover:underline"
        >
          Kembali ke Beranda
        </button>
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
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full p-0.5 shadow-lg border-2 border-teal-400 overflow-hidden text-center flex items-center justify-center">
                {shop.avatar_url ? (
                  <img
                    src={shop.avatar_url}
                    className="w-full h-full object-cover rounded-full"
                    alt="logo"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl md:text-4xl font-black text-teal-600 uppercase italic">
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
            <div className="flex-1 text-left">
              <h1 className="text-lg md:text-3xl font-black text-white uppercase tracking-tight italic leading-none">
                {shop.shop_name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-teal-100 font-bold uppercase tracking-widest opacity-80 italic">
                  Online
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="px-5 py-1.5 bg-white/10 border border-white/30 rounded-sm text-[10px] font-black uppercase text-white hover:bg-white/20 transition-all italic">
                  + Ikuti
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="px-5 py-1.5 bg-orange-500 border border-orange-500 rounded-sm text-[10px] font-black uppercase text-white flex items-center gap-1.5 hover:bg-orange-600 shadow-lg italic"
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
        <div className="bg-white p-4 mb-2 flex items-start gap-4 border border-slate-100 rounded-xl md:rounded-none text-left">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-orange-500 shrink-0 border border-slate-100 shadow-sm">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Lokasi Toko
            </p>
            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
              {shop.address || "Belum ada alamat operasional"}
            </p>
          </div>
        </div>

        {/* 5. DAFTAR PRODUK */}
        <div className="mt-4">
          <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center rounded-t-xl md:rounded-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest italic">
              Etalase <span className="text-teal-600">Produk</span>
            </h3>
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">
              Total {products.length} Item
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 p-2 md:p-0 mt-2">
            {products.length > 0 ? (
              products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer text-left"
                >
                  <div className="aspect-square relative bg-slate-50">
                    <img
                      src={item.image_url}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={item.name}
                    />
                    {item.is_po && (
                      <div className="absolute top-2 left-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-tighter italic animate-pulse">
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
                      <p className="text-sm font-black text-[#FF6600] tracking-tighter italic">
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
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">
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
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[90] border-4 border-white active:scale-90 transition-all hover:bg-orange-600"
      >
        <MessageCircle size={28} fill="currentColor" />
      </button>
    </div>
  );
};

// Sub-components
const Stat = ({ label, value }: any) => (
  <div className="text-center md:text-left">
    <p className="text-orange-400 font-black text-sm md:text-xl leading-none mb-1 italic">
      {value}
    </p>
    <p className="text-[8px] md:text-[10px] text-white/50 uppercase font-black tracking-tighter italic">
      {label}
    </p>
  </div>
);

const Tab = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all italic ${active ? "text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:text-slate-600"}`}
  >
    {label}
  </button>
);
