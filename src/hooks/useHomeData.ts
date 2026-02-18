import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export const useHomeData = (selectedMarketId?: string) => {
  const [products, setProducts] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Ads
      const { data: adsData } = await supabase.from("ads").select("*").eq("is_active", true).order("sort_order");
      setAds(adsData || []);

      // 2. Fetch Quick Actions
      const { data: qaData } = await supabase.from("quick_actions").select("*").eq("is_active", true).order("sort_order");
      setQuickActions(qaData || []);

      // 3. Fetch Products
      let query = supabase.from("products").select("*, merchants:merchant_id(shop_name)").eq("status", "APPROVED").order("stock", { ascending: false });
      if (selectedMarketId) query = query.eq("market_id", selectedMarketId);
      
      const { data: prodData } = await query;
      setProducts(prodData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMarketId]);

  return { products, ads, quickActions, isLoading, refresh: fetchData };
};