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

interface MarketContextType {
  markets: Market[];
  availableMarkets: Market[];
  selectedMarket: Market | null;
  selectMarket: (market: Market) => void;
  setSelectedMarket: (market: Market | null) => void;
  setMarketById: (id: string) => void;

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
  const { user, loading: authLoading } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarketState] = useState<Market | null>(
    null,
  );
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. LOGIKA PEMILIHAN PASAR
  useEffect(() => {
    const fetchMarkets = async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setMarkets(data);
        const savedMarketId =
          localStorage.getItem("active_market_id") ||
          localStorage.getItem("selected_market_id");

        if (savedMarketId) {
          const found = data.find((m) => m.id === savedMarketId);
          if (found) {
            setSelectedMarketState(found);
            return;
          }
        }
        if (data.length > 0) {
          setSelectedMarketState(data[0]);
        }
      }
    };
    fetchMarkets();
  }, []);

  // ✅ 2. LOGIKA KERANJANG ANTI-HILANG (MIGRASI GUEST KE USER)
  useEffect(() => {
    if (authLoading) return;

    const savedCart = localStorage.getItem("pasarqu_cart");
    const lastOwner = localStorage.getItem("pasarqu_cart_owner");
    const currentUser = user ? user.id : "guest";

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);

        // JIKA OWNER BERBEDA (Contoh: Guest mendaftar jadi User)
        // Kita pindahkan barangnya ke user baru tersebut (MIGRASI)
        if (lastOwner !== currentUser) {
          console.log("Migrasi keranjang dari", lastOwner, "ke", currentUser);
          localStorage.setItem("pasarqu_cart_owner", currentUser);
        }

        setCart(parsedCart);
      } catch (e) {
        setCart([]);
      }
    }
  }, [user, authLoading]);

  // Simpan keranjang setiap kali ada perubahan
  useEffect(() => {
    if (authLoading) return;
    localStorage.setItem("pasarqu_cart", JSON.stringify(cart));
    localStorage.setItem("pasarqu_cart_owner", user ? user.id : "guest");
  }, [cart, user, authLoading]);

  // --- HELPER FUNCTIONS ---
  const setMarketById = (id: string) => {
    const found = markets.find((m) => m.id === id);
    if (found) {
      setSelectedMarketState(found);
      localStorage.setItem("selected_market_id", id);
      localStorage.setItem("active_market_id", id);
    }
  };

  const setSelectedMarket = (market: Market | null) => {
    setSelectedMarketState(market);
    if (market) {
      localStorage.setItem("selected_market_id", market.id);
      localStorage.setItem("active_market_id", market.id);
    } else {
      localStorage.removeItem("selected_market_id");
      localStorage.removeItem("active_market_id");
    }
  };

  const selectMarket = (market: Market) => {
    setSelectedMarket(market);
  };

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
            merchant_name: product.merchants?.shop_name || "Toko",
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId: string, newQty: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, newQty) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
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
        setMarketById,
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
