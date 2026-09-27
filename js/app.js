// UI rendering and events

const App = (() => {
  // active filters
  let activeCategory = 'all';
  let activeBrand = 'all';
  let searchQuery = '';

  // setup on load
  function init() {
    // restore saved view mode
    const savedMode = (typeof Store !== 'undefined' && Store.getState().viewMode) || 'responsive';
    switchViewMode(savedMode, true);

    renderHeader();
    renderHeroCarousel();
    renderCategories();
    renderBrands();
    renderProducts();
    renderCartDrawer();
    updateBadges();
    setupEventListeners();
  }

  // event listeners
  function setupEventListeners() {
    // re-render UI whenever state changes
    document.addEventListener('feri:statechange', () => {
      updateBadges();
      renderProducts();
      renderCartDrawer();
      renderHeader();
    });

    // esc key closes any open drawer or modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDrawers();
      }
    });
  }

  // update cart count, subtotal and badge counts
  function updateBadges() {
    const count = Store.getCartCount();
    const totals = Store.getCartTotals(); // cart total and discounts

    // format currency
    const desktopCartCount = document.getElementById('desktopCartCount');
    const desktopCartSubtotal = document.getElementById('desktopCartSubtotal');
    if (desktopCartCount) desktopCartCount.textContent = count;
    if (desktopCartSubtotal) desktopCartSubtotal.textContent = `₹${totals.grandTotal}`;

    // bottom nav badge
    const bnavBadge = document.getElementById('bnavCartBadge');
    if (bnavBadge) {
      bnavBadge.textContent = count;
      bnavBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    // wishlist counter
    const wishlistBadge = document.getElementById('wishlistBadge');
    const wishlistCount = Store.getState().wishlist.length;
    if (wishlistBadge) {
      wishlistBadge.textContent = wishlistCount;
      wishlistBadge.style.display = wishlistCount > 0 ? 'flex' : 'none';
    }
  }

  // update delivery location & store pill in header
  function renderHeader() {
    const store = Store.getActiveStore();
    const address = Store.getActiveAddress();

    const locEl = document.getElementById('deliveryLocationText');
    const storeSubEl = document.getElementById('deliveryStoreSubtext');
    if (locEl) locEl.textContent = `${address.type}: ${address.city}`;
    if (storeSubEl) storeSubEl.textContent = `${store.name} • ${store.eta}`;

    const creditVal = `₹${Store.getState().user.credit.available.toLocaleString('en-IN')}`;
    const creditChip = document.getElementById('creditChipBalance');
    if (creditChip) {
      creditChip.textContent = creditVal;
    }
    const creditStrip = document.getElementById('creditStripBalance');
    if (creditStrip) {
      creditStrip.textContent = `${creditVal} Available`;
    }
  }

  // hero promo slides
  const heroSlides = [
    {
      badge: "SUPER SAVER DAYS",
      title: "Up to 40% Off on Daily Essentials",
      sub: "Fresh atta, premium cooking oils & breakfast staples at lowest prices",
      cta: "Shop Essentials",
      cat: "Groceries & Staples",
      img: "images/products/p86.jpg",
      gradient: "linear-gradient(135deg, #0A58CA 0%, #0043D1 50%, #002B82 100%)"
    },
    {
      badge: "MORNING FRESH",
      title: "Dairy, Butter & Milk by 7 AM",
      sub: "Guaranteed farm-fresh dairy delivered in 10-15 minutes",
      cta: "Explore Dairy",
      cat: "Dairy & Breakfast",
      img: "images/products/p11.jpg",
      gradient: "linear-gradient(135deg, #0C8340 0%, #075E2D 100%)"
    },
    {
      badge: "FMCG BRAND FESTIVAL",
      title: "Flat ₹50 Off on HUL & ITC",
      sub: "Use coupon code FERI10 at checkout on cart value above ₹499",
      cta: "View Brands",
      cat: "all",
      img: "images/products/p54.jpg",
      gradient: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)"
    }
  ];

  let currentSlide = 0;
  function renderHeroCarousel() {
    const wrap = document.getElementById('heroCarouselWrap');
    if (!wrap) return;

    const slide = heroSlides[currentSlide];
    wrap.style.background = slide.gradient;

    wrap.innerHTML = `
      <div class="hero-slide">
        <div class="hero-slide-content">
          <span class="hero-badge-tag"><i class="fas fa-certificate"></i> ${slide.badge}</span>
          <h2 class="hero-title">${slide.title}</h2>
          <p class="hero-subtitle">${slide.sub}</p>
          <button class="hero-cta-btn" onclick="App.filterCategory('${slide.cat}')">
            ${slide.cta} <i class="fas fa-arrow-right"></i>
          </button>
        </div>
        <div class="hero-visual-graphic">
          <img src="${slide.img}" alt="Featured Item" class="hero-thumb-pack" onerror="this.style.display='none'">
        </div>
        <div class="hero-indicators">
          ${heroSlides.map((_, idx) => `
            <div class="hero-dot ${idx === currentSlide ? 'active' : ''}" onclick="App.setHeroSlide(${idx})"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function setHeroSlide(idx) {
    currentSlide = idx;
    renderHeroCarousel();
  }

  // category cards
  function renderCategories() {
    const container = document.getElementById('categoryGrid');
    if (!container || typeof AppData === 'undefined') return;

    container.innerHTML = AppData.categories.map(cat => `
      <div class="category-card ${activeCategory === cat.name ? 'active' : ''}" onclick="App.filterCategory('${cat.name}')">
        <div class="category-avatar-wrap">
          <img src="${cat.icon}" alt="${cat.name}" class="category-icon" onerror="this.src='images/categories/cat_grocery.svg'">
        </div>
        <span class="category-title">${cat.name}</span>
        <span class="category-subtag">${cat.tag}</span>
      </div>
    `).join('');

    // sync desktop category pills
    const desktopBar = document.getElementById('desktopCategoryInner');
    if (desktopBar) {
      const categoryIconMap = {
        'all': 'fas fa-th-large',
        'Groceries & Staples': 'fas fa-basket-shopping',
        'Dairy & Breakfast': 'fas fa-egg',
        'Snacks & Munchies': 'fas fa-cookie-bite',
        'Beverages & Drinks': 'fas fa-bottle-water',
        'Biscuits & Cookies': 'fas fa-cookie',
        'Personal Care': 'fas fa-pump-soap',
        'Cleaning & Home': 'fas fa-spray-can-sparkles',
        'Pooja Essentials': 'fas fa-om'
      };

      const allActive = activeCategory === 'all';
      const pillsHtml = [
        `
        <a href="javascript:void(0)" class="desktop-cat-link desktop-category-pill ${allActive ? 'active' : ''}" onclick="App.filterCategory('all')" title="All Categories" aria-label="All Categories">
          <i class="fas fa-th-large desktop-cat-icon" aria-hidden="true"></i>
          <span class="desktop-cat-text">All Categories</span>
        </a>
        `,
        ...AppData.categories.map(cat => {
          const isActive = activeCategory === cat.name;
          const faClass = cat.faIcon || categoryIconMap[cat.name] || 'fas fa-tag';
          const safeName = cat.name.replace(/'/g, "\\'");
          return `
            <a href="javascript:void(0)" class="desktop-cat-link desktop-category-pill ${isActive ? 'active' : ''}" onclick="App.filterCategory('${safeName}')" title="${cat.name}" aria-label="${cat.name}">
              <i class="${faClass} desktop-cat-icon" aria-hidden="true"></i>
              <span class="desktop-cat-text">${cat.name}</span>
            </a>
          `;
        })
      ].join('');

      desktopBar.innerHTML = pillsHtml;
    }
  }

  // brand carousel
  function renderBrands() {
    const track = document.getElementById('brandCarouselTrack');
    if (!track || typeof AppData === 'undefined') return;

    track.innerHTML = AppData.brands.map(b => `
      <div class="brand-tile ${activeBrand === b.name ? 'active' : ''}" onclick="App.filterBrand('${b.name}')">
        <div class="brand-logo-circle">
          <img src="${b.logo}" alt="${b.name}" class="brand-logo-img">
        </div>
        <div class="brand-name">${b.name}</div>
        <div class="brand-count">${b.count}</div>
        <span class="brand-tag-pill pill-${b.pillType}">${b.pill}</span>
      </div>
    `).join('');
  }

  function scrollBrands(direction) {
    const track = document.getElementById('brandCarouselTrack');
    if (track) {
      const offset = direction === 'left' ? -220 : 220;
      track.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  // product grid
  function renderProducts() {
    const grid = document.getElementById('productGrid');
    const headerTitle = document.getElementById('productSectionTitle');
    const resetFilterBtn = document.getElementById('resetFiltersBtn');
    if (!grid || typeof AppData === 'undefined') return;

    let filterOptions = {};
    if (activeCategory !== 'all') filterOptions.category = activeCategory;
    if (activeBrand !== 'all') filterOptions.brand = activeBrand;
    if (searchQuery) filterOptions.search = searchQuery;

    const list = AppData.getProducts(filterOptions);

    // update title for active filter
    if (headerTitle) {
      if (searchQuery) {
        headerTitle.textContent = `Search results for "${searchQuery}" (${list.length})`;
      } else if (activeCategory !== 'all') {
        headerTitle.textContent = `${activeCategory} (${list.length})`;
      } else if (activeBrand !== 'all') {
        headerTitle.textContent = `Brand: ${activeBrand} (${list.length})`;
      } else {
        headerTitle.textContent = `Best Deals & Daily Essentials (${list.length})`;
      }
    }

    if (resetFilterBtn) {
      const isFiltered = activeCategory !== 'all' || activeBrand !== 'all' || searchQuery !== '';
      resetFilterBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 16px; background: #FFFFFF; border-radius: var(--r-xl); border: 1px solid var(--clr-border);">
          <i class="fas fa-search" style="font-size: 2.5rem; color: var(--clr-text-subtle); margin-bottom: 12px;"></i>
          <h3 style="font-size: 1.1rem; margin-bottom: 6px;">No products found</h3>
          <p style="font-size: 0.8125rem; color: var(--clr-text-light); margin-bottom: 16px;">We couldn't find items matching your filter criteria.</p>
          <button class="hero-cta-btn" onclick="App.resetFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(p => renderSingleProductCard(p)).join('');
  }

  // single product card template
  // fallback if image fails: onerror defaults to grocery placeholder
  // need this so clicks don't bubble up: stopPropagation on wishlist button
  // format currency: rupee symbol and discounted mrp
  function renderSingleProductCard(p) {
    const qty = Store.getItemQty(p.id);
    const isWished = Store.isInWishlist(p.id);

    return `
      <div class="product-card">
        <div class="product-img-wrap" onclick="App.openProductModal('${p.id}')">
          <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='images/categories/cat_grocery.svg'">
          ${p.discount > 0 ? `<span class="product-badge-discount">${p.discount}% OFF</span>` : ''}
          <button class="product-wishlist-btn ${isWished ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleWishlist('${p.id}')" aria-label="Toggle wishlist">
            <i class="${isWished ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <span class="product-badge-eta"><i class="fas fa-bolt"></i> ${p.eta}</span>
        </div>

        <div class="product-card-body" onclick="App.openProductModal('${p.id}')">
          <div class="product-brand-name">${p.brand}</div>
          <h3 class="product-name-title" title="${p.name}">${p.name}</h3>
          <span class="product-unit-text">${p.unit}</span>
          <span class="product-usp-text">${p.usp}</span>
        </div>

        <div class="product-card-bottom">
          <div class="price-container">
            <span class="current-price">₹${p.price}</span>
            ${p.mrp > p.price ? `<span class="original-mrp">₹${p.mrp}</span>` : ''}
          </div>

          <div class="stepper-wrap">
            ${qty === 0 ? `
              <button class="btn-stepper-add" onclick="App.handleStepper('${p.id}', 1)" aria-label="Add ${p.name} to cart">
                <i class="fas fa-plus"></i> ADD
              </button>
            ` : `
              <div class="stepper-control">
                <button class="stepper-btn" onclick="App.handleStepper('${p.id}', ${qty - 1})" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
                <span class="stepper-qty">${qty}</span>
                <button class="stepper-btn" onclick="App.handleStepper('${p.id}', ${qty + 1})" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // stepper add or remove item
  function handleStepper(productId, newQty) {
    Store.updateQty(productId, newQty);
    if (newQty > 0) {
      showToast('Cart Updated', 'success');
    } else {
      showToast('Item Removed', 'info');
    }
  }

  function toggleWishlist(productId) {
    const isAdded = Store.toggleWishlist(productId);
    showToast(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist', 'info');
  }

  // filter and search handlers
  function filterCategory(catName) {
    activeCategory = (activeCategory === catName) ? 'all' : catName;
    activeBrand = 'all'; // reset brand filter
    renderCategories();
    renderBrands();
    renderProducts();
    scrollToProducts();
  }

  function filterBrand(brandName) {
    activeBrand = (activeBrand === brandName) ? 'all' : brandName;
    activeCategory = 'all'; // reset category filter
    renderBrands();
    renderCategories();
    renderProducts();
    scrollToProducts();
  }

  let searchTimeout = null;
  function handleSearchInput(value) {
    const val = value || '';
    const hInput = document.getElementById('headerSearchInput');
    const mInput = document.getElementById('mobileSearchInput');
    if (hInput && hInput.value !== val) hInput.value = val;
    if (mInput && mInput.value !== val) mInput.value = val;

    // 200ms debounce for search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = val.trim();
      renderProducts();
    }, 200);
  }

  function resetFilters() {
    activeCategory = 'all';
    activeBrand = 'all';
    searchQuery = '';
    const hInput = document.getElementById('headerSearchInput');
    const mInput = document.getElementById('mobileSearchInput');
    if (hInput) hInput.value = '';
    if (mInput) mInput.value = '';
    renderCategories();
    renderBrands();
    renderProducts();
  }

  function scrollToProducts() {
    const el = document.getElementById('productsSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function scrollToCategories() {
    const el = document.getElementById('categorySection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // repeat previous order items
  function repeatLastOrder() {
    ['p86', 'p54', 'p6'].forEach(id => Store.addToCart(id, 1));
    showToast('3 items from previous order added to cart!', 'success');
    openCartDrawer();
  }

  function repeatOrderById(orderId) {
    const order = Store.getState().orders.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(it => Store.addToCart(it.productId, it.qty || 1));
    closeAllDrawers();
    showToast(`${order.items.length} items from ${order.id} added to bag!`, 'success');
    openCartDrawer();
  }

  // cart drawer
  function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');
    if (!body || !footer) return;

    const items = Store.getCartItems();
    const totals = Store.getCartTotals(); // cart total and discounts

    if (items.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px 16px;">
          <div style="width: 80px; height: 80px; border-radius: var(--r-full); background: var(--clr-surface-alt); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--clr-text-subtle);">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <h3 style="font-size: 1.1rem; margin-bottom: 6px;">Your cart is empty</h3>
          <p style="font-size: 0.8125rem; color: var(--clr-text-light); margin-bottom: 20px;">Explore our catalog and add fresh grocery essentials.</p>
          <button class="hero-cta-btn" onclick="App.closeAllDrawers(); App.scrollToProducts();">Start Shopping</button>
        </div>
      `;
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = `
      <div class="cart-items-list">
        ${items.map(({ product, qty }) => `
          <div class="cart-item-row">
            <div class="cart-item-thumb">
              <img src="${product.image}" alt="${product.name}" onerror="this.src='images/categories/cat_grocery.svg'">
            </div>
            <div class="cart-item-details">
              <div class="cart-item-name">${product.name}</div>
              <div class="cart-item-unit">${product.unit} • ${product.usp}</div>
              <div class="cart-item-pricing">₹${product.price * qty}</div>
            </div>
            <div class="stepper-wrap" style="width: 74px;">
              <div class="stepper-control">
                <button class="stepper-btn" onclick="App.handleStepper('${product.id}', ${qty - 1})" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
                <span class="stepper-qty">${qty}</span>
                <button class="stepper-btn" onclick="App.handleStepper('${product.id}', ${qty + 1})" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="coupon-section">
        <input type="text" id="couponCodeInput" class="coupon-input" placeholder="Coupon Code" value="${totals.appliedCoupon}">
        <button class="coupon-btn" onclick="App.applyCoupon()">Apply</button>
      </div>
      <div class="coupon-chips-list">
        <span class="coupon-chip-tag" onclick="App.applyCouponDirect('FERI10')">FERI10 (10% Off)</span>
        <span class="coupon-chip-tag" onclick="App.applyCouponDirect('FREEDEL')">FREEDEL (Free Delivery)</span>
      </div>

      <div class="bill-summary-box">
        <div class="bill-line">
          <span>Item Total (MRP)</span>
          <span>₹${totals.mrpTotal}</span>
        </div>
        ${totals.productSavings > 0 ? `
          <div class="bill-line savings">
            <span>Product Discount</span>
            <span>- ₹${totals.productSavings}</span>
          </div>
        ` : ''}
        ${totals.couponSavings > 0 ? `
          <div class="bill-line savings">
            <span>Coupon (${totals.appliedCoupon})</span>
            <span>- ₹${totals.couponSavings}</span>
          </div>
        ` : ''}
        <div class="bill-line">
          <span>Delivery Partner Fee</span>
          <span>${totals.deliveryFee === 0 ? '<strong style="color:var(--clr-green);">FREE</strong>' : '₹' + totals.deliveryFee}</span>
        </div>
        <div class="bill-line">
          <span>Handling & Packaging</span>
          <span>₹${totals.handlingFee}</span>
        </div>
        <div class="bill-line total">
          <span>To Pay</span>
          <span>₹${totals.grandTotal}</span>
        </div>
      </div>

      <div class="payment-selector-wrap">
        <div style="font-size: 0.8125rem; font-weight: 700; margin-bottom: 6px;">Select Payment Option:</div>
        <div class="payment-options-grid">
          <label class="payment-radio-label">
            <input type="radio" name="checkoutPayment" value="UPI" checked>
            <span>UPI (GPay / PhonePe)</span>
          </label>
          <label class="payment-radio-label">
            <input type="radio" name="checkoutPayment" value="Kirana Credit">
            <span>Kirana Pay Later</span>
          </label>
          <label class="payment-radio-label">
            <input type="radio" name="checkoutPayment" value="Card">
            <span>Credit / Debit Card</span>
          </label>
          <label class="payment-radio-label">
            <input type="radio" name="checkoutPayment" value="Cash on Delivery">
            <span>Cash on Delivery</span>
          </label>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="checkout-action-btn" onclick="App.placeOrder()">
        <span>Place Order (${items.length} items)</span>
        <span>₹${totals.grandTotal} <i class="fas fa-chevron-right"></i></span>
      </button>
    `;
  }

  function applyCoupon() {
    const input = document.getElementById('couponCodeInput');
    if (!input) return;
    const res = Store.applyCoupon(input.value);
    showToast(res.message, res.success ? 'success' : 'info');
  }

  function applyCouponDirect(code) {
    const res = Store.applyCoupon(code);
    showToast(res.message, res.success ? 'success' : 'info');
  }

  // place order
  function placeOrder() {
    const selectedRadio = document.querySelector('input[name="checkoutPayment"]:checked');
    const paymentMethod = selectedRadio ? selectedRadio.value : 'UPI';

    const order = Store.placeOrder(paymentMethod);
    if (!order) return;

    if (order.error) {
      showToast(order.message, 'info');
      return;
    }

    closeAllDrawers();
    openOrderSuccessModal(order);
  }

  function openOrderSuccessModal(order) {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    modal.innerHTML = `
      <div class="modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:32px; height:32px; border-radius:var(--r-full); background:var(--clr-green-light); color:var(--clr-green); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <i class="fas fa-check"></i>
          </div>
          <h3 style="font-size:1.1rem; margin:0;">Order Placed!</h3>
        </div>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div style="text-align: center; padding: 12px 0 16px;">
        <div style="font-size: 0.8125rem; color: var(--clr-text-light);">Order ID: <strong>${order.id}</strong></div>
        <div style="font-size: 1.4rem; font-weight: 900; color: var(--clr-green); margin: 6px 0;"><i class="fas fa-bolt"></i> Arriving in ${order.eta}</div>
        <p style="font-size: 0.8125rem; color: var(--clr-text-muted);">Packing at <strong>${order.storeName}</strong></p>
      </div>

      <div style="background: var(--clr-surface-alt); border-radius: var(--r-lg); padding: 12px; margin-bottom: 16px; border: 1px solid var(--clr-border);">
        <div style="display:flex; justify-content:space-between; font-size:0.8125rem; margin-bottom:6px;">
          <span>Payment:</span>
          <strong>${order.paymentMethod}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8125rem; margin-bottom:6px;">
          <span>Items:</span>
          <strong>${order.items.length} items (₹${order.totals.grandTotal})</strong>
        </div>
        <div style="font-size:0.75rem; color:var(--clr-text-light); border-top:1px dashed var(--clr-border); padding-top:6px; margin-top:6px;">
          Delivery to: ${order.deliveryAddress}
        </div>
      </div>

      <button class="hero-cta-btn" style="width:100%; justify-content:center; padding:10px;" onclick="App.closeAllDrawers()">
        Continue Shopping
      </button>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  // past orders modal
  function openOrdersModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    const orders = Store.getState().orders;

    modal.innerHTML = `
      <div class="modal-head">
        <h3 style="font-size: 1.1rem; margin:0;"><i class="fas fa-receipt" style="color:var(--clr-brand);"></i> Past Orders & Tracking</h3>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div class="order-history-list">
        ${orders.map(o => `
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div class="order-card-id">${o.id}</div>
                <div class="order-card-date">${new Date(o.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
              <span class="order-status-pill ${o.status.includes('Delivered') ? 'delivered' : 'processing'}">
                <i class="fas ${o.status.includes('Delivered') ? 'fa-check' : 'fa-clock'}"></i> ${o.status}
              </span>
            </div>

            <div class="order-items-preview">
              ${o.items.map(it => `
                <div class="order-item-mini">
                  <span>${it.qty}x ${it.name}</span>
                  <strong>₹${it.price * it.qty}</strong>
                </div>
              `).join('')}
            </div>

            <div class="order-card-footer">
              <div>
                <span style="font-size:0.6875rem; color:var(--clr-text-light);">Paid via ${o.paymentMethod}</span>
                <div class="order-total-amount">₹${o.totals.grandTotal}</div>
              </div>
              <button class="order-reorder-btn" onclick="App.repeatOrderById('${o.id}')">
                <i class="fas fa-redo-alt"></i> Re-Order
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  // notifications modal
  function openNotificationsModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    modal.innerHTML = `
      <div class="modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fas fa-bell" style="color:var(--clr-brand); font-size:1.1rem;"></i>
          <h3 style="font-size: 1.1rem; margin:0;">Notifications & Updates</h3>
        </div>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div class="notification-list">
        <div class="notification-card">
          <div class="notification-icon-wrap green">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">Order ORD-882194 Delivered</div>
            <div class="notification-desc">Your grocery basket with Fortune Oil and Aashirvaad Atta was delivered in 11 minutes to Flat 402, Green Park.</div>
            <div class="notification-time">2 days ago • Verified Kirana Dispatch</div>
          </div>
        </div>

        <div class="notification-card">
          <div class="notification-icon-wrap blue">
            <i class="fas fa-tags"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">Flat 10% Off with Code FERI10</div>
            <div class="notification-desc">Save up to ₹150 on pantry essentials, Britannia cookies, and Amul dairy. Code applies automatically at checkout.</div>
            <div class="notification-time">Active Today • Limited Period</div>
          </div>
        </div>

        <div class="notification-card">
          <div class="notification-icon-wrap amber">
            <i class="fas fa-shield-heart"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">100% Doorstep Quality Guarantee</div>
            <div class="notification-desc">All products are stored in FSSAI-compliant darkstores. Hand back any pack at delivery for instant doorstep refund.</div>
            <div class="notification-time">Platform Promise • FSSAI License: 10021011000456</div>
          </div>
        </div>
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  // barcode scanner modal
  function openBarcodeModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    modal.innerHTML = `
      <div class="modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fas fa-barcode" style="color:var(--clr-brand); font-size:1.1rem;"></i>
          <h3 style="font-size: 1.1rem; margin:0;">Scan FMCG Pack Barcode</h3>
        </div>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div class="barcode-scanner-wrap">
        <div class="barcode-viewfinder">
          <div class="barcode-target-corners"></div>
          <div class="barcode-laser-line"></div>
          <div style="color:rgba(255,255,255,0.7); font-size:0.75rem; text-align:center; z-index:2;">
            <i class="fas fa-camera" style="font-size:1.5rem; margin-bottom:6px; display:block; opacity:0.8;"></i>
            Align pack barcode inside frame
          </div>
        </div>

        <p style="font-size:0.8125rem; color:var(--clr-text-light); margin-bottom:14px;">
          Point camera at product pack or test with simulated FMCG barcodes below:
        </p>

        <div class="barcode-presets-title">Quick Test Presets (Instant EAN Scan):</div>
        <div class="barcode-presets-grid">
          <button class="barcode-chip-btn" onclick="App.scanBarcodePreset('p1')">
            <i class="fas fa-cookie"></i>
            <div>
              <div>Parle-G 800g</div>
              <small style="color:var(--clr-text-subtle);">8901000314159</small>
            </div>
          </button>
          <button class="barcode-chip-btn" onclick="App.scanBarcodePreset('p54')">
            <i class="fas fa-wheat-awn"></i>
            <div>
              <div>Aashirvaad Atta</div>
              <small style="color:var(--clr-text-subtle);">8901000628318</small>
            </div>
          </button>
          <button class="barcode-chip-btn" onclick="App.scanBarcodePreset('p18')">
            <i class="fas fa-bottle-water"></i>
            <div>
              <div>Coca-Cola 750ml</div>
              <small style="color:var(--clr-text-subtle);">8901000942477</small>
            </div>
          </button>
          <button class="barcode-chip-btn" onclick="App.scanBarcodePreset('p86')">
            <i class="fas fa-oil-can"></i>
            <div>
              <div>Fortune Oil 1L</div>
              <small style="color:var(--clr-text-subtle);">8901001256636</small>
            </div>
          </button>
        </div>
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  function scanBarcodePreset(productId) {
    closeAllDrawers();
    showToast('Barcode recognized! Opening item...', 'success');
    setTimeout(() => {
      openProductModal(productId);
    }, 200);
  }

  // wishlist modal
  function openWishlistModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    const wishlistIds = Store.getState().wishlist;
    const items = wishlistIds.map(id => AppData.getProductById(id)).filter(Boolean);

    modal.innerHTML = `
      <div class="modal-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fas fa-heart" style="color:#DC2626; font-size:1.1rem;"></i>
          <h3 style="font-size: 1.1rem; margin:0;">Saved Items (${items.length})</h3>
        </div>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div class="wishlist-modal-body">
        ${items.length === 0 ? `
          <div style="text-align:center; padding:32px 16px;">
            <i class="far fa-heart" style="font-size:2rem; color:var(--clr-text-subtle); margin-bottom:8px;"></i>
            <p style="font-size:0.875rem; color:var(--clr-text-light);">Your wishlist is empty. Tap the heart icon on any product to save it here.</p>
          </div>
        ` : items.map(p => `
          <div class="wishlist-row">
            <div class="wishlist-thumb">
              <img src="${p.image}" alt="${p.name}" onerror="this.src='images/categories/cat_grocery.svg'">
            </div>
            <div class="wishlist-info">
              <div class="wishlist-title">${p.name}</div>
              <div class="wishlist-price">₹${p.price} <span style="font-size:0.6875rem; color:var(--clr-text-subtle);">MRP ₹${p.mrp}</span></div>
            </div>
            <button class="hero-cta-btn" style="padding:4px 10px; font-size:0.75rem;" onclick="Store.addToCart('${p.id}', 1); App.showToast('Added to bag', 'success'); App.openCartDrawer();">
              <i class="fas fa-plus"></i> Add
            </button>
          </div>
        `).join('')}
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  // store and address picker
  function openStoreSelectorModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    const state = Store.getState();
    const activeStore = Store.getActiveStore();
    const activeAddress = Store.getActiveAddress();

    modal.innerHTML = `
      <div class="modal-head">
        <h3 style="font-size: 1.1rem; margin:0;"><i class="fas fa-map-marker-alt" style="color:var(--clr-brand);"></i> Delivery Location</h3>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close"><i class="fas fa-times"></i></button>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--clr-text-light); text-transform: uppercase; margin-bottom: 8px;">Saved Addresses</div>
        ${state.user.addresses.map(a => `
          <div class="store-option-card ${a.id === activeAddress.id ? 'selected' : ''}" onclick="App.selectAddress(${a.id})">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${a.type} - ${a.label}</strong>
              ${a.id === activeAddress.id ? '<span style="color:var(--clr-brand); font-size:0.75rem; font-weight:800;"><i class="fas fa-check"></i> Active</span>' : ''}
            </div>
            <div style="font-size:0.75rem; color:var(--clr-text-muted); margin-top:2px;">${a.addressLine}, ${a.city} - ${a.pincode}</div>
          </div>
        `).join('')}
      </div>

      <div>
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--clr-text-light); text-transform: uppercase; margin-bottom: 8px;">Nearby Kirana Darkstores</div>
        ${state.stores.map(s => `
          <div class="store-option-card ${s.id === activeStore.id ? 'selected' : ''}" onclick="App.selectStore('${s.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${s.name}</strong>
              <span style="font-size:0.75rem; color:var(--clr-green); font-weight:700;"><i class="fas fa-bolt"></i> ${s.eta} (${s.distance})</span>
            </div>
            <div style="font-size:0.75rem; color:var(--clr-text-muted); margin-top:2px;">${s.address} • FSSAI: ${s.fssaiNumber}</div>
          </div>
        `).join('')}
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  function selectAddress(id) {
    Store.setActiveAddress(id);
    closeAllDrawers();
    showToast('Delivery address updated', 'success');
  }

  function selectStore(id) {
    Store.setActiveStore(id);
    closeAllDrawers();
    showToast('Kirana store switched', 'success');
  }

  // pay later credit modal
  function openCreditModal() {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop) return;

    const credit = Store.getState().user.credit;

    modal.innerHTML = `
      <div class="modal-head">
        <h3 style="font-size: 1.1rem; margin:0;"><i class="fas fa-credit-card" style="color:var(--clr-brand);"></i> Kirana Pay Later</h3>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close"><i class="fas fa-times"></i></button>
      </div>

      <div style="background: linear-gradient(135deg, #0A58CA 0%, #0043D1 100%); color: #FFFFFF; border-radius: var(--r-xl); padding: 18px; margin-bottom: 16px;">
        <div style="font-size: 0.75rem; opacity: 0.85;">Available Credit Balance</div>
        <div style="font-size: 1.8rem; font-weight: 900; margin: 4px 0;">₹${credit.available.toLocaleString('en-IN')}</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">
          <span>Used: ₹${credit.used.toLocaleString('en-IN')}</span>
          <span>Total Limit: ₹${credit.totalLimit.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${credit.used > 0 ? `
        <button class="hero-cta-btn" style="width:100%; justify-content:center; padding:10px; margin-bottom:16px; background:var(--clr-green); color:#FFFFFF;" onclick="App.repayCredit()">
          <i class="fas fa-check-circle"></i> Repay Outstanding (₹${credit.used.toLocaleString('en-IN')})
        </button>
      ` : ''}

      <div style="background: var(--clr-surface-alt); border-radius: var(--r-lg); border: 1px solid var(--clr-border); padding: 12px; margin-bottom: 16px; font-size: 0.75rem; color: var(--clr-text-muted);">
        <div style="font-weight: 700; color: var(--clr-text-main); margin-bottom: 4px;">RBI Digital Lending Guidelines Compliance:</div>
        <div>• Regulated Entity (RE): <strong>${credit.lenderPartner}</strong></div>
        <div>• Billing Cycle: <strong>${credit.interestApr}</strong></div>
        <div>• Next Due Date: <strong>${credit.dueDate}</strong></div>
        <div>• Zero hidden convenience charges on prompt settlement.</div>
      </div>

      <button class="hero-cta-btn" style="width:100%; justify-content:center; padding:10px;" onclick="App.closeAllDrawers()">
        Done
      </button>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  function repayCredit() {
    const res = Store.repayCredit();
    if (res.success) {
      showToast(res.message, 'success');
      openCreditModal();
    } else {
      showToast(res.message, 'info');
    }
  }

  // product quick view modal
  function openProductModal(productId) {
    const modal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!modal || !backdrop || typeof AppData === 'undefined') return;

    const p = AppData.getProductById(productId);
    if (!p) return;

    const qty = Store.getItemQty(p.id);

    modal.innerHTML = `
      <div class="modal-head">
        <span style="font-size: 0.75rem; font-weight: 800; color: var(--clr-brand); text-transform: uppercase;">${p.brand}</span>
        <button class="drawer-close-btn" onclick="App.closeAllDrawers()" aria-label="Close dialog"><i class="fas fa-times"></i></button>
      </div>

      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
        <div style="width: 110px; height: 110px; border-radius: var(--r-lg); background: var(--clr-surface-alt); border: 1px solid var(--clr-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 6px;">
          <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='images/categories/cat_grocery.svg'">
        </div>
        <div>
          <h3 style="font-size: 1rem; line-height: 1.3; margin-bottom: 4px;">${p.name}</h3>
          <div style="font-size: 0.75rem; color: var(--clr-text-light); margin-bottom: 4px;">Pack Size: <strong>${p.unit}</strong></div>
          <div style="font-size: 0.75rem; color: var(--clr-text-subtle); margin-bottom: 6px;">Unit Sale Price: <strong>${p.usp}</strong></div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 1.25rem; font-weight: 900; color: var(--clr-text-main);">₹${p.price}</span>
            ${p.mrp > p.price ? `<span style="font-size: 0.8125rem; text-decoration: line-through; color: var(--clr-text-subtle);">₹${p.mrp}</span>` : ''}
            ${p.discount > 0 ? `<span class="product-badge-discount" style="position:static;">${p.discount}% OFF</span>` : ''}
          </div>
        </div>
      </div>

      <div style="background: var(--clr-surface-alt); border-radius: var(--r-md); padding: 10px; margin-bottom: 16px; font-size: 0.75rem; color: var(--clr-text-muted);">
        <p style="margin-bottom: 6px;">${p.description}</p>
        <div style="border-top: 1px dashed var(--clr-border); padding-top: 6px; display: flex; justify-content: space-between;">
          <span>FSSAI License: <strong>${p.fssai}</strong></span>
          <span style="color: var(--clr-green); font-weight: 700;"><i class="fas fa-bolt"></i> Delivery in ${p.eta}</span>
        </div>
        ${p.barcode ? `<div style="font-size:0.6875rem; color:var(--clr-text-subtle); margin-top:4px;">EAN Barcode: ${p.barcode}</div>` : ''}
      </div>

      <div style="display: flex; gap: 12px;">
        <div class="stepper-wrap" style="flex: 1; height: 38px;">
          ${qty === 0 ? `
            <button class="btn-stepper-add" style="height: 100%; font-size: 0.875rem;" onclick="App.handleStepper('${p.id}', 1); App.openProductModal('${p.id}');">
              <i class="fas fa-plus"></i> ADD TO CART
            </button>
          ` : `
            <div class="stepper-control" style="height: 100%; font-size: 0.9375rem;">
              <button class="stepper-btn" style="width: 32px; height: 32px;" onclick="App.handleStepper('${p.id}', ${qty - 1}); App.openProductModal('${p.id}');" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
              <span class="stepper-qty">${qty} in Cart</span>
              <button class="stepper-btn" style="width: 32px; height: 32px;" onclick="App.handleStepper('${p.id}', ${qty + 1}); App.openProductModal('${p.id}');" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
            </div>
          `}
        </div>
      </div>
    `;

    backdrop.classList.add('active');
    modal.classList.add('active');
  }

  // drawer and modal controls
  function openCartDrawer() {
    renderCartDrawer();
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
  }

  function openNavDrawer() {
    const drawer = document.getElementById('navDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const userNameEl = document.querySelector('.nav-user-name');
    if (userNameEl && typeof Store !== 'undefined') {
      userNameEl.textContent = Store.getState().user?.name || 'Demo User';
    }
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
  }

  // close modal if clicking outside
  function closeAllDrawers() {
    const cartDrawer = document.getElementById('cartDrawer');
    const navDrawer = document.getElementById('navDrawer');
    const centerModal = document.getElementById('centerModal');
    const backdrop = document.getElementById('drawerBackdrop');

    if (cartDrawer) cartDrawer.classList.remove('active');
    if (navDrawer) navDrawer.classList.remove('active');
    if (centerModal) centerModal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  // switch between desktop and mobile frame
  function switchViewMode(mode, silent = false) {
    const wrapper = document.getElementById('appWrapper');
    const btnResponsive = document.getElementById('btnModeResponsive');
    const btnMobile = document.getElementById('btnModeMobile');

    if (!wrapper) return;

    if (mode === 'mobile-frame') {
      wrapper.className = 'app-wrapper mode-mobile-frame';
      if (btnMobile) btnMobile.classList.add('active');
      if (btnResponsive) btnResponsive.classList.remove('active');
    } else {
      wrapper.className = 'app-wrapper mode-responsive';
      if (btnResponsive) btnResponsive.classList.add('active');
      if (btnMobile) btnMobile.classList.remove('active');
    }

    Store.setViewMode(mode);
    if (!silent) {
      showToast(mode === 'mobile-frame' ? 'Switched to Mobile Preview' : 'Switched to Full Desktop View', 'info');
    }
  }

  // toast notification helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = document.createElement('i');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`;
    toast.appendChild(icon);

    const span = document.createElement('span');
    span.textContent = message;
    toast.appendChild(span);

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  return {
    init,
    handleStepper,
    toggleWishlist,
    filterCategory,
    filterBrand,
    handleSearchInput,
    resetFilters,
    scrollToProducts,
    scrollToCategories,
    scrollBrands,
    setHeroSlide,
    repeatLastOrder,
    repeatOrderById,
    applyCoupon,
    applyCouponDirect,
    placeOrder,
    repayCredit,
    openCartDrawer,
    openNavDrawer,
    openStoreSelectorModal,
    openCreditModal,
    openProductModal,
    openOrdersModal,
    openNotificationsModal,
    openBarcodeModal,
    openWishlistModal,
    scanBarcodePreset,
    selectAddress,
    selectStore,
    closeAllDrawers,
    switchViewMode,
    showToast
  };
})();

// run init on dom ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
