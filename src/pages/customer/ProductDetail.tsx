import React, { useEffect, useState } from "react";
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
  AlertOctagon,
  MessageCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  calculateDistance,
  calculateShippingFee,
  getUserLocation,
} from "../../utils/courierLogic";

import { ProductGallery } from "./components/ProductGallery";
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

  const [product, setProduct] = useState<any>(null);
  const [soldCount, setSoldCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
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
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const totalCartItems = cart.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0,
  );

  // 🚀 FIX: LOGIKA SHARE YANG LEBIH HANDAL
  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || "Produk Pilihan di PasarQu";
    const text = `Lihat ${title} di PasarQu sekarang! Harga terbaik menantimu.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        // Tidak perlu toast jika share berhasil dibuka
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // Fallback jika API Share gagal (selain karena dibatalkan user)
          fallbackCopyText(url);
        }
      }
    } else {
      // Fallback untuk browser yang tidak dukung Web Share API (seperti Chrome Desktop)
      fallbackCopyText(url);
    }
  };

  const fallbackCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast("Link produk berhasil disalin!", "success");
    } catch (err) {
      showToast("Gagal menyalin link produk.", "error");
    }
  };

  const checkWishlist = async (prodId: string) => {
    if (!user || !prodId) return;
    try {
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", prodId)
        .maybeSingle();
      setIsWishlisted(!!data);
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const toggleWishlist = async () => {
    if (!user) return navigate("/login");
    setIsWishlistLoading(true);
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
    } catch (err) {
      showToast("Gagal menyimpan favorit", "error");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (chatLoading) return;
    if (!user) {
      showToast("Silakan login terlebih dahulu", "error");
      return navigate("/login");
    }
    if (!product?.merchant_id || !product?.merchants) {
      return showToast("Akun penjual tidak valid atau telah dihapus.", "error");
    }

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

      if (existingRoom?.id) {
        roomId = existingRoom.id;
      } else {
        const { data: newRoom, error: insertErr } = await supabase
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

        if (insertErr) {
          if (
            insertErr.code === "23505" ||
            String(insertErr.message).toLowerCase().includes("conflict") ||
            insertErr.code === "409"
          ) {
            const { data: retryRoom } = await supabase
              .from("chat_rooms")
              .select("id")
              .or(
                `and(participant_1_id.eq.${user.id},participant_2_id.eq.${cleanId}),and(participant_1_id.eq.${cleanId},participant_2_id.eq.${user.id})`,
              )
              .maybeSingle();
            if (retryRoom?.id) roomId = retryRoom.id;
            else throw new Error("Gagal memuat ulang ruang chat.");
          } else if (insertErr.code === "23503") {
            throw new Error("Gagal: Akun penjual tidak terdaftar di sistem.");
          } else {
            throw insertErr;
          }
        } else if (newRoom) {
          roomId = newRoom.id;
        }
      }

      if (!roomId) throw new Error("ID Ruang Chat tidak ditemukan.");

      const productLink = `${window.location.origin}/product/${product.id}`;
      const miniProductData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image:
          product.image_url || (product.image_urls && product.image_urls[0]),
        variant: selectedVariant,
        link: productLink,
      };

      const autoMessageRaw = `Halo Kak, saya tertarik dengan produk ini:\n*${product.name}*\n(Varian: ${selectedVariant})\n\nApakah stoknya masih tersedia?`;

      if (window.innerWidth >= 1024) {
        setActiveRoomId(roomId);
        setChatInitialMsg(autoMessageRaw);
        setChatAttachedProduct(miniProductData);
        setIsDesktopChatOpen(true);
      } else {
        const encodedProd = btoa(
          unescape(encodeURIComponent(JSON.stringify(miniProductData))),
        );
        navigate(
          `/chat/${roomId}?text=${encodeURIComponent(autoMessageRaw)}&p=${encodedProd}`,
        );
      }
    } catch (err: any) {
      console.error("Chat Error:", err.message || err);
      showToast(err.message || "Gagal memulai chat dengan penjual", "error");
    } finally {
      setChatLoading(false);
    }
  };

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
          let profileData = null;
          if (p.merchant_id) {
            const { data: m1 } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", p.merchant_id)
              .maybeSingle();
            profileData = m1;
          }

          const [c, r, s] = await Promise.all([
            p.category_id
              ? supabase
                  .from("categories")
                  .select("*")
                  .eq("id", p.category_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
            p.merchant_id
              ? supabase
                  .from("reviews")
                  .select("rating")
                  .eq("merchant_id", p.merchant_id)
              : Promise.resolve({ data: [] }),
            supabase
              .from("order_items")
              .select("quantity, orders!inner(status)")
              .eq("product_id", id)
              .in("orders.status", ["PAID", "COMPLETED", "SHIPPING"]),
          ]);

          const reviewData = r.data || [];
          const avg =
            reviewData.length > 0
              ? reviewData.reduce(
                  (acc: any, item: any) => acc + item.rating,
                  0,
                ) / reviewData.length
              : 0;
          const totalSold =
            s.data?.reduce(
              (acc: any, item: any) => acc + (item.quantity || 0),
              0,
            ) || 0;

          setProduct({ ...p, merchants: profileData, categories: c.data });
          setAverageRating(Number(avg.toFixed(1)));
          setSoldCount(totalSold);

          if (p.variants) {
            const variantList = Array.isArray(p.variants)
              ? p.variants
              : p.variants.split(",");
            if (variantList.length > 0) setSelectedVariant(variantList[0]);
          }
          checkWishlist(id);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    if (product) {
      const fetchShippingInfo = async () => {
        try {
          const userLoc = await getUserLocation();
          const merchantLat = product.merchants?.latitude || -6.2;
          const merchantLng = product.merchants?.longitude || 106.816666;
          const districtName =
            product.merchants?.district || product.merchants?.city || "Global";

          const dist = calculateDistance(
            userLoc.lat,
            userLoc.lng,
            merchantLat,
            merchantLng,
          );
          setDistanceKm(dist);

          const feeData = await calculateShippingFee(districtName, dist);
          setShippingCost(feeData.total_to_buyer);
          setLocationStatus("Lokasi ditemukan");
        } catch (error) {
          setLocationStatus("GPS tidak diizinkan");
          setDistanceKm(2.5);
          const feeData = await calculateShippingFee("Global", 2.5);
          setShippingCost(feeData.total_to_buyer);
        }
      };
      fetchShippingInfo();
    }
  }, [product]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2
          className="animate-spin text-[#008080]"
          size={36}
          strokeWidth={3}
        />
      </div>
    );
  if (!product)
    return (
      <div className="h-screen flex items-center justify-center font-[1000] uppercase tracking-widest text-slate-400 bg-slate-50 text-[14px]">
        Produk Tidak Ditemukan
      </div>
    );

  const images =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [
            `https://ui-avatars.com/api/?name=${product.name}&background=e2e8f0&color=64748b&size=500`,
          ];
  const isStoreOpen =
    product.merchants?.is_open !== false &&
    product.merchants?.status !== "CLOSED" &&
    product.merchants?.status !== "INACTIVE";
  const isOutOfStock = product.stock <= 0;
  const productVariants = product.variants
    ? Array.isArray(product.variants)
      ? product.variants
      : product.variants.split(",")
    : ["Standar"];
  const productWithVariant = { ...product, selected_variant: selectedVariant };

  return (
    <div className="bg-[#F5F5F5] min-h-screen text-left pb-24 md:pb-12 font-sans relative text-slate-900">
      {/* 🚀 FIX: HEADER HIJAU TOSCA, TEKS PUTIH, LOGO TEXT */}
      <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#008080] border-b border-white/10 shadow-md h-[60px] flex items-center justify-center transition-all">
        <div className="w-full max-w-[1200px] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-white active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            {/* Logo PasarQu dengan Outline Putih */}
            <div className="flex items-center">
              <img
                src="/logo-text.png"
                alt="PASARQU"
                className="h-7 md:h-8 w-auto object-contain"
                style={{
                  filter: `drop-shadow(1px 0px 0px white) drop-shadow(-1px 0px 0px white) drop-shadow(0px 1px 0px white) drop-shadow(0px -1px 0px white)`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 text-white hover:bg-white/20 rounded-full active:scale-90 transition-all"
            >
              <Share2 size={22} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate("/")}
              className="relative p-2 text-white hover:bg-white/20 rounded-full active:scale-90 transition-all"
            >
              <ShoppingBag size={22} strokeWidth={2.5} />
              {totalCartItems > 0 && (
                <div className="absolute top-0 right-0 bg-[#FF6600] text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-[#008080] shadow-sm">
                  {totalCartItems}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- SIDEBAR CHAT (DESKTOP) --- */}
      <div
        className={`fixed inset-0 z-[200] transition-all duration-300 ${isDesktopChatOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsDesktopChatOpen(false)}
        ></div>
        <div
          className={`absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isDesktopChatOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {activeRoomId && isDesktopChatOpen && (
            <ChatRoom
              embeddedRoomId={activeRoomId}
              initialMessage={chatInitialMsg}
              attachedProduct={chatAttachedProduct}
              onClose={() => setIsDesktopChatOpen(false)}
            />
          )}
        </div>
      </div>

      <main className="w-full max-w-[1200px] mx-auto pt-[76px] px-0 md:px-4">
        {/* Breadcrumb Desktop */}
        <div className="hidden md:flex items-center gap-2 mb-2 px-2">
          <button
            onClick={() => navigate("/")}
            className="text-[12px] font-[1000] text-[#008080] hover:text-teal-800 uppercase tracking-widest flex items-center gap-1.5"
          >
            <Home size={14} /> BERANDA
          </button>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[12px] font-[1000] text-[#008080] uppercase tracking-widest cursor-pointer hover:underline">
            {product.categories?.name || "KATEGORI"}
          </span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[300px]">
            {product.name}
          </span>
        </div>

        {!isStoreOpen && (
          <div className="bg-orange-50 border-l-4 border-[#FF6600] p-3 mb-3 mx-4 md:mx-0 rounded-r-md shadow-sm flex items-start gap-3">
            <AlertOctagon
              size={20}
              className="text-[#FF6600] shrink-0 mt-0.5"
            />
            <div>
              <h3 className="text-[14px] font-[1000] text-orange-900 uppercase tracking-widest">
                Toko Libur
              </h3>
              <p className="text-[12px] text-orange-800 font-bold mt-0.5">
                Penjual offline.{" "}
                <span className="text-[#FF6600] font-black">
                  Anda tetap bisa memesan!
                </span>{" "}
                Pesanan diproses saat toko buka.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white md:rounded-md shadow-sm mb-3">
          <div className="flex flex-col md:flex-row p-0 md:p-4 gap-0 md:gap-6">
            <div className="w-full md:w-[40%] shrink-0 relative">
              <div className="absolute top-4 right-4 z-30 md:hidden">
                <button
                  disabled={isWishlistLoading}
                  onClick={toggleWishlist}
                  className={`p-2.5 rounded-full shadow-lg border transition-all bg-white/90 backdrop-blur-md ${isWishlisted ? "text-red-500 border-red-200" : "text-slate-400 border-slate-100"}`}
                >
                  <Heart
                    size={22}
                    strokeWidth={2.5}
                    fill={isWishlisted ? "currentColor" : "none"}
                    className={isWishlistLoading ? "animate-pulse" : ""}
                  />
                </button>
              </div>
              <div className={!isStoreOpen ? "grayscale-[30%] opacity-95" : ""}>
                <ProductGallery
                  images={images}
                  activeIndex={activeImg}
                  onIndexChange={setActiveImg}
                  isOutOfStock={isOutOfStock}
                  isPo={product.is_po}
                  poDays={product.po_days}
                  productName={product.name}
                />
              </div>
            </div>

            <div className="w-full md:w-[60%] flex flex-col px-4 py-3 md:p-0">
              <div className="flex justify-between items-start gap-3">
                <h1 className="text-[18px] md:text-[20px] font-black text-slate-800 uppercase leading-snug tracking-wide">
                  {product.name}
                </h1>
                <div className="flex gap-2 shrink-0 mt-1">
                  <button
                    onClick={handleContactSeller}
                    disabled={chatLoading}
                    className="p-2 md:p-2.5 rounded-full text-[#008080] bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-all active:scale-90 flex items-center justify-center shadow-sm"
                  >
                    {chatLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <MessageCircle size={20} strokeWidth={2.5} />
                    )}
                  </button>
                  <button
                    disabled={isWishlistLoading}
                    onClick={toggleWishlist}
                    className={`hidden md:flex p-2.5 rounded-full transition-all active:scale-90 border shadow-sm items-center justify-center ${isWishlisted ? "text-red-500 bg-red-50 border-red-100" : "text-slate-400 hover:text-red-500 bg-slate-50 border-slate-200"}`}
                  >
                    <Heart
                      size={20}
                      strokeWidth={2.5}
                      fill={isWishlisted ? "currentColor" : "none"}
                      className={isWishlistLoading ? "animate-pulse" : ""}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-[12px] text-slate-500 font-bold divide-x divide-slate-300">
                <div className="flex items-center gap-1 text-[#FF6600]">
                  <Star size={14} fill="currentColor" />
                  <span className="text-[14px] border-b border-[#FF6600] leading-none">
                    {averageRating > 0 ? averageRating : "4.9"}
                  </span>
                </div>
                <div className="pl-3 flex items-center gap-1">
                  <span className="text-[14px] text-slate-800 leading-none">
                    {soldCount}
                  </span>{" "}
                  Penilaian
                </div>
                <div className="pl-3 flex items-center gap-1">
                  <span className="text-[14px] text-slate-800 leading-none">
                    {soldCount * 3 + 12}
                  </span>{" "}
                  Terjual
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3 mt-3 rounded-md flex items-end gap-2">
                <span className="text-[14px] text-[#FF6600] font-black mb-1 uppercase">
                  Rp
                </span>
                <span className="text-[28px] md:text-[32px] font-black text-[#FF6600] leading-none tracking-tighter">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-[12px] text-slate-400 font-bold ml-1 mb-1 uppercase tracking-widest">
                  Per {product.unit}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
                  <span className="text-[12px] text-slate-500 font-black uppercase tracking-widest w-20 shrink-0 mt-2">
                    Varian
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {productVariants.map((v: string) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-1.5 rounded-sm text-[12px] font-black uppercase tracking-wider border-2 transition-all ${selectedVariant === v ? "border-[#008080] text-[#008080] bg-teal-50/50" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                      >
                        {v}
                        {selectedVariant === v && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-[10px] border-t-transparent border-r-[#008080]"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="text-[12px] text-slate-500 font-black uppercase tracking-widest w-20 shrink-0">
                    Kuantitas
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-sm overflow-hidden h-8 w-24">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-8 h-full bg-white text-slate-600 font-black hover:bg-slate-50 border-r border-slate-300 text-[14px]"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={qty}
                        readOnly
                        className="flex-1 h-full w-full text-center text-[14px] font-black text-[#008080] outline-none"
                      />
                      <button
                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                        className="w-8 h-full bg-white text-slate-600 font-black hover:bg-slate-50 border-l border-slate-300 text-[14px]"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[12px] text-slate-500 font-bold">
                      Tersisa {product.stock} buah
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                {!isOutOfStock ? (
                  <>
                    <button
                      onClick={() => {
                        addToCart(productWithVariant, qty);
                        showToast("Masuk Keranjang", "success");
                      }}
                      className="px-6 h-10 bg-teal-50 border-2 border-[#008080] text-[#008080] font-black uppercase text-[12px] tracking-widest rounded-sm hover:bg-teal-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <ShoppingBag size={16} strokeWidth={2.5} /> KERANJANG
                    </button>
                    <button
                      onClick={() => {
                        addToCart(productWithVariant, qty);
                        navigate("/checkout");
                      }}
                      className="px-8 h-10 bg-[#FF6600] text-white font-black uppercase text-[12px] tracking-widest rounded-sm hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                    >
                      BELI SEKARANG
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-64 h-10 bg-slate-200 text-slate-500 font-black uppercase text-[12px] tracking-widest rounded-sm cursor-not-allowed"
                  >
                    STOK HABIS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white md:rounded-md shadow-sm mb-3 px-4 py-4 md:p-5">
          <MerchantCard
            merchant={product.merchants}
            onGoToShop={() => navigate(`/shop/${product.merchant_id}`)}
            onContactSeller={handleContactSeller}
            chatLoading={chatLoading}
          />
        </div>
        <div className="bg-white md:rounded-md shadow-sm mb-3 px-4 py-4 md:p-5">
          <ProductDescription
            category={product.categories?.name}
            city={product.merchants?.city || "Pasar Lokal"}
            stock={product.stock}
            description={product.description}
          />
        </div>
        <div className="bg-white md:rounded-md shadow-sm mb-3 px-4 py-4 md:p-5">
          <h3 className="text-[14px] font-[1000] text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star className="text-yellow-400" fill="currentColor" size={18} />{" "}
            Penilaian Produk
          </h3>
          <StoreReviews merchantId={product.merchant_id} />
        </div>
        <div className="bg-white md:rounded-md shadow-sm mb-3 px-4 py-4 md:p-5">
          <RelatedProducts
            categoryId={product.category_id}
            currentProductId={product.id}
          />
        </div>
      </main>

      <ProductActionBar
        isOutOfStock={isOutOfStock}
        qty={qty}
        stock={product.stock}
        onQtyChange={setQty}
        onAddToCart={() => {
          addToCart(productWithVariant, qty);
          showToast("Masuk Keranjang", "success");
        }}
        onContactSeller={handleContactSeller}
        chatLoading={chatLoading}
        onBuyNow={() => {
          addToCart(productWithVariant, qty);
          navigate("/checkout");
        }}
      />
    </div>
  );
};
