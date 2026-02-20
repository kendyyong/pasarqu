import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Wallet,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Search,
  Store,
  Truck,
  PlusSquare,
  Building2,
  MapPin,
  Layers,
  Download,
} from "lucide-react";
import { generateOfficialPDF } from "../../../../utils/pdfGenerator";

export const FinancialLedger = () => {
  const [activeTab, setActiveTab] = useState<
    "SEMUA" | "TOKO" | "KURIR" | "EKSTRA" | "PASARQU" | "TOPUP"
  >("SEMUA");
  const [selectedDistrict, setSelectedDistrict] = useState("SEMUA KECAMATAN");
  const [districts, setDistricts] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0,
    total_merchant_share: 0,
    total_courier_share: 0,
    total_extra_kurir: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, marketRes] = await Promise.all([
        supabase
          .from("orders")
          .select(`*, profiles:customer_id(name), markets(district)`)
          .order("created_at", { ascending: false }),
        supabase.from("markets").select("district"),
      ]);

      if (orderRes.error) throw orderRes.error;

      const uniqueDistricts = Array.from(
        new Set(marketRes.data?.map((m: any) => m.district).filter(Boolean)),
      );
      setDistricts(["SEMUA KECAMATAN", ...(uniqueDistricts as string[])]);

      let mShare = 0,
        cShare = 0,
        aShare = 0,
        eShare = 0;
      orderRes.data?.forEach((o) => {
        mShare += Number(o.merchant_earning_total || 0);
        cShare += Number(o.courier_earning_pure || 0);
        eShare += Number(o.courier_earning_extra || 0);
        aShare += Number(o.app_earning_total || 0);
      });

      const { data: courierStats } = await supabase.rpc(
        "get_courier_balance_sum",
      );

      setOrders(orderRes.data || []);
      setStats({
        total_courier_balance: courierStats || 0,
        total_revenue: aShare,
        total_merchant_share: mShare,
        total_courier_share: cShare + eShare,
        total_extra_kurir: eShare,
      });
    } catch (err: any) {
      setErrorMessage("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredData = () => {
    return orders.filter((o) => {
      const matchSearch =
        (o.profiles?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDistrict =
        selectedDistrict === "SEMUA KECAMATAN" ||
        o.markets?.district === selectedDistrict;

      if (!matchSearch || !matchDistrict) return false;

      if (activeTab === "SEMUA") return true;
      if (activeTab === "TOKO") return Number(o.merchant_earning_total) > 0;
      if (activeTab === "KURIR") return Number(o.courier_earning_pure) > 0;
      if (activeTab === "EKSTRA") return Number(o.courier_earning_extra) > 0;
      if (activeTab === "PASARQU") return Number(o.app_earning_total) > 0;
      if (activeTab === "TOPUP") return o.order_type === "TOPUP"; // Filter khusus Topup

      return true;
    });
  };

  const displayData = getFilteredData();

  const handleDownloadPDF = async () => {
    const headers = [
      ["NO", "ORDER ID", "CUSTOMER", "KECAMATAN", "ITEM AUDIT", "NOMINAL"],
    ];
    const rows = displayData.map((o, i) => {
      let nominal = 0;
      if (activeTab === "TOKO") nominal = o.merchant_earning_total;
      else if (activeTab === "KURIR") nominal = o.courier_earning_pure;
      else if (activeTab === "EKSTRA") nominal = o.courier_earning_extra;
      else if (activeTab === "PASARQU") nominal = o.app_earning_total;
      else nominal = o.total_price;

      return [
        i + 1,
        o.id.slice(0, 8).toUpperCase(),
        (o.profiles?.name || "GUEST").toUpperCase(),
        (o.markets?.district || "-").toUpperCase(),
        activeTab === "TOPUP" ? "TOPUP KURIR" : activeTab,
        `Rp ${nominal.toLocaleString()}`,
      ];
    });

    await generateOfficialPDF(
      `LAPORAN BUKU BESAR - ${activeTab === "TOPUP" ? "TOPUP KURIR" : activeTab}`,
      `PERIODE AUDIT WILAYAH: ${selectedDistrict}`,
      headers,
      rows,
      `BUKU_BESAR_${activeTab}_${selectedDistrict}`,
    );
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500 text-left pb-10 font-black uppercase tracking-tighter">
      {/* 1. FILTER HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-[18px] font-black text-slate-900 tracking-tighter leading-none">
            BUKU BESAR
          </h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase">
            DISTRIK: {selectedDistrict}
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6600]"
              size={14}
            />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-9 pr-4 rounded-md text-[12px] font-black outline-none focus:border-[#008080] appearance-none cursor-pointer"
            >
              {districts.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            className="p-3 bg-slate-50 rounded-md border border-slate-200 hover:text-[#008080] transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* 2. TAB KATEGORI */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { id: "SEMUA", label: "SEMUA", icon: Layers },
          { id: "TOKO", label: "TOKO", icon: Store },
          { id: "KURIR", label: "KURIR", icon: Truck },
          { id: "EKSTRA", label: "EKSTRA", icon: PlusSquare },
          { id: "PASARQU", label: "PASARQU", icon: Building2 },
          { id: "TOPUP", label: "TOPUP KURIR", icon: Wallet }, // 🚩 NAMA DIGANTI DISINI
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all ${activeTab === tab.id ? "bg-[#008080] text-white border-[#008080] shadow-md" : "bg-white text-slate-400 border-slate-100"}`}
          >
            <tab.icon size={18} className="mb-1" />
            <span className="text-[10px] font-black">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. TABEL & DOWNLOAD */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-3">
          <div className="relative flex-1 md:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 py-2.5 pl-9 pr-4 rounded-md text-[11px] font-black outline-none focus:border-[#008080]"
            />
          </div>

          <div className="flex gap-2">
            <div className="text-right mr-2">
              <p className="text-[8px] text-slate-400 leading-none mb-1 uppercase">
                TOTAL {activeTab === "TOPUP" ? "TOPUP KURIR" : activeTab}
              </p>
              <p className="text-[14px] font-black text-[#008080]">
                RP{" "}
                {displayData
                  .reduce((acc, curr) => {
                    if (activeTab === "TOKO")
                      return acc + (curr.merchant_earning_total || 0);
                    if (activeTab === "KURIR")
                      return acc + (curr.courier_earning_pure || 0);
                    if (activeTab === "EKSTRA")
                      return acc + (curr.courier_earning_extra || 0);
                    if (activeTab === "PASARQU")
                      return acc + (curr.app_earning_total || 0);
                    return acc + (curr.total_price || 0);
                  }, 0)
                  .toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="bg-[#FF6600] text-white px-4 py-2 rounded-md flex items-center gap-2 text-[11px] font-black hover:bg-slate-900 transition-all shadow-md shrink-0"
            >
              <Download size={16} /> DOWNLOAD PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-[12px]">
            <thead className="bg-slate-50 text-[10px] border-b border-slate-100 text-slate-400 uppercase font-black">
              <tr>
                <th className="p-3 text-left">DETAIL TRANSAKSI</th>
                {activeTab === "SEMUA" ? (
                  <>
                    <th className="p-3 text-right text-blue-600">TOKO</th>
                    <th className="p-3 text-right text-[#FF6600]">KURIR</th>
                    <th className="p-3 text-right text-[#008080]">PASARQU</th>
                  </>
                ) : (
                  <th className="p-3 text-left">PENGGUNA</th>
                )}
                <th className="p-3 text-right text-slate-900">NOMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayData.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-slate-50 transition-all font-black"
                >
                  <td className="p-3">
                    <p className="text-[10px] text-slate-400 font-sans tracking-normal leading-none">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[12px] text-slate-900 my-0.5 leading-tight">
                      {o.profiles?.name || "GUEST CUSTOMER"}
                    </p>
                    <p className="text-[9px] text-[#FF6600] tracking-wider uppercase font-bold">
                      {o.markets?.district || "WILAYAH"}
                    </p>
                  </td>
                  {activeTab === "SEMUA" ? (
                    <>
                      <td className="p-3 text-right text-blue-600">
                        {(o.merchant_earning_total || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-[#FF6600]">
                        {(o.courier_earning_pure || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-[#008080]">
                        {(o.app_earning_total || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-900 font-bold font-sans">
                        {(o.total_price || 0).toLocaleString()}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-slate-400 text-[10px] uppercase">
                        Terverifikasi
                      </td>
                      <td className="p-3 text-right text-[14px] font-sans">
                        {activeTab === "TOKO" && (
                          <span className="text-blue-600">
                            RP{" "}
                            {(o.merchant_earning_total || 0).toLocaleString()}
                          </span>
                        )}
                        {activeTab === "KURIR" && (
                          <span className="text-[#FF6600]">
                            RP {(o.courier_earning_pure || 0).toLocaleString()}
                          </span>
                        )}
                        {activeTab === "EKSTRA" && (
                          <span className="text-orange-800">
                            RP {(o.courier_earning_extra || 0).toLocaleString()}
                          </span>
                        )}
                        {activeTab === "PASARQU" && (
                          <span className="text-[#008080]">
                            RP {(o.app_earning_total || 0).toLocaleString()}
                          </span>
                        )}
                        {activeTab === "TOPUP" && (
                          <span className="text-slate-900">
                            RP {(o.total_price || 0).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
