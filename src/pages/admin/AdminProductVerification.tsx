import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Package,
  Store,
  ExternalLink,
  Loader2,
  ChevronRight,
} from "lucide-react";

export const AdminProductVerification: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      // Kita ambil semua produk agar tetap terdata
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          merchants (shop_name),
          categories (name),
          markets (name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      showToast("Gagal mengambil data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

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

      // Update state lokal agar tidak perlu refresh halaman
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)),
      );

      showToast(
        `Produk berhasil ${newStatus === "APPROVED" ? "Disetujui" : "Ditolak"}`,
        "success",
      );
    } catch (err: any) {
      showToast("Gagal update: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter data berdasarkan tab dan pencarian
  const filteredProducts = products.filter((p) => {
    const matchesTab = p.status === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchants?.shop_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-left antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">
              Verifikasi Produk
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Manajemen Persetujuan Etalase Pasar
            </p>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari produk atau toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-teal-500 w-full md:w-64 transition-all"
            />
          </div>
        </div>

        {/* TABS MENU - SUPAYA TETAP TERDATA */}
        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "PENDING" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Clock size={14} /> Perlu Verifikasi
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "APPROVED" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <CheckCircle size={14} /> Telah Disetujui
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "REJECTED" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <XCircle size={14} /> Ditolak
          </button>
        </div>

        {/* DATA GRID */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Tidak ada data di kategori ini
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                {/* IMAGE HEADER */}
                <div className="aspect-video bg-slate-100 relative">
                  <img
                    src={p.image_url}
                    className="w-full h-full object-cover"
                    alt={p.name}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-slate-800 shadow-sm uppercase">
                      {p.categories?.name}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <Store size={12} />
                      <span className="text-[10px] font-bold uppercase">
                        {p.merchants?.shop_name}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Harga
                      </p>
                      <p className="text-xs font-black text-teal-600">
                        Rp {p.price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Pasar
                      </p>
                      <p className="text-xs font-black text-slate-700">
                        {p.markets?.name}
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 flex gap-2">
                    {p.status === "PENDING" ? (
                      <>
                        <button
                          disabled={processingId === p.id}
                          onClick={() => handleUpdateStatus(p.id, "APPROVED")}
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          {processingId === p.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={14} /> Terima
                            </>
                          )}
                        </button>
                        <button
                          disabled={processingId === p.id}
                          onClick={() => handleUpdateStatus(p.id, "REJECTED")}
                          className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      </>
                    ) : (
                      <div
                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${p.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                      >
                        {p.status === "APPROVED" ? (
                          <>
                            <CheckCircle size={14} /> Sudah Disetujui
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Sudah Ditolak
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
