import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  MessageCircle,
  Store,
  Search,
  Share2,
  MoreVertical,
  ShoppingBag,
} from "lucide-react";
import { ProductGrid } from "../../components/ProductGrid";

export const ShopDetail: React.FC = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (merchantId) {
      fetchShopData();
    }
  }, [merchantId]);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const { data: shopData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", merchantId)
        .single();

      if (shopData) setShop(shopData);

      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("merchant_id", merchantId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (prodData) setProducts(prodData);
    } catch (error) {
      console.error(error);
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-teal-500"></div>
      </div>
    );
  }

  if (!shop)
    return (
      <div className="p-10 text-center font-black text-slate-400 uppercase">
        Toko Tidak Ditemukan
      </div>
    );

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-20 font-sans text-left">
      {/* 1. TOPBAR - HIJAU TOSCA (ALIGNED) */}
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
            <span className="text-xs text-white/80">Cari di toko ini...</span>
          </div>
          <div className="flex items-center gap-4">
            <Share2
              size={20}
              className="hidden md:block cursor-pointer hover:text-orange-200"
            />
            <MoreVertical
              size={20}
              className="cursor-pointer hover:text-orange-200"
            />
          </div>
        </div>
      </header>

      {/* 2. SHOP HEADER - BIRU NAVY (ALIGNED) */}
      <div className="mt-14 bg-slate-900 border-b-4 border-orange-500 relative overflow-hidden">
        {/* Background Overlay Tosca */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/30 to-transparent"></div>

        <div className="max-w-[1200px] mx-auto p-6 md:p-10 relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="flex gap-4 items-center">
            {/* Avatar Toko */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full p-0.5 shadow-lg border-2 border-teal-400 overflow-hidden">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl md:text-4xl font-black text-teal-600 uppercase">
                  {shop.shop_name ? shop.shop_name[0] : <Store />}
                </div>
              </div>
              {shop.is_verified && (
                <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-sm">
                  <CheckCircle size={14} fill="currentColor" />
                </div>
              )}
            </div>

            {/* Nama & Info */}
            <div className="flex-1">
              <h1 className="text-lg md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                {shop.shop_name}
              </h1>
              <p className="text-[10px] md:text-xs text-teal-100 font-bold uppercase tracking-widest opacity-80 flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>{" "}
                Online
              </p>
              <div className="flex gap-2 mt-3">
                <button className="px-5 py-1.5 bg-white/10 border border-white/30 rounded-sm text-[10px] font-black uppercase text-white hover:bg-white/20 transition-all">
                  + Ikuti
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="px-5 py-1.5 bg-orange-500 border border-orange-500 rounded-sm text-[10px] font-black uppercase text-white flex items-center gap-1.5 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  <MessageCircle size={12} fill="currentColor" /> Chat
                </button>
              </div>
            </div>
          </div>

          {/* Statistik Toko */}
          <div className="grid grid-cols-3 gap-4 md:gap-12 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-12">
            <div className="text-center md:text-left">
              <p className="text-orange-400 font-black text-sm md:text-xl">
                4.9
              </p>
              <p className="text-[8px] md:text-[10px] text-white/60 uppercase font-black tracking-tighter">
                Penilaian
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-orange-400 font-black text-sm md:text-xl">
                {products.length}
              </p>
              <p className="text-[8px] md:text-[10px] text-white/60 uppercase font-black tracking-tighter">
                Produk
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-orange-400 font-black text-sm md:text-xl">
                98%
              </p>
              <p className="text-[8px] md:text-[10px] text-white/60 uppercase font-black tracking-tighter">
                Respon Chat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STICKY TABS (ALIGNED) */}
      <div className="bg-white sticky top-14 z-50 shadow-sm border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto flex overflow-x-auto no-scrollbar">
          <button className="flex-1 min-w-[100px] py-4 text-[11px] font-black uppercase text-orange-600 border-b-2 border-orange-500">
            Beranda
          </button>
          <button className="flex-1 min-w-[100px] py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600">
            Semua Produk
          </button>
          <button className="flex-1 min-w-[100px] py-4 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600">
            Kategori
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-2 md:px-0">
        {/* 4. ALAMAT (ALIGNED) */}
        <div className="bg-white p-4 md:p-6 mb-2 flex items-start gap-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-orange-500 shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
              Lokasi Pengiriman
            </p>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed italic">
              {shop.address || "Lokasi Toko"}
            </p>
          </div>
        </div>

        {/* 5. DAFTAR PRODUK (RESPONSIVE GRID) */}
        <div className="p-1.5 md:p-0">
          <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
              <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest">
                Produk <span className="text-teal-600">Terbaru</span>
              </h3>
            </div>
            <div className="text-[10px] font-black text-orange-600 uppercase cursor-pointer hover:underline flex items-center gap-1">
              LIHAT SEMUA ❯
            </div>
          </div>

          {/* AREA GRID UTAMA - SEJAJAR DENGAN ATAS */}
          <div className="min-h-[500px]">
            {products.length > 0 ? (
              <ProductGrid products={products} isLoading={false} />
            ) : (
              <div className="bg-white py-32 text-center border-2 border-dashed border-slate-100">
                <ShoppingBag
                  size={48}
                  className="mx-auto text-slate-200 mb-4"
                />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Belum ada produk
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. FLOATING CHAT (Mobile Only) */}
      <button
        onClick={handleWhatsApp}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[90] border-4 border-white active:scale-90 transition-all"
      >
        <MessageCircle size={28} fill="currentColor" />
      </button>
    </div>
  );
};
