import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useMarket } from '../contexts/MarketContext';
import { ProductGrid } from '../components/ProductGrid';
import { Product } from '../types';

interface HomeProps {
  searchQuery: string;
}

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const { selectedMarket } = useMarket();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedMarket?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('market_id', selectedMarket.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setProducts(data);
      } catch (err) {
        console.error("Gagal mengambil produk:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedMarket]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-0 md:px-0">
      
      {/* JUDUL REKOMENDASI (Sticky) */}
      <div className="bg-white p-3 border-b border-slate-100 flex justify-between items-center sticky top-[54px] md:top-[70px] z-30 shadow-sm mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
            Rekomendasi <span className="text-orange-600">Untukmu</span>
          </h3>
        </div>
        <div className="text-[9px] text-orange-600 font-bold px-2 py-1 bg-orange-50 rounded flex items-center gap-1 cursor-pointer">
          LIHAT SEMUA ❯
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="pb-24 bg-slate-50 min-h-screen">
        <ProductGrid products={filteredProducts} isLoading={isLoading} />
      </div>
    </div>
  );
};