"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // unique item id in cart (productId + weight/unit variation)
  productId: string;
  nameAr: string;
  unit: string;
  unitPrice: number;
  price: number; // total price for this unit selection
  quantity: number;
  isWeighted: boolean;
  weightGrams?: number;
  image?: string | null;
  categoryName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: any, variation?: { type: "fraction" | "grams" | "amount" | "unit"; value: number | string; label?: string; price: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vinissia_cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vinissia_cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (
    product: any,
    variation?: { type: "fraction" | "grams" | "amount" | "unit"; value: number | string; label?: string; price: number }
  ) => {
    setItems((prev) => {
      let unitLabel = product.unit || "قطعة";
      let itemPrice = product.basePrice;
      let weightGrams: number | undefined = undefined;

      if (variation) {
        itemPrice = variation.price;
        if (variation.label) unitLabel = variation.label;
        if (variation.type === "grams" || variation.type === "fraction") {
          weightGrams = typeof variation.value === "number" ? variation.value : undefined;
        }
      }

      const cartItemId = `${product.id}-${unitLabel}`;
      const existing = prev.find((i) => i.id === cartItemId);

      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        nameAr: product.nameAr,
        unit: unitLabel,
        unitPrice: product.isWeighted ? (product.pricePerKg || product.basePrice) : product.basePrice,
        price: itemPrice,
        quantity: 1,
        isWeighted: Boolean(product.isWeighted),
        weightGrams,
        image: product.image,
        categoryName: product.categoryName,
      };

      return [...prev, newItem];
    });

    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
