import React, { useState } from "react";
import { MessageSquareWarning, X } from "lucide-react";
import { ComplaintForm } from "./ComplaintForm";

interface ComplaintTriggerProps {
  orderId: string;
  orderStatus?: string;
}

// 🚩 PASTIKAN ADA KATA 'export' DI DEPAN CONST
export const ComplaintTrigger = ({
  orderId,
  orderStatus,
}: ComplaintTriggerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Tombol muncul jika pesanan sudah dalam proses kirim atau selesai
  const allowedStatus = ["SHIPPING", "DELIVERED", "COMPLETED"];

  // Jika status tidak sesuai, jangan tampilkan tombol agar tidak ada komplain prematur
  if (orderStatus && !allowedStatus.includes(orderStatus)) return null;

  return (
    <>
      {/* TOMBOL PEMICU */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border-2 border-[#FF6600] text-[#FF6600] rounded-md font-black text-[11px] uppercase tracking-tighter hover:bg-orange-50 transition-all active:scale-95 shadow-sm"
      >
        <MessageSquareWarning size={16} />
        AJUKAN KOMPLAIN PESANAN
      </button>

      {/* MODAL OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-2 text-white font-black text-[11px] uppercase tracking-widest hover:text-orange-400 transition-colors"
            >
              <X size={18} /> TUTUP
            </button>

            <ComplaintForm
              orderId={orderId}
              onSuccess={() => {
                setTimeout(() => setIsOpen(false), 2000);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
