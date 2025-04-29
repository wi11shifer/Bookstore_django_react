import { createSlice } from '@reduxjs/toolkit';

const itemsSlice = createSlice({
  name: 'items',
  initialState: {
    selectedItems: [],
  },
  reducers: {
    addItem: (state, action) => {
      state.selectedItems.push(action.payload);
    },
    removeItem: (state, action) => {
      state.selectedItems = state.selectedItems.filter(item => item.id !== action.payload);
    },
    updateItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.selectedItems.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.selectedItems = [];
    },
  },
});

export const { addItem, removeItem, updateItemQuantity, clearCart } = itemsSlice.actions;

export default itemsSlice.reducer;