import { create } from 'zustand';
import { CartItem, Product, PrintItemConfiguration, Stationery } from '../types';

interface CartState {
  stationery: Stationery | null;
  items: CartItem[];
  addItem: (item: CartItem, stationery: Stationery) => void;
  addProduct: (product: Product, quantity: number, stationery: Stationery) => void;
  addPrintJob: (config: PrintItemConfiguration, stationery: Stationery) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getPrintingCost: () => number;
  getProductCost: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  stationery: null,
  items: [],

  addItem: (item, stationery) => {
    set((state) => {
      // If adding from a different stationery shop, reset cart to new stationery
      const currentStationeryId = state.stationery?.id;
      const isDifferentShop = currentStationeryId && currentStationeryId !== stationery.id;
      const baseItems = isDifferentShop ? [] : [...state.items];

      const existingIndex = baseItems.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        baseItems[existingIndex].quantity += item.quantity;
        baseItems[existingIndex].totalPrice =
          baseItems[existingIndex].unitPrice * baseItems[existingIndex].quantity;
      } else {
        baseItems.push(item);
      }

      return {
        stationery,
        items: baseItems,
      };
    });
  },

  addProduct: (product, quantity, stationery) => {
    const item: CartItem = {
      id: `prod-${product.id}`,
      type: 'PRODUCT',
      title: product.name,
      unitPrice: product.price,
      quantity,
      totalPrice: product.price * quantity,
      product,
    };
    get().addItem(item, stationery);
  },

  addPrintJob: (config, stationery) => {
    const item: CartItem = {
      id: `print-${config.documentId}`,
      type: 'PRINTING',
      title: `Print: ${config.fileName} (${config.copies} copies, ${config.paperSize}, ${config.colorOption === 'COLOR' ? 'Color' : 'B&W'})`,
      unitPrice: config.estimatedPrice / config.copies,
      quantity: config.copies,
      totalPrice: config.estimatedPrice,
      printConfig: config,
    };
    get().addItem(item, stationery);
  },

  removeItem: (itemId) => {
    set((state) => {
      const updated = state.items.filter((i) => i.id !== itemId);
      return {
        items: updated,
        stationery: updated.length === 0 ? null : state.stationery,
      };
    });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        }
        return item;
      });
      return { items: updated };
    });
  },

  clearCart: () => {
    set({ items: [], stationery: null });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getPrintingCost: () => {
    return get()
      .items.filter((i) => i.type === 'PRINTING')
      .reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getProductCost: () => {
    return get()
      .items.filter((i) => i.type === 'PRODUCT')
      .reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
