import React, { useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { SearchCode } from "lucide-react";

// Style Map
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1.5rem",
};
const centerDefault = { lat: -0.7893, lng: 113.9213 };
const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
];

interface Props {
  isLoaded: boolean;
  markets: any[];
  darkMode: boolean;
  theme: any;
  setAuditMarket: (market: any) => void;
}

export const DashboardOverview: React.FC<Props> = ({
  isLoaded,
  markets,
  darkMode,
  theme,
  setAuditMarket,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  return (
    <div className="animate-in fade-in">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
          Peta Sebaran
        </h1>
        <p
          className={`font-bold text-xs uppercase tracking-widest ${theme.subText}`}
        >
          Monitoring Nasional
        </p>
      </header>

      <div className="h-[70vh] rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-700">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={centerDefault}
            zoom={5}
            options={{ styles: darkMode ? mapDarkStyle : [] }}
          >
            {markets.map((m) => (
              <Marker
                key={m.id}
                position={{ lat: m.lat, lng: m.lng }}
                onClick={() => setSelectedMarker(m)}
              />
            ))}
            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-4 text-slate-900 min-w-[200px]">
                  <h3 className="font-black text-sm uppercase mb-1">
                    {selectedMarker.name}
                  </h3>
                  <button
                    onClick={() => setAuditMarket(selectedMarker)}
                    className="w-full py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <SearchCode size={12} /> Audit Wilayah
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 font-bold">
            Memuat Peta...
          </div>
        )}
      </div>
    </div>
  );
};
