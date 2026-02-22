import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
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
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
} from "lucide-react";

// --- FUNGSI KOMPRESI GAMBAR ---
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

interface Props {
  autoOpenForm?: boolean;
}

export const MerchantProducts: React.FC<Props> = ({ autoOpenForm = false }) => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();
  const [view, setView] = useState<"list" | "form">(
    autoOpenForm ? "form" : "list",
  );
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [merchantData, setMerchantData] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: mData } = await supabase
        .from("merchants")
        .select("id, market_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mData) setMerchantData(mData);

      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (catData) setCategories(catData);

      if (mData?.id) {
        const { data: prodData } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("merchant_id", mData.id)
          .order("created_at", { ascending: false });

        if (prodData) setProducts(prodData);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("HAPUS PRODUK INI?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      showToast("PRODUK DIHAPUS", "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (view === "list") {
    return (
      <div className="w-full animate-in fade-in duration-500 pb-20 text-left font-black uppercase text-[12px] not-italic">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[16px] font-[1000] text-slate-800 tracking-wider">
              KATALOG PRODUK
            </h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">
              TOTAL: {products.length} BARANG
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-[#008080] text-white px-6 py-4 rounded-md font-black text-[12px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={18} /> TAMBAH BARU
          </button>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-md p-2 mb-6 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-colors">
          <div className="pl-3 text-[#008080]">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="CARI NAMA BARANG..."
            className="flex-1 bg-transparent border-none outline-none py-3 text-[12px] font-black text-slate-800 placeholder:text-slate-300 uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#008080]" size={36} />
            <span className="text-[10px] tracking-widest">MEMUAT DATA...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white border-2 border-slate-200 rounded-md overflow-hidden hover:border-[#008080] transition-colors group relative flex flex-col"
                >
                  <div className="aspect-square relative bg-slate-50 border-b-2 border-slate-100 shrink-0">
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-2 bg-white/90 rounded-md text-slate-800 shadow-md active:scale-90"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-red-500/90 rounded-md text-white shadow-md active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <h4 className="font-[1000] text-slate-800 text-[11px] uppercase line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[#FF6600] font-sans font-[1000] text-[14px] mt-2 leading-none">
                      RP {product.final_price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ProductFormInternal
      onBack={() => setView("list")}
      categories={categories}
      merchantData={merchantData}
      onSuccess={() => {
        setView("list");
        fetchData();
      }}
      showToast={showToast}
      initialData={selectedProduct}
    />
  );
};

// --- KOMPONEN INTERNAL FORM ---
const ProductFormInternal = ({
  onBack,
  categories,
  merchantData,
  onSuccess,
  showToast,
  initialData,
}: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [adminFeePercent, setAdminFeePercent] = useState<number>(0);

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
            .select("seller_admin_fee_percent")
            .eq("district_name", market.district)
            .maybeSingle();

          if (rate) setAdminFeePercent(rate.seller_admin_fee_percent);
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
  const adminCut = Math.round(inputPrice * (adminFeePercent / 100));
  const netIncome = inputPrice - adminCut;

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-in fade-in duration-300 pb-24 text-left font-black uppercase tracking-tighter not-italic text-[12px]">
      {/* HEADER FORM */}
      <div className="bg-[#008080] px-4 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-md w-full">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-md transition-all active:scale-90"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-teal-200 tracking-widest leading-none mb-1">
              {isEditMode ? "MODE EDIT" : "DATA BARU"}
            </span>
            <h2 className="text-[14px] font-[1000] text-white leading-none">
              {isEditMode ? "PERBARUI PRODUK" : "REGISTRASI PRODUK"}
            </h2>
          </div>
        </div>
      </div>

      {/* LAYOUT HYBRID: p-2 di mobile agar lebih lebar */}
      <div className="max-w-[1200px] mx-auto p-2 md:p-6 w-full mt-2">
        <form
          onSubmit={handleAddProduct}
          className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6"
        >
          {/* KOLOM KIRI */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            {/* UPLOAD FOTO */}
            <div className="bg-white p-4 md:p-5 rounded-md border border-slate-200 shadow-sm space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                <ImageIcon size={16} className="text-[#008080]" /> FOTO PRODUK
                (MAKS 2)
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {existingImages.map((url, i) => (
                  <div
                    key={`ex-${i}`}
                    className="min-w-[100px] w-[100px] h-[100px] md:min-w-[140px] md:h-[140px] rounded-md overflow-hidden border-2 border-slate-200 relative group shadow-sm"
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
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-md p-1 shadow-md active:scale-90"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div
                    key={`nf-${i}`}
                    className="min-w-[100px] w-[100px] h-[100px] md:min-w-[140px] md:h-[140px] rounded-md overflow-hidden border-2 border-[#FF6600] relative shadow-sm"
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
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-md p-1 shadow-md active:scale-90"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                {imageFiles.length + existingImages.length < 2 && (
                  <label className="min-w-[100px] w-[100px] h-[100px] md:min-w-[140px] md:h-[140px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 rounded-md cursor-pointer hover:border-[#008080] hover:text-[#008080] transition-colors">
                    <Upload size={24} />
                    <span className="text-[10px] font-black mt-2 tracking-widest">
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

            {/* NAMA & DESKRIPSI */}
            <div className="bg-white p-4 md:p-5 rounded-md border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <Type size={16} className="text-[#008080]" /> NAMA BARANG
                </label>
                <input
                  required
                  className="w-full p-3 md:p-4 rounded-md border-2 border-slate-200 font-black text-[12px] md:text-[14px] uppercase outline-none focus:border-[#008080] transition-colors placeholder:text-slate-300"
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

              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-[#008080]" /> DESKRIPSI
                  BARANG
                </label>
                <textarea
                  required
                  className="w-full p-3 md:p-4 rounded-md border-2 border-slate-200 font-black text-[12px] h-32 md:h-40 outline-none focus:border-[#008080] resize-none uppercase placeholder:text-slate-300"
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

          {/* KOLOM KANAN */}
          <div className="lg:col-span-5 space-y-4 md:space-y-6">
            {/* KATEGORI & STOK (FIX OVERFLOW) */}
            <div className="bg-white p-4 md:p-5 rounded-md border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                  <Layers size={16} className="text-[#008080]" /> KATEGORI
                </label>
                <select
                  required
                  className="w-full p-3 md:p-4 rounded-md border-2 border-slate-200 font-black text-[12px] uppercase outline-none focus:border-[#008080] transition-colors bg-white"
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
                {/* 🚀 FIX: Menggunakan Grid agar tidak pernah keluar batas */}
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    required
                    className="col-span-2 p-3 md:p-4 rounded-md border-2 border-slate-200 font-sans font-black text-[14px] outline-none focus:border-[#008080] text-center"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, stock: e.target.value })
                    }
                    placeholder="0"
                  />
                  <input
                    className="col-span-1 p-3 md:p-4 rounded-md border-2 border-slate-200 font-black text-[11px] uppercase outline-none focus:border-[#008080] text-center placeholder:text-slate-300"
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

            {/* HARGA & SIMULASI */}
            <div className="bg-white p-4 md:p-5 rounded-md border border-slate-200 shadow-sm space-y-5">
              <div className="space-y-2 bg-slate-50 p-3 md:p-4 rounded-md border border-slate-200">
                <label className="text-[11px] font-black text-slate-500 tracking-widest flex items-center gap-2">
                  <Tag size={16} className="text-[#008080]" /> HARGA JUAL NORMAL
                  (RP)
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-3 md:p-4 rounded-md border-2 border-slate-200 font-sans font-[1000] text-[18px] text-[#008080] outline-none focus:border-[#008080] shadow-sm"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="0"
                />

                {inputPrice > 0 && (
                  <div className="bg-orange-50 p-3 md:p-4 rounded-md border-2 border-orange-200 mt-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3 border-b border-orange-200 pb-2">
                      <ShieldCheck size={16} className="text-[#FF6600]" />
                      <h4 className="text-[11px] font-[1000] text-[#FF6600] tracking-widest uppercase">
                        SIMULASI PENDAPATAN
                      </h4>
                    </div>
                    <div className="space-y-2 text-[11px] font-black uppercase">
                      <div className="flex justify-between text-slate-500">
                        <span>HARGA AWAL</span>
                        <span className="font-sans">
                          RP {inputPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>BIAYA APP ({adminFeePercent}%)</span>
                        <span className="font-sans">
                          - RP {adminCut.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-end pt-3 mt-2 border-t border-orange-200">
                        <span className="text-[10px] text-[#008080] tracking-widest uppercase">
                          BERSIH DITERIMA
                        </span>
                        <span className="text-[20px] font-[1000] text-[#008080] font-sans leading-none">
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
                  className="w-full p-3 md:p-4 rounded-md border-2 border-orange-200 bg-orange-50 font-sans font-[1000] text-[14px] text-[#FF6600] outline-none focus:border-[#FF6600] placeholder:text-orange-300 shadow-sm"
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
              className="w-full py-4 md:py-5 bg-[#FF6600] text-white rounded-md font-[1000] text-[14px] uppercase tracking-widest hover:bg-[#e65c00] active:scale-95 transition-all shadow-md disabled:bg-slate-300 flex items-center justify-center gap-3"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={24} />
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
