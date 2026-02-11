import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; // Pastikan path ini benar sesuai struktur project
import { Market, Product, CartItem } from '../types';

// Definisi Tipe Data Context
interface MarketContextType {
  markets: Market[];
  availableMarkets: Market[]; // Alias (Legacy Support)
  selectedMarket: Market | null;
  selectMarket: (market: Market) => void; // Alias (Legacy Support)
  setSelectedMarket: (market: Market | null) => void; // <--- INI PENTING UNTUK APP.TSX
  
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarketState] = useState<Market | null>(null);

  // --- LOGIKA KERANJANG (DENGAN PENYIMPANAN OTOMATIS) ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Cek apakah ada keranjang tersimpan di HP?
    const savedCart = localStorage.getItem('pasarqu_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Setiap kali keranjang berubah, simpan ke HP
  useEffect(() => {
    localStorage.setItem('pasarqu_cart', JSON.stringify(cart));
  }, [cart]);

  // --- LOGIKA PASAR ---
  
  // Fungsi Wrapper untuk mengatur Selected Market + Alias
  const setSelectedMarket = (market: Market | null) => {
    setSelectedMarketState(market);
    // Simpan ID pasar ke storage agar App.tsx bisa membacanya saat refresh
    if (market) {
        localStorage.setItem('selected_market_id', market.id);
    } else {
        localStorage.removeItem('selected_market_id');
    }
  };

  // Alias untuk kompatibilitas dengan kode lama Bapak
  const selectMarket = (market: Market) => {
    setSelectedMarket(market);
  };

  // --- FUNGSI KERANJANG ---

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { 
            ...product, 
            quantity: 1, 
            unit: product.unit || 'pcs', 
            image_url: product.image_url || '' 
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === productId);
      // Jika jumlah > 1, kurangi 1. Jika 1, hapus.
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <MarketContext.Provider
      value={{
        markets,
        availableMarkets: markets, // Kompatibilitas
        selectedMarket,
        selectMarket, // Kompatibilitas
        setSelectedMarket, // <--- Fungsi ini sekarang sudah ada isinya
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
  if (!context) throw new Error('useMarket must be used within a MarketProvider');
  return context;
};