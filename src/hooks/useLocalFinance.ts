import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export const useLocalFinance = (marketId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState({
    totalOmzet: 0,
    totalServiceFee: 0,
    totalOrders: 0,
    courierEarnings: 0,
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    try {
      // 1. Fetch Orders Summary
      const { data: orders } = await supabase
        .from("orders")
        .select("total_price, service_fee, courier_earning_total")
        .eq("market_id", marketId)
        .eq("status", "COMPLETED");

      // 2. Fetch Seller Stats
      const { data: sellerStats } = await supabase
        .from("order_items")
        .select(`merchant_id, quantity, price_at_purchase, merchants!inner(shop_name, id)`)
        .eq("merchants.market_id", marketId);

      // Processing Logic
      const summary = (orders || []).reduce((acc, curr) => ({
        omzet: acc.omzet + Number(curr.total_price),
        fees: acc.fees + Number(curr.service_fee),
        courier: acc.courier + Number(curr.courier_earning_total),
        count: acc.count + 1,
      }), { omzet: 0, fees: 0, courier: 0, count: 0 });

      const groupedSellers: any = {};
      (sellerStats || []).forEach((item: any) => {
        const id = item.merchant_id;
        if (!groupedSellers[id]) {
          groupedSellers[id] = { name: item.merchants.shop_name, total: 0, count: 0 };
        }
        groupedSellers[id].total += item.quantity * item.price_at_purchase;
        groupedSellers[id].count += 1;
      });

      setFinanceStats({
        totalOmzet: summary.omzet,
        totalServiceFee: summary.fees,
        totalOrders: summary.count,
        courierEarnings: summary.courier,
      });

      setTopSellers(Object.values(groupedSellers).sort((a: any, b: any) => b.total - a.total).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { financeStats, topSellers, loading, refresh: fetchData };
};