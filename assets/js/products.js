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
    
    // State
    const state = {
      products: [],
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0,
      filters: {
        category: getQueryParam('category') || 'all',
        maxPrice: 1000,
        minRating: 0,
        inStock: false
      },
      sort: 'featured'
    };
    
    // DOM elements
    const productsContainer = document.getElementById('products-container');
    const productsShowing = document.getElementById('products-showing');
    const productsTotal = document.getElementById('products-total');
    const paginationNumbers = document.getElementById('pagination-numbers');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const sortSelect = document.getElementById('sort-by');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const inStockCheckbox = document.getElementById('in-stock');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial load
    loadProducts();
    
    // Functions
    function setupEventListeners() {
      // Sort change
      if (sortSelect) {
        sortSelect.addEventListener('change', function() {
          state.sort = this.value;
          state.currentPage = 1;
          loadProducts();
        });
      }
      
      // Price range
      if (priceRange) {
        priceRange.addEventListener('input', function() {
          priceValue.textContent = '$' + this.value;
          state.filters.maxPrice = parseInt(this.value);
        });
      }
      
      // In stock filter
      if (inStockCheckbox) {
        inStockCheckbox.addEventListener('change', function() {
          state.filters.inStock = this.checked;
        });
      }
      
      // Category filters
      const categoryCheckboxes = document.querySelectorAll('input[data-category]');
      categoryCheckboxes.forEach(checkbox => {
        if (checkbox.dataset.category === state.filters.category) {
          checkbox.checked = true;
        }
        
        checkbox.addEventListener('change', function() {
          if (this.dataset.category === 'all') {
            // If 'All' is checked, uncheck others
            if (this.checked) {
              categoryCheckboxes.forEach(cb => {
                if (cb !== this) cb.checked = false;
              });
              state.filters.category = 'all';
            } else {
              this.checked = true; // Keep 'All' checked if unchecked
            }
          } else {
            // If specific category is checked, uncheck 'All'
            const allCheckbox = document.querySelector('input[data-category="all"]');
            if (allCheckbox) {
              allCheckbox.checked = false;
            }
            
            // If no specific categories are checked, check 'All'
            const anyChecked = Array.from(categoryCheckboxes).some(cb => 
              cb.dataset.category !== 'all' && cb.checked
            );
            
            if (!anyChecked && allCheckbox) {
              allCheckbox.checked = true;
              state.filters.category = 'all';
            } else {
              // Get all checked categories
              const checkedCategories = Array.from(categoryCheckboxes)
                .filter(cb => cb.dataset.category !== 'all' && cb.checked)
                .map(cb => cb.dataset.category);
              
              state.filters.category = checkedCategories.length > 0 ? checkedCategories[0] : 'all';
            }
          }
        });
      });
      
      // Rating filters
      const ratingRadios = document.querySelectorAll('input[name="rating"]');
      ratingRadios.forEach(radio => {
        radio.addEventListener('change', function() {
          if (this.checked) {
            state.filters.minRating = this.value === 'all' ? 0 : parseInt(this.value);
          }
        });
      });
      
      // Apply filters button
      if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
          state.currentPage = 1;
          loadProducts();
        });
      }
      
      // Clear filters button
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
          // Reset filters to default
          state.filters = {
            category: 'all',
            maxPrice: 1000,
            minRating: 0,
            inStock: false
          };
          state.sort = 'featured';
          state.currentPage = 1;
          
          // Reset UI
          if (priceRange) {
            priceRange.value = 1000;
            priceValue.textContent = '$1000';
          }
          
          if (inStockCheckbox) {
            inStockCheckbox.checked = false;
          }
          
          if (sortSelect) {
            sortSelect.value = 'featured';
          }
          
          // Reset category checkboxes
          const categoryCheckboxes = document.querySelectorAll('input[data-category]');
          categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = checkbox.dataset.category === 'all';
          });
          
          // Reset rating radios
          const ratingRadios = document.querySelectorAll('input[name="rating"]');
          ratingRadios.forEach(radio => {
            radio.checked = radio.value === 'all';
          });
          
          // Load products with reset filters
          loadProducts();
        });
      }
      
      // Pagination buttons
      if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
          if (state.currentPage > 1) {
            state.currentPage--;
            loadProducts();
            window.scrollTo(0, 0);
          }
        });
      }
      
      if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
          if (state.currentPage < state.totalPages) {
            state.currentPage++;
            loadProducts();
            window.scrollTo(0, 0);
          }
        });
      }
    }
    
    async function loadProducts() {
      try {
        if (productsContainer) {
          productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
        }
        
        // Prepare params for API call
        const params = {
          page: state.currentPage,
          perPage: 8,
          category: state.filters.category,
          maxPrice: state.filters.maxPrice,
          minRating: state.filters.minRating,
          inStock: state.filters.inStock,
          sort: state.sort
        };
        
        // Call API
        const result = await api.getProducts(params);
        
        // Update state
        state.products = result.products;
        state.totalPages = result.totalPages;
        state.totalProducts = result.total;
        
        // Update UI
        updateProductsList();
        updatePagination();
        updateProductCount();
      } catch (error) {
        console.error('Error loading products:', error);
        if (productsContainer) {
          productsContainer.innerHTML = '<div class="error">Failed to load products. Please try again later.</div>';
        }
      }
    }
    
    function updateProductsList() {
      if (!productsContainer) return;
      
      if (state.products.length === 0) {
        productsContainer.innerHTML = `
          <div class="no-products">
            <i class="fas fa-search"></i>
            <p>No products found matching your criteria.</p>
            <button class="btn" id="reset-filters">Reset Filters</button>
          </div>
        `;
        
        const resetButton = document.getElementById('reset-filters');
        if (resetButton) {
          resetButton.addEventListener('click', function() {
            if (clearFiltersBtn) clearFiltersBtn.click();
          });
        }
        return;
      }
      
      let html = '';
      
      state.products.forEach(product => {
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
      
      productsContainer.innerHTML = html;
      
      // Add event listeners to Add to Cart buttons
      const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
      addToCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
      });
    }
    
    function updatePagination() {
      // Update prev/next buttons
      if (prevPageBtn) {
        prevPageBtn.disabled = state.currentPage === 1;
      }
      
      if (nextPageBtn) {
        nextPageBtn.disabled = state.currentPage === state.totalPages;
      }
      
      // Generate pagination numbers
      if (paginationNumbers) {
        let html = '';
        
        // Logic for showing limited page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
          html += `<div class="pagination-number" data-page="1">1</div>`;
          if (startPage > 2) {
            html += `<div class="pagination-ellipsis">...</div>`;
          }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
          html += `<div class="pagination-number ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</div>`;
        }
        
        // Last page
        if (endPage < state.totalPages) {
          if (endPage < state.totalPages - 1) {
            html += `<div class="pagination-ellipsis">...</div>`;
          }
          html += `<div class="pagination-number" data-page="${state.totalPages}">${state.totalPages}</div>`;
        }
        
        paginationNumbers.innerHTML = html;
        
        // Add click events to page numbers
        const pageNumbers = document.querySelectorAll('.pagination-number');
        pageNumbers.forEach(number => {
          number.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page !== state.currentPage) {
              state.currentPage = page;
              loadProducts();
              window.scrollTo(0, 0);
            }
          });
        });
      }
    }
    
    function updateProductCount() {
      if (productsShowing && productsTotal) {
        productsShowing.textContent = state.products.length;
        productsTotal.textContent = state.totalProducts;
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
    
    // Utility function to get query parameters
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
  });