import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Loader2,
  MoreVertical,
  Home,
  Star,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

// Sub-Komponen
import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { MerchantCard } from "./components/MerchantCard";
import { ProductDescription } from "./components/ProductDescription";
import { ProductActionBar } from "./components/ProductActionBar";
// Import komponen review terbaru kita
import { StoreReviews } from "../../components/reviews/StoreReviews";

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

  const totalCartItems = cart.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0,
  );

  const handleContactSeller = async () => {
    if (!user) return navigate("/login");
    setChatLoading(true);
    try {
      const cleanId = product.merchant_id.trim();
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${cleanId}),and(participant_1_id.eq.${cleanId},participant_2_id.eq.${user.id})`,
        )
        .maybeSingle();
      if (room) navigate(`/chat/${room.id}`);
      else {
        const { data: nr } = await supabase
          .from("chat_rooms")
          .insert([
            {
              participant_1_id: user.id,
              participant_2_id: cleanId,
              updated_at: new Date(),
            },
          ])
          .select()
          .single();
        navigate(`/chat/${nr.id}`);
      }
    } catch (err) {
      showToast("Gagal chat", "error");
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
          const [m, c, r, s] = await Promise.all([
            supabase
              .from("profiles")
              .select("*")
              .eq("id", p.merchant_id)
              .maybeSingle(),
            supabase
              .from("categories")
              .select("*")
              .eq("id", p.category_id)
              .maybeSingle(),
            // 🚀 PERBAIKAN: Ambil rating rata-rata dari tabel 'reviews' yang baru
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

          const reviewData = r.data || [];
          const avg =
            reviewData.length > 0
              ? reviewData.reduce((acc, item) => acc + item.rating, 0) /
                reviewData.length
              : 0;

          const totalSold =
            s.data?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

          setProduct({ ...p, merchants: m.data, categories: c.data });
          setAverageRating(Number(avg.toFixed(1)));
          setSoldCount(totalSold);
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

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  if (!product)
    return (
      <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400">
        Produk Tidak Ditemukan
      </div>
    );

  const images =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : ["https://placehold.co/600x600/e2e8f0/64748b?text=Foto+Produk"];

  return (
    <div className="bg-white min-h-screen text-left pb-24 md:pb-10 font-sans">
      <header className="md:hidden fixed top-0 z-50 w-full flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-600 active:scale-90"
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
              <div className="absolute -top-1 -right-1 bg-teal-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                {totalCartItems}
              </div>
            )}
          </button>
          <MoreVertical size={22} className="text-slate-600" />
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto md:pt-6 px-0 md:px-4">
        <div className="hidden md:flex items-center gap-2 mb-4 px-2">
          <button
            onClick={() => navigate("/")}
            className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1"
          >
            <Home size={12} /> Beranda
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
            {product.name}
          </span>
        </div>

        <div className="bg-white flex flex-col md:flex-row overflow-hidden border-b border-slate-50 md:border-none">
          <ProductGallery
            images={images}
            activeIndex={activeImg}
            onIndexChange={setActiveImg}
            isOutOfStock={product.stock <= 0}
            isPo={product.is_po}
            poDays={product.po_days}
            productName={product.name}
          />
          <div className="flex-1 p-4 md:p-8 md:pl-4 space-y-6">
            <ProductInfo
              name={product.name}
              price={product.price}
              unit={product.unit}
              stock={product.stock}
              isOutOfStock={product.stock <= 0}
              soldCount={soldCount}
              rating={averageRating}
            />
            {product.stock > 0 && (
              <div className="hidden md:block pt-4 text-left">
                <button
                  onClick={() => {
                    addToCart(product, qty);
                    showToast("Masuk Keranjang", "success");
                  }}
                  className="px-8 py-4 bg-teal-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/10"
                >
                  Tambah Keranjang
                </button>
              </div>
            )}
          </div>
        </div>

        <MerchantCard
          merchant={product.merchants}
          onGoToShop={() => navigate(`/shop/${product.merchant_id}`)}
          onContactSeller={handleContactSeller}
          chatLoading={chatLoading}
        />

        <ProductDescription
          category={product.categories?.name}
          city={
            product.merchants?.city ||
            product.merchants?.shop_name ||
            "Pasar Lokal"
          }
          stock={product.stock}
          description={product.description}
        />

        {/* 🚀 BAGIAN ULASAN BARU */}
        <div className="mt-4 bg-white p-4 md:p-0">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-2 flex items-center gap-2 px-2 md:px-0 mt-4 md:mt-8">
            <Star className="text-yellow-400" fill="currentColor" size={18} />{" "}
            Penilaian Toko
          </h3>
          <StoreReviews merchantId={product.merchant_id} />
        </div>
      </main>

      <ProductActionBar
        isOutOfStock={product.stock <= 0}
        qty={qty}
        stock={product.stock}
        onQtyChange={setQty}
        onAddToCart={() => {
          addToCart(product, qty);
          showToast("Masuk Keranjang", "success");
        }}
        onContactSeller={handleContactSeller}
        chatLoading={chatLoading}
        onBuyNow={() => {
          addToCart(product, qty);
          navigate("/checkout");
        }}
      />
    </div>
  );
};
