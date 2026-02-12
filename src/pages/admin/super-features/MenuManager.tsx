import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Zap,
  ToggleLeft,
  ToggleRight,
  Plus,
  Save,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Link as LinkIcon,
  Palette,
  Type,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

// Helper: Preview Icon Dinamis agar admin bisa lihat icon sebelum save
const DynamicIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  // @ts-ignore
  const IconComponent = Icons[name];
  return IconComponent ? (
    <IconComponent size={size} />
  ) : (
    <Icons.HelpCircle size={size} />
  );
};

export const MenuManager = () => {
  const { showToast } = useToast();
  const [menus, setMenus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Ambil Data dari Tabel app_menus
  const fetchMenus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_menus")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setMenus(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 2. Logic Update Status (On/Off)
  const toggleMenuStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("app_menus")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) {
      setMenus((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, is_active: !currentStatus } : m,
        ),
      );
      showToast(
        currentStatus ? "Menu dinonaktifkan" : "Menu diaktifkan",
        "success",
      );
    }
  };

  // 3. Logic Tambah Menu Baru
  const handleAdd = async () => {
    const newMenu = {
      label: "Menu Baru",
      icon_name: "Zap",
      target_url: "/",
      color_class: "bg-teal-600",
      order_index: menus.length + 1,
      is_active: true,
    };
    const { error } = await supabase.from("app_menus").insert([newMenu]);
    if (!error) {
      fetchMenus();
      showToast("Menu berhasil ditambahkan", "success");
    }
  };

  // 4. Logic Hapus Menu
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus menu ini secara permanen?")) {
      const { error } = await supabase.from("app_menus").delete().eq("id", id);
      if (!error) {
        setMenus((prev) => prev.filter((m) => m.id !== id));
        showToast("Menu dihapus", "success");
      }
    }
  };

  // 5. Logic Update Field (Simpan saat kursor keluar dari input)
  const handleUpdateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("app_menus")
      .update({ [field]: value })
      .eq("id", id);
    if (!error) showToast("Tersimpan", "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* SECTION 1: IKLAN SLIDE (BANNER) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl flex items-center gap-2">
              <ImageIcon className="text-teal-600" /> Iklan Slide Beranda
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Banner promosi teratas
            </p>
          </div>
          <button className="bg-teal-50 text-teal-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all">
            <Upload size={16} className="mr-2 inline" /> Tambah Banner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="aspect-[2/1] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2 hover:border-teal-400 hover:text-teal-400 cursor-pointer transition-all">
            <Plus size={32} />
            <span className="text-[9px] font-black uppercase">
              Slot Iklan Baru
            </span>
          </div>
          <div className="aspect-[2/1] bg-slate-800 rounded-2xl relative overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
              alt="Promo"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-lg text-white hover:bg-red-500 cursor-pointer transition-colors">
              <X size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TOMBOL NAVIGASI GRID */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl flex items-center gap-2">
              <Zap className="text-orange-500" /> Tombol Navigasi Grid
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Menu navigasi utama pelanggan
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
          >
            <Plus size={16} /> Tambah Menu
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="flex flex-col lg:flex-row items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 gap-6 group hover:bg-white hover:shadow-md transition-all"
              >
                {/* Preview Ikon */}
                <div
                  className={`w-14 h-14 ${menu.color_class || "bg-teal-600"} text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0`}
                >
                  <DynamicIcon name={menu.icon_name} size={24} />
                </div>

                {/* Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Label
                    </label>
                    <input
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      defaultValue={menu.label}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "label", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      URL / Path
                    </label>
                    <input
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      defaultValue={menu.target_url}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "target_url", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Icon Name (Lucide)
                    </label>
                    <input
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-teal-500 transition-all"
                      defaultValue={menu.icon_name}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "icon_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Warna Latar
                    </label>
                    <select
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold cursor-pointer"
                      defaultValue={menu.color_class}
                      onChange={(e) =>
                        handleUpdateField(
                          menu.id,
                          "color_class",
                          e.target.value,
                        )
                      }
                    >
                      <option value="bg-teal-600">Teal</option>
                      <option value="bg-orange-500">Orange</option>
                      <option value="bg-blue-500">Blue</option>
                      <option value="bg-red-500">Red</option>
                      <option value="bg-purple-600">Purple</option>
                      <option value="bg-slate-800">Black</option>
                    </select>
                  </div>
                </div>

                {/* Aksi Toggle & Hapus */}
                <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                  <button
                    onClick={() => toggleMenuStatus(menu.id, menu.is_active)}
                  >
                    {menu.is_active ? (
                      <ToggleRight className="text-teal-600" size={32} />
                    ) : (
                      <ToggleLeft className="text-slate-300" size={32} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
