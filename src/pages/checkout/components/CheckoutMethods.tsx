import React from "react";
import {
  Truck,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  Gift,
} from "lucide-react";

interface Props {
  shippingMethod: "courier" | "pickup";
  setShippingMethod: (val: "courier" | "pickup") => void;
  paymentMethod: "midtrans" | "cod";
  setPaymentMethod: (val: "midtrans" | "cod") => void;
}

export const CheckoutMethods: React.FC<Props> = ({
  shippingMethod,
  setShippingMethod,
  paymentMethod,
  setPaymentMethod,
}) => {
  return (
    <div className="md:col-span-2 space-y-5">
      {/* CARA AMBIL */}
      <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <h2 className="text-[12px] text-slate-400 mb-4 tracking-widest font-black">
          1. PILIH CARA AMBIL
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShippingMethod("courier")}
            className={`flex flex-col items-center justify-center gap-3 py-6 rounded-md border-2 transition-all ${
              shippingMethod === "courier"
                ? "border-[#008080] bg-teal-50 text-[#008080]"
                : "border-slate-100 bg-slate-50 text-slate-400"
            }`}
          >
            <Truck size={32} />
            <span className="text-[12px] font-black">KURIR PASAR</span>
          </button>
          <button
            onClick={() => {
              setShippingMethod("pickup");
              setPaymentMethod("midtrans"); // Wajib bayar online kalau pickup
            }}
            className={`flex flex-col items-center justify-center gap-3 py-6 rounded-md border-2 transition-all ${
              shippingMethod === "pickup"
                ? "border-[#008080] bg-teal-50 text-[#008080]"
                : "border-slate-100 bg-slate-50 text-slate-400"
            }`}
          >
            <ShoppingBag size={32} />
            <span className="text-[12px] font-black">AMBIL SENDIRI</span>
          </button>
        </div>
      </section>

      {/* CARA BAYAR */}
      <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <h2 className="text-[12px] text-slate-400 mb-4 tracking-widest font-black">
          2. CARA BAYAR
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod("midtrans")}
            className={`w-full flex items-center justify-between p-5 rounded-md border-2 transition-all ${
              paymentMethod === "midtrans"
                ? "border-[#008080] bg-teal-50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <CreditCard
                className={
                  paymentMethod === "midtrans"
                    ? "text-[#008080]"
                    : "text-slate-400"
                }
                size={24}
              />
              <span className="text-[13px] font-black uppercase">
                BAYAR ONLINE (QRIS/E-WALLET)
              </span>
            </div>
            {paymentMethod === "midtrans" && (
              <CheckCircle2 size={24} className="text-[#008080]" />
            )}
          </button>

          {shippingMethod === "courier" ? (
            <button
              onClick={() => setPaymentMethod("cod")}
              className={`w-full flex items-center justify-between p-5 rounded-md border-2 transition-all ${
                paymentMethod === "cod"
                  ? "border-[#008080] bg-teal-50"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <Banknote
                  className={
                    paymentMethod === "cod"
                      ? "text-[#008080]"
                      : "text-slate-400"
                  }
                  size={24}
                />
                <span className="text-[13px] font-black uppercase">
                  BAYAR TUNAI (COD)
                </span>
              </div>
              {paymentMethod === "cod" && (
                <CheckCircle2 size={24} className="text-[#008080]" />
              )}
            </button>
          ) : (
            <div className="p-4 bg-orange-50 border-l-4 border-[#FF6600] rounded-md flex gap-4">
              <Gift size={24} className="text-[#FF6600] shrink-0" />
              <div>
                <p className="text-[12px] font-black text-[#FF6600] uppercase">
                  BONUS AMBIL SENDIRI
                </p>
                <p className="text-[12px] font-bold text-slate-600 mt-1 uppercase leading-tight">
                  WAJIB BAYAR ONLINE UNTUK DAPAT CASHBACK 3-5%.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
