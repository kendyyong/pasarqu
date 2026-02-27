import React from "react";
import { Coins, ReceiptText, Loader2, MapPin, Tag } from "lucide-react";

interface Props {
  profile: any;
  useBalance: boolean;
  setUseBalance: (val: boolean) => void;
  subtotalCart: number;
  shippingDetails: any;
  usedBalanceAmount: number;
  grandTotalAkhir: number;
  loading: boolean;
  onProcessPayment: () => void;
  onTermsClick: () => void;
}

export const CheckoutSummary: React.FC<Props> = ({
  profile,
  useBalance,
  setUseBalance,
  subtotalCart,
  shippingDetails,
  usedBalanceAmount,
  grandTotalAkhir,
  loading,
  onProcessPayment,
  onTermsClick,
}) => {
  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      {/* SALDO PASARQU (Desain Asli) */}
      <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm border-t-8 border-[#008080]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#008080]">
            <Coins size={20} />
            <h2 className="text-[12px] font-black uppercase">DOMPET SAYA</h2>
          </div>
          <span className="text-[14px] font-sans font-black text-slate-900">
            RP {(profile?.balance || 0).toLocaleString("id-ID")}
          </span>
        </div>
        <button
          onClick={() => setUseBalance(!useBalance)}
          disabled={(profile?.balance || 0) === 0}
          className={`w-full flex items-center justify-between p-4 rounded-md border-2 transition-all ${
            useBalance
              ? "border-[#008080] bg-teal-50 text-[#008080]"
              : "border-slate-100 bg-slate-50 text-slate-400"
          }`}
        >
          <span className="text-[12px] font-black uppercase">PAKAI SALDO</span>
          <div
            className={`w-10 h-5 rounded-full relative transition-colors ${useBalance ? "bg-[#008080]" : "bg-slate-300"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${useBalance ? "right-0.5" : "left-0.5"}`}
            />
          </div>
        </button>
      </section>

      {/* RINGKASAN TAGIHAN (Desain Asli + Fitur Detail) */}
      <section className="bg-white p-6 rounded-md border border-slate-200 shadow-xl border-b-[8px] border-[#008080]">
        <h2 className="text-[13px] font-[1000] mb-5 flex items-center gap-2 uppercase tracking-widest">
          <ReceiptText size={22} className="text-[#FF6600]" /> RINGKASAN HARGA
        </h2>

        <div className="space-y-4 text-[12px] font-black uppercase">
          {/* TOTAL PRODUK */}
          <div className="flex justify-between text-slate-500">
            <span>PRODUK</span>
            <span className="font-sans text-slate-900">
              {subtotalCart.toLocaleString("id-ID")}
            </span>
          </div>

          {/* 🚀 ONGKIR & JARAK (ANTI NaN) */}
          <div className="flex justify-between items-start text-slate-500">
            <div className="flex flex-col">
              <span>ONGKIR</span>

              {/* Logika Pintar: Hanya muncul kalau shippingDetails.distance_km ADA dan BUKAN NaN */}
              {shippingDetails?.distance_km &&
                !isNaN(parseFloat(shippingDetails.distance_km)) && (
                  <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> Jarak: {shippingDetails.distance_km} KM
                  </span>
                )}
            </div>

            {shippingDetails ? (
              <span
                className={`font-sans ${shippingDetails.app_subsidy > 0 ? "text-slate-400 line-through" : "text-slate-900"}`}
              >
                {(shippingDetails.real_shipping_cost || 0).toLocaleString(
                  "id-ID",
                )}
              </span>
            ) : (
              <Loader2 size={12} className="animate-spin text-slate-400" />
            )}
          </div>

          {/* 🚀 SUBSIDI GRATIS ONGKIR */}
          {shippingDetails?.app_subsidy > 0 && (
            <div className="flex justify-between text-teal-600 bg-teal-50 p-2 rounded border border-teal-100">
              <span className="flex items-center gap-1">
                <Tag size={12} /> PROMO ONGKIR
              </span>
              <span className="font-sans">
                -{shippingDetails.app_subsidy.toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {/* LAYANAN (TERMASUK HANDLING FEE JIKA ADA) */}
          <div className="flex justify-between text-[#008080]">
            <span>LAYANAN</span>
            <span className="font-sans">
              +
              {(shippingDetails?.combined_service_fee || 0).toLocaleString(
                "id-ID",
              )}
            </span>
          </div>

          {/* SALDO TERPAKAI */}
          {useBalance && (
            <div className="flex justify-between text-[#FF6600]">
              <span>SALDO TERPAKAI</span>
              <span className="font-sans">
                -{usedBalanceAmount.toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {/* TOTAL BAYAR (Desain Teks Super Besar Asli Bos) */}
          <div className="pt-5 border-t-2 border-slate-100 mt-5 leading-none">
            <p className="text-[12px] text-slate-400 mb-2 font-black text-center">
              TOTAL BAYAR
            </p>
            <p className="text-[42px] font-[1000] text-[#FF6600] font-sans text-center leading-none">
              RP {grandTotalAkhir.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* TOMBOL PROSES (Desain Asli) */}
        <button
          disabled={loading || !shippingDetails}
          onClick={onProcessPayment}
          className="w-full mt-8 py-5 bg-[#FF6600] text-white rounded-md font-black text-[14px] uppercase active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none flex justify-center items-center gap-2 shadow-lg shadow-orange-200 transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            "PROSES PESANAN"
          )}
        </button>

        {/* FOOTER SYARAT & KETENTUAN */}
        <p className="mt-5 text-[12px] text-slate-400 text-center px-2 uppercase font-black leading-tight">
          Klik Proses berarti setuju{" "}
          <button
            onClick={onTermsClick}
            className="text-[#008080] underline underline-offset-4 hover:text-teal-700"
          >
            S&K Cashback
          </button>
        </p>
      </section>
    </div>
  );
};
