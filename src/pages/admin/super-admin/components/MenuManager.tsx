import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
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
    try {
      const { error } = await supabase
        .from("app_menus")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setMenus((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, is_active: !currentStatus } : m,
        ),
      );
      showToast(
        currentStatus ? "MENU DINONAKTIFKAN" : "MENU DIAKTIFKAN",
        "success",
      );
    } catch (err: any) {
      showToast(err.message, "error");
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
    try {
      const { error } = await supabase.from("app_menus").insert([newMenu]);
      if (error) throw error;
      fetchMenus();
      showToast("MENU BERHASIL DITAMBAHKAN", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("HAPUS MENU INI SECARA PERMANEN?")) {
      try {
        const { error } = await supabase
          .from("app_menus")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setMenus((prev) => prev.filter((m) => m.id !== id));
        showToast("MENU DIHAPUS", "success");
      } catch (err: any) {
        showToast(err.message, "error");
      }
    }
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("app_menus")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setMenus((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
      );
      showToast("DATA TERSIMPAN", "success");
    } catch (err: any) {
      // Jika error 400 terjadi di sini, database dan kodingan belum sinkron
      showToast("GAGAL SIMPAN: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter">
      <div className="bg-white dark:bg-slate-900 rounded-md p-6 border border-slate-200 dark:border-slate-800 relative transition-colors duration-500">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[14px] font-black text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="text-[#FF6600]" size={20} /> TOMBOL
              NAVIGASI GRID
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
              MENU UTAMA PADA DASHBOARD PELANGGAN
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-[#008080] text-white px-5 py-2.5 rounded-md font-black text-[11px] flex items-center gap-2 hover:bg-slate-900 transition-all active:scale-95"
          >
            <Plus size={16} /> TAMBAH MENU
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-[#008080]" size={32} />
            <p className="text-[10px] text-slate-400 font-black">
              MENGHUBUNGKAN DATABASE...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="flex flex-col lg:flex-row items-center p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-md gap-6 hover:border-[#008080] transition-all"
              >
                <div
                  className={`w-12 h-12 ${menu.color_class} text-white rounded-md flex items-center justify-center shrink-0 border-b-4 border-black/20`}
                >
                  <DynamicIcon name={menu.icon_name} size={22} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Label Menu
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2 text-[12px] font-black outline-none focus:border-[#008080] dark:text-white"
                      value={menu.label}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setMenus((prev) =>
                          prev.map((m) =>
                            m.id === menu.id ? { ...m, label: val } : m,
                          ),
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "label", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Rute URL
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2 text-[12px] font-black outline-none focus:border-[#008080] dark:text-white"
                      value={menu.target_url}
                      onChange={(e) => {
                        setMenus((prev) =>
                          prev.map((m) =>
                            m.id === menu.id
                              ? { ...m, target_url: e.target.value }
                              : m,
                          ),
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "target_url", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Nama Ikon
                    </label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2 text-[12px] font-black outline-none focus:border-[#008080] dark:text-white"
                      value={menu.icon_name}
                      onChange={(e) => {
                        setMenus((prev) =>
                          prev.map((m) =>
                            m.id === menu.id
                              ? { ...m, icon_name: e.target.value }
                              : m,
                          ),
                        );
                      }}
                      onBlur={(e) =>
                        handleUpdateField(menu.id, "icon_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">
                      Warna Tema
                    </label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-md px-3 py-2 text-[12px] font-black outline-none focus:border-[#008080] dark:text-white"
                      value={menu.color_class}
                      onChange={(e) =>
                        handleUpdateField(
                          menu.id,
                          "color_class",
                          e.target.value,
                        )
                      }
                    >
                      <option value="bg-[#008080]">TOSCA</option>
                      <option value="bg-[#FF6600]">ORANGE</option>
                      <option value="bg-blue-600">BLUE</option>
                      <option value="bg-red-600">RED</option>
                      <option value="bg-purple-600">PURPLE</option>
                      <option value="bg-slate-900">BLACK</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-slate-200">
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
                    className="p-2 text-slate-300 hover:text-red-600"
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
