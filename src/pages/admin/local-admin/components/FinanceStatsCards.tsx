import React from "react";
import { TrendingUp, Coins, ShoppingBag } from "lucide-react";
import { FinanceCard } from "../../../../components/ui/SharedUI"; // Asumsi FinanceCard dipindah ke SharedUI

export const FinanceStatsCards = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <FinanceCard
      label="Omzet Pasar"
      value={`Rp ${stats.totalOmzet.toLocaleString()}`}
      icon={<TrendingUp className="text-blue-500" />}
      sub="Total Transaksi Produk"
      color="teal"
    />
    <FinanceCard
      label="Biaya Layanan"
      value={`Rp ${stats.totalServiceFee.toLocaleString()}`}
      icon={<Coins className="text-teal-500" />}
      sub="Revenue Bersih Aplikasi"
      color="teal"
    />
    <FinanceCard
      label="Volume Order"
      value={`${stats.totalOrders} Transaksi`}
      icon={<ShoppingBag className="text-orange-500" />}
      sub="Total Pesanan Berhasil"
      color="orange"
    />
  </div>
);
