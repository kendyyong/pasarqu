import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient"; // 🚀 FIX: Jalur sudah disesuaikan
import { useToast } from "../contexts/ToastContext"; // 🚀 FIX: Jalur sudah disesuaikan

export const useOrderTracking = (orderId: string | undefined, user: any) => {
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchFullData = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      
      // 1. Ambil Order
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("*, market:markets(*)")
        .eq("id", orderId)
        .maybeSingle();

      if (orderErr) throw orderErr;
      if (!orderData) return;

      // 2. Ambil Item & Info Toko Asli (Mencegah Error Review)
      const { data: rawItems } = await supabase
        .from("order_items")
        .select("*, product:products(name, image_url), merchant:merchants(id, latitude, longitude, address, shop_name)")
        .eq("order_id", orderId);

      if (rawItems) {
        setOrderItems(rawItems);
        if (rawItems[0]?.merchant) {
          orderData.merchant = rawItems[0].merchant;
        }
      }

      setOrder(orderData);

      // 3. Ambil Kurir
      if (orderData.courier_id) {
        const { data: cData } = await supabase.from("couriers").select("*").eq("id", orderData.courier_id).maybeSingle();
        setCourier(cData);
      }

      // 4. Cek Ulasan
      const { data: reviewData } = await supabase.from("reviews").select("id").eq("order_id", orderId).maybeSingle();
      if (reviewData) setHasReviewed(true);
      
    } catch (err: any) {
      console.error(err);
      showToast("Gagal memuat data pesanan", "error");
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => { fetchFullData(); }, [fetchFullData]);

  // Real-time listener
  useEffect(() => {
    if (!orderId) return;
    const orderChannel = supabase.channel(`track-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, 
        (payload: any) => setOrder((prev: any) => ({ ...prev, ...payload.new }))) // 🚀 FIX: payload diberi tipe :any
      .subscribe();

    return () => { supabase.removeChannel(orderChannel); };
  }, [orderId]);

  return { order, setOrder, courier, orderItems, loading, hasReviewed, setHasReviewed };
};