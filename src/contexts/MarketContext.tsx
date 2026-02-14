import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { Market, Product, CartItem } from "../types";

// Definisi Tipe Data Context
interface MarketContextType {
  markets: Market[];
  availableMarkets: Market[];
  selectedMarket: Market | null;
  selectMarket: (market: Market) => void;
  setSelectedMarket: (market: Market | null) => void;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void; // Tambah parameter quantity opsional
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, newQty: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarketState] = useState<Market | null>(
    null,
  );

  // --- LOGIKA KERANJANG (DENGAN PENYIMPANAN OTOMATIS) ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("pasarqu_cart");
    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

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

        // Cek jika ada pasar yang tersimpan di LocalStorage
        const savedMarketId = localStorage.getItem("selected_market_id");
        if (savedMarketId) {
          const found = data.find((m) => m.id === savedMarketId);
          if (found) setSelectedMarketState(found);
        }
      }
    };
    fetchMarkets();
  }, []);

  // Setiap kali keranjang berubah, simpan ke HP
  useEffect(() => {
    localStorage.setItem("pasarqu_cart", JSON.stringify(cart));
  }, [cart]);

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
        // Jika sudah ada, tambahkan sesuai quantity yang dikirim
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        // Jika baru, masukkan semua data termasuk is_po dan po_days (Fitur Baru)
        return [
          ...prev,
          {
            ...product,
            quantity: quantity,
            unit: product.unit || "Pcs",
            image_url: product.image_url || "",
            // Pastikan data PO ikut masuk agar bisa diproses di Checkout
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
