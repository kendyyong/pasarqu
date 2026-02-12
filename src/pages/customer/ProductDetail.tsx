import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Share2,
  MessageCircle,
  ShieldCheck,
  Truck,
  Star,
  Store,
  ChevronRight,
  MoreHorizontal,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";

export const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useMarket();
  const { showToast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [qty, setQty] = useState(1); // State jumlah beli

  // 1. Hitung Badge Keranjang
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 2. Efek Scroll (Mobile)
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Ambil Data Produk
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const { data } = await supabase
          .from("products")
          .select("*, merchants(id, name, city, is_verified, image_url)")
          .eq("id", productId)
          .maybeSingle();

        if (data) setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    showToast(`${qty} produk masuk keranjang`, "success");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const goToShop = () => {
    if (product?.merchants?.id) {
      navigate(`/shop/${product.merchants.id}`);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );

  if (!product)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold mb-4">Produk tidak ditemukan</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-teal-600 text-white rounded font-bold"
        >
          Kembali
        </button>
      </div>
    );

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-24 md:pb-10">
      {/* ============================== */}
      {/* HEADER NAVIGASI (MOBILE ONLY)  */}
      {/* ============================== */}
      <header
        className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 transition-all duration-300 ${
          isHeaderVisible
            ? "bg-white shadow-sm text-slate-800"
            : "bg-transparent text-white"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-full transition-all ${
            isHeaderVisible
              ? "hover:bg-slate-100"
              : "bg-black/30 backdrop-blur-md"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className={`font-bold text-sm transition-opacity duration-300 ${isHeaderVisible ? "opacity-100" : "opacity-0"}`}
        >
          Detail Produk
        </div>

        <div className="flex gap-2">
          <button
            className={`p-2 rounded-full transition-all ${isHeaderVisible ? "hover:bg-slate-100" : "bg-black/30 backdrop-blur-md"}`}
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={() => navigate("/")}
            className={`p-2 rounded-full transition-all relative ${isHeaderVisible ? "hover:bg-slate-100" : "bg-black/30 backdrop-blur-md"}`}
          >
            <ShoppingBag size={20} />
            {totalCartItems > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {totalCartItems}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ============================== */}
      {/* HEADER NAVIGASI (DESKTOP ONLY) */}
      {/* ============================== */}
      {/* Menggunakan bg-teal-700 (Tema Pasarqu) */}
      <div className="hidden md:flex bg-teal-700 text-white py-4 px-4 sticky top-0 z-50 shadow-md mb-6">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-white text-teal-700 p-1 rounded font-black text-xl">
              P
            </div>
            <span className="font-bold text-lg">Pasarqu</span>
          </div>
          <div className="h-6 w-[1px] bg-white/30 mx-2"></div>
          <span className="text-sm font-medium">Detail Produk</span>

          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer hover:text-white/80">
              <Store size={18} />{" "}
              <span className="text-sm font-medium">Toko</span>
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:text-white/80"
              onClick={() => navigate("/checkout")}
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-medium">
                Keranjang ({totalCartItems})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTAINER UTAMA (RESPONSIVE GRID) */}
      <div className="max-w-[1200px] mx-auto md:px-4 md:grid md:grid-cols-12 md:gap-6">
        {/* ============================== */}
        {/* KOLOM KIRI: GAMBAR (DESKTOP)   */}
        {/* ============================== */}
        <div className="md:col-span-5 bg-white md:rounded-xl md:shadow-sm md:p-4 h-fit">
          <div className="w-full aspect-square bg-white relative overflow-hidden md:rounded-lg">
            <img
              src={product.image_url || "https://via.placeholder.com/500"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
            />
            <div className="md:hidden absolute bottom-4 right-4 bg-black/30 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm font-medium">
              1/1
            </div>
          </div>
          {/* Thumbnail Desktop */}
          <div className="hidden md:flex gap-2 mt-4 overflow-x-auto pb-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-20 h-20 border border-slate-200 cursor-pointer hover:border-teal-500 rounded-md overflow-hidden shrink-0"
              >
                <img
                  src={product.image_url}
                  className="w-full h-full object-cover opacity-80 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ============================== */}
        {/* KOLOM KANAN: INFO (DESKTOP)    */}
        {/* ============================== */}
        <div className="md:col-span-7 space-y-4">
          {/* CARD 1: INFO UTAMA */}
          <div className="bg-white p-4 md:rounded-xl md:shadow-sm">
            <h1 className="text-[16px] md:text-xl font-medium text-slate-800 leading-snug mb-3 line-clamp-2 md:line-clamp-none">
              {product.name}
            </h1>

            {/* Rating & Stats */}
            <div className="flex items-center justify-between md:justify-start md:gap-6 mb-4">
              <div className="flex items-center gap-1 text-xs md:text-sm text-teal-600 border-b border-teal-600 pb-0.5">
                <span className="font-bold underline">4.9</span>
                <Star size={14} className="fill-orange-400 text-orange-400" />
              </div>
              <div className="w-[1px] h-3 bg-slate-300 md:h-4"></div>
              <div className="text-xs md:text-sm text-slate-600">
                <span className="font-bold text-slate-800 border-b border-slate-800 pb-0.5">
                  100+
                </span>{" "}
                Terjual
              </div>
              <div className="w-[1px] h-3 bg-slate-300 md:h-4"></div>
              <div className="text-xs md:text-sm text-slate-500">
                Dikirim dari{" "}
                <span className="text-slate-700 font-medium">
                  {product.merchants?.city || "Jakarta"}
                </span>
              </div>
            </div>

            {/* Harga: Menggunakan Teal Gelap agar Premium */}
            <div className="bg-slate-50 md:bg-teal-50/50 p-3 md:p-5 rounded flex items-center gap-3">
              {product.old_price > product.price && (
                <span className="text-sm text-slate-400 line-through">
                  Rp{product.old_price.toLocaleString()}
                </span>
              )}
              <span className="text-2xl md:text-3xl font-black text-teal-700">
                Rp{product.price.toLocaleString()}
              </span>
              {product.old_price > product.price && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                  DISKON{" "}
                  {Math.round(
                    ((product.old_price - product.price) / product.old_price) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>

            {/* Pilihan Kuantitas (Desktop) */}
            <div className="hidden md:flex items-center gap-6 mt-6 mb-4">
              <span className="text-sm text-slate-500 w-24">Kuantitas</span>
              <div className="flex items-center border border-slate-300 rounded-sm">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1 border-r border-slate-200 hover:bg-slate-50"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="text"
                  value={qty}
                  readOnly
                  className="w-12 text-center text-sm font-medium outline-none"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1 border-l border-slate-200 hover:bg-slate-50"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Tersisa {product.stock} buah
              </span>
            </div>

            {/* TOMBOL AKSI DESKTOP */}
            <div className="hidden md:flex gap-4 mt-8">
              {/* Tombol Keranjang: Tema Teal Pasarqu */}
              <button
                onClick={handleAddToCart}
                className="flex-1 max-w-[200px] bg-teal-50 border border-teal-600 text-teal-700 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors"
              >
                <ShoppingCart size={18} /> Masukkan Keranjang
              </button>

              {/* Tombol Beli: Tetap Oranye agar Kontras/CTA Kuat */}
              <button
                onClick={handleBuyNow}
                className="flex-1 max-w-[200px] bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
              >
                Beli Sekarang
              </button>
            </div>
          </div>

          {/* CARD 2: PROFIL TOKO */}
          <div className="bg-white p-4 md:rounded-xl md:shadow-sm flex items-center gap-4">
            <div
              onClick={goToShop}
              className="w-14 h-14 bg-slate-100 rounded-full overflow-hidden border border-slate-100 cursor-pointer"
            >
              <img
                src={
                  product.merchants?.image_url ||
                  `https://ui-avatars.com/api/?name=${product.merchants?.name}&background=random`
                }
                alt="Store"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 cursor-pointer" onClick={goToShop}>
              <h4 className="font-bold text-base text-slate-800 flex items-center gap-1">
                {product.merchants?.name || "Toko"}
                {product.merchants?.is_verified && (
                  <ShieldCheck
                    size={16}
                    className="text-teal-500 fill-teal-100"
                  />
                )}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="text-teal-600 border border-teal-600 px-1 rounded-[2px] text-[10px]">
                  Active
                </span>
                <span>|</span>
                <span>{product.merchants?.city || "Jakarta"}</span>
              </div>
            </div>
            <button
              onClick={goToShop}
              className="px-4 py-2 border border-teal-600 text-teal-600 rounded text-sm font-medium hover:bg-teal-50"
            >
              Kunjungi Toko
            </button>
          </div>

          {/* CARD 3: SPESIFIKASI & DESKRIPSI */}
          <div className="bg-white p-4 md:rounded-xl md:shadow-sm md:p-6">
            <div className="bg-slate-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-sm text-slate-800 mb-3">
                Spesifikasi Produk
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 text-sm">
                <div className="flex">
                  <span className="text-slate-500 w-32">Stok</span>{" "}
                  <span className="text-slate-800">{product.stock}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32">Kategori</span>{" "}
                  <span className="text-teal-600 font-medium cursor-pointer">
                    {product.category}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32">Dikirim Dari</span>{" "}
                  <span className="text-slate-800">
                    {product.merchants?.city}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32">Berat</span>{" "}
                  <span className="text-slate-800">1000gr</span>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-4 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded">
              Deskripsi Produk
            </h3>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description || "Tidak ada deskripsi."}
            </p>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* BOTTOM BAR (MOBILE ONLY)       */}
      {/* ============================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center z-40 pb-safe">
        <div className="flex bg-white">
          <div className="flex flex-col items-center justify-center w-16 h-14 cursor-pointer border-r border-slate-50 active:bg-slate-50">
            <MessageCircle size={20} className="text-slate-600" />
            <span className="text-[10px] text-slate-600 mt-0.5">Chat</span>
          </div>
          <div
            onClick={goToShop}
            className="flex flex-col items-center justify-center w-16 h-14 cursor-pointer border-r border-slate-50 active:bg-slate-50"
          >
            <Store size={20} className="text-slate-600" />
            <span className="text-[10px] text-slate-600 mt-0.5">Toko</span>
          </div>
        </div>

        <div className="flex-1 flex h-14">
          {/* Mobile: Tombol Keranjang Teal */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-teal-600 text-white text-xs font-bold flex flex-col items-center justify-center active:opacity-90"
          >
            <span>+ Keranjang</span>
          </button>
          {/* Mobile: Tombol Beli Oranye (Agar user langsung notice tombol ini) */}
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-orange-500 text-white text-xs font-bold flex flex-col items-center justify-center active:opacity-90"
          >
            <span>Beli Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
