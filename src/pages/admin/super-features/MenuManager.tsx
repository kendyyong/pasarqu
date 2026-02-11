import React, { useState, useEffect } from "react";
import { Zap, ToggleLeft, ToggleRight, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient"; // Sesuaikan path ../
import { useToast } from "../../../contexts/ToastContext";

export const MenuManager = () => {
  const { showToast } = useToast();
  const [menus, setMenus] = useState<any[]>([]);

  // 1. Fetch Data
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    const { data } = await supabase
      .from("app_menus")
      .select("*")
      .order("order_index");
    if (data) setMenus(data);
  };

  // 2. Logic Update
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
      showToast("Status berhasil diubah", "success");
    }
  };

  // 3. Render Tampilan
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      <h3 className="font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Zap className="text-orange-500" /> Manajemen Tombol Navigasi
      </h3>

      <div className="grid gap-3">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${menu.color_class} text-white rounded-xl flex items-center justify-center`}
              >
                <Zap size={18} /> {/* Bisa diganti dynamic icon */}
              </div>
              <div>
                <p className="font-black text-xs uppercase text-slate-800">
                  {menu.label}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">
                  {menu.target_url}
                </p>
              </div>
            </div>
            <button onClick={() => toggleMenuStatus(menu.id, menu.is_active)}>
              {menu.is_active ? (
                <ToggleRight className="text-teal-600" size={28} />
              ) : (
                <ToggleLeft className="text-slate-300" size={28} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
