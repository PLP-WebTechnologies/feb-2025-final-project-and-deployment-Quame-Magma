document.addEventListener('DOMContentLoaded', function() {
    // Initialize services
    const api = new ApiService();
    const storage = new StorageService();
    
    // Get cart from storage
    let cart;
    const storedCart = storage.get('cart');
    
    if (storedCart) {
      cart = Cart.fromJSON(storedCart);
    } else {
      cart = new Cart();
      storage.set('cart', cart.toJSON());
    }
    
    // DOM elements
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartEl = document.getElementById('empty-cart');
    const cartContentEl = document.getElementById('cart-content');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartDiscountRow = document.getElementById('discount-row');
    const cartDiscountEl = document.getElementById('cart-discount');
    const cartShippingEl = document.getElementById('cart-shipping');
    const cartTotalEl = document.getElementById('cart-total');
    const updateCartBtn = document.getElementById('update-cart');
    const applyCouponBtn = document.getElementById('apply-coupon');
    const couponCodeInput = document.getElementById('coupon-code');
    const checkoutBtn = document.getElementById('checkout-btn');
    const recommendedProductsContainer = document.getElementById('recommended-products');
    
    // Update cart count in header
    updateCartCount();
    
    // Load cart items
    loadCart();
    
    // Load recommended products
    loadRecommendedProducts();
    
    // Add event listeners
    if (updateCartBtn) {
      updateCartBtn.addEventListener('click', updateCart);
    }
    
    if (applyCouponBtn && couponCodeInput) {
      applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        if (cart.items.length === 0) {
          e.preventDefault();
          showNotification('Your cart is empty. Add items before checkout.', 'error');
        }
      });
    }
    
    // Functions
    function loadCart() {
      // Update cart visibility
      updateCartVisibility();
      
      // If cart is empty, no need to proceed
      if (cart.items.length === 0) return;
      
      // Populate cart items
      if (cartItemsContainer) {
        let html = '';
        
        cart.items.forEach((item, index) => {
          html += `
            <tr>
              <td data-title="Product">
                <div class="cart-product">
                  <div class="cart-product-image">
                    <img src="${item.image}" alt="${item.name}">
                  </div>
                  <div class="cart-product-details">
                    <h4>${item.name}</h4>
                    ${Object.keys(item.options).length > 0 ? 
                      `<div class="product-variant">
                        ${Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>` : 
                      ''}
                  </div>
                </div>
              </td>
              <td data-title="Price">$${item.price.toFixed(2)}</td>
              <td data-title="Quantity">
                <div class="cart-quantity">
                  <button type="button" class="decrease-qty" data-index="${index}">-</button>
                  <input type="number" value="${item.quantity}" min="1" class="item-quantity" data-index="${index}">
                  <button type="button" class="increase-qty" data-index="${index}">+</button>
                </div>
              </td>
              <td data-title="Subtotal">$${item.getSubtotal().toFixed(2)}</td>
              <td data-title="Action">
                <button type="button" class="cart-remove" data-index="${index}">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          `;
        });
        
        cartItemsContainer.innerHTML = html;
        
        // Add event listeners to cart item controls
        const quantityInputs = document.querySelectorAll('.item-quantity');
        quantityInputs.forEach(input => {
          input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const quantity = parseInt(this.value);
            if (quantity > 0) {
              updateItemQuantity(index, quantity);
            }
          });
        });
        
        const increaseButtons = document.querySelectorAll('.increase-qty');
        increaseButtons.forEach(button => {
          button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const input = document.querySelector(`.item-quantity[data-index="${index}"]`);
            let quantity = parseInt(input.value) + 1;
            input.value = quantity;
            updateItemQuantity(index, quantity);
          });
        });
        
        const decreaseButtons = document.querySelectorAll('.decrease-qty');
        decreaseButtons.forEach(button => {
          button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const input = document.querySelector(`.item-quantity[data-index="${index}"]`);
            let quantity = parseInt(input.value) - 1;
            if (quantity >= 1) {
              input.value = quantity;
              updateItemQuantity(index, quantity);
            }
          });
        });
        
        const removeButtons = document.querySelectorAll('.cart-remove');
        removeButtons.forEach(button => {
          button.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            removeItem(index);
          });
        });
      }
      
      // Update summary
      updateCartSummary();
    }
    
    function updateCartVisibility() {
      if (cart.items.length === 0) {
        if (emptyCartEl) emptyCartEl.style.display = 'block';
        if (cartContentEl) cartContentEl.style.display = 'none';
      } else {
        if (emptyCartEl) emptyCartEl.style.display = 'none';
        if (cartContentEl) cartContentEl.style.display = 'block';
      }
    }
    
    function updateCartSummary() {
      if (cartSubtotalEl) {
        cartSubtotalEl.textContent = `$${cart.getSubtotal().toFixed(2)}`;
      }
      
      if (cartDiscountRow && cartDiscountEl) {
        if (cart.discountAmount > 0) {
          cartDiscountRow.style.display = 'flex';
          cartDiscountEl.textContent = `-$${cart.discountAmount.toFixed(2)}`;
        } else {
          cartDiscountRow.style.display = 'none';
        }
      }
      
      if (cartShippingEl) {
        const shipping = cart.getShippingCost();
        cartShippingEl.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free';
      }
      
      if (cartTotalEl) {
        cartTotalEl.textContent = `$${cart.getTotal().toFixed(2)}`;
      }
    }
    
    function updateItemQuantity(index, quantity) {
      cart.updateItemQuantity(index, quantity);
      storage.set('cart', cart.toJSON());
      updateCartSummary();
      updateCartCount();
    }
    
    function removeItem(index) {
      cart.removeItem(index);
      storage.set('cart', cart.toJSON());
      loadCart();
      storage.set('cart', cart.toJSON());
      loadCart();
      updateCartCount();
      showNotification('Item removed from cart', 'info');
    }
    
    function updateCart() {
      // This function is triggered when the "Update Cart" button is clicked
      // Cart quantities are already updated via the quantity controls
      showNotification('Cart updated successfully', 'success');
    }
    
    function applyCoupon() {
      const code = couponCodeInput.value.trim();
      if (!code) {
        showNotification('Please enter a coupon code', 'error');
        return;
      }
      
      // Apply coupon code
      const applied = cart.applyDiscount(code);
      
      if (applied) {
        storage.set('cart', cart.toJSON());
        updateCartSummary();
        showNotification('Coupon applied successfully', 'success');
        couponCodeInput.value = '';
      } else {
        showNotification('Invalid coupon code', 'error');
      }
    }
    
    async function loadRecommendedProducts() {
      if (!recommendedProductsContainer) return;
      
      try {
        recommendedProductsContainer.innerHTML = '<div class="loading">Loading recommendations...</div>';
        
        // Get recommendations based on cart items (using the first item in cart)
        let recommendedProducts = [];
        
        if (cart.items.length > 0) {
          // Get related products for the first item in cart
          recommendedProducts = await api.getRelatedProducts(cart.items[0].productId, 4);
        }
        
        // If no related products or cart is empty, get featured products
        if (recommendedProducts.length === 0) {
          recommendedProducts = await api.getFeaturedProducts(4);
        }
        
        if (recommendedProducts.length > 0) {
          let html = '';
          
          recommendedProducts.forEach(product => {
            // Calculate average rating
            const reviewCount = product.reviews.length;
            let avgRating = 0;
            if (reviewCount > 0) {
              avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
            }
            
            // Format stars HTML
            let starsHtml = '';
            const fullStars = Math.floor(avgRating);
            const halfStar = avgRating % 1 >= 0.5;
            
            for (let i = 0; i < 5; i++) {
              if (i < fullStars) {
                starsHtml += '<i class="fas fa-star"></i>';
              } else if (i === fullStars && halfStar) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
              } else {
                starsHtml += '<i class="far fa-star"></i>';
              }
            }
            
            html += `
              <div class="product-card">
                <div class="product-image">
                  <img src="${product.imageUrls[0]}" alt="${product.name}">
                  ${product.inventory < 5 && product.inventory > 0 ? '<span class="product-tag">Low Stock</span>' : ''}
                  ${product.inventory <= 0 ? '<span class="product-tag">Out of Stock</span>' : ''}
                  <div class="product-actions">
                    <button onclick="window.location.href='product-detail.html?id=${product.id}'"><i class="far fa-eye"></i> View</button>
                    <button class="add-to-cart-btn" data-product-id="${product.id}" ${product.inventory <= 0 ? 'disabled' : ''}><i class="fas fa-shopping-cart"></i> Add</button>
                    <button><i class="far fa-heart"></i></button>
                  </div>
                </div>
                <div class="product-info">
                  <div class="product-category">${product.category}</div>
                  <h3 class="product-title"><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                  <div class="product-price">
                    $${product.price.toFixed(2)}
                  </div>
                  <div class="product-rating">
                    <div class="stars">${starsHtml}</div>
                    <span class="rating-count">(${reviewCount})</span>
                  </div>
                </div>
              </div>
            `;
          });
          
          recommendedProductsContainer.innerHTML = html;
          
          // Add event listeners to Add to Cart buttons
          const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
          addToCartButtons.forEach(button => {
            button.addEventListener('click', handleAddToCart);
          });
        } else {
          recommendedProductsContainer.innerHTML = '<p class="no-products">No recommended products available.</p>';
        }
      } catch (error) {
        console.error('Error loading recommended products:', error);
        recommendedProductsContainer.innerHTML = '<p class="error">Error loading recommended products. Please try again later.</p>';
      }
    }
    
    // Add to cart handler
    async function handleAddToCart(event) {
      const button = event.currentTarget;
      const productId = button.dataset.productId;
      
      try {
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        // Get product details
        const product = await api.getProductById(productId);
        
        if (product && product.inventory > 0) {
          // Add to cart
          cart.addItem(product, 1);
          storage.set('cart', cart.toJSON());
          
          // Update UI
          updateCartCount();
          loadCart();
          showNotification('Product added to cart!', 'success');
        } else {
          showNotification('Sorry, this product is out of stock.', 'error');
        }
      } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Failed to add product to cart. Please try again.', 'error');
      } finally {
        // Restore button state
        button.innerHTML = '<i class="fas fa-shopping-cart"></i> Add';
        button.disabled = false;
      }
    }
    
    // Update cart count in header
    function updateCartCount() {
      const cartCountElements = document.querySelectorAll('.cart-count');
      const itemCount = cart.getItemCount();
      
      cartCountElements.forEach(element => {
        element.textContent = itemCount.toString();
      });
    }
    
    // Utility function to show notifications
    function showNotification(message, type = 'info') {
      // Check if notification container exists, if not create it
      let notificationContainer = document.querySelector('.notification-container');
      
      if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
      }
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span>${message}</span>
          <button class="notification-close">&times;</button>
        </div>
      `;
      
      // Add to container
      notificationContainer.appendChild(notification);
      
      // Add close event
      const closeButton = notification.querySelector('.notification-close');
      closeButton.addEventListener('click', function() {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notificationContainer.removeChild(notification);
        }, 300);
      });
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notificationContainer.contains(notification)) {
          notification.classList.add('fade-out');
          setTimeout(() => {
            if (notificationContainer.contains(notification)) {
              notificationContainer.removeChild(notification);
            }
          }, 300);
        }
      }, 5000);
    }
  });