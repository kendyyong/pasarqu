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
    // Dihapus <h1>Radar Driver</h1> agar tampilan atas lebih lega
    <div className="animate-in fade-in w-full space-y-4">
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
