import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const useMerchantProducts = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchProducts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // ✅ PERBAIKAN: Gunakan maybeSingle agar tidak meledak jika toko super baru
      const { data: merchantData } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!merchantData) return;

      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantData.id)
        .order("created_at", { ascending: false });

      if (data) setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true);
    if (data) setCategories(data);
  };

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  return { products, loading, categories, fetchProducts, showToast, user };
};