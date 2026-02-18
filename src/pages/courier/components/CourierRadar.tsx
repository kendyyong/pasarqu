import React from "react";
import { CourierActiveOrder } from "./CourierActiveOrder";
import { CourierBidArea } from "./CourierBidArea";

interface Props {
  activeOrder: any;
  isOnline: boolean;
  currentCoords: { lat: number; lng: number } | null;
  onRefresh: () => void;
}

export const CourierRadar: React.FC<Props> = ({
  activeOrder,
  isOnline,
  currentCoords,
  onRefresh,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
        Radar Driver
      </h1>

      {activeOrder ? (
        <CourierActiveOrder order={activeOrder} onFinished={onRefresh} />
      ) : (
        <CourierBidArea
          isOnline={isOnline}
          currentCoords={currentCoords}
          onOrderAccepted={onRefresh}
        />
      )}
    </div>
  );
};
