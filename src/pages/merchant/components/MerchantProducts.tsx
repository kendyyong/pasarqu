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
  ToggleLeft,
  ToggleRight,
  Tag,
  EyeOff,
  Image as ImageIcon,
  FileText,
  Layers,
  Timer,
} from "lucide-react";

interface Props {
  merchantProfile: any;
}

export const MerchantProducts: React.FC<Props> = ({ merchantProfile }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    unit: "Pcs",
    category_id: "",
    is_po: false, // FIELD BARU
    po_days: "3", // FIELD BARU
  });

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!error) setCategories(data || []);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantProfile?.id || user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
      fetchCategories();
    }
  }, [user, merchantProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = [...imageFiles, ...selectedFiles].slice(0, 3);
      setImageFiles(totalFiles);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleStatus = async (
    productId: string,
    currentStatus: string,
  ) => {
    setUpdatingId(productId);
    const newStatus =
      currentStatus === "APPROVED" ? "OUT_OF_STOCK" : "APPROVED";
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);
      if (error) throw error;
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, status: newStatus } : p,
        ),
      );
      showToast(
        newStatus === "APPROVED" ? "Produk Aktif" : "Produk Habis",
        "success",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalMerchantId = merchantProfile?.id || user.id;
    const finalMarketId =
      profile?.managed_market_id || merchantProfile?.market_id;

    if (!finalMerchantId || !finalMarketId || imageFiles.length === 0) {
      showToast("Lengkapi data & foto!", "error");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("products").insert({
        merchant_id: finalMerchantId,
        market_id: finalMarketId,
        category_id: newProduct.category_id,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        description: newProduct.description,
        unit: newProduct.unit,
        is_po: newProduct.is_po, // KIRIM DATA PO
        po_days: newProduct.is_po ? parseInt(newProduct.po_days) : null, // KIRIM DURASI PO
        image_url: uploadedUrls[0],
        image_urls: uploadedUrls,
        status: "PENDING",
      });

      if (error) throw error;
      showToast("Produk Berhasil Ditambahkan!", "success");
      setShowAddModal(false);
      fetchProducts();
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
      setImageFiles([]);
    } catch (err: any) {
      showToast("Gagal: " + err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus barang?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      showToast("Terhapus", "success");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans text-left antialiased px-1">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-teal-600 p-6 rounded-xl shadow-lg shadow-teal-900/10">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
            Etalase Saya
          </h2>
          <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-1">
            Kelola stok & verifikasi produk
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-teal-600 px-4 py-2 rounded-lg font-black text-xs uppercase hover:bg-teal-50 transition-all flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Tambah Barang
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Cari di etalase..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500 transition-all font-semibold text-sm"
        />
      </div>

      {/* GRID RESPONSIF */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all ${p.status === "OUT_OF_STOCK" ? "opacity-60" : ""}`}
            >
              <div className="aspect-square relative bg-slate-50">
                <img
                  src={p.image_url}
                  className="w-full h-full object-cover"
                  alt={p.name}
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <StatusBadge status={p.status} />
                  {p.is_po && (
                    <div className="bg-orange-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-sm uppercase">
                      PO {p.po_days} Hari
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    {p.categories?.name}
                  </span>
                  <span className="text-[8px] font-black text-teal-600 uppercase">
                    Stok {p.stock}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-[10px] uppercase line-clamp-1">
                  {p.name}
                </h3>
                <div className="pt-2 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">
                      Rp {p.price.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      per {p.unit}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStatus(p.id, p.status)}
                      className="p-1.5 bg-slate-50 rounded-md text-slate-400 hover:text-teal-600"
                    >
                      {p.status === "APPROVED" ? (
                        <ToggleRight size={16} />
                      ) : (
                        <ToggleLeft size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 bg-slate-50 rounded-md text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black uppercase text-slate-800 italic">
                Data Barang Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* FOTO SECTION */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} /> Foto Produk (Max 3)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {imageFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 3 && (
                    <label className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-teal-500 hover:text-teal-500 transition-all">
                      <Upload size={18} />
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

              {/* INPUTS SECTION */}
              <div className="space-y-4">
                <Input
                  label="Nama Dagangan"
                  val={newProduct.name}
                  set={(v: string) => setNewProduct({ ...newProduct, name: v })}
                />

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Kategori
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-teal-500"
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Satuan (Pcs/Kg/Ikat)"
                    val={newProduct.unit}
                    set={(v: string) =>
                      setNewProduct({ ...newProduct, unit: v })
                    }
                  />
                  <Input
                    label="Harga Jual (Rp)"
                    type="number"
                    val={newProduct.price}
                    set={(v: string) =>
                      setNewProduct({ ...newProduct, price: v })
                    }
                  />
                </div>

                <Input
                  label="Jumlah Stok Tersedia"
                  type="number"
                  val={newProduct.stock}
                  set={(v: string) =>
                    setNewProduct({ ...newProduct, stock: v })
                  }
                />

                {/* --- FITUR PRE-ORDER (PO) --- */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-orange-600" />
                      <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">
                        Sistem Pre-Order (PO)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          is_po: !newProduct.is_po,
                        })
                      }
                      className={`w-10 h-5 rounded-full transition-all relative ${newProduct.is_po ? "bg-orange-500" : "bg-slate-300"}`}
                    >
                      <div
                        className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newProduct.is_po ? "left-6" : "left-1"}`}
                      ></div>
                    </button>
                  </div>

                  {newProduct.is_po && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[8px] font-black text-orange-400 uppercase tracking-widest ml-1">
                        Lama Proses (Hari)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white border border-orange-200 rounded-md text-xs font-bold outline-none focus:border-orange-500 mt-1"
                        placeholder="Contoh: 3"
                        value={newProduct.po_days}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            po_days: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} /> Deskripsi Produk
                  </label>
                  <textarea
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-teal-500 outline-none h-24 resize-none"
                    placeholder="Ceritakan detail produk..."
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

              <button
                disabled={isUploading}
                className="w-full py-4 bg-teal-600 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-lg hover:bg-teal-700 disabled:bg-slate-200 transition-all"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  "Simpan & Verifikasi"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toUpperCase();
  if (s === "APPROVED")
    return (
      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
    );
  if (s === "PENDING")
    return (
      <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow-sm"></div>
    );
  return (
    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
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
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-teal-500 transition-all"
    />
  </div>
);
