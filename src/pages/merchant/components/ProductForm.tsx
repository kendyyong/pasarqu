import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  X,
  Loader2,
  Tag,
  Package,
  Type,
  FileText,
  Percent,
  Lock,
  Layers,
  Archive,
} from "lucide-react";

interface Props {
  onBack: () => void;
  categories: any[];
  user: any;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  initialData?: any;
}

export const ProductForm: React.FC<Props> = ({
  onBack,
  categories,
  user,
  onSuccess,
  showToast,
  initialData,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const isEditMode = !!initialData;

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    promo_price: "",
    stock: "",
    description: "",
    unit: "Pcs",
    category_id: "",
    is_po: false,
    po_days: "3",
  });

  useEffect(() => {
    if (initialData) {
      setNewProduct({
        name: initialData.name || "",
        price: initialData.price?.toString() || "",
        promo_price: initialData.promo_price?.toString() || "",
        stock: initialData.stock?.toString() || "",
        description: initialData.description || "",
        unit: initialData.unit || "Pcs",
        category_id: initialData.category_id || "",
        is_po: initialData.is_po || false,
        po_days: initialData.po_days?.toString() || "3",
      });
      if (initialData.image_urls) {
        setExistingImages(initialData.image_urls);
      } else if (initialData.image_url) {
        setExistingImages([initialData.image_url]);
      }
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalPhotos =
        selectedFiles.length + imageFiles.length + existingImages.length;

      if (totalPhotos > 3) {
        showToast("MAKSIMAL HANYA BOLEH 3 FOTO!", "error");
        return;
      }
      setImageFiles([...imageFiles, ...selectedFiles]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);
    try {
      const { data: merchant } = await supabase
        .from("profiles")
        .select("id, market_id, merchant_id")
        .eq("id", user.id)
        .maybeSingle();

      const finalMerchantId = merchant?.merchant_id || user.id;
      const finalMarketId = merchant?.market_id;

      if (!finalMarketId) throw new Error("WILAYAH PASAR TIDAK DITEMUKAN.");

      const productData: any = {
        price: parseInt(newProduct.price),
        promo_price: newProduct.promo_price
          ? parseInt(newProduct.promo_price)
          : null,
        final_price: newProduct.promo_price
          ? parseInt(newProduct.promo_price)
          : parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        unit: newProduct.unit,
        is_po: newProduct.is_po,
        po_days: newProduct.is_po ? parseInt(newProduct.po_days) : null,
      };

      if (!isEditMode) {
        let finalUrls = [];
        for (const file of imageFiles) {
          const fileName = `${finalMerchantId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { error: upErr } = await supabase.storage
            .from("product-images")
            .upload(fileName, file);
          if (upErr) throw upErr;
          const { data: url } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);
          finalUrls.push(url.publicUrl);
        }
        productData.merchant_id = finalMerchantId;
        productData.market_id = finalMarketId;
        productData.category_id = newProduct.category_id;
        productData.name = newProduct.name;
        productData.image_url = finalUrls[0];
        productData.image_urls = finalUrls;
        productData.status = "PENDING";
      }

      if (isEditMode) {
        await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id);
        showToast("PRODUK BERHASIL DIPERBARUI!", "success");
      } else {
        await supabase.from("products").insert(productData);
        showToast("PRODUK BERHASIL DIDAFTARKAN!", "success");
      }
      onSuccess();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-in slide-in-from-right duration-300 pb-20 font-sans text-left">
      {/* NAVBAR HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-[14px] font-bold text-slate-800 leading-none uppercase">
              {isEditMode ? "Perbarui Detail" : "Registrasi Produk"}
            </h2>
            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mt-1">
              {isEditMode ? "Mode Edit Aktif" : "Lengkapi Data Dagangan"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto md:p-6">
        <form onSubmit={handleAddProduct} className="space-y-4 md:space-y-6">
          {/* SEKSI FOTO */}
          <div className="bg-white p-5 md:rounded-2xl border-y md:border border-slate-200 space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-[#008080]" /> Foto Produk
              (Maks 3)
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {existingImages.map((url, idx) => (
                <div
                  key={`ex-${idx}`}
                  className="min-w-[100px] w-[100px] h-[100px] rounded-xl relative overflow-hidden flex-shrink-0 border border-slate-100 group"
                >
                  <img
                    src={url}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
                    <Lock size={16} className="text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
              {imageFiles.map((file, idx) => (
                <div
                  key={`new-${idx}`}
                  className="min-w-[100px] w-[100px] h-[100px] rounded-xl relative overflow-hidden flex-shrink-0 border-2 border-orange-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImageFiles(imageFiles.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {!isEditMode && imageFiles.length + existingImages.length < 3 && (
                <label className="min-w-[100px] w-[100px] h-[100px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 rounded-xl flex-shrink-0 cursor-pointer hover:border-[#008080] hover:text-[#008080] transition-all">
                  <Upload size={20} />
                  <span className="text-[8px] font-black mt-1">TAMBAH</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* INFORMASI PRODUK */}
          <div className="bg-white p-5 md:rounded-2xl border-y md:border border-slate-200 space-y-6">
            {/* Nama Produk */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Type size={14} /> Nama Produk{" "}
                {isEditMode && (
                  <Lock size={10} className="text-orange-500 ml-1" />
                )}
              </label>
              <input
                disabled={isEditMode}
                className={`w-full p-4 rounded-xl border font-bold text-[13px] uppercase transition-all outline-none ${
                  isEditMode
                    ? "bg-slate-50 border-slate-100 text-slate-400"
                    : "bg-white border-slate-200 focus:border-[#008080] text-slate-800 shadow-sm"
                }`}
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    name: e.target.value.toUpperCase(),
                  })
                }
                placeholder="CONTOH: BERAS KEPALA SUPER"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stok & Unit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Archive size={14} /> Stok & Satuan
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    className="flex-1 p-4 bg-white border border-slate-200 rounded-xl font-bold text-[13px] focus:border-[#008080] outline-none transition-all shadow-sm"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    placeholder="0"
                  />
                  <input
                    placeholder="UNIT"
                    className="w-24 p-4 bg-white border border-slate-200 rounded-xl font-bold text-[12px] uppercase focus:border-[#008080] outline-none shadow-sm"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Layers size={14} /> Kategori
                </label>
                <select
                  disabled={isEditMode}
                  className={`w-full p-4 rounded-xl border font-bold text-[12px] uppercase outline-none appearance-none transition-all ${
                    isEditMode
                      ? "bg-slate-50 border-slate-100 text-slate-400"
                      : "bg-white border-slate-200 focus:border-[#008080] shadow-sm"
                  }`}
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">PILIH KATEGORI</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga Normal */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Tag size={14} /> Harga Normal (Rp)
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-[13px] text-[#008080] focus:border-[#008080] outline-none shadow-sm transition-all"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              {/* Harga Promo */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                  <Percent size={14} /> Harga Promo (Rp)
                </label>
                <input
                  type="number"
                  className="w-full p-4 bg-orange-50/30 border border-orange-100 rounded-xl font-bold text-[13px] text-orange-600 focus:border-orange-500 outline-none shadow-sm transition-all"
                  value={newProduct.promo_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      promo_price: e.target.value,
                    })
                  }
                  placeholder="OPSIONAL"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FileText size={14} /> Deskripsi Produk
              </label>
              <textarea
                required
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-[13px] h-32 focus:border-[#008080] outline-none shadow-sm resize-none transition-all"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Jelaskan detail barang Anda..."
              />
            </div>
          </div>

          {/* BUTTON SUBMIT */}
          <div className="p-4 md:p-0">
            <button
              disabled={isUploading}
              className="w-full py-5 bg-[#008080] text-white rounded-2xl font-bold text-[14px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isEditMode ? (
                "Update Produk"
              ) : (
                "Daftarkan Sekarang"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
