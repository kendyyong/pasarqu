import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { Market, Product, CartItem } from "../types";
import { useAuth } from "./AuthContext";

// Definisi Tipe Data Context
interface MarketContextType {
  markets: Market[];
  availableMarkets: Market[];
  selectedMarket: Market | null;
  selectMarket: (market: Market) => void;
  setSelectedMarket: (market: Market | null) => void;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, newQty: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarketState] = useState<Market | null>(
    null,
  );

  // ✅ PERUBAHAN PENTING:
  // Mulai dengan array KOSONG []. Jangan langsung ambil dari localStorage.
  // Ini mencegah "Hantu" muncul sebelum dicek pemiliknya.
  const [cart, setCart] = useState<CartItem[]>([]);

  // ✅ LOGIKA PEMUATAN AMAN (LOADER & VERIFICATOR)
  useEffect(() => {
    // Tunggu sampai sistem login selesai mengecek (loading = false)
    if (loading) return;

    const savedCart = localStorage.getItem("pasarqu_cart");
    const lastOwner = localStorage.getItem("pasarqu_cart_owner");
    const currentUser = user ? user.id : "guest"; // ID User atau "guest"

    // Skenario 1: Tidak ada data keranjang sama sekali
    if (!savedCart) {
      localStorage.setItem("pasarqu_cart_owner", currentUser);
      return;
    }

    // Skenario 2: Ada data, tapi pemiliknya COCOK (User yang sama atau sesama Guest)
    if (lastOwner === currentUser) {
      try {
        setCart(JSON.parse(savedCart)); // ✅ Aman, tampilkan cart
      } catch (e) {
        setCart([]);
      }
    }
    // Skenario 3: Ada data, tapi pemilik BEDA (Misal: Dulu Admin, skrg Tamu)
    else {
      console.log("🛑 Keranjang milik user lain dibersihkan.");
      localStorage.removeItem("pasarqu_cart"); // Hapus data lama
      localStorage.setItem("pasarqu_cart_owner", currentUser); // Set pemilik baru
      setCart([]); // Pastikan state kosong
    }
  }, [user, loading]); // Jalankan ulang setiap kali user berubah (Login/Logout)

  // Ambil data pasar saat pertama kali load
  useEffect(() => {
    const fetchMarkets = async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setMarkets(data);
        const savedMarketId = localStorage.getItem("selected_market_id");
        if (savedMarketId) {
          const found = data.find((m) => m.id === savedMarketId);
          if (found) setSelectedMarketState(found);
        }
      }
    };
    fetchMarkets();
  }, []);

  // Simpan perubahan keranjang ke LocalStorage (Hanya jika loading selesai)
  useEffect(() => {
    if (loading) return;

    // Jangan simpan array kosong jika itu terjadi karena inisialisasi awal
    // Tapi jika user sengaja menghapus item (cart.length 0), tetap harus disimpan.
    // Kita gunakan logic sederhana: selalu simpan current state.
    localStorage.setItem("pasarqu_cart", JSON.stringify(cart));

    // Selalu perbarui tanda tangan pemilik
    const currentUser = user ? user.id : "guest";
    localStorage.setItem("pasarqu_cart_owner", currentUser);
  }, [cart, user, loading]);

  // --- LOGIKA PASAR ---
  const setSelectedMarket = (market: Market | null) => {
    setSelectedMarketState(market);
    if (market) {
      localStorage.setItem("selected_market_id", market.id);
    } else {
      localStorage.removeItem("selected_market_id");
    }
  };

  const selectMarket = (market: Market) => {
    setSelectedMarket(market);
  };

  // --- FUNGSI KERANJANG ---
  const addToCart = (product: any, quantity: number = 1) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        return [
          ...prev,
          {
            ...product,
            quantity: quantity,
            unit: product.unit || "Pcs",
            image_url: product.image_url || "",
            is_po: product.is_po || false,
            po_days: product.po_days || 0,
            merchant_name:
              product.merchants?.shop_name || product.merchants?.name || "Toko",
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId: string, newQty: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const safeQty = Math.max(0, Number(newQty));
            return { ...item, quantity: safeQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("pasarqu_cart");
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  return (
    <MarketContext.Provider
      value={{
        markets,
        availableMarkets: markets,
        selectedMarket,
        selectMarket,
        setSelectedMarket,
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context)
    throw new Error("useMarket must be used within a MarketProvider");
  return context;
};
