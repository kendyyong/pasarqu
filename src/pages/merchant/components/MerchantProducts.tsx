import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Plus,
  Package,
  Search,
  X,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface Props {
  merchantProfile: any;
}

export const MerchantProducts: React.FC<Props> = ({ merchantProfile }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    unit: "Pcs",
  });

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchantProfile?.id || user.id) // Pakai ID dari profile merchant
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [user, merchantProfile]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !merchantProfile) return;

    // 1. VALIDASI PASAR (PENTING!)
    if (!merchantProfile.market_id) {
      showToast(
        "Error: Data Toko tidak memiliki ID Pasar. Hubungi Admin.",
        "error",
      );
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = null;
      // Upload Gambar
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // 2. INSERT KE DATABASE (DENGAN PERBAIKAN)
      const { error } = await supabase.from("products").insert({
        merchant_id: merchantProfile.id, // Pastikan pakai ID Merchant (bukan user_id auth)

        // --- PERBAIKAN UTAMA DI SINI ---
        market_id: merchantProfile.market_id, // Bukan managed_market_id

        name: newProduct.name,
        price: parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        unit: newProduct.unit,
        image_url: imageUrl,

        // --- STATUS WAJIB PENDING (HURUF BESAR) ---
        status: "PENDING",
      });

      if (error) throw error;

      showToast(
        "Produk berhasil diajukan! Menunggu verifikasi admin.",
        "success",
      );
      setShowAddModal(false);
      fetchProducts();

      // Reset Form
      setNewProduct({
        name: "",
        price: "",
        stock: "",
        description: "",
        unit: "Pcs",
      });
      setImageFile(null);
    } catch (err: any) {
      console.error(err);
      showToast("Gagal upload: " + err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      showToast("Produk dihapus", "success");
      fetchProducts();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Katalog Produk
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Kelola stok dan harga dagangan
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95"
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* SEARCH & FILTER (Placeholder) */}
      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Cari produk di etalase Anda..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:border-teal-500 shadow-sm transition-all font-medium text-sm"
        />
      </div>

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
        </div>
      ) : products.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
          <Package size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-6">
            Etalase masih kosong
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
          >
            Mulai Jualan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <StatusBadge status={p.status} />
              </div>
              <div className="aspect-square bg-slate-50 rounded-2xl mb-3 overflow-hidden relative">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={p.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-200">
                    <Package size={40} />
                  </div>
                )}
              </div>
              <div className="px-1">
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-tight line-clamp-1 mb-1 leading-tight">
                  {p.name}
                </h3>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-black text-teal-600 tracking-tighter">
                      Rp {p.price.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      Stok: {p.stock} {p.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH PRODUK */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in-95 text-left">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight">
                Tambah Dagangan
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Image Upload */}
              <div className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 cursor-pointer relative overflow-hidden group">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />
                ) : (
                  <>
                    <Upload
                      size={32}
                      className="mb-2 group-hover:scale-110 transition-transform text-teal-600"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Klik Upload Foto
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) =>
                    e.target.files && setImageFile(e.target.files[0])
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nama Produk"
                  val={newProduct.name}
                  set={(v: string) => setNewProduct({ ...newProduct, name: v })}
                />
                <Input
                  label="Satuan (Pcs/Kg)"
                  val={newProduct.unit}
                  set={(v: string) => setNewProduct({ ...newProduct, unit: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Harga (Rp)"
                  type="number"
                  val={newProduct.price}
                  set={(v: string) =>
                    setNewProduct({ ...newProduct, price: v })
                  }
                />
                <Input
                  label="Stok"
                  type="number"
                  val={newProduct.stock}
                  set={(v: string) =>
                    setNewProduct({ ...newProduct, stock: v })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">
                  Deskripsi Produk
                </label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-teal-500 outline-none h-24 resize-none"
                  placeholder="Ceritakan detail produk Anda..."
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <button
                disabled={isUploading}
                className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-teal-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Simpan & Jual Sekarang"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- INTERNAL HELPERS ---
const StatusBadge = ({ status }: { status: string }) => {
  // Samakan case-nya (biasanya uppercase dari DB)
  const s = status?.toUpperCase();

  if (s === "APPROVED")
    return (
      <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-md">
        <CheckCircle size={8} /> Aktif
      </span>
    );
  if (s === "PENDING")
    return (
      <span className="bg-orange-400 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-md">
        <Clock size={8} /> Verifikasi
      </span>
    );
  return (
    <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-md">
      <AlertCircle size={8} /> Ditolak
    </span>
  );
};

const Input = ({ label, val, set, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">
      {label}
    </label>
    <input
      type={type}
      required
      value={val}
      onChange={(e) => set(e.target.value)}
      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-teal-500 shadow-inner"
    />
  </div>
);
