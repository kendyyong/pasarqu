import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Plus,
  Trash2,
  Zap,
  Flame,
  Star,
  ShoppingBag,
  Timer,
  BadgePercent,
  LayoutGrid,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

export const ManageQuickActions = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 1. Ambil data dari Database
  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quick_actions")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setActions(data || []);
    } catch (err: any) {
      showToast("Gagal memuat data: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // 2. Tambah Tombol Baru
  const handleAdd = async () => {
    const newAction = {
      label: "Menu Baru",
      icon_name: "Zap",
      link_to: "/",
      bg_color: "bg-teal-500",
      sort_order: actions.length + 1,
      is_active: true,
    };

    const { error } = await supabase.from("quick_actions").insert([newAction]);
    if (!error) {
      fetchActions();
      showToast("Menu baru berhasil ditambahkan", "success");
    }
  };

  // 3. Update Data
  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase
      .from("quick_actions")
      .update(updates)
      .eq("id", id);

    if (error) {
      showToast("Gagal memperbarui", "error");
    } else {
      showToast("Tersimpan", "success");
      fetchActions();
    }
  };

  // 4. Hapus Tombol
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus tombol ini secara permanen?")) {
      const { error } = await supabase
        .from("quick_actions")
        .delete()
        .eq("id", id);
      if (!error) {
        fetchActions();
        showToast("Tombol berhasil dihapus", "success");
      }
    }
  };

  // Icon Preview Helper
  const renderPreviewIcon = (name: string) => {
    const props = { size: 22 };
    switch (name) {
      case "Flame":
        return <Flame {...props} />;
      case "Star":
        return <Star {...props} />;
      case "ShoppingBag":
        return <ShoppingBag {...props} />;
      case "Timer":
        return <Timer {...props} />;
      case "BadgePercent":
        return <BadgePercent {...props} />;
      case "LayoutGrid":
        return <LayoutGrid {...props} />;
      default:
        return <Zap {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-left overflow-y-auto">
      <div className="max-w-[1000px] mx-auto pb-20">
        {/* TOP NAVIGATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4 transition-all"
            >
              <ArrowLeft size={14} /> Kembali ke Aplikasi
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg shadow-teal-600/30">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Konfigurasi <span className="text-teal-600">Beranda</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Kelola tombol cepat akses marketplace
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="bg-slate-900 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tambah Menu Baru
          </button>
        </div>

        {/* CONTENT AREA */}
        {isLoading ? (
          <div className="flex flex-col items-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
              Sinkronisasi Data Master...
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {actions.length === 0 && (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                Data Kosong. Silakan tambah menu baru.
              </div>
            )}

            {actions.map((item) => (
              <div
                key={item.id}
                className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-8 transition-all hover:shadow-xl group relative overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-teal-50 transition-colors"></div>

                {/* Preview Icon Bulatan Besar */}
                <div
                  className={`${item.bg_color || "bg-teal-500"} w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shrink-0 z-10`}
                >
                  {renderPreviewIcon(item.icon_name)}
                </div>

                {/* Form Pengaturan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 w-full z-10">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Label Menu
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      defaultValue={item.label}
                      onBlur={(e) =>
                        handleUpdate(item.id, { label: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Link Tujuan (URL)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      defaultValue={item.link_to}
                      onBlur={(e) =>
                        handleUpdate(item.id, { link_to: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Jenis Icon
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none cursor-pointer appearance-none"
                      defaultValue={item.icon_name}
                      onChange={(e) =>
                        handleUpdate(item.id, { icon_name: e.target.value })
                      }
                    >
                      <option value="Zap">Zap (Petir)</option>
                      <option value="Flame">Flame (Hot)</option>
                      <option value="Star">Star (Bintang)</option>
                      <option value="ShoppingBag">Shopping Bag</option>
                      <option value="Timer">Timer (Cepat)</option>
                      <option value="BadgePercent">Diskon %</option>
                      <option value="LayoutGrid">Semua Kategori</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Warna Latar
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none cursor-pointer appearance-none"
                      defaultValue={item.bg_color}
                      onChange={(e) =>
                        handleUpdate(item.id, { bg_color: e.target.value })
                      }
                    >
                      <option value="bg-teal-500">Teal (Hijau Pasarqu)</option>
                      <option value="bg-orange-500">Orange (Energi)</option>
                      <option value="bg-red-500">Red (Mendesak)</option>
                      <option value="bg-blue-500">Blue (Segar)</option>
                      <option value="bg-slate-900">Black (Elegant)</option>
                      <option value="bg-pink-500">Pink (Soft)</option>
                    </select>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex lg:flex-col gap-3 border-l lg:border-l-2 pl-8 border-slate-50 z-10">
                  <button
                    onClick={() =>
                      handleUpdate(item.id, { is_active: !item.is_active })
                    }
                    className={`p-4 rounded-2xl transition-all shadow-sm ${item.is_active ? "text-teal-600 bg-teal-50" : "text-slate-300 bg-slate-100"}`}
                    title={item.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm group/del"
                    title="Hapus Permanen"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">
            Pasarqu Master Engine &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
};
