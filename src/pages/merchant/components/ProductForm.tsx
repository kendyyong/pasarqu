import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Tag,
  Type,
  Box,
  Camera,
  Clock,
  AlertCircle,
} from "lucide-react";

// 🚀 FUNGSI KOMPRESI OTOMATIS
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
          0.8,
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
  const [adminRates, setAdminRates] = useState({ reguler: 5, sembako: 2 });

  const isEditMode = !!initialData;
  const MAX_IMAGES = 3;

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    promo_price: "",
    stock: "",
    description: "",
    unit: "PCS",
    category_id: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    condition: "BARU",
    is_preorder: false,
    preorder_days: "",
    min_order: "1",
    sku: "",
  });

  useEffect(() => {
    const fetchAdminRates = async () => {
      try {
        const marketId =
          merchantData?.managed_market_id ||
          merchantData?.market_id ||
          localStorage.getItem("active_market_id");
        if (!marketId) return;
        const { data: market } = await supabase
          .from("markets")
          .select("district")
          .eq("id", marketId)
          .maybeSingle();
        if (market?.district) {
          const { data: rates } = await supabase
            .from("shipping_rates")
            .select("seller_admin_fee_percent, sembako_admin_fee_percent")
            .eq("district_name", market.district)
            .maybeSingle();
          if (rates)
            setAdminRates({
              reguler: rates.seller_admin_fee_percent || 0,
              sembako: rates.sembako_admin_fee_percent || 0,
            });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAdminRates();
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
        weight: initialData.weight?.toString() || "",
        length: initialData.length?.toString() || "",
        width: initialData.width?.toString() || "",
        height: initialData.height?.toString() || "",
        condition: initialData.condition || "BARU",
        is_preorder: initialData.is_preorder || false,
        preorder_days: initialData.preorder_days?.toString() || "",
        min_order: initialData.min_order?.toString() || "1",
        sku: initialData.sku || "",
      });
      setExistingImages(
        initialData.image_urls?.length > 0
          ? initialData.image_urls
          : initialData.image_url
            ? [initialData.image_url]
            : [],
      );
    }
  }, [initialData]);

  const inputPrice = Number(newProduct.price) || 0;
  const inputPromo = Number(newProduct.promo_price) || 0;
  const selectedCategory = categories.find(
    (c: any) => c.id === newProduct.category_id,
  );
  const isSembako = selectedCategory?.name?.toUpperCase().includes("SEMBAKO");
  const activeAdminPercent = isSembako
    ? adminRates.sembako
    : adminRates.reguler;
  const discountPercent =
    inputPromo > 0 && inputPrice > inputPromo
      ? Math.round(((inputPrice - inputPromo) / inputPrice) * 100)
      : 0;
  const finalPriceForCut = inputPromo > 0 ? inputPromo : inputPrice;
  const adminCut = Math.round(finalPriceForCut * (activeAdminPercent / 100));
  const netIncome = finalPriceForCut - adminCut;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.category_id)
      return showToast("GAGAL: SILAKAN PILIH KATEGORI PRODUK!", "error");
    if (imageFiles.length === 0 && existingImages.length === 0)
      return showToast("GAGAL: WAJIB ADA FOTO PRODUK", "error");

    setIsUploading(true);
    try {
      const targetMarketId =
        merchantData?.managed_market_id ||
        merchantData?.market_id ||
        localStorage.getItem("active_market_id");

      if (!targetMarketId) throw new Error("ID Pasar tidak ditemukan.");

      const { data: checkMerchant, error: checkErr } = await supabase
        .from("merchants")
        .select("id")
        .eq("id", merchantData.id)
        .maybeSingle();

      if (checkErr)
        throw new Error(`Gagal Verifikasi Toko: ${checkErr.message}`);

      if (!checkMerchant) {
        const { error: repairErr } = await supabase.from("merchants").insert([
          {
            id: merchantData.id,
            name:
              merchantData.full_name ||
              merchantData.name ||
              merchantData.shop_name ||
              "Pemilik Toko",
            shop_name: merchantData.shop_name || "Toko Baru",
            market_id: targetMarketId,
          },
        ]);

        if (repairErr) {
          throw new Error(`DB Error: ${repairErr.message}`);
        }
      }

      let finalUrls = [...existingImages];
      for (const file of imageFiles) {
        const compressed = await compressImage(file);
        const fileName = `${merchantData.id || "admin"}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(fileName, compressed);
        if (upErr) throw new Error(`Gagal Upload Foto: ${upErr.message}`);
        const { data: url } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        finalUrls.push(url.publicUrl);
      }

      const productData: any = {
        name: newProduct.name.toUpperCase(),
        price: parseInt(newProduct.price),
        promo_price: inputPromo || null,
        final_price: finalPriceForCut,
        promo_percentage: discountPercent || null,
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        unit: newProduct.unit.toUpperCase(),
        category_id: newProduct.category_id,
        merchant_id: merchantData.id,
        market_id: targetMarketId,
        image_url: finalUrls[0],
        image_urls: finalUrls.slice(0, MAX_IMAGES),
        weight: parseInt(newProduct.weight) || 0,
        length: parseInt(newProduct.length) || 0,
        width: parseInt(newProduct.width) || 0,
        height: parseInt(newProduct.height) || 0,
        condition: newProduct.condition,
        is_preorder: newProduct.is_preorder,
        preorder_days: newProduct.is_preorder
          ? parseInt(newProduct.preorder_days) || 0
          : 0,
        min_order: parseInt(newProduct.min_order) || 1,
        sku: newProduct.sku.toUpperCase(),
      };

      if (isEditMode) {
        const { error: updateErr } = await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id);
        if (updateErr) throw new Error(`DATABASE ERROR: ${updateErr.message}`);
        showToast("DATA PRODUK DIPERBARUI", "success");
      } else {
        const { error: insertErr } = await supabase
          .from("products")
          // 🚀 KEMBALIKAN KE SOP PASARQU: is_verified harus FALSE agar masuk antrean Admin
          .insert([{ ...productData, is_verified: false }]);
        if (insertErr) throw new Error(`DATABASE ERROR: ${insertErr.message}`);
        showToast("PRODUK MENUNGGU VERIFIKASI ADMIN", "success");
      }

      onSuccess();
    } catch (err: any) {
      console.error("CATCH ERROR:", err);
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 text-left font-sans text-[12px] flex flex-col w-full overflow-x-hidden selection:bg-[#008080] selection:text-white">
      {/* HEADER STICKY */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center shadow-sm sticky top-0 z-50">
        <div className="max-w-[1000px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-90 transition-all"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-[15px] font-[1000] text-slate-800 uppercase tracking-tight">
              {isEditMode ? "Edit Detail Produk" : "Tambah Produk Baru"}
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50 uppercase tracking-widest"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddProduct}
              disabled={isUploading}
              className="px-6 py-2.5 bg-[#FF6600] text-white font-bold rounded-lg text-[11px] hover:bg-orange-600 flex items-center gap-2 uppercase tracking-widest shadow-md"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : isEditMode ? (
                "Simpan Perubahan"
              ) : (
                "Publikasikan"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-2 md:px-4 w-full mt-4">
        <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
          {/* BAGIAN 1: INFORMASI DASAR & FOTO */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Type size={18} className="text-[#008080]" />
              <h3 className="font-[1000] text-[13px] text-slate-800 uppercase tracking-tight">
                Informasi Dasar
              </h3>
            </div>

            {/* UPLOAD FOTO (Maks 3) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-2">
                Foto Produk <span className="text-red-500">*</span>{" "}
                <span className="text-slate-400 font-normal ml-auto">
                  (Wajib 1, Maks {MAX_IMAGES})
                </span>
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {existingImages.map((url, i) => (
                  <div
                    key={i}
                    className="w-[85px] h-[85px] md:w-[110px] md:h-[110px] rounded-xl overflow-hidden border border-slate-200 relative shrink-0 group"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExistingImages((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-1 right-1 bg-white/90 text-red-500 rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#008080]/90 text-white text-[8px] text-center py-1 font-bold tracking-widest uppercase">
                        UTAMA
                      </div>
                    )}
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div
                    key={i}
                    className="w-[85px] h-[85px] md:w-[110px] md:h-[110px] rounded-xl overflow-hidden border-2 border-[#FF6600] relative shrink-0 group"
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
                      className="absolute top-1 right-1 bg-white/90 text-red-500 rounded p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {imageFiles.length + existingImages.length < MAX_IMAGES && (
                  <label className="w-[85px] h-[85px] md:w-[110px] md:h-[110px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-[#008080] rounded-xl cursor-pointer shrink-0 hover:bg-teal-50 transition-colors">
                    <Camera size={24} className="mb-1 opacity-70" />
                    <span className="text-[9px] font-bold tracking-widest uppercase mt-1">
                      Tambah
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files)
                          setImageFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files!).slice(
                              0,
                              MAX_IMAGES -
                                (prev.length + existingImages.length),
                            ),
                          ]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-[#008080] outline-none text-[13px] font-bold uppercase text-slate-800 bg-slate-50 focus:bg-white transition-colors"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Contoh: Beras Ramos Super 5 Kg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-[#008080] outline-none text-[12px] font-bold text-slate-700 uppercase bg-slate-50 focus:bg-white transition-colors"
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category_id: e.target.value,
                      })
                    }
                  >
                    <option value="">- Pilih Kategori -</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                    Kondisi Barang
                  </label>
                  <select
                    className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-[#008080] outline-none text-[12px] font-bold text-slate-700 bg-slate-50 focus:bg-white transition-colors uppercase"
                    value={newProduct.condition}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        condition: e.target.value,
                      })
                    }
                  >
                    <option value="BARU">Baru</option>
                    <option value="BEKAS">Pernah Dipakai (Bekas)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                  Deskripsi Produk <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-[#008080] outline-none text-[12px] text-slate-700 min-h-[120px] resize-y leading-relaxed bg-slate-50 focus:bg-white transition-colors"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  placeholder="Jelaskan detail produk, bahan, expired date, dll..."
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: INFORMASI PENJUALAN */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Tag size={18} className="text-[#FF6600]" />
              <h3 className="font-[1000] text-[13px] text-slate-800 uppercase tracking-tight">
                Informasi Penjualan
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
                <label className="text-[11px] font-bold text-teal-800 mb-2 block uppercase tracking-widest">
                  Harga Normal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-teal-700">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    className="w-full pl-10 p-3.5 rounded-xl border border-teal-200 text-[16px] font-[1000] text-teal-900 outline-none focus:border-teal-400 bg-white shadow-sm"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                {inputPrice > 0 && (
                  <div className="mt-4 pt-3 border-t border-teal-200/50 text-[10px] space-y-1.5 font-bold uppercase tracking-wider">
                    <div className="flex justify-between text-teal-700/70">
                      <span>Biaya Admin ({activeAdminPercent}%)</span>
                      <span className="text-red-500">
                        - Rp {adminCut.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-teal-900">
                      <span>Pendapatan Bersih</span>
                      <span>Rp {netIncome.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-xl flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-bold text-[#FF6600] block uppercase tracking-widest">
                    Harga Promo
                  </label>
                  {discountPercent > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest animate-pulse">
                      DISKON {discountPercent}%
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-orange-700">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full pl-10 p-3.5 rounded-xl border border-orange-200 text-[16px] font-[1000] text-[#FF6600] outline-none focus:border-orange-400 bg-white shadow-sm"
                    value={newProduct.promo_price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        promo_price: e.target.value,
                      })
                    }
                    placeholder="0 (Opsional)"
                  />
                </div>
                <p className="text-[9px] text-orange-600/70 mt-2 leading-tight font-bold">
                  Biarkan kosong jika tidak ada promo. Pendapatan dihitung dari
                  harga ini.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                  Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors text-center"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 uppercase outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors text-center"
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
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block">
                  Min. Order
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors text-center"
                  value={newProduct.min_order}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, min_order: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  SKU <AlertCircle size={10} className="text-slate-400" />
                </label>
                <input
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 uppercase outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="KODE"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 3: PENGIRIMAN & LOGISTIK */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Box size={18} className="text-[#008080]" />
              <h3 className="font-[1000] text-[13px] text-slate-800 uppercase tracking-tight">
                Pengiriman & Logistik
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  Berat Produk <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    className="w-full p-3.5 pr-14 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors"
                    value={newProduct.weight}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, weight: e.target.value })
                    }
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gram
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                  Wajib untuk kurir. (1 Kg = 1000 Gram)
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1.5">
                  Ukuran Paket (PxLxT){" "}
                  <span className="font-normal text-slate-400">- Opsional</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-[12px] font-bold text-center outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors"
                    value={newProduct.length}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, length: e.target.value })
                    }
                    placeholder="P"
                  />
                  <span className="text-slate-300 font-bold">x</span>
                  <input
                    type="number"
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-[12px] font-bold text-center outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors"
                    value={newProduct.width}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, width: e.target.value })
                    }
                    placeholder="L"
                  />
                  <span className="text-slate-300 font-bold">x</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      className="w-full p-3.5 pr-8 rounded-xl border border-slate-200 text-[12px] font-bold text-center outline-none focus:border-[#008080] bg-slate-50 focus:bg-white transition-colors"
                      value={newProduct.height}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, height: e.target.value })
                      }
                      placeholder="T"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">
                      cm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PRE-ORDER */}
            <div className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
              <div>
                <h4 className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock size={14} className="text-[#FF6600]" /> Pre-Order
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">
                  Aktifkan jika butuh waktu tambahan untuk produksi/kemas.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {newProduct.is_preorder && (
                  <div className="relative w-28 animate-in fade-in slide-in-from-right-2">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required={newProduct.is_preorder}
                      className="w-full p-2.5 pr-10 rounded-lg border border-orange-300 text-[13px] font-bold text-center outline-none focus:border-[#FF6600] bg-white shadow-sm"
                      value={newProduct.preorder_days}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          preorder_days: e.target.value,
                        })
                      }
                      placeholder="Hari"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase">
                      Hari
                    </span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newProduct.is_preorder}
                    onChange={() =>
                      setNewProduct({
                        ...newProduct,
                        is_preorder: !newProduct.is_preorder,
                        preorder_days: "",
                      })
                    }
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#008080] shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>

          {/* TOMBOL AKSI MOBILE */}
          <div className="md:hidden mt-2 sticky bottom-4 z-40">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-4 bg-[#FF6600] text-white rounded-xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-500"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isEditMode ? (
                "SIMPAN PERUBAHAN"
              ) : (
                "PUBLIKASIKAN PRODUK"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
