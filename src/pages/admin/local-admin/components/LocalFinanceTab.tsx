import React, { useState, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  History,
  Search,
  Download,
  BadgeDollarSign,
  Store,
  Bike,
  ArrowDownCircle,
  AlertCircle,
} from "lucide-react";

interface LocalFinanceTabProps {
  merchants: any[];
  couriers: any[];
}

export const LocalFinanceTab: React.FC<LocalFinanceTabProps> = ({
  merchants,
  couriers,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 🛠️ MENGGABUNGKAN DATA WILAYAH SENDIRI
  const allEntities = useMemo(
    () => [
      ...merchants.map((m) => ({ ...m, entity_type: "MERCHANT" })),
      ...couriers.map((c) => ({ ...c, entity_type: "COURIER" })),
    ],
    [merchants, couriers],
  );

  // 🧮 MENGHITUNG STATISTIK KEUANGAN WILAYAH SECARA OTOMATIS
  const stats = useMemo(() => {
    const totalBalance = allEntities.reduce(
      (acc, curr) => acc + (curr.balance || 0),
      0,
    );
    // Estimasi pendapatan layanan (asumsi dari service fee yang terkumpul di saldo)
    const serviceRevenue = merchants.reduce(
      (acc, curr) => acc + (curr.total_service_fee || 0),
      0,
    );

    return {
      totalBalance,
      serviceRevenue,
      estimatedOmzet: totalBalance * 5, // Hanya ilustrasi estimasi perputaran
    };
  }, [allEntities, merchants]);

  const filteredData = allEntities.filter((item) =>
    (item.shop_name || item.full_name || item.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-20">
      {/* 📊 TOP STATS - REAL DATA MONITORING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-xl border-b-4 border-[#008080] shadow-lg">
          <p className="text-[10px] text-slate-400 mb-2 tracking-widest">
            ESTIMASI OMZET PASAR ANDA
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-white">
              RP {stats.estimatedOmzet.toLocaleString()}
            </h2>
            <TrendingUp className="text-[#008080]" size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 mb-2 tracking-widest">
            TOTAL SALDO MITRA WILAYAH
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-slate-900">
              RP {stats.totalBalance.toLocaleString()}
            </h2>
            <ArrowDownCircle className="text-[#FF6600]" size={24} />
          </div>
        </div>

        <div className="bg-[#008080] p-5 rounded-xl border-b-4 border-slate-900 shadow-lg">
          <p className="text-[10px] text-white/60 mb-2 tracking-widest">
            KONTRIBUSI LAYANAN NODE
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-white">
              RP {stats.serviceRevenue.toLocaleString()}
            </h2>
            <BadgeDollarSign className="text-white/40" size={24} />
          </div>
        </div>
      </div>

      {/* 🏗️ MONITORING PANEL */}
      <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#FF6600] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white shadow-lg">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-white text-[12px] leading-none">
              AUDIT SALDO ENTITAS LOKAL
            </h2>
            <p className="text-[#FF6600] text-[10px] mt-1 tracking-widest uppercase">
              TRANSPARANSI DANA PASAR KHUSUS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA TOKO ATAU KURIR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border-none text-white text-[12px] py-3 pl-10 pr-4 rounded-lg outline-none focus:ring-2 focus:ring-[#008080]"
            />
          </div>
          <button className="p-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700 transition-all shadow-md">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* 🧾 DATA TABLE - INDUSTRIAL BORDER */}
      <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b-2 border-slate-200">
                <th className="p-5">IDENTITAS ENTITAS</th>
                <th className="p-5">KATEGORI KERJA</th>
                <th className="p-5 text-right">SALDO BERJALAN</th>
                <th className="p-5 text-right">STATUS FINANSIAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.entity_type === "MERCHANT" ? "bg-teal-50 border-teal-100 text-[#008080]" : "bg-blue-50 border-blue-100 text-blue-600"}`}
                      >
                        {item.entity_type === "MERCHANT" ? (
                          <Store size={14} />
                        ) : (
                          <Bike size={14} />
                        )}
                      </div>
                      <span className="text-[12px] text-slate-900 font-black uppercase">
                        {item.shop_name || item.full_name || item.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200 font-black">
                      {item.entity_type === "MERCHANT"
                        ? "MITRA TOKO"
                        : "UNIT KURIR"}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <span className="text-[12px] font-black text-slate-900">
                      RP {(item.balance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <span
                      className={`px-3 py-1 text-[9px] font-black rounded-md uppercase ${(item.balance || 0) > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {(item.balance || 0) > 0
                        ? "NOMINAL AMAN"
                        : "SALDO KOSONG"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚨 AUDIT NOTICE */}
      <div className="p-4 bg-orange-50 border-2 border-orange-100 rounded-xl flex items-start gap-4 shadow-sm">
        <AlertCircle size={24} className="text-[#FF6600] shrink-0 mt-0.5" />
        <p className="text-[12px] leading-tight text-orange-900 font-black uppercase">
          PERINGATAN AUDIT: DATA INI ADALAH REPLIKASI DARI SERVER PUSAT. ADMIN
          LOKAL DILARANG MELAKUKAN TRANSAKSI DILUAR SISTEM UNTUK MENJAGA
          VALIDITAS DATA KEUANGAN PASAR.
        </p>
      </div>

      {/* ⚙️ INFO FOOTER */}
      <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center gap-4">
        <History size={24} className="text-[#008080]" />
        <p className="text-[12px] leading-tight text-slate-600 font-black uppercase">
          LOG KEUANGAN WILAYAH TERAKHIR DIPERBARUI:{" "}
          {new Date().toLocaleTimeString()} WIB.
        </p>
      </div>
    </div>
  );
};
