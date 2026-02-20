import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  Package,
  LayoutGrid,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const ManageCategories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [newCat, setNewCat] = useState({ name: "", slug: "", icon_url: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Otomatis buat slug saat ngetik nama
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    setNewCat({ ...newCat, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) return showToast("NAMA KATEGORI WAJIB DIISI", "error");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert([
        {
          name: newCat.name.toUpperCase(),
          slug: newCat.slug,
          icon_url: newCat.icon_url,
        },
      ]);

      if (error) throw error;
      showToast("KATEGORI BERHASIL DITAMBAHKAN", "success");
      setNewCat({ name: "", slug: "", icon_url: "" });
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "HAPUS KATEGORI INI? PRODUK TERKAIT MUNGKIN AKAN KEHILANGAN LABELNYA.",
      )
    )
      return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      showToast("KATEGORI TELAH DIHAPUS", "success");
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="p-6 space-y-6 text-left animate-in fade-in duration-500 font-black uppercase tracking-tighter">
      {/* HEADER */}
      <header className="border-b-4 border-[#008080] pb-4">
        <h1 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
          <LayoutGrid className="text-[#008080]" size={24} /> MANAJEMEN KATEGORI
          PRODUK
        </h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
          KELOLA LABEL PRODUK SELURUH EKOSISTEM PASARQU
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM TAMBAH (KIRI) */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-5"
          >
            <h3 className="font-black text-slate-800 text-[12px] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus size={18} className="text-[#008080]" /> TAMBAH KATEGORI BARU
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                  NAMA KATEGORI
                </label>
                <input
                  required
                  value={newCat.name}
                  onChange={handleNameChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md font-black text-[12px] outline-none focus:border-[#008080] uppercase"
                  placeholder="CONTOH: SAYUR SEGAR"
                />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                  SLUG (OTOMATIS)
                </label>
                <input
                  readOnly
                  value={newCat.slug}
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md font-black text-[12px] outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                  URL IKON / GAMBAR
                </label>
                <input
                  value={newCat.icon_url}
                  onChange={(e) =>
                    setNewCat({ ...newCat, icon_url: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md font-black text-[12px] outline-none focus:border-[#008080]"
                  placeholder="HTTPS://IMAGE-LINK.COM/ICON.PNG"
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-4 bg-[#008080] text-white rounded-md font-black uppercase text-[11px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md active:translate-y-0.5 border-b-4 border-black/20"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <CheckCircle2 size={18} /> SIMPAN KATEGORI
                </>
              )}
            </button>
          </form>
        </div>

        {/* LIST KATEGORI (KANAN) */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                DAFTAR KATEGORI AKTIF
              </h4>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="animate-spin text-[#008080]" size={32} />
                <p className="text-[10px] text-slate-400 font-black">
                  MEMUAT DATA...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-20 text-center text-slate-300 font-black text-[12px]">
                BELUM ADA DATA
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-[#008080] border border-slate-200 overflow-hidden">
                        {cat.icon_url ? (
                          <img
                            src={cat.icon_url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <Tag size={18} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-[12px] uppercase">
                          {cat.name}
                        </h4>
                        <p className="text-[8px] font-bold text-slate-400 tracking-widest">
                          SLUG: {cat.slug}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-md flex items-start gap-3">
            <Package className="text-[#FF6600] shrink-0" size={18} />
            <p className="text-[9px] text-[#FF6600] font-bold leading-relaxed uppercase">
              PASTIKAN NAMA KATEGORI SINGKAT DAN JELAS. SISTEM AKAN OTOMATIS
              MENGUBAHNYA MENJADI HURUF KAPITAL UNTUK KONSISTENSI TAMPILAN PADA
              APLIKASI PELANGGAN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
