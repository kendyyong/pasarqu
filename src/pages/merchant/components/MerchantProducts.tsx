import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Plus,
  Search,
  X,
  Upload,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Timer,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

interface Props {
  merchantProfile: any;
  autoOpenForm?: boolean;
}

export const MerchantProducts: React.FC<Props> = ({
  merchantProfile,
  autoOpenForm,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    unit: "Pcs",
    category_id: "",
    is_po: false,
    po_days: "3",
  });

  // TANGKAP SINYAL DARI DASHBOARD
  useEffect(() => {
    if (autoOpenForm) setIsAdding(true);
  }, [autoOpenForm]);

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  // ✅ REALTIME LISTENER (Agar otomatis update saat status berubah)
  useEffect(() => {
    if (!user?.id) return;

    // Kita dengarkan perubahan di tabel products untuk merchant ini
    const channel = supabase
      .channel("merchant_products_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          // Filter berdasarkan user_id merchant (kita ambil dari profile user yang login)
          // Note: Logic filter ini akan lebih akurat jika kita sudah tau ID merchantnya,
          // tapi refresh manual di function handleAddProduct juga sudah cukup aman.
        },
        () => fetchProducts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true);
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 1. Ambil ID Merchant yang VALID dari database dulu
      const { data: merchantData } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!merchantData) {
        setLoading(false);
        return;
      }

      // 2. Ambil Produk berdasarkan ID Merchant yang valid tadi
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantData.id)
        .order("created_at", { ascending: false });

      if (!error && data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImageFiles([...imageFiles, ...selectedFiles].slice(0, 3));
    }
  };

  // 🔥 FUNGSI UPLOAD ANTI-GAGAL 🔥
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (imageFiles.length === 0) {
      showToast("Wajib upload minimal 1 foto produk!", "error");
      return;
    }

    setIsUploading(true);
    try {
      // 1. CEK KTP TOKO (Ambil ID Merchant Valid dari Database)
      // Kita tidak mengandalkan props merchantProfile yang mungkin telat loading
      const { data: validMerchant, error: merchantError } = await supabase
        .from("merchants")
        .select("id, market_id")
        .eq("user_id", user.id)
        .single();

      if (merchantError || !validMerchant) {
        throw new Error("Data Toko belum siap. Silakan refresh halaman.");
      }

      const finalMerchantId = validMerchant.id;
      const finalMarketId = validMerchant.market_id;

      // 2. UPLOAD FOTO KE STORAGE
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${finalMerchantId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }

      // 3. SIMPAN DATA PRODUK (Dijamin Aman karena ID sudah valid)
      const { error: insertErr } = await supabase.from("products").insert({
        merchant_id: finalMerchantId,
        market_id: finalMarketId,
        category_id: newProduct.category_id,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        unit: newProduct.unit,
        is_po: newProduct.is_po,
        po_days: newProduct.is_po ? parseInt(newProduct.po_days) : null,
        image_url: uploadedUrls[0],
        image_urls: uploadedUrls,
        status: "PENDING", // Status Awal
      });

      if (insertErr) throw insertErr;

      showToast("Produk Berhasil Diupload! Menunggu Verifikasi.", "success");

      // Reset Form
      setIsAdding(false);
      setImageFiles([]);
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        description: "",
        unit: "Pcs",
        category_id: "",
        is_po: false,
        po_days: "3",
      });

      // Refresh Data
      fetchProducts();
    } catch (err: any) {
      console.error("Upload Error:", err);
      showToast(err.message || "Gagal upload produk", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // TAMPILAN FORM TAMBAH BARANG
  if (isAdding) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right duration-300">
        <div className="bg-slate-900 p-5 border-b-4 border-orange-600 flex justify-between items-center rounded-none sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-4 text-left">
            <button
              onClick={() => setIsAdding(false)}
              className="w-8 h-8 bg-slate-800 flex items-center justify-center text-white hover:bg-orange-600 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
                Registrasi Barang
              </h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Kembali ke Etalase
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 md:p-8 rounded-none">
          <form onSubmit={handleAddProduct} className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Foto Dagangan (Max 3)
              </label>
              <div className="flex gap-2">
                {imageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-20 border-2 border-slate-200 relative group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImageFiles(imageFiles.filter((_, i) => i !== idx))
                      }
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 shadow-lg hover:bg-red-700 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 3 && (
                  <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-teal-500 transition-all">
                    <Upload size={20} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <Input
                label="Nama Barang"
                val={newProduct.name}
                set={(v: string) => setNewProduct({ ...newProduct, name: v })}
              />
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Kategori
                </label>
                <select
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs font-black uppercase outline-none focus:border-teal-600"
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">Pilih...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Harga Jual (Rp)"
                type="number"
                val={newProduct.price}
                set={(v: string) => setNewProduct({ ...newProduct, price: v })}
              />
              <Input
                label="Stok (Angka)"
                type="number"
                val={newProduct.stock}
                set={(v: string) => setNewProduct({ ...newProduct, stock: v })}
              />
              <Input
                label="Satuan (Pcs/Kg/Ikat)"
                val={newProduct.unit}
                set={(v: string) => setNewProduct({ ...newProduct, unit: v })}
              />
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-orange-600" />
                  <span className="text-[9px] font-black text-orange-900 uppercase">
                    Sistem Pre-Order
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewProduct({ ...newProduct, is_po: !newProduct.is_po })
                  }
                  className={`w-10 h-5 rounded-none relative transition-colors ${newProduct.is_po ? "bg-orange-600" : "bg-slate-300"}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white transition-all ${newProduct.is_po ? "left-6" : "left-1"}`}
                  ></div>
                </button>
              </div>
              {newProduct.is_po && (
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-orange-200 rounded-none text-xs font-black outline-none"
                  placeholder="LAMA HARI PO"
                  value={newProduct.po_days}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, po_days: e.target.value })
                  }
                />
              )}
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Deskripsi Barang
              </label>
              <textarea
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-bold focus:border-teal-600 outline-none h-24 resize-none"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              ></textarea>
            </div>

            <button
              disabled={isUploading}
              className="w-full py-4 bg-slate-900 text-white rounded-none font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "UPLOAD KE ETALASE SEKARANG"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN LIST PRODUK
  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left">
      <div className="bg-slate-900 p-5 border-b-4 border-teal-600 flex justify-between items-center rounded-none shadow-md">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">
            Etalase Saya
          </h2>
          <p className="text-[8px] font-bold text-teal-500 uppercase tracking-[0.2em] mt-1">
            Management System
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-none font-black text-[10px] uppercase flex items-center gap-2 hover:bg-teal-700 transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={3} /> Tambah Barang
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          placeholder="CARI NAMA BARANG..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-none outline-none focus:border-teal-600 font-black text-[10px] uppercase"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-slate-900 mx-auto" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {products
            .filter((p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-none overflow-hidden transition-all group relative"
              >
                <div className="aspect-square relative bg-slate-100">
                  <img
                    src={p.image_url}
                    className={`w-full h-full object-cover ${p.status === "PENDING" ? "opacity-70 grayscale" : ""}`}
                  />

                  {/* STATUS BADGES */}
                  {p.status === "PENDING" && (
                    <div className="absolute top-0 left-0 right-0 bg-orange-500/90 text-white text-[7px] font-black uppercase py-1.5 flex items-center justify-center gap-1 backdrop-blur-sm z-10">
                      <Loader2 size={8} className="animate-spin" /> MENUNGGU
                      VERIFIKASI
                    </div>
                  )}
                  {p.status === "REJECTED" && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-[7px] font-black uppercase py-1.5 text-center backdrop-blur-sm z-10">
                      <AlertCircle size={8} className="inline mr-1" /> DITOLAK
                    </div>
                  )}
                  {p.is_po && (
                    <div className="absolute bottom-1 right-1 bg-slate-900 text-white text-[6px] font-black px-1.5 py-0.5 rounded-none uppercase shadow-lg">
                      PO {p.po_days}D
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="text-[7px] font-black text-slate-400 uppercase">
                    {p.categories?.name}
                  </p>
                  <h3 className="font-black text-slate-800 text-[9px] uppercase truncate">
                    {p.name}
                  </h3>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-900 italic">
                      Rp{p.price.toLocaleString()}
                    </p>

                    <button
                      onClick={async () => {
                        if (confirm("Hapus permanen?")) {
                          await supabase
                            .from("products")
                            .delete()
                            .eq("id", p.id);
                          fetchProducts();
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const Input = ({ label, val, set, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </label>
    <input
      type={type}
      required
      value={val}
      onChange={(e) => set(e.target.value)}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs font-black outline-none focus:border-teal-600 uppercase transition-all"
    />
  </div>
);
