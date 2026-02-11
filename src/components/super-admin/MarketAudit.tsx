import React, { useState } from "react";
import { ArrowLeft, Shield, Store, Truck, Users, Eye } from "lucide-react";
import { TabAudit } from "./SharedUI";

export const MarketAuditFullView = ({
  market,
  allUsers,
  theme,
  onViewUser,
}: any) => {
  const [subTab, setSubTab] = useState<
    "ADMIN" | "MERCHANT" | "COURIER" | "BUYER"
  >("ADMIN");
  const filtered = allUsers.filter(
    (u: any) => u.managed_market_id === market.id,
  );
  const activeList =
    subTab === "ADMIN"
      ? filtered.filter((u: any) => u.role.includes("ADMIN"))
      : subTab === "MERCHANT"
        ? filtered.filter((u: any) => u.role === "MERCHANT")
        : subTab === "COURIER"
          ? filtered.filter((u: any) => u.role === "COURIER")
          : filtered.filter((u: any) => u.role === "CUSTOMER");

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <TabAudit
          label="Admin Wilayah"
          icon={<Shield />}
          count={filtered.filter((u: any) => u.role.includes("ADMIN")).length}
          active={subTab === "ADMIN"}
          onClick={() => setSubTab("ADMIN")}
        />
        <TabAudit
          label="Merchant / Toko"
          icon={<Store />}
          count={filtered.filter((u: any) => u.role === "MERCHANT").length}
          active={subTab === "MERCHANT"}
          onClick={() => setSubTab("MERCHANT")}
        />
        <TabAudit
          label="Kurir Pasar"
          icon={<Truck />}
          count={filtered.filter((u: any) => u.role === "COURIER").length}
          active={subTab === "COURIER"}
          onClick={() => setSubTab("COURIER")}
        />
        <TabAudit
          label="Warga / Pembeli"
          icon={<Users />}
          count={filtered.filter((u: any) => u.role === "CUSTOMER").length}
          active={subTab === "BUYER"}
          onClick={() => setSubTab("BUYER")}
        />
      </div>
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
            Database {subTab}
          </h3>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black">
            Data: {activeList.length}
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[65vh]">
          {activeList.map((u: any) => (
            <div
              key={u.id}
              className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                  {u.name[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase text-sm">
                    {u.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {u.email}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-black mt-1">
                    {u.phone_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onViewUser(u)}
                className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Eye size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
