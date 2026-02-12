import React, { useState } from "react";
import {
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export const LocalResolutionTab = () => {
  const [filter, setFilter] = useState("PENDING");

  // Data Dummy untuk visualisasi Pro
  const complaints = [
    {
      id: "RES-001",
      customer: "Budi Santoso",
      merchant: "Toko Sayur Segar",
      issue: "Barang busuk saat sampai",
      amount: "Rp 45.000",
      status: "PENDING",
      date: "12 Feb 2026",
    },
    {
      id: "RES-002",
      customer: "Siti Aminah",
      merchant: "Ayam Potong Pak Kumis",
      issue: "Kurir belum sampai setelah 2 jam",
      amount: "Rp 120.000",
      status: "IN_PROGRESS",
      date: "11 Feb 2026",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Pusat Resolusi Wilayah
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Selesaikan sengketa transaksi antara pembeli dan mitra
          </p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {["PENDING", "IN_PROGRESS", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* COMPLAINT LIST */}
      <div className="grid grid-cols-1 gap-4">
        {complaints.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-slate-300" size={32} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Semua aman! Tidak ada komplain aktif.
            </p>
          </div>
        ) : (
          complaints.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black rounded-lg uppercase tracking-widest">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {item.date}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-tight uppercase group-hover:text-teal-600 transition-colors">
                      {item.issue}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
                      <span className="text-slate-900">{item.customer}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                      <span className="text-teal-600">{item.merchant}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">
                        Nilai Transaksi
                      </p>
                      <p className="text-xs font-black text-slate-800">
                        {item.amount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-3">
                  <button className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2">
                    <MessageSquare size={14} /> Tangani
                  </button>
                  <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Detail Order
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PRO TIP CARD */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-center gap-6">
        <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center shrink-0">
          <ShieldAlert className="text-orange-400" size={32} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest mb-1">
            Kebijakan Penengah Wilayah
          </h4>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
            Sebagai Admin Lokal, Anda memiliki otoritas untuk membekukan
            sementara dana transaksi jika terjadi sengketa demi menjaga
            kepercayaan pelanggan.
          </p>
        </div>
      </div>
    </div>
  );
};
