document.addEventListener('DOMContentLoaded', function() {
    // Initialize services
    const api = new ApiService();
    const storage = new StorageService();
    
    // Initialize cart from storage or create new one
    let cart;
    const storedCart = storage.get('cart');
    
    if (storedCart) {
      cart = Cart.fromJSON(storedCart);
    } else {
      cart = new Cart();
      storage.set('cart', cart.toJSON());
    }
  
    // Update cart count in header
    updateCartCount();
  
    // Setup event listeners
    setupNavigation();
    setupNewsletterForm();
    setupContactForm();
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger && nav) {
      hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('active');
      });
    }
  
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (nav && nav.classList.contains('active')) {
        if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
          nav.classList.remove('active');
          hamburger.classList.remove('active');
        }
      }
    });
  
    // Load featured products on homepage
    const featuredProductsContainer = document.getElementById('featured-products-container');
    if (featuredProductsContainer) {
      loadFeaturedProducts();
    }
  
    // Utility function to update cart count
    function updateCartCount() {
      const cartCountElements = document.querySelectorAll('.cart-count');
      const itemCount = cart.getItemCount();
      
      cartCountElements.forEach(element => {
        element.textContent = itemCount.toString();
      });
    }
  
    // Load featured products
    async function loadFeaturedProducts() {
      try {
        featuredProductsContainer.innerHTML = '<div class="loading">Loading products...</div>';
        
        const featuredProducts = await api.getFeaturedProducts(4);
        
        if (featuredProducts && featuredProducts.length > 0) {
          let html = '';
          
          featuredProducts.forEach(product => {
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
                    ${product.price.toFixed(2)}
                  </div>
                  <div class="product-rating">
                    <div class="stars">${starsHtml}</div>
                    <span class="rating-count">(${reviewCount})</span>
                  </div>
                </div>
              </div>
            `;
          });
          
          featuredProductsContainer.innerHTML = html;
          
          // Add event listeners to Add to Cart buttons
          const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
          addToCartButtons.forEach(button => {
            button.addEventListener('click', handleAddToCart);
          });
        } else {
          featuredProductsContainer.innerHTML = '<p class="no-products">No featured products available.</p>';
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
        featuredProductsContainer.innerHTML = '<p class="error">Error loading products. Please try again later.</p>';
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
  
    // Setup navigation events
    function setupNavigation() {
      // For non-mobile devices, add hover effects to dropdown menus if needed
      const navItems = document.querySelectorAll('nav ul li');
      
      navItems.forEach(item => {
        // Add your navigation interaction logic here if needed
      });
    }
  
    // Setup newsletter subscription
    function setupNewsletterForm() {
      const newsletterForm = document.getElementById('newsletter-form');
      
      if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(event) {
          event.preventDefault();
          const emailInput = this.querySelector('input[type="email"]');
          const email = emailInput.value.trim();
          
          if (email) {
            // In a real app, you would send this to your server
            console.log('Newsletter subscription for:', email);
            showNotification('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
          } else {
            showNotification('Please enter a valid email address.', 'error');
          }
        });
      }
    }
  
    // Setup contact form
    function setupContactForm() {
      const contactForm = document.getElementById('contact-form');
      
      if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
          event.preventDefault();
          
          const name = document.getElementById('name').value.trim();
          const email = document.getElementById('email').value.trim();
          const subject = document.getElementById('subject').value.trim();
          const message = document.getElementById('message').value.trim();
          
          if (name && email && subject && message) {
            // In a real app, you would send this to your server
            console.log('Contact form submission:', { name, email, subject, message });
            showNotification('Your message has been sent. We\'ll get back to you soon!', 'success');
            contactForm.reset();
          } else {
            showNotification('Please fill all required fields.', 'error');
          }
        });
      }
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
  
    // Add utility CSS for notifications if not already in CSS file
    if (!document.getElementById('notification-styles')) {
      const notificationStyles = document.createElement('style');
      notificationStyles.id = 'notification-styles';
      notificationStyles.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1050;
          max-width: 350px;
        }
        
        .notification {
          margin-bottom: 10px;
          border-radius: 4px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          overflow: hidden;
          animation: slide-in 0.3s ease-out forwards;
        }
        
        .notification.fade-out {
          animation: slide-out 0.3s ease-out forwards;
        }
        
        .notification-content {
          padding: 15px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .notification.success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .notification.error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .notification.info {
          background-color: #d1ecf1;
          color: #0c5460;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          margin-left: 10px;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
        }
        
        .notification-close:hover {
          opacity: 1;
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(notificationStyles);
    }
  });