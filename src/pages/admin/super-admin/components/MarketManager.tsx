import React, { useState, useRef } from "react";
import { MarketList } from "./MarketList";
import { MarketEditor } from "./MarketEditor";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

interface Props {
  markets: any[];
  theme: any;
  darkMode: boolean;
  isLoaded: boolean;
  refreshData: () => void;
  setAuditMarket: (market: any) => void;
}

const DEFAULT_CENTER = { lat: -7.96662, lng: 112.63266 };

export const MarketManager: React.FC<Props> = ({
  markets,
  isLoaded,
  refreshData,
  setAuditMarket,
}) => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  const [marketForm, setMarketForm] = useState({
    name: "",
    region_name: "",
    district: "",
    city: "",
    address: "",
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const switchToEditor = (isEdit = false, data: any = null) => {
    if (isEdit && data) {
      setEditingId(data.id);
      const loc = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
      setMarketForm({ ...data, ...loc });
      setMapCenter(loc);
    } else {
      setEditingId(null);
      setMarketForm({
        name: "",
        region_name: "",
        district: "",
        city: "",
        address: "",
        ...DEFAULT_CENTER,
      });
      setMapCenter(DEFAULT_CENTER);
    }
    setViewMode("editor");
  };

  const handleSave = async () => {
    if (!marketForm.name || !marketForm.district)
      return showToast("Nama & Kecamatan wajib!", "error");
    setLoading(true);
    try {
      if (editingId) {
        await supabase.from("markets").update(marketForm).eq("id", editingId);
      } else {
        await supabase
          .from("markets")
          .insert([{ ...marketForm, is_active: true }]);
      }
      showToast("Berhasil disimpan", "success");
      refreshData();
      setViewMode("list");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus wilayah ${name.toUpperCase()}?`)) {
      await supabase.from("markets").delete().eq("id", id);
      refreshData();
    }
  };

  return (
    <>
      {viewMode === "list" ? (
        <MarketList
          markets={markets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAdd={() => switchToEditor(false)}
          onEdit={(m) => switchToEditor(true, m)}
          onDelete={handleDelete}
          onAudit={setAuditMarket}
          onRefresh={refreshData}
        />
      ) : (
        <MarketEditor
          isLoaded={isLoaded}
          editingId={editingId}
          marketForm={marketForm}
          setMarketForm={setMarketForm}
          mapCenter={mapCenter}
          isDragging={isDragging}
          loading={loading}
          autocompleteRef={autocompleteRef}
          mapRef={mapRef}
          onMapIdle={() => {
            if (mapRef.current) {
              const c = mapRef.current.getCenter();
              if (c)
                setMarketForm((p) => ({ ...p, lat: c.lat(), lng: c.lng() }));
              setIsDragging(false);
            }
          }}
          onDragStart={() => setIsDragging(true)}
          onPlaceChanged={() => {
            if (autocompleteRef.current) {
              const p = autocompleteRef.current.getPlace();
              if (p.geometry?.location) {
                const loc = {
                  lat: p.geometry.location.lat(),
                  lng: p.geometry.location.lng(),
                };
                setMapCenter(loc);
                setMarketForm((prev) => ({
                  ...prev,
                  address: p.formatted_address || prev.address,
                }));
              }
            }
          }}
          onSave={handleSave}
          onBack={() => setViewMode("list")}
        />
      )}
    </>
  );
};
