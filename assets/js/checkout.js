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
    const orderItemsContainer = document.getElementById('order-items');
    const orderSubtotalEl = document.getElementById('order-subtotal');
    const orderShippingEl = document.getElementById('order-shipping');
    const orderTotalEl = document.getElementById('order-total');
    const checkoutForm = document.getElementById('checkout-form');
    const shipToDifferentCheckbox = document.getElementById('ship-to-different');
    const shippingAddressSection = document.getElementById('shipping-address');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const paymentDetailSections = document.querySelectorAll('.payment-details');
    const termsAgreeCheckbox = document.getElementById('terms-agree');
    
    // Update cart count in header
    updateCartCount();
    
    // Load order summary
    loadOrderSummary();
    
    // Setup event listeners
    setupEventListeners();
    
    // Functions
    function loadOrderSummary() {
      // Check if cart is empty
      if (cart.items.length === 0) {
        // Redirect to cart page if cart is empty
        window.location.href = 'cart.html';
        return;
      }
      
      // Populate order items
      if (orderItemsContainer) {
        let html = '';
        
        cart.items.forEach(item => {
          html += `
            <div class="order-item">
              <div class="order-item-name">
                ${item.name} 
                <span class="order-item-quantity">× ${item.quantity}</span>
              </div>
              <div class="order-item-price">$${item.getSubtotal().toFixed(2)}</div>
            </div>
          `;
        });
        
        orderItemsContainer.innerHTML = html;
      }
      
      // Update summary
      if (orderSubtotalEl) {
        orderSubtotalEl.textContent = `$${cart.getSubtotal().toFixed(2)}`;
      }
      
      if (orderShippingEl) {
        const shipping = cart.getShippingCost();
        orderShippingEl.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free';
      }
      
      if (orderTotalEl) {
        orderTotalEl.textContent = `$${cart.getTotal().toFixed(2)}`;
      }
    }
    
    function setupEventListeners() {
      // Shipping address toggle
      if (shipToDifferentCheckbox && shippingAddressSection) {
        shipToDifferentCheckbox.addEventListener('change', function() {
          shippingAddressSection.style.display = this.checked ? 'block' : 'none';
        });
      }
      
      // Payment method toggle
      paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
          // Hide all payment details sections
          paymentDetailSections.forEach(section => {
            section.style.display = 'none';
          });
          
          // Show selected payment details
          const selectedPaymentDetails = document.getElementById(`${this.value}-details`);
          if (selectedPaymentDetails) {
            selectedPaymentDetails.style.display = 'block';
          }
        });
      });
      
      // Place order button
      if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
      }
    }
    
    async function placeOrder(event) {
      event.preventDefault();
      
      // Validate form
      if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
      }
      
      // Validate terms agreement
      if (!termsAgreeCheckbox.checked) {
        showNotification('Please agree to the Terms and Conditions', 'error');
        return;
      }
      
      // Get form data
      const formData = new FormData(checkoutForm);
      const billingData = {
        firstName: formData.get('first-name'),
        lastName: formData.get('last-name'),
        company: formData.get('company-name'),
        country: formData.get('country'),
        address1: formData.get('street-address'),
        address2: formData.get('street-address-2'),
        city: formData.get('city'),
        state: formData.get('state'),
        postcode: formData.get('postcode'),
        phone: formData.get('phone'),
        email: formData.get('email')
      };
      
      let shippingData = { ...billingData };
      
      if (shipToDifferentCheckbox.checked) {
        shippingData = {
          firstName: formData.get('shipping-first-name'),
          lastName: formData.get('shipping-last-name'),
          company: formData.get('shipping-company-name'),
          country: formData.get('shipping-country'),
          address1: formData.get('shipping-address-1'),
          address2: formData.get('shipping-address-2'),
          city: formData.get('shipping-city'),
          state: formData.get('shipping-state'),
          postcode: formData.get('shipping-postcode')
        };
      }
      
      // Get payment data
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
      let paymentData = {};
      
      if (paymentMethod === 'creditcard') {
        paymentData = {
          cardNumber: formData.get('card-number'),
          expiryDate: formData.get('expiry-date'),
          cvv: formData.get('cvv'),
          cardName: formData.get('card-name')
        };
      }
      
      // Create order object
      const order = {
        items: cart.items,
        subtotal: cart.getSubtotal(),
        shipping: cart.getShippingCost(),
        discount: cart.discountAmount,
        total: cart.getTotal(),
        billingAddress: billingData,
        shippingAddress: shippingData,
        paymentMethod: paymentMethod,
        paymentData: paymentData,
        notes: formData.get('order-notes'),
        createdAt: new Date().toISOString(),
        status: 'pending',
        customer: {
          firstName: billingData.firstName,
          lastName: billingData.lastName,
          email: billingData.email,
          phone: billingData.phone
        }
      };
      
      try {
        // Disable place order button and show loading state
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Process order
        const result = await api.processOrder(order);
        
        if (result.success) {
          // Clear cart
          cart.clearCart();
          storage.set('cart', cart.toJSON());
          
          // Show success message
          showOrderConfirmation(result.orderId);
        } else {
          showNotification('Failed to process order. Please try again.', 'error');
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = 'Place Order';
        }
      } catch (error) {
        console.error('Error processing order:', error);
        showNotification('An error occurred while processing your order. Please try again.', 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Place Order';
      }
    }
    
    function showOrderConfirmation(orderId) {
      // Create confirmation overlay
      const overlay = document.createElement('div');
      overlay.className = 'order-confirmation-overlay';
      
      const confirmation = document.createElement('div');
      confirmation.className = 'order-confirmation';
      confirmation.innerHTML = `
        <div class="confirmation-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your purchase. Your order has been received and is now being processed.</p>
        <p class="order-number">Order #: <strong>${orderId}</strong></p>
        <p>A confirmation email has been sent to your email address.</p>
        <div class="confirmation-buttons">
          <button class="btn btn-full">Continue Shopping</button>
        </div>
      `;
      
      overlay.appendChild(confirmation);
      document.body.appendChild(overlay);
      
      // Add continue shopping button event
      const continueBtn = confirmation.querySelector('.confirmation-buttons .btn');
      continueBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
      
      // Add confirmation styles if not already in CSS
      if (!document.getElementById('confirmation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'confirmation-styles';
        styles.textContent = `
          .order-confirmation-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            animation: fadeIn 0.3s ease-out;
          }
          
          .order-confirmation {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            animation: scaleIn 0.3s ease-out;
          }
          
          .confirmation-icon {
            font-size: 4rem;
            color: var(--success-color);
            margin-bottom: 20px;
          }
          
          .order-confirmation h2 {
            color: var(--success-color);
            margin-bottom: 20px;
          }
          
          .order-number {
            margin: 20px 0;
            padding: 10px;
            background-color: var(--background-light);
            border-radius: 4px;
          }
          
          .confirmation-buttons {
            margin-top: 30px;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(styles);
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