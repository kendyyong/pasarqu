import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  X,
  Loader2,
  Tag,
  Type,
  FileText,
  Percent,
  Layers,
  Archive,
  ShieldCheck,
  Camera,
} from "lucide-react";

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
            }
          },
          "image/jpeg",
          0.7,
        );
      };
    };
  });
};

interface ProductFormProps {
  onBack: () => void;
  categories: any[];
  merchantData: any;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
  initialData?: any;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onBack,
  categories,
  merchantData,
  onSuccess,
  showToast,
  initialData,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [normalFeePercent, setNormalFeePercent] = useState<number>(0);
  const [sembakoFeePercent, setSembakoFeePercent] = useState<number>(0);

  const isEditMode = !!initialData;

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    promo_price: "",
    stock: "",
    description: "",
    unit: "PCS",
    category_id: "",
  });

  useEffect(() => {
    const fetchAdminRule = async () => {
      try {
        if (!merchantData?.market_id) return;
        const { data: market } = await supabase
          .from("markets")
          .select("district")
          .eq("id", merchantData.market_id)
          .maybeSingle();

        if (market?.district) {
          const { data: rate } = await supabase
            .from("shipping_rates")
            .select("seller_admin_fee_percent, sembako_admin_fee_percent")
            .eq("district_name", market.district)
            .maybeSingle();

          if (rate) {
            setNormalFeePercent(rate.seller_admin_fee_percent || 0);
            setSembakoFeePercent(rate.sembako_admin_fee_percent || 0);
          }
        }
      } catch (err) {
        console.error("Gagal menarik aturan admin:", err);
      }
    };
    fetchAdminRule();
  }, [merchantData]);

  useEffect(() => {
    if (initialData) {
      setNewProduct({
        name: initialData.name || "",
        price: initialData.price?.toString() || "",
        promo_price: initialData.promo_price?.toString() || "",
        stock: initialData.stock?.toString() || "",
        description: initialData.description || "",
        unit: initialData.unit || "PCS",
        category_id: initialData.category_id || "",
      });
      setExistingImages(initialData.image_urls || [initialData.image_url]);
    }
  }, [initialData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 && existingImages.length === 0)
      return showToast("WAJIB ADA FOTO", "error");

    setIsUploading(true);
    try {
      let finalUrls = [...existingImages];

      for (const file of imageFiles) {
        const compressed = await compressImage(file);
        const fileName = `${merchantData.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(fileName, compressed);
        if (upErr) throw upErr;
        const { data: url } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        finalUrls.push(url.publicUrl);
      }

      const productData: any = {
        name: newProduct.name.toUpperCase(),
        price: parseInt(newProduct.price),
        promo_price: newProduct.promo_price
          ? parseInt(newProduct.promo_price)
          : null,
        final_price: newProduct.promo_price
          ? parseInt(newProduct.promo_price)
          : parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        description: newProduct.description.toUpperCase(),
        unit: newProduct.unit.toUpperCase(),
        category_id: newProduct.category_id,
        merchant_id: merchantData.id,
        market_id: merchantData.market_id,
        image_url: finalUrls[0],
        image_urls: finalUrls.slice(0, 2),
      };

      if (isEditMode) {
        await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id);
        showToast("DATA DIPERBARUI", "success");
      } else {
        await supabase
          .from("products")
          .insert([{ ...productData, is_verified: false }]);
        showToast("BARANG DIDAFTARKAN", "success");
      }
      onSuccess();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const inputPrice = Number(newProduct.price) || 0;
  const selectedCategory = categories.find(
    (c: any) => c.id === newProduct.category_id,
  );
  const isSembako = selectedCategory?.name?.toLowerCase().includes("sembako");
  const activeAdminPercent = isSembako ? sembakoFeePercent : normalFeePercent;
  const adminCut = Math.round(inputPrice * (activeAdminPercent / 100));
  const netIncome = inputPrice - adminCut;

  return (
    <div className="min-h-screen bg-[#F1F5F9] animate-in fade-in duration-300 pb-24 text-left font-[1000] uppercase tracking-tighter text-[12px] flex flex-col w-full overflow-x-hidden">
      {/* HEADER */}
      <div className="bg-[#008080] px-4 py-3.5 flex items-center shadow-md w-full sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-white bg-white/10 rounded-lg active:scale-90 transition-all"
          >
            <ArrowLeft size={22} strokeWidth={3} />
          </button>
          <div className="flex flex-col text-left justify-center pt-0.5">
            <h2 className="text-[14px] md:text-[16px] font-[1000] text-white leading-none">
              {isEditMode ? "PERBARUI PRODUK" : "REGISTRASI PRODUK"}
            </h2>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-2 md:px-6 w-full flex-1 mt-3">
        <form
          onSubmit={handleAddProduct}
          className="flex flex-col lg:grid lg:grid-cols-12 gap-3 md:gap-6"
        >
          <div className="lg:col-span-7 space-y-3 md:space-y-6">
            {/* 1. FOTO */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 overflow-hidden">
              <label className="text-[10px] font-[1000] text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <Camera size={14} className="text-[#008080]" /> FOTO PRODUK
                (MAKS 2)
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {existingImages.map((url, i) => (
                  <div
                    key={`ex-${i}`}
                    className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-xl overflow-hidden border border-slate-100 relative shrink-0 shadow-sm"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          setExistingImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-lg p-1.5 shadow-lg active:scale-90"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div
                    key={`nf-${i}`}
                    className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-xl overflow-hidden border-2 border-[#FF6600] relative shrink-0 shadow-sm"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImageFiles((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-lg p-1.5 shadow-lg active:scale-90"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                {imageFiles.length + existingImages.length < 2 && (
                  <label className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 rounded-xl cursor-pointer hover:border-[#008080] transition-all shrink-0">
                    <Upload size={24} />
                    <span className="text-[9px] font-black mt-2 tracking-widest">
                      TAMBAH
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          const slots =
                            2 - (imageFiles.length + existingImages.length);
                          setImageFiles((prev) => [
                            ...prev,
                            ...files.slice(0, slots),
                          ]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. NAMA & DESKRIPSI */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 overflow-hidden">
              <div className="space-y-1.5">
                <label className="text-[10px] font-[1000] text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <Type size={14} className="text-[#008080]" /> NAMA BARANG
                </label>
                <input
                  required
                  className="w-full p-4 rounded-xl border border-slate-100 font-[1000] text-[13px] md:text-[15px] uppercase outline-none focus:border-[#008080] bg-slate-50/50 shadow-inner"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="CONTOH: BERAS KEPALA SUPER 5KG"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-[1000] text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <FileText size={14} className="text-[#008080]" /> DESKRIPSI
                  DETAIL
                </label>
                <textarea
                  required
                  className="w-full p-4 rounded-xl border border-slate-100 font-[1000] text-[12px] h-28 md:h-40 outline-none focus:border-[#008080] resize-none uppercase bg-slate-50/50 shadow-inner leading-relaxed"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="TULISKAN DETAIL BARANG..."
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 md:space-y-6">
            {/* 3. KATEGORI & STOK (REVISI FIX OVERFLOW) */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 overflow-hidden">
              <div className="space-y-1.5">
                <label className="text-[10px] font-[1000] text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <Layers size={14} className="text-[#008080]" /> PILIH KATEGORI
                </label>
                <select
                  required
                  className="w-full p-4 rounded-xl border border-slate-100 font-[1000] text-[12px] uppercase outline-none focus:border-[#008080] bg-slate-50/50 shadow-inner appearance-none"
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">- KATEGORI PRODUK -</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-[1000] text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <Archive size={14} className="text-[#008080]" /> JUMLAH STOK &
                  SATUAN
                </label>
                {/* 🚀 FIX: Menggunakan GRID responsif agar input tidak meluber keluar kotak */}
                <div className="grid grid-cols-[1fr_80px] md:grid-cols-[1fr_90px] gap-2">
                  <input
                    type="number"
                    required
                    className="w-full p-3.5 rounded-xl border border-slate-100 font-sans font-[1000] text-[15px] outline-none focus:border-[#008080] text-center bg-slate-50/50 shadow-inner"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    placeholder="0"
                  />
                  <input
                    className="w-full p-3.5 rounded-xl border border-slate-100 font-[1000] text-[11px] uppercase outline-none focus:border-[#008080] text-center bg-slate-50/50 shadow-inner"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        unit: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="PCS"
                  />
                </div>
              </div>
            </div>

            {/* 4. HARGA */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 overflow-hidden">
              <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                <label className="text-[10px] font-[1000] text-teal-600 tracking-[0.2em] flex items-center gap-2 mb-2">
                  <Tag size={14} /> HARGA JUAL NORMAL (RP)
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-4 rounded-xl border border-teal-200 font-sans font-[1000] text-[20px] text-[#008080] outline-none shadow-sm bg-white"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="0"
                />

                {inputPrice > 0 && activeAdminPercent > 0 && (
                  <div className="mt-4 pt-4 border-t border-teal-200/50 space-y-2 uppercase text-[10px] font-[1000]">
                    <div className="flex justify-between text-slate-400">
                      <span>BIAYA SISTEM ({activeAdminPercent}%)</span>
                      <span className="text-red-500">
                        - RP {adminCut.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-teal-600">BERSIH DITERIMA</span>
                      <span className="text-[18px] text-teal-700 font-sans">
                        RP {netIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-[1000] text-[#FF6600] tracking-[0.2em] flex items-center gap-2">
                  <Percent size={14} /> HARGA PROMO CORET (OPSIONAL)
                </label>
                <input
                  type="number"
                  className="w-full p-4 rounded-xl border border-orange-100 bg-orange-50/30 font-sans font-[1000] text-[16px] text-[#FF6600] outline-none shadow-inner"
                  value={newProduct.promo_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      promo_price: e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <button
              disabled={isUploading}
              className="w-full py-5 bg-[#FF6600] text-white rounded-2xl font-[1000] text-[13px] uppercase tracking-[0.2em] hover:bg-[#e65c00] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 disabled:bg-slate-300 flex items-center justify-center gap-3 mt-1"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isEditMode ? (
                "SIMPAN PERUBAHAN"
              ) : (
                "PUBLIKASIKAN BARANG"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="h-10"></div>
    </div>
  );
};
