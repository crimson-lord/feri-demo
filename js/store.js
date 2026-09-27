// simple state container saved in localStorage

const Store = (() => {
  const STORAGE_KEY = 'feri_remade_store_v1';

  const defaultState = {
    cart: [
      { productId: 'p86', qty: 1, addedAt: Date.now() - 3600000 }, // Fortune Sunlite Oil
      { productId: 'p11', qty: 1, addedAt: Date.now() - 1800000 }  // Amul Butter
    ],
    wishlist: ['p60', 'p54'],
    activeAddressId: 1,
    activeStoreId: 'store-1',
    viewMode: 'responsive', // 'responsive' | 'mobile-frame'
    appliedCoupon: '',
    user: {
      name: 'Demo User',
      phone: '+91 98765 43210',
      email: 'demo.user@example.in',
      addresses: [
        {
          id: 1,
          type: 'Home',
          label: 'Primary Residence',
          addressLine: 'Flat 402, Royal Palms, Green Park Extension',
          city: 'New Delhi',
          pincode: '110016',
          isDefault: true
        },
        {
          id: 2,
          type: 'Work',
          label: 'Office HQ',
          addressLine: 'Tower B, 6th Floor, Cyber City, DLF Phase 2',
          city: 'Gurugram',
          pincode: '122002',
          isDefault: false
        }
      ],
      // pay later credit balance
      credit: {
        totalLimit: 5000,
        available: 3750,
        used: 1250,
        dueDate: '05 Nov 2026',
        lenderPartner: 'FairPaisa Finance Ltd (RBI Reg. NBFC-ND)',
        interestApr: '0% for 15-day billing cycle'
      }
    },
    stores: [
      {
        id: 'store-1',
        name: 'New Shree Kirana & Provisions',
        address: 'Main Market, Green Park, New Delhi',
        distance: '0.8 km',
        eta: '10-12 mins',
        rating: 4.8,
        isOpen: true,
        fssaiNumber: '13320005000189'
      },
      {
        id: 'store-2',
        name: 'Bharat Super Daily Mart',
        address: 'Hauz Khas Enclave, New Delhi',
        distance: '1.6 km',
        eta: '15-18 mins',
        rating: 4.7,
        isOpen: true,
        fssaiNumber: '13321008000412'
      },
      {
        id: 'store-3',
        name: 'Gupta Traders Kirana',
        address: 'Malviya Nagar Corner, New Delhi',
        distance: '2.4 km',
        eta: '20-25 mins',
        rating: 4.6,
        isOpen: true,
        fssaiNumber: '13319002000781'
      }
    ],
    orders: [
      {
        id: 'ORD-882194',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        items: [
          { productId: 'p86', qty: 1, price: 135, name: 'Fortune Sunlite Refined Oil 1L' },
          { productId: 'p54', qty: 1, price: 249, name: 'Aashirvaad Atta 5kg' },
          { productId: 'p6',  qty: 2, price: 55,  name: 'Britannia Good Day Butter' }
        ],
        totals: {
          subtotal: 554,
          discount: 60,
          delivery: 0,
          grandTotal: 494
        },
        status: 'Delivered',
        paymentMethod: 'UPI (Google Pay)',
        storeName: 'New Shree Kirana & Provisions'
      }
    ]
  };

  let state = defaultState;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state = {
            ...defaultState,
            ...parsed,
            cart: Array.isArray(parsed.cart) ? parsed.cart : [],
            wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
            orders: Array.isArray(parsed.orders) ? parsed.orders : defaultState.orders
          };
          if (state.user && (state.user.name === 'Priya Sharma' || !state.user.name)) {
            state.user.name = 'Demo User';
            state.user.email = 'demo.user@example.in';
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not load saved state from localStorage', err);
  }

  function emitChange(reason) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {}
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('feri:statechange', { detail: { reason } }));
    }
  }

  return {
    getState: () => state,

    // cart actions
    getItemQty: (productId) => {
      if (!productId || !Array.isArray(state.cart)) return 0;
      const match = state.cart.find(item => item.productId === productId);
      return match ? match.qty : 0;
    },

    addToCart: (productId, qty = 1) => {
      if (!productId || qty <= 0) return;
      if (!Array.isArray(state.cart)) state.cart = [];
      const match = state.cart.find(item => item.productId === productId);
      if (match) {
        match.qty += qty;
      } else {
        state.cart.push({ productId, qty, addedAt: Date.now() });
      }
      emitChange('cart:add');
    },

    updateQty: (productId, qty) => {
      if (!productId) return;
      if (!Array.isArray(state.cart)) state.cart = [];
      const matchIndex = state.cart.findIndex(item => item.productId === productId);
      if (matchIndex > -1) {
        if (qty <= 0) {
          state.cart.splice(matchIndex, 1);
        } else {
          state.cart[matchIndex].qty = qty;
        }
      } else if (qty > 0) {
        state.cart.push({ productId, qty, addedAt: Date.now() });
      }
      emitChange('cart:update');
    },

    removeFromCart: (productId) => {
      if (!productId || !Array.isArray(state.cart)) return;
      state.cart = state.cart.filter(item => item.productId !== productId);
      emitChange('cart:remove');
    },

    clearCart: () => {
      state.cart = [];
      emitChange('cart:clear');
    },

    getCartCount: () => {
      return state.cart.reduce((sum, item) => sum + item.qty, 0);
    },

    getCartItems: () => {
      if (typeof AppData === 'undefined') return [];
      return state.cart.map(c => {
        const product = AppData.getProductById(c.productId);
        return {
          productId: c.productId,
          qty: c.qty,
          product: product || {
            id: c.productId,
            name: 'Grocery Product',
            price: 100,
            mrp: 120,
            unit: '1 pc',
            image: 'images/categories/cat_grocery.svg'
          }
        };
      });
    },

    // cart total and discounts
    getCartTotals: () => {
      const items = Store.getCartItems();
      let mrpTotal = 0;
      let actualTotal = 0;

      items.forEach(({ product, qty }) => {
        mrpTotal += (product.mrp || product.price) * qty;
        actualTotal += product.price * qty;
      });

      const productSavings = mrpTotal - actualTotal;
      const standardDeliveryFee = (items.length > 0 && actualTotal < 199) ? 25 : 0;
      let deliveryFee = standardDeliveryFee;
      let couponSavings = 0;

      if (state.appliedCoupon === 'FERI10') {
        couponSavings = Math.round(actualTotal * 0.1);
      } else if (state.appliedCoupon === 'FREEDEL') {
        if (standardDeliveryFee > 0) {
          couponSavings = standardDeliveryFee;
          deliveryFee = 0;
        } else {
          couponSavings = 0;
          deliveryFee = 0;
        }
      }

      const discountedPrice = Math.max(0, actualTotal - (state.appliedCoupon === 'FERI10' ? couponSavings : 0));
      // free delivery if over 199
      const handlingFee = items.length > 0 ? 4 : 0; // small packing fee
      const grandTotal = items.length > 0 ? (discountedPrice + deliveryFee + handlingFee) : 0;

      return {
        mrpTotal,
        actualTotal,
        productSavings,
        couponSavings,
        deliveryFee,
        handlingFee,
        grandTotal,
        appliedCoupon: state.appliedCoupon,
        itemCount: items.reduce((sum, i) => sum + i.qty, 0)
      };
    },

    applyCoupon: (code) => {
      const clean = (code || '').toUpperCase().trim();
      if (clean === 'FERI10') {
        state.appliedCoupon = clean;
        emitChange('coupon:apply');
        return { success: true, message: 'Coupon FERI10 applied! 10% discount added.' };
      }
      if (clean === 'FREEDEL') {
        const totals = Store.getCartTotals();
        state.appliedCoupon = clean;
        emitChange('coupon:apply');
        if (totals.actualTotal >= 199) {
          return { success: true, message: 'Free delivery active! (Orders over ₹199 already qualify for free delivery)' };
        }
        return { success: true, message: 'Coupon FREEDEL applied! ₹25 delivery fee waived.' };
      }
      return { success: false, message: 'Invalid coupon code. Try FERI10 or FREEDEL' };
    },

    removeCoupon: () => {
      state.appliedCoupon = '';
      emitChange('coupon:remove');
    },

    // wishlist
    isInWishlist: (productId) => {
      if (!productId || !Array.isArray(state.wishlist)) return false;
      return state.wishlist.includes(productId);
    },

    toggleWishlist: (productId) => {
      if (!productId) return false;
      if (!Array.isArray(state.wishlist)) state.wishlist = [];
      const idx = state.wishlist.indexOf(productId);
      let isAdded = false;
      if (idx > -1) {
        state.wishlist.splice(idx, 1);
      } else {
        state.wishlist.push(productId);
        isAdded = true;
      }
      emitChange('wishlist:toggle');
      return isAdded;
    },

    // place order
    placeOrder: (paymentMethod = 'UPI') => {
      const items = Store.getCartItems();
      if (items.length === 0) return null;

      const totals = Store.getCartTotals();
      const currentStore = state.stores.find(s => s.id === state.activeStoreId) || state.stores[0];
      const currentAddress = state.user.addresses.find(a => a.id === state.activeAddressId) || state.user.addresses[0];

      // check credit limit if paying later
      if (paymentMethod === 'Kirana Credit' || paymentMethod === 'Pay Later') {
        if (state.user.credit.available < totals.grandTotal) {
          return {
            error: true,
            message: `Insufficient Kirana Credit balance (Available: ₹${state.user.credit.available}, Order: ₹${totals.grandTotal}). Please choose UPI, Card, or COD.`
          };
        }
        state.user.credit.used += totals.grandTotal;
        state.user.credit.available = Math.max(0, state.user.credit.totalLimit - state.user.credit.used);
      }

      const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString(),
        items: items.map(i => ({
          productId: i.productId,
          qty: i.qty,
          price: i.product.price,
          name: i.product.name,
          image: i.product.image
        })),
        totals,
        status: 'Confirmed - Out for Packing',
        eta: currentStore.eta,
        paymentMethod: paymentMethod,
        storeName: currentStore.name,
        deliveryAddress: currentAddress.addressLine + ', ' + currentAddress.city
      };

      state.orders.unshift(newOrder);
      state.cart = [];
      state.appliedCoupon = '';
      emitChange('order:placed');
      return newOrder;
    },

    repayCredit: (amount) => {
      const payAmt = Math.min(amount || state.user.credit.used, state.user.credit.used);
      if (payAmt <= 0) return { success: false, message: 'No outstanding balance to repay.' };
      state.user.credit.used -= payAmt;
      state.user.credit.available = state.user.credit.totalLimit - state.user.credit.used;
      emitChange('credit:repaid');
      return { success: true, repaid: payAmt, available: state.user.credit.available, message: `Successfully repaid ₹${payAmt}. Available credit: ₹${state.user.credit.available}` };
    },

    // switch between desktop and mobile frame
    setViewMode: (mode) => {
      if (mode === 'responsive' || mode === 'mobile-frame') {
        state.viewMode = mode;
        emitChange('viewmode:change');
      }
    },

    // store and address helpers
    setActiveStore: (storeId) => {
      state.activeStoreId = storeId;
      emitChange('store:change');
    },

    setActiveAddress: (addressId) => {
      state.activeAddressId = addressId;
      emitChange('address:change');
    },

    getActiveStore: () => {
      return state.stores.find(s => s.id === state.activeStoreId) || state.stores[0];
    },

    getActiveAddress: () => {
      return state.user.addresses.find(a => a.id === state.activeAddressId) || state.user.addresses[0];
    }
  };
})();

if (typeof window !== 'undefined') {
  window.Store = Store;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Store;
}
