import React, { useState } from "react";
// ✅ FIX 2307: Jalur import mundur 2 langkah (../../)
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Search,
  Package,
  Store,
  Loader2,
  Filter,
  ArrowRight,
} from "lucide-react";

// ✅ Interface Props menerima data matang dari Dashboard Admin Lokal
interface Props {
  products: any[];
  onAction: () => void;
}

export const AdminProductVerification: React.FC<Props> = ({
  products,
  onAction,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    productId: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    setProcessingId(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);

      if (error) throw error;

      showToast(
        `Produk berhasil ${newStatus === "APPROVED" ? "Disetujui" : "Ditolak"}`,
        "success",
      );
      onAction(); // Refresh data dashboard
    } catch (err: any) {
      showToast("Gagal update: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter Lokal (Hanya Pencarian, data sudah difilter market_id di Dashboard)
  const filteredData = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchants?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & SEARCH (SHARP STYLE) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-none border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 text-slate-800">
          <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center rounded-none">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight leading-none">
              Antrian Verifikasi
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {filteredData.length} Produk Menunggu
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="CARI NAMA BARANG / TOKO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-[10px] font-black uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* GRID PRODUK */}
      {filteredData.length === 0 ? (
        <div className="py-24 text-center bg-white border border-dashed border-slate-300 rounded-none">
          <div className="w-16 h-16 bg-slate-50 mx-auto flex items-center justify-center text-slate-300 mb-4 rounded-full">
            <CheckCircle size={32} />
          </div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
            Tidak ada antrian produk saat ini
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 hover:border-slate-800 transition-all group rounded-none flex flex-col"
            >
              {/* IMAGE AREA */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden border-b border-slate-100">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-0 left-0 bg-orange-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                  PENDING
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/80 to-transparent">
                  <p className="text-white text-[9px] font-bold uppercase flex items-center gap-1 tracking-wide">
                    <Store size={10} className="text-orange-400" />{" "}
                    {p.merchants?.shop_name || "Toko Tidak Diketahui"}
                  </p>
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[7px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 py-0.5">
                      {p.categories?.name || "UMUM"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Stok: {p.stock} {p.unit}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug line-clamp-2 min-h-[2.5em]">
                    {p.name}
                  </h3>
                  <p className="text-sm font-black text-teal-600 mt-2 tracking-tighter italic">
                    Rp {p.price.toLocaleString()}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 border-l-2 border-slate-300">
                    <p className="text-[8px] text-slate-500 line-clamp-2 leading-relaxed italic">
                      "{p.description || "Tidak ada deskripsi."}"
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 pt-5 mt-2 border-t border-slate-100">
                  <button
                    disabled={processingId === p.id}
                    onClick={() => handleUpdateStatus(p.id, "REJECTED")}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 rounded-none text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {processingId === p.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Tolak
                  </button>
                  <button
                    disabled={processingId === p.id}
                    onClick={() => handleUpdateStatus(p.id, "APPROVED")}
                    className="flex-[2] py-3 bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {processingId === p.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Setujui & Rilis
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
