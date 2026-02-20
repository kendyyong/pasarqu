import React from "react";
import { Wallet, Package, Bike, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";

interface OrderStatusProps {
  stats: {
    unpaid: number;
    packing: number;
    delivering: number;
    reviewable: number;
  };
}

export const CustomerOrderStatus: React.FC<OrderStatusProps> = ({ stats }) => {
  const navigate = useNavigate();
  const { user } = useAuth() as any;

  const handleGoToTracking = async (category: string) => {
    try {
      let query = supabase
        .from("orders")
        .select("id")
        .eq("customer_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (category === "UNPAID") query = query.eq("status", "UNPAID");
      if (category === "PACKING")
        query = query.eq("shipping_status", "PACKING");
      if (category === "SHIPPING")
        query = query.eq("shipping_status", "SHIPPING");
      if (category === "REVIEW") query = query.eq("status", "COMPLETED");

      const { data } = await query.maybeSingle();
      if (data) navigate(`/track-order/${data.id}`);
    } catch (err) {
      console.error("Nav error:", err);
    }
  };

  const items = [
    {
      label: "BELUM BAYAR",
      count: stats.unpaid,
      icon: Wallet,
      key: "UNPAID",
      color: "text-[#FF6600]",
      bg: "bg-orange-50",
    },
    {
      label: "DIKEMAS",
      count: stats.packing,
      icon: Package,
      key: "PACKING",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "DIKIRIM",
      count: stats.delivering,
      icon: Bike,
      key: "SHIPPING",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "ULASAN",
      count: stats.reviewable,
      icon: Star,
      key: "REVIEW",
      color: "text-[#FF6600]",
      bg: "bg-orange-50",
    },
  ];

  return (
    <section className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center">
        {items.map((item, idx) => {
          const isWorking = item.count > 0;
          const IconComponent = item.icon; // Ambil komponen ikonnya

          return (
            <button
              key={idx}
              disabled={!isWorking}
              onClick={() => handleGoToTracking(item.key)}
              className={`flex flex-col items-center justify-center w-1/4 transition-all ${
                isWorking
                  ? "opacity-100 cursor-pointer active:scale-90"
                  : "opacity-30 cursor-default"
              }`}
            >
              {/* BOX IKON PADAT */}
              <div
                className={`relative p-2 rounded-lg ${item.bg} mb-0.5 transition-colors`}
              >
                {/* Panggil ikon secara langsung sebagai komponen */}
                <IconComponent size={18} className={item.color} />

                {/* Badge Angka Orange */}
                {isWorking && (
                  <span className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-[8px] font-sans font-black w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white shadow-sm">
                    {item.count}
                  </span>
                )}
              </div>

              {/* TEKS LABEL 12PX */}
              <p className="text-[12px] font-black text-slate-700 tracking-tighter leading-none scale-90 md:scale-100">
                {item.label}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
