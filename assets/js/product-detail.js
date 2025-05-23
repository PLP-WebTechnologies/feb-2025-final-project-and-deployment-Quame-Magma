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
    
    // Update cart count in header
    updateCartCount();
    
    // Get product ID from URL
    const productId = getQueryParam('id');
    if (!productId) {
      window.location.href = 'products.html'; // Redirect to products page if no ID
      return;
    }
    
    // State
    let currentProduct = null;
    let selectedOptions = {};
    
    // DOM Elements
    const productLoading = document.getElementById('product-loading');
    const productContent = document.getElementById('product-detail-content');
    const productCategory = document.getElementById('product-category');
    const productName = document.getElementById('product-name');
    const featuredImage = document.getElementById('featured-image');
    const thumbnailImages = document.getElementById('thumbnail-images');
    const productTitle = document.getElementById('product-title');
    const productStars = document.getElementById('product-stars');
    const reviewCount = document.getElementById('review-count');
    const productSku = document.getElementById('product-sku');
    const productPrice = document.getElementById('product-price');
    const productAvailability = document.getElementById('product-availability');
    const productShortDesc = document.getElementById('product-short-desc');
    const productSize = document.getElementById('product-size');
    const sizeOption = document.getElementById('size-option');
    const colorOptions = document.getElementById('color-options');
    const colorOption = document.getElementById('color-option');
    const quantityInput = document.getElementById('product-quantity');
    const decreaseQtyBtn = document.getElementById('decrease-qty');
    const increaseQtyBtn = document.getElementById('increase-qty');
    const addToCartBtn = document.getElementById('add-to-cart');
    const addToWishlistBtn = document.getElementById('add-to-wishlist');
    const productDescription = document.getElementById('product-description');
    const specificationsTable = document.getElementById('specifications-table');
    const averageRating = document.getElementById('average-rating');
    const ratingValue = document.getElementById('rating-value');
    const totalReviews = document.getElementById('total-reviews');
    const ratingBreakdown = document.getElementById('rating-breakdown');
    const reviewsList = document.getElementById('reviews-list');
    const relatedProducts = document.getElementById('related-products');
    
    // Load product details
    loadProduct();
    
    // Load related products
    loadRelatedProducts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup tab switching
    setupTabs();
    
    // Functions
    async function loadProduct() {
      try {
        // Show loading state
        if (productLoading) {
          productLoading.style.display = 'block';
        }
        if (productContent) {
          productContent.style.display = 'none';
        }
        
        // Fetch product details
        currentProduct = await api.getProductById(productId);
        
        // Update UI
        updateProductUI();
        
        // Hide loading, show content
        if (productLoading) {
          productLoading.style.display = 'none';
        }
        if (productContent) {
          productContent.style.display = 'block';
        }
      } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Failed to load product details. Please try again.', 'error');
        
        // Redirect to products page after a delay
        setTimeout(() => {
          window.location.href = 'products.html';
        }, 2000);
      }
    }
    
    function updateProductUI() {
      // Set document title
      document.title = `${currentProduct.name} | ShopEase`;
      
      // Update breadcrumb
      if (productCategory) {
        const categoryLink = productCategory.querySelector('a');
        categoryLink.textContent = currentProduct.category;
        categoryLink.href = `products.html?category=${currentProduct.category.toLowerCase()}`;
      }
      if (productName) {
        productName.textContent = currentProduct.name;
      }
      
      // Main product info
      if (productTitle) {
        productTitle.textContent = currentProduct.name;
      }
      if (productSku) {
        productSku.textContent = currentProduct.id;
      }
      if (productPrice) {
        productPrice.textContent = `$${currentProduct.price.toFixed(2)}`;
      }
      
      // Availability
      if (productAvailability) {
        if (currentProduct.inventory > 0) {
          productAvailability.textContent = 'In Stock';
          productAvailability.className = 'product-availability in-stock';
        } else {
          productAvailability.textContent = 'Out of Stock';
          productAvailability.className = 'product-availability out-of-stock';
        }
      }
      
      // Short description
      if (productShortDesc) {
        // Use first paragraph of description as short description
        const firstParagraph = currentProduct.description.split('\n')[0];
        productShortDesc.textContent = firstParagraph;
      }
      
      // Product images
      if (featuredImage) {
        featuredImage.src = currentProduct.imageUrls[0];
        featuredImage.alt = currentProduct.name;
      }
      
      if (thumbnailImages && currentProduct.imageUrls.length > 1) {
        let thumbnailsHtml = '';
        
        currentProduct.imageUrls.forEach((url, index) => {
          thumbnailsHtml += `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
              <img src="${url}" alt="${currentProduct.name} - Image ${index + 1}">
            </div>
          `;
        });
        
        thumbnailImages.innerHTML = thumbnailsHtml;
        
        // Add click event listeners to thumbnails
        const thumbnails = thumbnailImages.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumbnail => {
          thumbnail.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            updateFeaturedImage(index);
            
            // Update active class
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            this.classList.add('active');
          });
        });
      } else if (thumbnailImages) {
        thumbnailImages.style.display = 'none';
      }
      
      // Rating stars
      if (productStars) {
        const avgRating = calculateAverageRating();
        const starsHtml = generateStarsHtml(avgRating);
        productStars.innerHTML = starsHtml;
      }
      
      if (reviewCount) {
        reviewCount.textContent = `${currentProduct.reviews.length} Reviews`;
      }
      
      // Product options
      updateProductOptions();
      
      // Product tabs
      updateProductTabs();
    }
    
    function updateProductOptions() {
      // Size options (example - in a real app, this would come from the product data)
      if (sizeOption && productSize) {
        // Check if product has size options
        const hasSizes = currentProduct.features.some(feature => feature.name === 'Available Sizes');
        
        if (hasSizes) {
          const sizes = currentProduct.features.find(feature => feature.name === 'Available Sizes').value.split(',');
          
          let sizesHtml = '<option value="">Select Size</option>';
          sizes.forEach(size => {
            const trimmedSize = size.trim();
            sizesHtml += `<option value="${trimmedSize}">${trimmedSize}</option>`;
          });
          
          productSize.innerHTML = sizesHtml;
        } else {
          sizeOption.style.display = 'none';
        }
      }
      
      // Color options (example - in a real app, this would come from the product data)
      if (colorOption && colorOptions) {
        // Check if product has color options
        const hasColors = currentProduct.features.some(feature => feature.name === 'Available Colors');
        
        if (hasColors) {
          const colors = currentProduct.features.find(feature => feature.name === 'Available Colors').value.split(',');
          
          let colorsHtml = '';
          colors.forEach(color => {
            const trimmedColor = color.trim();
            colorsHtml += `
              <div class="color-option" style="background-color: ${trimmedColor};" data-color="${trimmedColor}"></div>
            `;
          });
          
          colorOptions.innerHTML = colorsHtml;
          
          // Add click event listeners to color options
          const colorOptionElements = colorOptions.querySelectorAll('.color-option');
          colorOptionElements.forEach(option => {
            option.addEventListener('click', function() {
              colorOptionElements.forEach(opt => opt.classList.remove('active'));
              this.classList.add('active');
              selectedOptions.color = this.dataset.color;
            });
          });
        } else {
          colorOption.style.display = 'none';
        }
      }
    }
    
    function updateProductTabs() {
      // Description tab
      if (productDescription) {
        productDescription.innerHTML = currentProduct.description.replace(/\n/g, '<br>');
      }
      
      // Specifications tab
      if (specificationsTable) {
        let specificationsHtml = '';
        
        currentProduct.features.forEach(feature => {
          specificationsHtml += `
            <tr>
              <th>${feature.name}</th>
              <td>${feature.value}</td>
            </tr>
          `;
        });
        
        specificationsTable.innerHTML = specificationsHtml;
      }
      
      // Reviews tab
      updateReviewsTab();
    }
    
    function updateReviewsTab() {
      const avgRating = calculateAverageRating();
      
      // Average rating
      if (averageRating) {
        averageRating.innerHTML = generateStarsHtml(avgRating, true);
      }
      
      if (ratingValue) {
        ratingValue.textContent = avgRating;
      }
      
      if (totalReviews) {
        totalReviews.textContent = currentProduct.reviews.length;
      }
      
      // Rating breakdown
      if (ratingBreakdown) {
        let breakdownHtml = '';
        
        // Count reviews per rating
        const ratingCounts = {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        currentProduct.reviews.forEach(review => {
          const rating = Math.round(review.rating);
          if (ratingCounts[rating] !== undefined) {
            ratingCounts[rating]++;
          }
        });
        
        // Create rating bars
        for (let i = 5; i >= 1; i--) {
          const count = ratingCounts[i] || 0;
          const percentage = currentProduct.reviews.length > 0 ? Math.round((count / currentProduct.reviews.length) * 100) : 0;
          
          breakdownHtml += `
            <div class="rating-bar">
              <div class="rating-label">${i} stars</div>
              <div class="bar">
                <div class="bar-fill" style="width: ${percentage}%;"></div>
              </div>
              <div class="rating-count">${count}</div>
            </div>
          `;
        }
        
        ratingBreakdown.innerHTML = breakdownHtml;
      }
      
      // Reviews list
      if (reviewsList) {
        if (currentProduct.reviews.length === 0) {
          reviewsList.innerHTML = '<div class="no-reviews">There are no reviews yet. Be the first to review this product!</div>';
        } else {
          let reviewsHtml = '';
          
          // Sort reviews by date, newest first
          const sortedReviews = [...currentProduct.reviews].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          sortedReviews.forEach(review => {
            const reviewDate = new Date(review.date);
            const formattedDate = `${reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            
            reviewsHtml += `
              <div class="review">
                <div class="review-header">
                  <div class="review-author">${review.user}</div>
                  <div class="review-date">${formattedDate}</div>
                </div>
                <div class="stars">${generateStarsHtml(review.rating)}</div>
                <h4 class="review-title">${review.title || 'Review'}</h4>
                <div class="review-content">${review.comment}</div>
                ${review.verified ? '<div class="review-verification"><i class="fas fa-check-circle"></i> Verified Purchase</div>' : ''}
              </div>
            `;
          });
          
          reviewsList.innerHTML = reviewsHtml;
        }
        
        // Setup review form
        setupReviewForm();
      }
    }
    
    function setupReviewForm() {
      const reviewForm = document.getElementById('review-form');
      const ratingSelector = document.querySelector('.rating-selector');
      
      if (reviewForm && ratingSelector) {
        // Rating stars selection
        const stars = ratingSelector.querySelectorAll('i');
        let selectedRating = 0;
        
        stars.forEach(star => {
          star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            
            stars.forEach((s, index) => {
              if (index < rating) {
                s.className = 'fas fa-star';
              } else {
                s.className = 'far fa-star';
              }
            });
          });
          
          star.addEventListener('mouseout', function() {
            stars.forEach((s, index) => {
              if (index < selectedRating) {
                s.className = 'fas fa-star';
              } else {
                s.className = 'far fa-star';
              }
            });
          });
          
          star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            
            stars.forEach((s, index) => {
              if (index < selectedRating) {
                s.className = 'fas fa-star';
              } else {
                s.className = 'far fa-star';
              }
            });
          });
        });
        
        // Form submission
        reviewForm.addEventListener('submit', async function(event) {
          event.preventDefault();
          
          if (selectedRating === 0) {
            showNotification('Please select a rating', 'error');
            return;
          }
          
          const name = document.getElementById('review-name').value.trim();
          const email = document.getElementById('review-email').value.trim();
          const title = document.getElementById('review-title').value.trim();
          const content = document.getElementById('review-content').value.trim();
          
          if (!name || !email || !title || !content) {
            showNotification('Please fill out all fields', 'error');
            return;
          }
          
          try {
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            const review = {
              user: name,
              email: email,
              rating: selectedRating,
              title: title,
              comment: content,
              verified: false
            };
            
            await api.addReview(productId, review);
            
            // Reload product to get updated reviews
            currentProduct = await api.getProductById(productId);
            updateReviewsTab();
            
            // Reset form
            reviewForm.reset();
            selectedRating = 0;
            stars.forEach(s => {
              s.className = 'far fa-star';
            });
            
            showNotification('Thank you! Your review has been submitted.', 'success');
            
            // Update product rating display
            if (productStars) {
              const avgRating = calculateAverageRating();
              productStars.innerHTML = generateStarsHtml(avgRating);
            }
            
            if (reviewCount) {
              reviewCount.textContent = `${currentProduct.reviews.length} Reviews`;
            }
          } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Failed to submit review. Please try again.', 'error');
          } finally {
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
          }
        });
      }
    }
    
    async function loadRelatedProducts() {
      if (!relatedProducts || !productId) return;
      
      try {
        relatedProducts.innerHTML = '<div class="loading">Loading related products...</div>';
        
        const relatedProductsList = await api.getRelatedProducts(productId);
        
        if (relatedProductsList.length === 0) {
          relatedProducts.innerHTML = '<p class="no-products">No related products found.</p>';
          return;
        }
        
        let html = '';
        
        relatedProductsList.forEach(product => {
          // Calculate average rating
          const reviewCount = product.reviews.length;
          let avgRating = 0;
          if (reviewCount > 0) {
            avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
          }
          
          // Format stars HTML
          const starsHtml = generateStarsHtml(avgRating);
          
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
        
        relatedProducts.innerHTML = html;
        
        // Add event listeners to Add to Cart buttons
        const addToCartButtons = relatedProducts.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
          button.addEventListener('click', handleAddToCart);
        });
      } catch (error) {
        console.error('Error loading related products:', error);
        relatedProducts.innerHTML = '<p class="error">Failed to load related products.</p>';
      }
    }
    
    function setupEventListeners() {
      // Quantity buttons
      if (decreaseQtyBtn && quantityInput) {
        decreaseQtyBtn.addEventListener('click', function() {
          const currentQty = parseInt(quantityInput.value);
          if (currentQty > 1) {
            quantityInput.value = currentQty - 1;
          }
        });
      }
      
      if (increaseQtyBtn && quantityInput) {
        increaseQtyBtn.addEventListener('click', function() {
          const currentQty = parseInt(quantityInput.value);
          quantityInput.value = currentQty + 1;
        });
      }
      
      // Add to cart button
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
          addToCart();
        });
      }
      
      // Add to wishlist button
      if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', function() {
          // Toggle heart icon
          const icon = this.querySelector('i');
          if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            showNotification('Added to wishlist!', 'success');
          } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            showNotification('Removed from wishlist', 'info');
          }
        });
      }
    }
    
    function setupTabs() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove active class from all buttons and contents
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Add active class to clicked button and corresponding content
          this.classList.add('active');
          const tabId = this.dataset.tab;
          document.getElementById(`${tabId}-tab`).classList.add('active');
        });
      });
    }
    
    function addToCart() {
      if (!currentProduct) return;
      
      // Check if product is in stock
      if (currentProduct.inventory <= 0) {
        showNotification('Sorry, this product is out of stock.', 'error');
        return;
      }
      
      // Get quantity
      const quantity = parseInt(quantityInput.value);
      if (isNaN(quantity) || quantity < 1) {
        showNotification('Please enter a valid quantity.', 'error');
        return;
      }
      
      // Check if quantity is available
      if (quantity > currentProduct.inventory) {
        showNotification(`Sorry, only ${currentProduct.inventory} items are available.`, 'error');
        return;
      }
      
      // Get selected options
      const options = { ...selectedOptions };
      
      if (productSize && productSize.value) {
        options.size = productSize.value;
      }
      
      // Add to cart
      cart.addItem(currentProduct, quantity, options);
      storage.set('cart', cart.toJSON());
      
      // Update cart count
      updateCartCount();
      
      // Show notification
      showNotification(`${currentProduct.name} added to cart!`, 'success');
    }
    
    function updateFeaturedImage(index) {
      if (featuredImage && currentProduct && currentProduct.imageUrls[index]) {
        featuredImage.src = currentProduct.imageUrls[index];
      }
    }
    
    function calculateAverageRating() {
      if (!currentProduct || !currentProduct.reviews || currentProduct.reviews.length === 0) {
        return 0;
      }
      
      const totalRating = currentProduct.reviews.reduce((sum, review) => sum + review.rating, 0);
      return (totalRating / currentProduct.reviews.length).toFixed(1);
    }
    
    function generateStarsHtml(rating, large = false) {
      let html = '';
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const starClass = large ? 'fa-2x' : '';
      
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          html += `<i class="fas fa-star ${starClass}"></i>`;
        } else if (i === fullStars && halfStar) {
          html += `<i class="fas fa-star-half-alt ${starClass}"></i>`;
        } else {
          html += `<i class="far fa-star ${starClass}"></i>`;
        }
      }
      
      return html;
    }
    
    // Add to cart handler for related products
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
    
    // Utility function to get query parameters
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
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