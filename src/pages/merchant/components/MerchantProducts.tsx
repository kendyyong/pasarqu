import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

// --- FUNGSI KOMPRESI GAMBAR (AUTO COMPRESS) ---
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // Ukuran optimal untuk HP
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

        // Kompresi ke format JPEG dengan kualitas 0.7 (70%)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
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
  merchantProfile: any;
  autoOpenForm?: boolean;
}

export const MerchantProducts: React.FC<Props> = ({
  merchantProfile,
  autoOpenForm = false,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<"list" | "form">(
    autoOpenForm ? "form" : "list",
  );
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (catData) setCategories(catData);

      const { data: prodData } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantProfile?.merchant_id || user.id)
        .order("created_at", { ascending: false });

      if (prodData) setProducts(prodData);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, merchantProfile]);

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
      <div className="w-full animate-in fade-in duration-500 pb-20 text-left font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">
              Katalog Produk
            </h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Total: {products.length} Item
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-[#008080] hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} /> Produk Baru
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 mb-6 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-all">
          <div className="pl-3 text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="CARI BARANG..."
            className="flex-1 bg-transparent border-none outline-none py-2 text-[12px] font-bold text-slate-700 placeholder:text-slate-300 uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="aspect-square relative bg-slate-100">
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-2 bg-white/90 rounded-lg text-slate-600 shadow-sm"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-white/90 rounded-lg text-red-600 shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase truncate">
                      {product.name}
                    </h4>
                    <p className="text-[#008080] font-black text-[12px] mt-1">
                      Rp{product.final_price?.toLocaleString()}
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
      user={user}
      merchantProfile={merchantProfile}
      onSuccess={() => {
        setView("list");
        fetchData();
      }}
      showToast={showToast}
      initialData={selectedProduct}
    />
  );
};

// --- KOMPONEN INTERNAL FORM (DENGAN AUTO COMPRESS & LIMIT 2 FOTO) ---
const ProductFormInternal = ({
  onBack,
  categories,
  user,
  merchantProfile,
  onSuccess,
  showToast,
  initialData,
}: any) => {
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
      setExistingImages(initialData.image_urls || [initialData.image_url]);
    }
  }, [initialData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 && existingImages.length === 0) {
      showToast("WAJIB ADA FOTO PRODUK", "error");
      return;
    }

    setIsUploading(true);
    try {
      const finalMerchantId = merchantProfile?.merchant_id || user.id;
      const finalMarketId = merchantProfile?.market_id;

      let finalUrls = [...existingImages];

      // LOGIKA UPLOAD DENGAN AUTO COMPRESS
      for (const file of imageFiles) {
        // 1. Kompres gambar di Client-side sebelum kirim ke server
        const compressed = await compressImage(file);

        const fileName = `${finalMerchantId}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
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
        description: newProduct.description,
        unit: newProduct.unit,
        category_id: newProduct.category_id,
        merchant_id: finalMerchantId,
        market_id: finalMarketId,
        image_url: finalUrls[0],
        image_urls: finalUrls.slice(0, 2), // Pastikan hanya simpan maksimal 2
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

  return (
    <div className="min-h-screen bg-slate-50 animate-in slide-in-from-right duration-300 pb-20 text-left">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-sm">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-[14px] font-bold text-slate-800 uppercase leading-none">
            {isEditMode ? "Edit Produk" : "Produk Baru"}
          </h2>
          <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mt-1">
            Maksimal 2 Foto Produk
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto md:p-6 p-4">
        <form onSubmit={handleAddProduct} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-[#008080]" /> Foto Produk
              (Maks 2)
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {existingImages.map((url, i) => (
                <div
                  key={i}
                  className="min-w-[120px] h-[120px] rounded-xl overflow-hidden border border-slate-100 relative"
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-md p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {imageFiles.map((file, i) => (
                <div
                  key={i}
                  className="min-w-[120px] h-[120px] rounded-xl overflow-hidden border-2 border-orange-200 relative"
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
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-md p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* LIMITASI 2 FOTO DI SINI */}
              {imageFiles.length + existingImages.length < 2 && (
                <label className="min-w-[120px] h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 rounded-xl cursor-pointer">
                  <Upload size={20} />
                  <span className="text-[8px] font-black mt-1">UPLOAD</span>
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
            <p className="text-[9px] text-slate-400 font-medium">
              * Foto akan di-compress otomatis agar ringan
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Type size={14} /> Nama Produk
              </label>
              <input
                required
                className="w-full p-4 rounded-xl border border-slate-200 font-bold text-[12px] uppercase outline-none focus:border-[#008080] shadow-sm"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Archive size={14} /> Stok
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 font-bold text-[12px] focus:border-[#008080] outline-none shadow-sm"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Layers size={14} /> Kategori
                </label>
                <select
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 font-bold text-[12px] outline-none focus:border-[#008080] shadow-sm"
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">PILIH</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Tag size={14} /> Harga Normal
                </label>
                <input
                  type="number"
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 font-bold text-[12px] focus:border-[#008080] outline-none shadow-sm"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                  <Percent size={14} /> Harga Promo
                </label>
                <input
                  type="number"
                  className="w-full p-4 border-orange-100 bg-orange-50/30 rounded-xl border font-bold text-[12px] focus:border-orange-500 outline-none shadow-sm"
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
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <FileText size={14} /> Deskripsi
              </label>
              <textarea
                required
                className="w-full p-4 rounded-xl border border-slate-200 font-medium text-[12px] h-32 focus:border-[#008080] outline-none shadow-sm resize-none"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
            </div>
          </div>

          <button
            disabled={isUploading}
            className="w-full py-5 bg-[#008080] text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isEditMode ? (
              "SIMPAN PERUBAHAN"
            ) : (
              "DAFTARKAN PRODUK"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
