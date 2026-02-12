import React, { useState } from "react";
import {
  Star,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Search,
} from "lucide-react";

interface Props {
  merchants: any[];
  couriers: any[];
}

export const LocalRatingsTab: React.FC<Props> = ({ merchants, couriers }) => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Kontrol Kualitas & Rating
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Pantau performa dan legalitas mitra wilayah
          </p>
        </div>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="CARI NAMA MITRA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-teal-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. VERIFIKASI DOKUMEN (KYC) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal-600" /> Status Legalitas
            Mitra
          </h4>
          <div className="space-y-4">
            {merchants.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <FileText size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase leading-none">
                      {m.shop_name || m.full_name}
                    </p>
                    <p className="text-[9px] font-bold text-teal-600 uppercase mt-1">
                      KTP TERVERIFIKASI
                    </p>
                  </div>
                </div>
                <button className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-all">
                  Lihat Dokumen
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. RATING & REVIEW LIVE */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Star size={18} className="text-orange-500" /> Kepuasan Pelanggan
          </h4>
          <div className="space-y-6">
            {couriers.slice(0, 3).map((c, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-black text-xs">
                      {c.full_name?.charAt(0)}
                    </div>
                    <span className="text-[11px] font-black text-slate-700 uppercase">
                      {c.full_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        className="fill-orange-400 text-orange-400"
                      />
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 italic">
                  <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                    "Kurirnya ramah banget, sayurannya masih segar pas nyampe.
                    Makasih Pasarqu!"
                  </p>
                  <p className="text-[8px] font-black text-orange-400 uppercase mt-2">
                    — Member @{i + 1}23
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MITRA BERMASALAH (WARNING SYSTEM) */}
      <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-1">
              Peringatan Kualitas Wilayah
            </h4>
            <p className="text-[10px] text-red-600 font-bold uppercase leading-relaxed">
              Ada 2 Mitra Kurir dengan rating di bawah 3.0. Segera lakukan
              peninjauan atau suspend sementara.
            </p>
          </div>
        </div>
        <button className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all">
          Tinjau Performa
        </button>
      </div>
    </div>
  );
};
