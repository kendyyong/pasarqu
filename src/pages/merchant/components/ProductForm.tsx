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
        showToast("Maksimal hanya boleh 3 foto!", "error");
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
        .from("merchants")
        .select("id, market_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const finalMerchantId = merchant?.id || user.id;
      const finalMarketId = merchant?.market_id;

      if (!finalMarketId) throw new Error("Wilayah pasar tidak ditemukan.");

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
      } else {
        await supabase.from("products").insert(productData);
      }
      onSuccess();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white animate-in slide-in-from-right duration-300 pb-20">
      {/* HEADER - Slim & Full Width */}
      <div className="bg-slate-900 px-4 py-5 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={onBack} className="text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">
            {isEditMode ? "Update Produk" : "Registrasi Barang"}
          </h2>
          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">
            Pasarqu Merchant Dashboard
          </p>
        </div>
      </div>

      {/* CONTAINER - Tanpa padding pinggir pada ponsel (px-0 md:px-8) */}
      <div className="w-full max-w-4xl mx-auto px-0 md:px-8 py-0 md:py-8">
        <div className="bg-white border-0 md:border border-slate-200 p-4 md:p-10">
          <form onSubmit={handleAddProduct} className="space-y-8">
            {/* FOTO - Layout melebar */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2 md:px-0">
                <ImageIcon size={14} /> Foto Dagangan (Maks 3)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 px-2 md:px-0 scrollbar-hide">
                {existingImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="min-w-[110px] w-[110px] h-[110px] rounded-xl relative overflow-hidden flex-shrink-0 border border-slate-100"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover opacity-60"
                      alt=""
                    />
                    {isEditMode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10">
                        <Lock size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {imageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="min-w-[110px] w-[110px] h-[110px] rounded-xl relative overflow-hidden flex-shrink-0 border-2 border-orange-500"
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
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {!isEditMode &&
                  imageFiles.length + existingImages.length < 3 && (
                    <label className="min-w-[110px] w-[110px] h-[110px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 rounded-xl flex-shrink-0">
                      <Upload size={24} />
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

            {/* INPUT FIELDS - Tanpa padding berlebih pada ponsel */}
            <div className="grid grid-cols-1 gap-6 px-4 md:px-0">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Type size={14} /> Nama Barang{" "}
                  {isEditMode && <Lock size={10} className="text-orange-600" />}
                </label>
                <input
                  disabled={isEditMode}
                  className={`w-full py-4 bg-transparent border-b-2 outline-none font-black text-sm uppercase transition-all ${isEditMode ? "border-slate-100 text-slate-300" : "border-slate-200 focus:border-teal-600"}`}
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Stok Tersedia
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full py-4 bg-transparent border-b-2 border-slate-200 outline-none font-black text-sm"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Satuan (Unit)
                  </label>
                  <input
                    required
                    className="w-full py-4 bg-transparent border-b-2 border-slate-200 outline-none font-black text-sm uppercase"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-black">
                    Harga Asli
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full py-4 bg-transparent border-b-2 border-slate-200 outline-none font-black text-sm"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest font-black">
                    Harga Promo
                  </label>
                  <input
                    type="number"
                    className="w-full py-4 bg-transparent border-b-2 border-orange-100 outline-none font-black text-sm text-orange-600"
                    value={newProduct.promo_price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        promo_price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText size={14} /> Keterangan Barang
                </label>
                <textarea
                  required
                  placeholder="Jelaskan kondisi barang Anda..."
                  className="w-full py-4 bg-slate-50 px-4 rounded-xl outline-none font-bold text-sm h-40 border border-slate-100 focus:border-teal-600 transition-all"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>
            </div>

            {/* BUTTON ACTION - Full width di mobile */}
            <div className="px-4 md:px-0">
              <button
                disabled={isUploading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-600 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : isEditMode ? (
                  "Update Sekarang"
                ) : (
                  "Daftarkan Barang"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
