import React from "react";
import { CourierActiveOrder } from "./CourierActiveOrder";
import { CourierBidArea } from "./CourierBidArea";

interface Props {
  activeOrder: any;
  isOnline: boolean;
  currentCoords: { lat: number; lng: number } | null;
  onRefresh: () => void;
  acceptOrder: (orderId: string) => void; // 🚀 TAMBAHKAN INI SEBAGAI JALUR
}

export const CourierRadar: React.FC<Props> = ({
  activeOrder,
  isOnline,
  currentCoords,
  onRefresh,
  acceptOrder, // 🚀 TERIMA FUNGSINYA DI SINI
}) => {
  return (
    <div className="animate-in fade-in w-full space-y-4">
      {activeOrder ? (
        <CourierActiveOrder order={activeOrder} onFinished={onRefresh} />
      ) : (
        <CourierBidArea
          isOnline={isOnline}
          currentCoords={currentCoords}
          onOrderAccepted={onRefresh}
          acceptOrder={acceptOrder} // 🚀 LEMPAR KE TOMBOL DI BID AREA
        />
      )}
    </div>
  );
};
