import { useState, useEffect, useMemo } from "react";
import { CartItem } from "../types";

export const useCartSelection = (cart: CartItem[], isOpen: boolean) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Default: Pilih semua saat dibuka
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      setSelectedIds(new Set(cart.map((item) => item.id)));
    }
  }, [isOpen, cart.length]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cart.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map((item) => item.id)));
  };

  const stats = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      return selectedIds.has(item.id) ? sum + item.price * item.quantity : sum;
    }, 0);

    const count = cart.reduce((sum, item) => {
      return selectedIds.has(item.id) ? sum + item.quantity : sum;
    }, 0);

    return { totalPrice: total, totalSelectedItems: count };
  }, [cart, selectedIds]);

  return { selectedIds, toggleSelection, toggleSelectAll, ...stats };
};