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
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, newQty: number) => void; // Diubah: menerima angka pasti
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
    return savedCart ? JSON.parse(savedCart) : [];
  });

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

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prev,
          {
            ...product,
            quantity: 1,
            unit: product.unit || "pcs",
            image_url: product.image_url || "",
          },
        ];
      }
    });
  };

  // Menghapus item secara total
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // PERBAIKAN LOGIKA: Mengatur angka kuantitas secara langsung (Absolute)
  // Cara ini mencegah angka bertambah berkali lipat saat tombol minus ditekan
  const updateQty = (productId: string, newQty: number) => {
    setCart((prev) => {
      return (
        prev
          .map((item) => {
            if (item.id === productId) {
              // Pastikan input adalah angka murni dan minimal 0
              const safeQty = Math.max(0, Number(newQty));
              return { ...item, quantity: safeQty };
            }
            return item;
          })
          // Jika kuantitas 0, otomatis dihapus dari daftar
          .filter((item) => item.quantity > 0)
      );
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
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
