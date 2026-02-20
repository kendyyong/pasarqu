import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
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
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

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
      showToast("GAGAL MEMUAT MENU: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

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
        currentStatus ? "MENU DINONAKTIFKAN" : "MENU DIAKTIFKAN",
        "success",
      );
    }
  };

  const handleAdd = async () => {
    const newMenu = {
      label: "MENU BARU",
      icon_name: "Zap",
      target_url: "/",
      color_class: "bg-[#008080]",
      order_index: menus.length + 1,
      is_active: true,
    };
    const { error } = await supabase.from("app_menus").insert([newMenu]);
    if (!error) {
      fetchMenus();
      showToast("MENU BERHASIL DITAMBAHKAN", "success");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("HAPUS MENU INI SECARA PERMANEN?")) {
      const { error } = await supabase.from("app_menus").delete().eq("id", id);
      if (!error) {
        setMenus((prev) => prev.filter((m) => m.id !== id));
        showToast("MENU DIHAPUS", "success");
      }
    }
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("app_menus")
      .update({ [field]: value })
      .eq("id", id);
    if (!error) showToast("DATA TERSIMPAN", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter">
      {/* SECTION 1: BANNER IKLAN */}
      <div className="bg-white rounded-md p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2">
              <ImageIcon className="text-[#008080]" size={20} /> IKLAN SLIDE
              BERANDA
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
              BANNER PROMOSI UTAMA APLIKASI
            </p>
          </div>
          <button className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-md font-black text-[11px] hover:bg-[#008080] hover:text-white transition-all">
            <Upload size={14} className="mr-2 inline" /> TAMBAH BANNER
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="aspect-[2/1] bg-slate-50 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2 hover:border-[#008080] hover:text-[#008080] cursor-pointer transition-all">
            <Plus size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              SLOT IKLAN BARU
            </span>
          </div>

          {/* Contoh Banner Aktif */}
          <div className="aspect-[2/1] bg-slate-800 rounded-md relative overflow-hidden group border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
              alt="Promo"
              className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-2 left-2">
              <p className="text-[8px] text-white font-black px-2 py-0.5 bg-[#FF6600] rounded-sm">
                AKTIF
              </p>
            </div>
            <button className="absolute top-2 right-2 bg-white/10 backdrop-blur-md p-1.5 rounded-md text-white hover:bg-red-600 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: TOMBOL NAVIGASI GRID */}
      <div className="bg-white rounded-md p-6 shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-2">
              <LayoutGrid className="text-[#FF6600]" size={20} /> TOMBOL
              NAVIGASI GRID
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
              MENU UTAMA PADA DASHBOARD PELANGGAN
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-[#008080] text-white px-5 py-2.5 rounded-md font-black text-[11px] flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
          >
            <Plus size={16} /> TAMBAH MENU
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-[#008080]" size={32} />
            <p className="text-[10px] text-slate-400 font-black">
              MENGHUBUNGKAN KE DATABASE...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="flex flex-col lg:flex-row items-center p-4 bg-white border border-slate-100 rounded-md gap-6 hover:border-[#008080] hover:shadow-md transition-all group"
              >
                {/* Preview Ikon */}
                <div
                  className={`w-12 h-12 ${menu.color_class || "bg-[#008080]"} text-white rounded-md flex items-center justify-center shadow-lg shrink-0 border-b-4 border-black/20`}
                >
                  <DynamicIcon name={menu.icon_name} size={22} />
                </div>

                {/* Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                      Label Menu
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-[12px] font-black focus:border-[#008080] outline-none transition-all uppercase"
                      defaultValue={menu.label}
                      onBlur={(e) =>
                        handleUpdateField(
                          menu.id,
                          "label",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                      Rute / URL
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-[12px] font-black focus:border-[#008080] outline-none transition-all"
                      defaultValue={menu.target_url}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "target_url", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                      Nama Ikon (Lucide)
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-[12px] font-black focus:border-[#008080] outline-none transition-all"
                      defaultValue={menu.icon_name}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "icon_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 tracking-widest uppercase ml-1">
                      Warna Tema
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5 text-[12px] font-black cursor-pointer focus:border-[#008080] outline-none"
                      defaultValue={menu.color_class}
                      onChange={(e) =>
                        handleUpdateField(
                          menu.id,
                          "color_class",
                          e.target.value,
                        )
                      }
                    >
                      <option value="bg-[#008080]">TOSCA (PRIMARY)</option>
                      <option value="bg-[#FF6600]">ORANGE (SECONDARY)</option>
                      <option value="bg-blue-600">BLUE SKY</option>
                      <option value="bg-red-600">DANGER RED</option>
                      <option value="bg-purple-600">ROYAL PURPLE</option>
                      <option value="bg-slate-900">DEEP BLACK</option>
                    </select>
                  </div>
                </div>

                {/* Aksi Toggle & Hapus */}
                <div className="flex items-center gap-4 lg:border-l lg:pl-6 border-slate-200">
                  <button
                    onClick={() => toggleMenuStatus(menu.id, menu.is_active)}
                  >
                    {menu.is_active ? (
                      <ToggleRight className="text-[#008080]" size={36} />
                    ) : (
                      <ToggleLeft className="text-slate-300" size={36} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-4 rounded-md text-center border-b-4 border-[#008080]">
        <p className="text-[10px] text-white font-black tracking-widest uppercase">
          SELURUH PERUBAHAN PADA HALAMAN INI AKAN BERDAMPAK LANGSUNG PADA
          TAMPILAN APLIKASI PELANGGAN.
        </p>
      </div>
    </div>
  );
};
