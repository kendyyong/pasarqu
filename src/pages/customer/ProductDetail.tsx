import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Home,
  Star,
  ChevronRight,
  Share2,
  Heart,
  Scale,
  Truck,
  PackageCheck,
  ShoppingCart,
  Image as ImageIcon, // Fallback icon
} from "lucide-react";

// Contexts & Hooks
import { supabase } from "../../lib/supabaseClient";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

// Utils
import {
  calculateDistance,
  calculateShippingFee,
  getUserLocation,
} from "../../utils/courierLogic";

// Sub-Components
import { MerchantCard } from "./components/MerchantCard";
import { ProductDescription } from "./components/ProductDescription";
import { ProductActionBar } from "./components/ProductActionBar";
import { StoreReviews } from "../../components/reviews/StoreReviews";
import { RelatedProducts } from "./components/RelatedProducts";
import { ChatRoom } from "../../pages/chat/ChatRoom";

export const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useMarket();
  const { showToast } = useToast();
  const { user } = useAuth();

  // --- STATE MANAGEMENT ---
  const [product, setProduct] = useState<any>(null);
  const [soldCount, setSoldCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("Standar");
  const [isDesktopChatOpen, setIsDesktopChatOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatInitialMsg, setChatInitialMsg] = useState("");
  const [chatAttachedProduct, setChatAttachedProduct] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<string>("Melacak lokasi...");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 🚀 STATE UNTUK GALERI SWIPEABLE
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const totalCartItems = cart.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0,
  );

  // --- LOGIKA: FETCH DATA PRODUK LENGKAP ---
  useEffect(() => {
    const fetchFullData = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const id = productId.trim();
        const { data: p } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (p) {
          const { data: mData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", p.merchant_id)
            .maybeSingle();
          const [cat, rev, ord] = await Promise.all([
            supabase
              .from("categories")
              .select("*")
              .eq("id", p.category_id)
              .maybeSingle(),
            supabase
              .from("reviews")
              .select("rating")
              .eq("merchant_id", p.merchant_id),
            supabase
              .from("order_items")
              .select("quantity, orders!inner(status)")
              .eq("product_id", id)
              .in("orders.status", ["PAID", "COMPLETED", "SHIPPING"]),
          ]);

          const avg =
            rev.data && rev.data.length > 0
              ? rev.data.reduce((acc: any, i: any) => acc + i.rating, 0) /
                rev.data.length
              : 0;
          const sold =
            ord.data?.reduce(
              (acc: any, i: any) => acc + (i.quantity || 0),
              0,
            ) || 0;

          setProduct({ ...p, merchants: mData, categories: cat.data });
          setAverageRating(Number(avg.toFixed(1)));
          setSoldCount(sold);
          if (p.variants) {
            const vList = Array.isArray(p.variants)
              ? p.variants
              : p.variants.split(",");
            if (vList.length > 0) setSelectedVariant(vList[0]);
          }
          checkWishlist(id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
    window.scrollTo(0, 0);
  }, [productId]);

  // --- LOGIKA: HITUNG ONGKIR & JARAK ---
  useEffect(() => {
    if (product) {
      const getShipping = async () => {
        try {
          const userLoc = await getUserLocation();
          const dist = calculateDistance(
            userLoc.lat,
            userLoc.lng,
            product.merchants?.latitude || -6.2,
            product.merchants?.longitude || 106.8,
          );
          setDistanceKm(dist);
          const fee = await calculateShippingFee(
            product.merchants?.district || "Global",
            dist,
          );
          setShippingCost(fee.total_to_buyer);
          setLocationStatus("Lokasi ditemukan");
        } catch (e) {
          setDistanceKm(2.5);
          const fee = await calculateShippingFee("Global", 2.5);
          setShippingCost(fee.total_to_buyer);
          setLocationStatus("GPS Tidak Aktif");
        }
      };
      getShipping();
    }
  }, [product]);

  // --- LOGIKA: WISHLIST ---
  const checkWishlist = async (id: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();
    setIsWishlisted(!!data);
  };

  const toggleWishlist = async () => {
    if (!user) return navigate("/login");
    try {
      if (isWishlisted) {
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        setIsWishlisted(false);
        showToast("Dihapus dari Favorit", "success");
      } else {
        await supabase
          .from("wishlists")
          .insert([{ user_id: user.id, product_id: product.id }]);
        setIsWishlisted(true);
        showToast("Disimpan ke Favorit", "success");
      }
    } catch (err) {}
  };

  // --- LOGIKA: CHAT & SHARE ---
  const handleContactSeller = async () => {
    if (!user) return navigate("/login");
    setChatLoading(true);
    try {
      const cleanId = product.merchant_id.trim();
      let roomId = null;
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${cleanId}),and(participant_1_id.eq.${cleanId},participant_2_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (existingRoom?.id) roomId = existingRoom.id;
      else {
        const { data: newRoom } = await supabase
          .from("chat_rooms")
          .insert([
            {
              participant_1_id: user.id,
              participant_2_id: cleanId,
              updated_at: new Date().toISOString(),
            },
          ])
          .select("id")
          .maybeSingle();
        roomId = newRoom?.id;
      }

      const miniProd = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || product.image_urls?.[0],
        variant: selectedVariant,
        link: window.location.href,
      };
      const autoMsg = `Halo Kak, stok ready?`;

      if (window.innerWidth >= 1024) {
        setActiveRoomId(roomId);
        setChatInitialMsg(autoMsg);
        setChatAttachedProduct(miniProd);
        setIsDesktopChatOpen(true);
      } else {
        const encodedProd = btoa(
          unescape(encodeURIComponent(JSON.stringify(miniProd))),
        );
        navigate(
          `/chat/${roomId}?text=${encodeURIComponent(autoMsg)}&p=${encodedProd}`,
        );
      }
    } catch (e) {
      showToast("Gagal chat", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link disalin!", "success");
    }
  };

  // 🚀 LOGIKA: DETEKSI SCROLL GAMBAR UNTUK INDIKATOR TITIK
  const handleScroll = () => {
    if (galleryRef.current) {
      const scrollPosition = galleryRef.current.scrollLeft;
      const width = galleryRef.current.clientWidth;
      const newIndex = Math.round(scrollPosition / width);
      setActiveImgIndex(newIndex);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
      </div>
    );
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center font-black text-slate-400 uppercase">
        Produk Tidak Ditemukan
      </div>
    );

  const isOutOfStock = product.stock <= 0;
  const hasPromo = product.promo_price && product.promo_price < product.price;
  const displayPrice = hasPromo ? product.promo_price : product.price;
  const discountPercent =
    product.promo_percentage ||
    (hasPromo
      ? Math.round(
          ((product.price - product.promo_price) / product.price) * 100,
        )
      : 0);

  const productWithVariant = { ...product, selected_variant: selectedVariant };
  const productVariants = product.variants
    ? Array.isArray(product.variants)
      ? product.variants
      : product.variants.split(",")
    : ["Standar"];
  const images =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : [product.image_url];

  return (
    <div className="bg-[#F5F5F5] min-h-screen text-left pb-20 md:pb-12 font-sans relative text-slate-900 overflow-x-hidden">
      {/* 🚀 HEADER */}
      <ProductHeader
        totalCartItems={totalCartItems}
        onShare={handleShare}
        onBack={() => navigate(-1)}
      />

      <main className="w-full max-w-[1200px] mx-auto pt-[58px] md:pt-[76px] px-0 md:px-4">
        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-3 px-2 text-[11px] font-black text-[#008080] uppercase tracking-widest">
          <Home size={14} /> HOME <ChevronRight size={12} />{" "}
          {product.categories?.name} <ChevronRight size={12} />{" "}
          <span className="text-slate-400">{product.name}</span>
        </div>

        {/* 🚀 KARTU PRODUK UTAMA */}
        <div className="bg-white md:rounded-xl shadow-sm overflow-hidden mb-1 md:mb-3">
          <div className="flex flex-col md:flex-row">
            {/* 📸 BAGIAN GALERI GAMBAR (SWIPEABLE LEVEL DEWA) */}
            <div className="w-full md:w-[450px] shrink-0 relative bg-slate-50 aspect-square overflow-hidden group">
              {/* Container Scroll/Swipe */}
              <div
                ref={galleryRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              >
                {images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center flex justify-center items-center relative"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={`${product.name} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <ImageIcon size={64} />
                        <p className="text-[10px] mt-2 font-black tracking-widest">
                          NO IMAGE
                        </p>
                      </div>
                    )}

                    {/* Badge Out of Stock */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-slate-900 text-white px-6 py-2 rounded-xl text-lg font-black tracking-widest uppercase border-4 border-white shadow-2xl rotate-[-10deg]">
                          STOK HABIS
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Indikator Titik (Dots) */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                  {images.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${activeImgIndex === idx ? "w-6 bg-[#008080]" : "w-2 bg-white/70 shadow-sm"}`}
                    />
                  ))}
                </div>
              )}

              {/* Tombol Wishlist Melayang */}
              <button
                onClick={toggleWishlist}
                className="absolute top-4 right-4 z-30 md:hidden p-2.5 bg-white/90 rounded-full shadow-lg active:scale-90 transition-transform"
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "#ef4444" : "none"}
                  className={isWishlisted ? "text-red-500" : "text-slate-400"}
                />
              </button>
            </div>

            {/* INFO PRODUK & HARGA */}
            <div className="flex-1 p-3.5 md:p-6 flex flex-col">
              <h1 className="text-[18px] md:text-[24px] font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-3 md:mb-4 text-[12px] font-bold">
                <div className="flex items-center gap-1 text-[#FF6600] bg-orange-50 px-2 py-0.5 rounded-md">
                  <Star size={14} fill="currentColor" />{" "}
                  <span>{averageRating || "4.9"}</span>
                </div>
                <div className="text-slate-200">|</div>
                <div className="text-slate-500 uppercase font-black tracking-tight">
                  {soldCount * 2 + 5} TERJUAL
                </div>
              </div>

              {/* HARGA & DISKON */}
              <div className="bg-slate-50 border-2 border-slate-100 p-4 md:p-5 rounded-xl mb-4 shadow-sm relative overflow-hidden">
                {hasPromo && (
                  <div className="flex items-center gap-2 mb-1 relative z-10">
                    <span className="bg-red-500 text-white text-[10px] md:text-[11px] font-black px-2 py-0.5 rounded-md">
                      DISKON {discountPercent}%
                    </span>
                    <span className="text-slate-400 line-through text-[12px] md:text-[14px] font-bold tracking-tighter">
                      Rp {product.price.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-end gap-1.5 leading-none relative z-10">
                  <span className="text-3xl md:text-4xl font-black text-[#FF6600] tracking-tighter">
                    Rp {displayPrice.toLocaleString()}
                  </span>
                  <span className="text-[12px] md:text-sm font-black text-slate-400 mb-0.5 uppercase tracking-widest">
                    / {product.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-[#008080] font-black text-[10px] md:text-[11px] uppercase tracking-widest bg-teal-50/50 inline-flex px-2 py-1 rounded-md border border-teal-100 relative z-10">
                  <Scale size={14} /> BERAT: {product.weight}{" "}
                  {product.unit === "Kg" ? "Kg" : "Gram"}
                </div>

                {/* Dekorasi Airmark */}
                <PackageCheck
                  size={100}
                  className="absolute -right-4 -bottom-4 text-slate-200 opacity-30 pointer-events-none"
                />
              </div>

              {/* LOGISTIK KOMPAK */}
              <div className="flex items-start gap-3 mb-6 p-3 bg-white border border-slate-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008080] flex items-center justify-center shrink-0">
                  <Truck size={18} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] md:text-[14px] text-slate-800 font-black leading-tight uppercase">
                    ESTIMASI ONGKIR:{" "}
                    <span className="text-[#FF6600]">
                      Rp {shippingCost?.toLocaleString() || "---"}
                    </span>
                  </p>
                  <span className="text-[10px] md:text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                    {locationStatus} ({distanceKm?.toFixed(1)} Km)
                  </span>
                </div>
              </div>

              {/* 🚀 VARIAN (Jika ada) */}
              <div className="mb-4">
                <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  PILIH VARIAN
                </span>
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((v: string) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 text-[11px] font-black uppercase rounded-lg border-2 transition-all shadow-sm ${selectedVariant === v ? "border-[#008080] text-[#008080] bg-teal-50" : "border-slate-200 text-slate-500 bg-white hover:border-[#008080]"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🚀 TOMBOL BELANJA DESKTOP (Sembunyi di Mobile) */}
              <div className="hidden md:flex flex-col gap-4 mt-auto border-t-2 border-slate-100 pt-4">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase w-20 shrink-0 tracking-widest">
                    JUMLAH
                  </span>
                  <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden w-32 h-12 shadow-sm bg-white">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex-1 font-black text-xl hover:bg-slate-100 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qty}
                      readOnly
                      className="w-12 text-center font-black text-xl text-[#008080] bg-transparent outline-none"
                    />
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="flex-1 font-black text-xl hover:bg-slate-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 tracking-widest">
                    SISA:{" "}
                    <span className="text-slate-800">{product.stock}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      addToCart(productWithVariant, qty);
                      showToast("Masuk Keranjang", "success");
                    }}
                    className="flex-1 h-14 border-2 border-[#008080] text-[#008080] font-black tracking-widest rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                  >
                    <ShoppingCart size={20} /> KERANJANG
                  </button>
                  <button
                    onClick={() => {
                      addToCart(productWithVariant, qty);
                      navigate("/checkout");
                    }}
                    className="flex-[1.5] h-14 bg-[#FF6600] text-white font-black tracking-widest rounded-xl hover:bg-orange-600 transition-all active:scale-95 text-center shadow-lg shadow-orange-900/10"
                  >
                    BELI SEKARANG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 SPESIFIKASI */}
        <div className="bg-white md:rounded-xl shadow-sm mb-1 md:mb-3 overflow-hidden border-2 border-slate-50">
          <div className="px-4 py-3 border-b-2 border-slate-100 flex items-center gap-2 bg-slate-50">
            <PackageCheck size={18} className="text-[#008080]" />
            <h3 className="text-[12px] md:text-[14px] font-black text-slate-800 uppercase tracking-widest">
              Spesifikasi Produk
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <SpecRow label="Kategori" value={product.categories?.name} isLink />
            <SpecRow
              label="Berat"
              value={`${product.weight} ${product.unit === "Kg" ? "Kg" : "Gram"}`}
            />
            <SpecRow label="Satuan" value={`Per ${product.unit}`} />
            <SpecRow label="Stok" value={product.stock} />
            <SpecRow
              label="Dikirim Dari"
              value={product.merchants?.city || "Pasar Lokal"}
            />
          </div>
        </div>

        {/* 🚀 MERCHANT SECTION */}
        <div className="bg-white md:rounded-xl shadow-sm mb-1 p-3">
          <MerchantCard
            merchant={product.merchants}
            onGoToShop={() => navigate(`/shop/${product.merchant_id}`)}
            onContactSeller={handleContactSeller}
            chatLoading={chatLoading}
          />
        </div>

        <div className="bg-white md:rounded-xl shadow-sm mb-1 p-4">
          <ProductDescription
            category={product.categories?.name}
            city={product.merchants?.city}
            stock={product.stock}
            description={product.description}
          />
        </div>

        <div className="bg-white md:rounded-xl shadow-sm mb-1 p-4">
          <h3 className="text-[12px] md:text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Star className="text-yellow-400" fill="currentColor" size={18} />{" "}
            Penilaian Produk
          </h3>
          <StoreReviews merchantId={product.merchant_id} />
        </div>

        <div className="mb-6 px-1 md:px-0">
          <RelatedProducts
            categoryId={product.category_id}
            currentProductId={product.id}
          />
        </div>
      </main>

      {/* 🚀 ACTION BAR (Mobile Floating di Bawah) */}
      <div className="md:hidden">
        <ProductActionBar
          isOutOfStock={isOutOfStock}
          qty={qty}
          stock={product.stock}
          onQtyChange={setQty}
          onAddToCart={() => {
            addToCart(productWithVariant, qty);
            showToast("Berhasil ditambah", "success");
          }}
          onContactSeller={handleContactSeller}
          chatLoading={chatLoading}
          onBuyNow={() => {
            addToCart(productWithVariant, qty);
            navigate("/checkout");
          }}
        />
      </div>

      {/* CHAT MODAL DESKTOP */}
      {isDesktopChatOpen && activeRoomId && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsDesktopChatOpen(false)}
          />
          <div className="relative w-[400px] h-full bg-white shadow-2xl">
            <ChatRoom
              embeddedRoomId={activeRoomId}
              initialMessage={chatInitialMsg}
              attachedProduct={chatAttachedProduct}
              onClose={() => setIsDesktopChatOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 🚀 CSS MAGIC UNTUK MENGHILANGKAN SCROLLBAR TAPI BISA DI-SWIPE */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const ProductHeader = ({ totalCartItems, onShare, onBack }: any) => (
  <header className="fixed top-0 left-0 right-0 z-[100] bg-[#008080] h-[55px] md:h-[65px] flex items-center shadow-md">
    <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1 text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <img
          src="/logo-text.png"
          alt="PASARQU"
          className="h-9 md:h-12 w-auto object-contain"
          style={{
            filter:
              "drop-shadow(1px 1px 0px #ffffff) drop-shadow(-1px -1px 0px #ffffff) drop-shadow(1px -1px 0px #ffffff) drop-shadow(-1px 1px 0px #ffffff)",
          }}
        />
      </div>
      <div className="flex items-center gap-1 md:gap-3">
        <button
          onClick={onShare}
          className="p-2 text-white active:bg-white/10 rounded-full transition-all"
        >
          <Share2 size={26} strokeWidth={2} />
        </button>
        <div
          className="relative p-2 text-white cursor-pointer active:bg-white/10 rounded-full"
          onClick={() => (window.location.href = "/cart")}
        >
          <ShoppingCart size={26} strokeWidth={2.5} />
          {totalCartItems > 0 && (
            <div className="absolute top-1 right-1 bg-[#FF6600] text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-[#008080] shadow-sm">
              {totalCartItems}
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);

const SpecRow = ({ label, value, isLink }: any) => (
  <div className="flex items-center justify-between py-2 border-b-2 border-slate-50 last:border-0 min-h-[40px] gap-6">
    <span className="text-[11px] md:text-[12px] text-slate-400 font-black uppercase tracking-widest shrink-0">
      {label}
    </span>
    <span
      className={`text-[12px] md:text-[13px] font-black uppercase text-right leading-tight flex-1 ${isLink ? "text-[#008080] cursor-pointer hover:underline" : "text-slate-800"}`}
    >
      {value}
    </span>
  </div>
);
