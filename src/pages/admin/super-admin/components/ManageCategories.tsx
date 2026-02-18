import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Package,
} from "lucide-react";

export const ManageCategories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", slug: "", icon: "package" });

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setCategories(data || []);
    setLoading(false);
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
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert(newCat);
      if (error) throw error;
      showToast("Kategori Berhasil Ditambahkan", "success");
      setNewCat({ name: "", slug: "", icon: "package" });
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
        "Hapus kategori ini? Produk dengan kategori ini mungkin akan kehilangan labelnya.",
      )
    )
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      showToast("Kategori Terhapus", "info");
      fetchCategories();
    }
  };

  return (
    <div className="p-10 space-y-10 text-left animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
          Master Kategori
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Kelola Label Produk Seluruh Ekosistem
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* FORM TAMBAH */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5"
          >
            <h3 className="font-black uppercase text-slate-800 text-sm flex items-center gap-2">
              <Plus size={18} className="text-teal-600" /> Tambah Baru
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  Nama Kategori
                </label>
                <input
                  required
                  value={newCat.name}
                  onChange={handleNameChange}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Contoh: Sayur Segar"
                />
              </div>
              <div className="space-y-1 opacity-50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  Slug (Otomatis)
                </label>
                <input
                  readOnly
                  value={newCat.slug}
                  className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-sm outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Simpan Kategori"
              )}
            </button>
          </form>
        </div>

        {/* LIST KATEGORI */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:border-teal-500 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <Tag size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm uppercase">
                        {cat.name}
                      </h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Slug: {cat.slug}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-3 text-slate-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
