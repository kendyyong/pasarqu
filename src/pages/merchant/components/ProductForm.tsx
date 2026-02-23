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
          .insert([{ ...productData, status: "PENDING" }]);
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
    <div className="min-h-screen bg-[#F8FAFC] animate-in fade-in duration-300 pb-24 text-left font-black uppercase tracking-tighter not-italic text-[12px] flex flex-col w-full">
      <div className="bg-[#008080] px-4 py-4 flex items-center shadow-md w-full mb-6 relative z-10">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-md transition-all active:scale-90 flex items-center justify-center"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex flex-col text-left justify-center pt-1">
            <span className="text-[10px] text-teal-200 tracking-widest leading-none mb-1">
              {isEditMode ? "MODE EDIT" : "DATA BARU"}
            </span>
            <h2 className="text-[16px] font-[1000] text-white leading-none">
              {isEditMode ? "PERBARUI PRODUK" : "REGISTRASI PRODUK"}
            </h2>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 w-full flex-1">
        <form
          onSubmit={handleAddProduct}
          className="flex flex-col lg:grid lg:grid-cols-12 gap-5 md:gap-6"
        >
          <div className="lg:col-span-7 space-y-5 md:space-y-6">
            <div className="bg-white p-5 md:p-6 rounded-md border border-slate-200 shadow-sm space-y-4">
              <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                <ImageIcon size={16} className="text-[#008080]" /> FOTO PRODUK
                (MAKS 2)
              </label>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {existingImages.map((url, i) => (
                  <div
                    key={`ex-${i}`}
                    className="min-w-[120px] w-[120px] h-[120px] md:min-w-[150px] md:h-[150px] rounded-md overflow-hidden border border-slate-200 relative group shadow-sm shrink-0"
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
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-md p-1.5 shadow-md active:scale-90"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div
                    key={`nf-${i}`}
                    className="min-w-[120px] w-[120px] h-[120px] md:min-w-[150px] md:h-[150px] rounded-md overflow-hidden border-2 border-[#FF6600] relative shadow-sm shrink-0"
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
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-md p-1.5 shadow-md active:scale-90"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                {imageFiles.length + existingImages.length < 2 && (
                  <label className="min-w-[120px] w-[120px] h-[120px] md:min-w-[150px] md:h-[150px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 rounded-md cursor-pointer hover:border-[#008080] hover:text-[#008080] transition-colors shrink-0">
                    <Upload size={28} />
                    <span className="text-[11px] font-black mt-3 tracking-widest">
                      TAMBAH FOTO
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          const availableSlots =
                            2 - (imageFiles.length + existingImages.length);
                          setImageFiles((prev) => [
                            ...prev,
                            ...files.slice(0, availableSlots),
                          ]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-md border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <Type size={16} className="text-[#008080]" /> NAMA BARANG
                </label>
                <input
                  required
                  className="w-full p-4 md:p-5 rounded-md border border-slate-200 font-black text-[14px] md:text-[16px] uppercase outline-none focus:border-[#008080] transition-colors placeholder:text-slate-300 shadow-inner"
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

              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-[#008080]" /> DESKRIPSI
                  BARANG
                </label>
                <textarea
                  required
                  className="w-full p-4 md:p-5 rounded-md border border-slate-200 font-black text-[12px] md:text-[14px] h-32 md:h-40 outline-none focus:border-[#008080] resize-none uppercase placeholder:text-slate-300 shadow-inner leading-snug"
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

          <div className="lg:col-span-5 space-y-5 md:space-y-6">
            <div className="bg-white p-5 md:p-6 rounded-md border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <Layers size={16} className="text-[#008080]" /> KATEGORI
                </label>
                <select
                  required
                  className="w-full p-4 rounded-md border border-slate-200 font-black text-[12px] uppercase outline-none focus:border-[#008080] transition-colors bg-white shadow-inner"
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">- PILIH KATEGORI -</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <Archive size={16} className="text-[#008080]" /> STOK & SATUAN
                  JUAL
                </label>
                {/* 🚀 FIX: Menggunakan flex untuk menjamin kolom tidak akan jebol keluar batas */}
                <div className="flex gap-3">
                  <input
                    type="number"
                    required
                    className="flex-1 p-4 rounded-md border border-slate-200 font-sans font-black text-[16px] outline-none focus:border-[#008080] text-center shadow-inner"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    placeholder="0"
                  />
                  <input
                    className="w-24 shrink-0 p-4 rounded-md border border-slate-200 font-black text-[12px] uppercase outline-none focus:border-[#008080] text-center placeholder:text-slate-300 shadow-inner"
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

            <div className="bg-white p-5 md:p-6 rounded-md border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-3 bg-slate-50 p-4 md:p-5 rounded-md border border-slate-200">
                <label className="text-[11px] font-black text-slate-500 tracking-widest flex items-center gap-2">
                  <Tag size={16} className="text-[#008080]" /> HARGA JUAL NORMAL
                  (RP)
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-4 rounded-md border border-slate-200 font-sans font-[1000] text-[20px] text-[#008080] outline-none focus:border-[#008080] shadow-sm bg-white"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="0"
                />

                {inputPrice > 0 && activeAdminPercent > 0 && (
                  <div className="bg-orange-50 p-4 rounded-md border border-orange-200 mt-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-orange-200 pb-3">
                      <ShieldCheck size={18} className="text-[#FF6600]" />
                      <h4 className="text-[11px] md:text-[12px] font-[1000] text-[#FF6600] tracking-widest uppercase">
                        SIMULASI PENDAPATAN
                      </h4>
                    </div>
                    <div className="space-y-3 text-[12px] font-black uppercase">
                      <div className="flex justify-between text-slate-500">
                        <span>HARGA AWAL</span>
                        <span className="font-sans">
                          RP {inputPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>
                          {isSembako ? "BIAYA SEMBAKO" : "BIAYA APP"} (
                          {activeAdminPercent}%)
                        </span>
                        <span className="font-sans">
                          - RP {adminCut.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-end pt-4 mt-2 border-t border-orange-200">
                        <span className="text-[10px] md:text-[11px] text-[#008080] tracking-widest uppercase">
                          BERSIH DITERIMA
                        </span>
                        <span className="text-[24px] md:text-[28px] font-[1000] text-[#008080] font-sans leading-none">
                          RP {netIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#FF6600] tracking-widest flex items-center gap-2">
                  <Percent size={16} /> HARGA PROMO CORET (RP)
                </label>
                <input
                  type="number"
                  className="w-full p-4 rounded-md border border-orange-200 bg-orange-50 font-sans font-[1000] text-[16px] text-[#FF6600] outline-none focus:border-[#FF6600] placeholder:text-orange-300 shadow-inner"
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

            <button
              disabled={isUploading}
              className="w-full py-5 bg-[#FF6600] text-white rounded-md font-[1000] text-[14px] uppercase tracking-widest hover:bg-[#e65c00] active:scale-95 transition-all shadow-md disabled:bg-slate-300 flex items-center justify-center gap-3"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isEditMode ? (
                "SIMPAN PERUBAHAN"
              ) : (
                "PUBLIKASIKAN PRODUK SEKARANG"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
