import React, { useState, useEffect } from "react";
import { X, Save, Percent, DollarSign, AlertCircle } from "lucide-react";

// IMPORT YANG BENAR SESUAI FILE ANDA:
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export const ProductDiscountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [discountType, setDiscountType] = useState<
    "none" | "percent" | "fixed"
  >("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reset state saat modal dibuka dengan produk baru
  useEffect(() => {
    if (product && isOpen) {
      setDiscountType(product.discount_type || "none");
      setDiscountValue(product.discount_value || 0);
      setErrorMsg("");
    }
  }, [product, isOpen]);

  // Kalkulasi Harga Akhir secara Real-time
  const calculateFinalPrice = () => {
    if (!product) return 0;
    const price = Number(product.price);

    if (discountType === "none") return price;

    if (discountType === "percent") {
      // Validasi persen tidak boleh > 100
      if (discountValue > 100) return 0;
      const cut = price * (discountValue / 100);
      return Math.max(0, price - cut);
    }

    if (discountType === "fixed") {
      // Validasi potongan tidak boleh melebihi harga
      if (discountValue > price) return 0;
      return Math.max(0, price - discountValue);
    }

    return price;
  };

  const finalPrice = calculateFinalPrice();

  const handleSave = async () => {
    if (!product) return;

    // Validasi Sederhana
    if (discountType === "percent" && discountValue > 100) {
      setErrorMsg("Diskon persen tidak boleh lebih dari 100%");
      return;
    }
    if (discountType === "fixed" && discountValue > product.price) {
      setErrorMsg("Potongan harga tidak boleh melebihi harga produk");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("products")
        .update({
          discount_type: discountType,
          discount_value: discountValue,
          final_price: finalPrice, // Simpan harga akhir agar query sorting lebih cepat
        })
        .eq("id", product.id);

      if (error) throw error;

      onSuccess(); // Refresh data di halaman induk
      onClose(); // Tutup modal
    } catch (err: any) {
      console.error("Error updating discount:", err);
      setErrorMsg(err.message || "Gagal menyimpan diskon. Periksa koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-slate-200">
        {/* Header Modal */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              Atur Diskon Produk
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[250px] mt-0.5">
              {product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-6">
          {/* Opsi Tipe Diskon */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
              Pilih Tipe Potongan
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDiscountType("none")}
                className={`py-2.5 px-3 rounded-lg border text-[10px] font-black uppercase transition-all ${
                  discountType === "none"
                    ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`py-2.5 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                  discountType === "percent"
                    ? "bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-100"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Percent size={14} /> Persen
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`py-2.5 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                  discountType === "fixed"
                    ? "bg-[#FF6600] text-white border-[#FF6600] shadow-md ring-2 ring-orange-100"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <DollarSign size={14} /> Rupiah
              </button>
            </div>
          </div>

          {/* Input Nilai Diskon */}
          {discountType !== "none" && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                {discountType === "percent"
                  ? "Besar Persentase (%)"
                  : "Nominal Potongan (Rp)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full pl-4 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-bold text-slate-800 text-lg transition-all"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Area Preview Harga */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-teal-100 rounded-full blur-2xl opacity-50"></div>

            <div className="text-left z-10">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                Harga Awal
              </p>
              <p className="text-sm font-medium text-slate-400 line-through decoration-slate-400/50">
                Rp {Number(product.price).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="text-right z-10">
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-1">
                Harga Final
              </p>
              <p
                className={`text-2xl font-black tracking-tight ${finalPrice === 0 ? "text-red-500" : "text-slate-800"}`}
              >
                Rp {finalPrice.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-xs font-bold border border-red-100 animate-pulse">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isLoading || (discountType !== "none" && discountValue <= 0)
            }
            className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
          >
            {isLoading ? (
              <span className="animate-pulse">Menyimpan...</span>
            ) : (
              <>
                <Save size={16} /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
