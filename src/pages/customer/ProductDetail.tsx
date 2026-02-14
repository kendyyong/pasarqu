import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Share2,
  Star,
  Store,
  ChevronRight,
  ShoppingCart,
  Timer,
  Package,
  Loader2,
  ShieldCheck,
  MessageCircle,
  MoreVertical,
  Heart,
  MapPin,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";

export const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useMarket();
  const { showToast } = useToast();

  // --- STATE UTAMA ---
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [qty, setQty] = useState(1); // Perbaikan: State quantity ditambahkan kembali

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- FUNGSI NAVIGASI ---
  const goToShop = () => {
    // Perbaikan: Fungsi goToShop ditambahkan kembali
    if (product?.merchant_id) {
      navigate(`/shop/${product.merchant_id}`);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const { data: pureProduct, error: pError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .maybeSingle();

        if (pError) throw pError;

        if (pureProduct) {
          const [merchantRes, categoryRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, full_name, shop_name, city, is_verified, avatar_url")
              .eq("id", pureProduct.merchant_id)
              .maybeSingle(),
            supabase
              .from("categories")
              .select("name")
              .eq("id", pureProduct.category_id)
              .maybeSingle(),
          ]);

          setProduct({
            ...pureProduct,
            merchants: merchantRes.data,
            categories: categoryRes.data,
          });
        }
      } catch (err: any) {
        console.error("Gagal memuat produk:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty); // Mengirim qty yang dipilih
    showToast(`Berhasil masuk keranjang`, "success");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  if (!product)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <Package size={48} className="text-slate-200 mb-4" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
          Produk Tidak Ditemukan
        </h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-xs font-bold text-teal-600 underline uppercase"
        >
          Kembali Beranda
        </button>
      </div>
    );

  const productImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : [product.image_url];

  return (
    <div className="bg-[#F5F5F5] min-h-screen font-sans antialiased text-left pb-20 md:pb-10">
      {/* 1. HEADER MOBILE (Hidden on Desktop) */}
      <header className="md:hidden fixed top-0 z-50 w-full flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-600 active:scale-90 transition-all"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="relative text-slate-600"
          >
            <ShoppingBag size={22} />
            {totalCartItems > 0 && (
              <div className="absolute -top-1 -right-1 bg-teal-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                {totalCartItems}
              </div>
            )}
          </button>
          <MoreVertical size={22} className="text-slate-600" />
        </div>
      </header>

      {/* --- WRAPPER UTAMA RESPONSIVE --- */}
      <main className="w-full max-w-[1200px] mx-auto md:pt-6 px-0 md:px-4">
        {/* DESKTOP BOX LAYOUT */}
        <div className="bg-white md:rounded-sm md:shadow-sm flex flex-col md:flex-row overflow-hidden">
          {/* AREA GAMBAR */}
          <div className="w-full md:w-[450px] p-0 md:p-4 shrink-0">
            <div className="relative aspect-square overflow-hidden bg-white">
              <img
                src={productImages[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="md:hidden absolute bottom-4 right-4 bg-black/30 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
                {activeImg + 1} / {productImages.length}
              </div>
              {product.is_po && (
                <div className="absolute top-4 left-0 bg-orange-500 text-white px-3 py-1 rounded-r-full text-[11px] font-bold shadow-lg">
                  PO {product.po_days} Hari
                </div>
              )}
            </div>

            {/* Thumbnail Gallery (Desktop) */}
            <div className="hidden md:flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {productImages.map((img: string, i: number) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveImg(i)}
                  className={`w-16 h-16 border-2 cursor-pointer transition-all ${activeImg === i ? "border-teal-600" : "border-transparent hover:border-teal-200"}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* AREA INFO PRODUK */}
          <div className="flex-1 p-4 md:p-8 md:pl-4 space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl text-slate-800 leading-snug font-medium line-clamp-2 md:line-clamp-none uppercase tracking-tight italic">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1 text-teal-600 border-r border-slate-200 pr-3">
                  <span className="text-sm font-bold underline">4.9</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-500 border-r border-slate-200 pr-3">
                  820 Penilaian
                </div>
                <div className="text-sm text-slate-500">1,5rb Terjual</div>
              </div>
            </div>

            {/* PRICE SECTION */}
            <div className="bg-slate-50 p-4 md:p-6 rounded-sm flex items-center gap-3">
              <span className="text-teal-600 text-sm font-bold">Rp</span>
              <span className="text-teal-600 text-3xl md:text-4xl font-black tracking-tighter">
                {product.price.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2 italic">
                per {product.unit || "Unit"}
              </span>
            </div>

            {/* ACTIONS SECTION (Desktop Only) */}
            <div className="hidden md:flex flex-col gap-8 pt-4">
              <div className="flex items-center gap-8">
                <span className="text-xs text-slate-500 w-20 uppercase font-bold tracking-widest">
                  Kuantitas
                </span>
                <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-1.5 hover:bg-slate-50 border-r transition-colors"
                  >
                    {" "}
                    -{" "}
                  </button>
                  <span className="px-8 font-black text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-4 py-1.5 hover:bg-slate-50 border-l transition-colors"
                  >
                    {" "}
                    +{" "}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase italic">
                  Stok tersedia
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="px-8 py-4 border border-teal-600 bg-teal-50 text-teal-600 font-black uppercase text-[10px] tracking-widest hover:bg-teal-100 transition-all flex items-center gap-3"
                >
                  <ShoppingCart size={18} /> Masukkan Keranjang
                </button>
                <button
                  onClick={() => {
                    handleAddToCart();
                    navigate("/checkout");
                  }}
                  className="px-12 py-4 bg-teal-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-95 transition-all"
                >
                  Beli Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MERCHANT SECTION */}
        <div className="mt-4 bg-white p-4 md:p-6 md:shadow-sm md:rounded-sm flex items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={
                product.merchants?.avatar_url ||
                "https://via.placeholder.com/100"
              }
              className="w-16 h-16 rounded-full border border-slate-100 object-cover"
              alt=""
            />
            {product.merchants?.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <ShieldCheck size={18} className="text-teal-600 fill-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight italic">
              {product.merchants?.shop_name || "Toko Pasarqu"}
            </h4>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {product.merchants?.city || "Area Pasar"} |
              Aktif baru saja
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={goToShop}
                className="px-4 py-1.5 border border-teal-600 text-teal-600 text-[10px] font-black uppercase tracking-tighter hover:bg-teal-50 transition-all"
              >
                Lihat Toko
              </button>
              <button className="px-4 py-1.5 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-tighter hover:bg-slate-50 transition-all">
                Chat Admin
              </button>
            </div>
          </div>
        </div>

        {/* DESCRIPTION SECTION */}
        <div className="mt-4 bg-white p-4 md:p-8 md:shadow-sm md:rounded-sm">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-teal-600 pl-3">
            Rincian & Spesifikasi
          </h3>
          <div className="grid md:grid-cols-2 gap-y-4 mb-10">
            <div className="flex text-xs">
              <span className="w-28 text-slate-400 font-bold uppercase tracking-tighter">
                Kategori
              </span>
              <span className="text-teal-600 font-black uppercase italic">
                {product.categories?.name || "Pasar Lokal"}
              </span>
            </div>
            <div className="flex text-xs">
              <span className="w-28 text-slate-400 font-bold uppercase tracking-tighter">
                Wilayah
              </span>
              <span className="text-slate-800 font-bold uppercase">
                {product.merchants?.city || "Lokal"}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-50 pt-8">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line text-justify italic">
              {product.description ||
                "Penjual belum melengkapi deskripsi produk ini."}
            </p>
          </div>
        </div>
      </main>

      {/* 6. MOBILE BOTTOM BAR (Visible on Mobile Only) */}
      <div className="md:hidden fixed bottom-0 z-[60] w-full bg-white border-t border-slate-100 flex items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] h-16">
        <button className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full border-r border-slate-50">
          <MessageCircle size={20} />
          <span className="text-[8px] mt-0.5 font-bold uppercase">Chat</span>
        </button>
        <button
          onClick={handleAddToCart}
          className="flex-1 flex flex-col items-center justify-center text-teal-600 bg-teal-50/30 h-full border-r border-slate-50"
        >
          <ShoppingCart size={20} />
          <span className="text-[8px] mt-0.5 font-bold uppercase">
            Keranjang
          </span>
        </button>
        <button
          onClick={() => {
            handleAddToCart();
            navigate("/checkout");
          }}
          className="flex-[2.5] bg-teal-600 text-white h-full font-black uppercase text-[11px] tracking-widest active:bg-teal-700"
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
};
