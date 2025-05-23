class ApiService {
    constructor() {
      // In a real application, this would be your API base URL
      this.baseUrl = 'https://api.example.com';
      
      // For this demo, we'll use localStorage to simulate a backend
      this.initializeData();
    }
  
    initializeData() {
      // Check if products data exists in localStorage
      if (!localStorage.getItem('shopease_products')) {
        // If not, initialize with dummy data
        const products = this.generateDummyProducts();
        localStorage.setItem('shopease_products', JSON.stringify(products));
      }
    }
  
    async getProducts(params = {}) {
      // Simulate API delay
      await this.delay(500);
  
      // Get products from localStorage
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      
      // Apply filters and sorting based on params
      let filteredProducts = [...products];
      
      // Filter by category
      if (params.category && params.category !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.category.toLowerCase() === params.category.toLowerCase()
        );
      }
      
      // Filter by price range
      if (params.maxPrice) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= params.maxPrice
        );
      }
      
      // Filter by minimum rating
      if (params.minRating) {
        filteredProducts = filteredProducts.filter(product => {
          const avgRating = product.reviews.length > 0 
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length 
            : 0;
          return avgRating >= params.minRating;
        });
      }
      
      // Filter by inventory
      if (params.inStock) {
        filteredProducts = filteredProducts.filter(product => product.inventory > 0);
      }
      
      // Apply sorting
      if (params.sort) {
        switch (params.sort) {
          case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            filteredProducts.sort((a, b) => {
              const avgA = a.reviews.length > 0 
                ? a.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length 
                : 0;
              const avgB = b.reviews.length > 0 
                ? b.reviews.reduce((sum, review) => sum + review.rating, 0) / b.reviews.length 
                : 0;
              return avgB - avgA;
            });
            break;
          case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          default:
            // Default sorting (featured)
            break;
        }
      }
      
      // Pagination
      const page = params.page || 1;
      const perPage = params.perPage || 8;
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedProducts,
        total: filteredProducts.length,
        page: page,
        perPage: perPage,
        totalPages: Math.ceil(filteredProducts.length / perPage)
      };
    }
  
    async getProductById(id) {
      // Simulate API delay
      await this.delay(300);
  
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      const product = products.find(p => p.id === id);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    }
  
    async getFeaturedProducts(limit = 4) {
      // Simulate API delay
      await this.delay(300);
  
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      
      // Return a sample of products as "featured"
      return products.slice(0, limit);
    }
  
    async getRelatedProducts(productId, limit = 4) {
      // Simulate API delay
      await this.delay(300);
  
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      const currentProduct = products.find(p => p.id === productId);
      
      if (!currentProduct) {
        return [];
      }
      
      // Filter products in same category (excluding current product)
      const relatedProducts = products.filter(p => 
        p.id !== productId && p.category === currentProduct.category
      ).slice(0, limit);
      
      return relatedProducts;
    }
  
    async addReview(productId, review) {
      // Simulate API delay
      await this.delay(500);
  
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      // Add review with a timestamp
      const newReview = {
        ...review,
        date: new Date().toISOString(),
        id: 'rev_' + Math.random().toString(36).substr(2, 9)
      };
      
      products[productIndex].reviews.push(newReview);
      localStorage.setItem('shopease_products', JSON.stringify(products));
      
      return newReview;
    }
  
    async processOrder(order) {
      // Simulate API delay to process order
      await this.delay(1000);
      
      // In a real application, you would send the order to your backend
      // For this demo, we'll just update product inventory
      const products = JSON.parse(localStorage.getItem('shopease_products') || '[]');
      
      // Update inventory for each product in order
      order.items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          products[productIndex].inventory = Math.max(0, products[productIndex].inventory - item.quantity);
        }
      });
      
      localStorage.setItem('shopease_products', JSON.stringify(products));
      
      // Generate a fake order ID
      const orderId = 'ORD' + Date.now();
      
      return {
        success: true,
        orderId: orderId,
        message: 'Order processed successfully'
      };
    }
  
    // Utility method to simulate network delay
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    // Generate dummy products data for demo purposes
    generateDummyProducts() {
      const categories = ['electronics', 'fashion', 'home', 'beauty'];
      const products = [];
      
      // Electronics
      products.push({
        id: 'prod_1',
        name: 'Premium Noise-Cancelling Headphones',
        price: 129.99,
        description: 'Experience crystal-clear audio with our premium noise-cancelling headphones. Perfect for travel, work, or enjoying your favorite music without distractions. Features include Bluetooth 5.2 connectivity, 30-hour battery life, and comfortable over-ear design.',
        category: 'electronics',
        imageUrls: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop'
        ],
        inventory: 45,
        features: [
          { name: 'Connectivity', value: 'Bluetooth 5.2' },
          { name: 'Battery Life', value: '30 hours' },
          { name: 'Noise Cancellation', value: 'Active (ANC)' },
          { name: 'Charging', value: 'USB-C' },
          { name: 'Weight', value: '250g' }
        ],
        reviews: [
          { id: 'rev_1', user: 'AudioEnthusiast', rating: 4.5, title: 'Great sound quality!', comment: 'These headphones have excellent sound quality and the noise cancellation works very well. Battery life is impressive too.', date: '2025-04-15T14:22:00Z', verified: true },
          { id: 'rev_2', user: 'TravellerJane', rating: 5, title: 'Perfect for flights', comment: 'Used these on a 10-hour flight and they were amazing. Comfortable to wear for long periods and the noise cancellation made a huge difference.', date: '2025-04-02T09:15:00Z', verified: true }
        ],
        relatedProducts: ['prod_2', 'prod_5'],
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z'
      });
      
      products.push({
        id: 'prod_2',
        name: 'Ultra HD Smart TV - 55"',
        price: 799.99,
        description: 'Bring the cinema experience home with our Ultra HD Smart TV. This 55-inch 4K display delivers stunning visuals with vibrant colors and deep contrasts. Packed with smart features, streaming capabilities, and voice control, this TV transforms your entertainment experience.',
        category: 'electronics',
        imageUrls: [
          'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1577979749830-f1d742b96791?w=600&auto=format&fit=crop'
        ],
        inventory: 12,
        features: [
          { name: 'Screen Size', value: '55 inches' },
          { name: 'Resolution', value: '4K Ultra HD' },
          { name: 'Smart Features', value: 'Built-in streaming apps' },
          { name: 'Connectivity', value: 'HDMI, USB, Wi-Fi, Bluetooth' },
          { name: 'Audio', value: 'Dolby Atmos compatible' }
        ],
        reviews: [
          { id: 'rev_3', user: 'MovieBuff', rating: 5, title: 'Incredible picture quality', comment: 'The picture quality is outstanding and the smart features work flawlessly. Setup was easy and the remote is intuitive.', date: '2025-04-10T18:45:00Z', verified: true },
          { id: 'rev_4', user: 'TechLover', rating: 4, title: 'Great TV, but UI could be better', comment: 'Picture and sound quality are excellent, but the user interface is a bit sluggish at times. Overall still very satisfied.', date: '2025-03-22T11:30:00Z', verified: true }
        ],
        relatedProducts: ['prod_1', 'prod_3'],
        createdAt: '2025-01-20T14:15:00Z',
        updatedAt: '2025-01-20T14:15:00Z'
      });
      
      products.push({
        id: 'prod_3',
        name: 'Professional Camera DSLR Kit',
        price: 1299.99,
        description: 'Capture life\'s moments with exceptional clarity using our Professional DSLR Camera Kit. Whether you\'re an aspiring photographer or a seasoned pro, this camera delivers stunning photos and videos. Includes camera body, 18-55mm lens, camera bag, and accessories.',
        category: 'electronics',
        imageUrls: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop'
        ],
        inventory: 8,
        features: [
          { name: 'Sensor', value: '24.2 Megapixel CMOS' },
          { name: 'Video', value: '4K UHD' },
          { name: 'Connectivity', value: 'Wi-Fi, Bluetooth, HDMI' },
          { name: 'Battery Life', value: 'Approx. 1,200 shots' },
          { name: 'Weight', value: '765g (body only)' }
        ],
        reviews: [
          { id: 'rev_5', user: 'PhotoEnthusiast', rating: 5, title: 'Professional quality at a reasonable price', comment: 'This camera exceeds expectations. The image quality is excellent and the controls are intuitive. Perfect upgrade from my previous camera.', date: '2025-04-05T15:10:00Z', verified: true }
        ],
        relatedProducts: ['prod_2', 'prod_1'],
        createdAt: '2025-02-05T09:45:00Z',
        updatedAt: '2025-02-05T09:45:00Z'
      });
      
      // Fashion
      products.push({
        id: 'prod_4',
        name: 'Classic Leather Watch',
        price: 89.99,
        description: 'A timeless accessory for any occasion, our Classic Leather Watch combines elegant design with reliable functionality. The genuine leather strap and stainless steel case provide durability, while the minimalist dial ensures it pairs well with both casual and formal attire.',
        category: 'fashion',
        imageUrls: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&auto=format&fit=crop'
        ],
        inventory: 35,
        features: [
          { name: 'Movement', value: 'Japanese Quartz' },
          { name: 'Case Material', value: 'Stainless Steel' },
          { name: 'Band Material', value: 'Genuine Leather' },
          { name: 'Water Resistance', value: '30 meters' },
          { name: 'Warranty', value: '2 years' }
        ],
        reviews: [
          { id: 'rev_6', user: 'StyleConscious', rating: 4, title: 'Elegant and versatile', comment: 'This watch looks great with everything from jeans to suits. The leather is high quality and very comfortable.', date: '2025-03-12T10:15:00Z', verified: true },
          { id: 'rev_7', user: 'WatchCollector', rating: 4.5, title: 'Good entry-level watch', comment: 'Solid construction and keeps good time. The design is classic and will never go out of style.', date: '2025-02-28T16:40:00Z', verified: true }
        ],
        relatedProducts: ['prod_5', 'prod_7'],
        createdAt: '2025-01-25T11:20:00Z',
        updatedAt: '2025-01-25T11:20:00Z'
      });
      
      products.push({
        id: 'prod_5',
        name: 'Premium Leather Wallet',
        price: 49.99,
        description: 'Keep your essentials organized with our Premium Leather Wallet. Crafted from top-grain leather, this wallet features multiple card slots, a bill compartment, and RFID protection. The slim profile fits comfortably in your pocket while providing ample storage for your daily needs.',
        category: 'fashion',
        imageUrls: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop'
        ],
        inventory: 50,
        features: [
          { name: 'Material', value: 'Top-grain Leather' },
          { name: 'Card Slots', value: '8' },
          { name: 'Bill Compartments', value: '2' },
          { name: 'RFID Protection', value: 'Yes' },
          { name: 'Dimensions', value: '9cm x 11cm x 1.5cm' }
        ],
        reviews: [
          { id: 'rev_8', user: 'BusinessPro', rating: 5, title: 'Perfect business wallet', comment: 'This wallet holds everything I need without being bulky. The leather is clearly high quality and the stitching is flawless.', date: '2025-04-18T09:25:00Z', verified: true }
        ],
        relatedProducts: ['prod_4', 'prod_8'],
        createdAt: '2025-01-30T13:45:00Z',
        updatedAt: '2025-01-30T13:45:00Z'
      });
      
      products.push({
        id: 'prod_6',
        name: 'Designer Sunglasses',
        price: 129.99,
        description: 'Protect your eyes in style with our Designer Sunglasses. These unisex sunglasses feature polarized lenses that reduce glare and UV protection to shield your eyes from harmful rays. The lightweight yet durable frame ensures comfort for all-day wear.',
        category: 'fashion',
        imageUrls: [
          'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop'
        ],
        inventory: 28,
        features: [
          { name: 'Lens Type', value: 'Polarized' },
          { name: 'UV Protection', value: '100%' },
          { name: 'Frame Material', value: 'Acetate' },
          { name: 'Style', value: 'Unisex' },
          { name: 'Includes', value: 'Case and Cleaning Cloth' }
        ],
        reviews: [
          { id: 'rev_9', user: 'BeachLover', rating: 5, title: 'Great for bright days', comment: 'These sunglasses are amazing - they completely eliminate glare and are super comfortable. The design is stylish and gets lots of compliments.', date: '2025-03-05T14:30:00Z', verified: true },
          { id: 'rev_10', user: 'FashionForward', rating: 4, title: 'Stylish and functional', comment: 'Love the look of these glasses! The polarization works well for driving and outdoor activities. The case it comes with is also nice quality.', date: '2025-02-20T11:15:00Z', verified: true }
        ],
        relatedProducts: ['prod_4', 'prod_5'],
        createdAt: '2025-02-10T15:30:00Z',
        updatedAt: '2025-02-10T15:30:00Z'
      });
      
      // Home
      products.push({
        id: 'prod_7',
        name: 'Smart Home Hub',
        price: 149.99,
        description: 'Transform your house into a smart home with our versatile Smart Home Hub. Control lights, temperature, security systems, and compatible appliances from one intuitive interface. Compatible with major voice assistants and hundreds of smart devices for a truly connected home experience.',
        category: 'home',
        imageUrls: [
          'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1556669546-9170c1998ba8?w=600&auto=format&fit=crop'
        ],
        inventory: 20,
        features: [
          { name: 'Compatibility', value: 'Works with 1000+ devices' },
          { name: 'Voice Control', value: 'All major voice assistants' },
          { name: 'Connectivity', value: 'Wi-Fi, Bluetooth, Zigbee' },
          { name: 'Setup', value: 'Simple smartphone setup' },
          { name: 'Power', value: 'AC adapter (included)' }
        ],
        reviews: [
          { id: 'rev_11', user: 'TechHome', rating: 4.5, title: 'Center of my smart home', comment: 'This hub has unified all my smart devices seamlessly. The app interface is intuitive and I love being able to create custom routines.', date: '2025-04-01T19:20:00Z', verified: true },
          { id: 'rev_12', user: 'SmartLiving', rating: 4, title: 'Good but has occasional connectivity issues', comment: 'When it works, it\'s excellent. The interface is user-friendly and it integrates well with all my devices. Occasionally needs rebooting though.', date: '2025-03-15T09:10:00Z', verified: true }
        ],
        relatedProducts: ['prod_8', 'prod_1'],
        createdAt: '2025-02-12T10:45:00Z',
        updatedAt: '2025-02-12T10:45:00Z'
      });
      
      products.push({
        id: 'prod_8',
        name: 'Luxury Scented Candle Set',
        price: 39.99,
        description: 'Create a warm and inviting atmosphere with our Luxury Scented Candle Set. This set of three premium candles includes soothing lavender, refreshing citrus, and warm vanilla scents. Each candle is made from natural soy wax for a clean, long-lasting burn that will transform any room.',
        category: 'home',
        imageUrls: [
          'https://images.pexels.com/photos/1832562/pexels-photo-1832562.jpeg?auto=compress&cs=tinysrgb&w=1200',
          'https://images.pexels.com/photos/1832562/pexels-photo-1832562.jpeg?auto=compress&cs=tinysrgb&w=1200'
        ],
        inventory: 40,
        features: [
          { name: 'Material', value: '100% Natural Soy Wax' },
          { name: 'Scents', value: 'Lavender, Citrus, Vanilla' },
          { name: 'Burn Time', value: '40-45 hours each' },
          { name: 'Wick', value: 'Cotton' },
          { name: 'Container', value: 'Glass jars with lids' }
        ],
        reviews: [
          { id: 'rev_13', user: 'RelaxationSeeker', rating: 5, title: 'The perfect gift', comment: 'Gave these as a housewarming gift and the recipients loved them. The scents are sophisticated and not overwhelming.', date: '2025-04-20T20:15:00Z', verified: true },
          { id: 'rev_14', user: 'HomeDecorator', rating: 5, title: 'Beautiful and fragrant', comment: 'These candles look elegant and smell amazing. The scents fill the room without being too strong. Will definitely buy again.', date: '2025-03-25T16:50:00Z', verified: true }
        ],
        relatedProducts: ['prod_9', 'prod_7'],
        createdAt: '2025-02-15T12:30:00Z',
        updatedAt: '2025-02-15T12:30:00Z'
      });
      
      products.push({
        id: 'prod_9',
        name: 'Ergonomic Office Chair',
        price: 249.99,
        description: 'Work in comfort with our Ergonomic Office Chair, designed to provide optimal support during long hours at your desk. Featuring adjustable height, lumbar support, breathable mesh back, and padded armrests, this chair helps improve posture and reduce fatigue for a more productive day.',
        category: 'home',
        imageUrls: [
          'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&auto=format&fit=crop'
        ],
        inventory: 15,
        features: [
          { name: 'Material', value: 'Mesh Back, Fabric Seat' },
          { name: 'Adjustments', value: 'Height, Tilt, Armrests' },
          { name: 'Lumbar Support', value: 'Yes, adjustable' },
          { name: 'Weight Capacity', value: '300 lbs' },
          { name: 'Warranty', value: '5 years' }
        ],
        reviews: [
          { id: 'rev_15', user: 'RemoteWorker', rating: 5, title: 'Best work-from-home purchase', comment: 'After trying several office chairs, this one is by far the most comfortable. The adjustments make it perfect for my height and desk setup.', date: '2025-04-08T11:35:00Z', verified: true },
          { id: 'rev_16', user: 'BackPainSufferer', rating: 4.5, title: 'Great for back pain', comment: 'This chair has significantly reduced my back pain after long workdays. The lumbar support is excellent and all the adjustments help find the perfect position.', date: '2025-03-18T13:25:00Z', verified: true }
        ],
        relatedProducts: ['prod_8', 'prod_7'],
        createdAt: '2025-02-20T09:10:00Z',
        updatedAt: '2025-02-20T09:10:00Z'
      });
      
      // Beauty
      products.push({
        id: 'prod_10',
        name: 'Luxury Skincare Set',
        price: 79.99,
        description: 'Pamper your skin with our comprehensive Luxury Skincare Set. This collection includes a gentle cleanser, hydrating toner, brightening serum, and moisturizer with SPF, all formulated with natural ingredients to reveal your skin\'s natural radiance. Suitable for all skin types and perfect for your daily routine.',
        category: 'beauty',
        imageUrls: [
          'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1656327423297-c43471d466f3?w=600&auto=format&fit=crop'
        ],
        inventory: 30,
        features: [
          { name: 'Skincare Steps', value: '4-step system' },
          { name: 'Key Ingredients', value: 'Hyaluronic Acid, Vitamin C, Aloe' },
          { name: 'Skin Type', value: 'All skin types' },
          { name: 'Free From', value: 'Parabens, Sulfates, Artificial Fragrances' },
          { name: 'Size', value: '50ml each' }
        ],
        reviews: [
          { id: 'rev_17', user: 'SkincareLover', rating: 4.5, title: 'Transformed my routine', comment: 'This set has simplified my skincare routine while giving amazing results. My skin looks more radiant and feels softer after just two weeks.', date: '2025-04-22T10:40:00Z', verified: true },
          { id: 'rev_18', user: 'SensitiveSkin', rating: 5, title: 'Great for sensitive skin', comment: 'Finally found products that don\'t irritate my sensitive skin! The moisturizer is especially good and doesn\'t feel greasy.', date: '2025-04-05T08:20:00Z', verified: true }
        ],
        relatedProducts: ['prod_11', 'prod_12'],
        createdAt: '2025-02-25T14:50:00Z',
        updatedAt: '2025-02-25T14:50:00Z'
      });
      
      products.push({
        id: 'prod_11',
        name: 'Professional Haircare Collection',
        price: 59.99,
        description: 'Achieve salon-quality results at home with our Professional Haircare Collection. This set includes a nourishing shampoo, hydrating conditioner, and revitalizing hair mask, all formulated to restore shine, reduce frizz, and strengthen hair from within. Suitable for all hair types and color-treated hair.',
        category: 'beauty',
        imageUrls: [
          'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1631730486572-5183a8c25a9b?w=600&auto=format&fit=crop'
        ],
        inventory: 25,
        features: [
          { name: 'Hair Type', value: 'All hair types' },
          { name: 'Key Benefits', value: 'Hydration, Strength, Shine' },
          { name: 'Key Ingredients', value: 'Argan Oil, Keratin, Biotin' },
          { name: 'Free From', value: 'Sulfates, Silicones, Parabens' },
          { name: 'Size', value: '250ml shampoo, 250ml conditioner, 200ml mask' }
        ],
        reviews: [
          { id: 'rev_19', user: 'CurlyHaired', rating: 5, title: 'Amazing for curly hair', comment: 'This collection has transformed my curls! Less frizz, more definition, and my hair feels so much healthier.', date: '2025-04-15T14:20:00Z', verified: true },
          { id: 'rev_20', user: 'HairEnthusiast', rating: 4, title: 'Good results but strong scent', comment: 'The products work well and my hair looks great, but the fragrance is a bit strong for my preference. Otherwise, very satisfied!', date: '2025-03-28T19:45:00Z', verified: true }
        ],
        relatedProducts: ['prod_10', 'prod_12'],
        createdAt: '2025-03-01T11:15:00Z',
        updatedAt: '2025-03-01T11:15:00Z'
      });
      
      products.push({
        id: 'prod_12',
        name: 'Premium Makeup Brush Set',
        price: 45.99,
        description: 'Apply makeup like a professional with our Premium Makeup Brush Set. This comprehensive 12-piece collection includes brushes for foundation, concealer, powder, contour, blush, and eyeshadow application. The soft synthetic bristles ensure smooth application while the ergonomic handles provide precise control.',
        category: 'beauty',
        imageUrls: [
          'https://images.pexels.com/photos/1926620/pexels-photo-1926620.jpeg?auto=compress&cs=tinysrgb&w=600&auto=format&fit=crop',
          'https://images.pexels.com/photos/1926620/pexels-photo-1926620.jpeg?auto=compress&cs=tinysrgb&w=600&auto=format&fit=crop'
        ],
        inventory: 35,
        features: [
          { name: 'Brush Count', value: '12 pieces' },
          { name: 'Bristle Material', value: 'Synthetic, Cruelty-Free' },
          { name: 'Handle Material', value: 'Lightweight Wood' },
          { name: 'Includes', value: 'Travel Case' },
          { name: 'Care', value: 'Easy to clean' }
        ],
        reviews: [
          { id: 'rev_21', user: 'MakeupArtist', rating: 4.5, title: 'Great quality for the price', comment: 'The brushes are surprisingly high quality for this price point. They don\'t shed and apply makeup beautifully. The case is also very convenient.', date: '2025-04-18T15:30:00Z', verified: true },
          { id: 'rev_22', user: 'BeautyBlogger', rating: 5, title: 'Perfect starter set', comment: 'I recommend these brushes to all my followers. They\'re soft, versatile, and work well with all types of makeup products. A must-have!', date: '2025-03-30T12:10:00Z', verified: true }
        ],
        relatedProducts: ['prod_10', 'prod_11'],
        createdAt: '2025-03-05T16:25:00Z',
        updatedAt: '2025-03-05T16:25:00Z'
      });
      
      return products;
    }
  }  