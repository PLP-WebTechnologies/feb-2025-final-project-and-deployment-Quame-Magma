class Product {
    constructor(id, name, price, description, category, imageUrls, inventory, features = [], reviews = [], relatedProducts = []) {
      this.id = id;                         // Unique identifier (string)
      this.name = name;                     // Product name (string)
      this.price = price;                   // Price in currency units (number)
      this.description = description;       // Full product description (string)
      this.category = category;             // Product category (string/object)
      this.imageUrls = imageUrls;           // Array of image URLs (array)
      this.inventory = inventory;           // Available stock quantity (number)
      this.features = features;             // Product features/specifications (array)
      this.reviews = reviews;               // Customer reviews (array)
      this.relatedProducts = relatedProducts; // Related product IDs (array)
      this.createdAt = new Date();          // Creation timestamp (Date)
      this.updatedAt = new Date();          // Last update timestamp (Date)
    }
  
    // Gets formatted price with currency symbol
    getFormattedPrice(currencySymbol = '$') {
      return `${currencySymbol}${this.price.toFixed(2)}`;
    }
  
    // Checks if product is in stock
    isInStock() {
      return this.inventory > 0;
    }
  
    // Decreases inventory by specified quantity
    decreaseInventory(quantity = 1) {
      if (this.inventory >= quantity) {
        this.inventory -= quantity;
        this.updatedAt = new Date();
        return true;
      }
      return false;
    }
  
    // Calculates average rating from reviews
    getAverageRating() {
      if (this.reviews.length === 0) return 0;
      
      const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      return (totalRating / this.reviews.length).toFixed(1);
    }
  
    // Adds a new review to the product
    addReview(review) {
      this.reviews.push(review);
      this.updatedAt = new Date();
    }
  
    // Converts product to JSON format for storage/transmission
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        price: this.price,
        description: this.description,
        category: this.category,
        imageUrls: this.imageUrls,
        inventory: this.inventory,
        features: this.features,
        reviews: this.reviews.map(review => typeof review.toJSON === 'function' ? review.toJSON() : review),
        relatedProducts: this.relatedProducts,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString()
      };
    }
  
    // Creates a Product instance from JSON data
    static fromJSON(data) {
      const product = new Product(
        data.id,
        data.name,
        data.price,
        data.description,
        data.category,
        data.imageUrls,
        data.inventory,
        data.features,
        data.reviews,
        data.relatedProducts
      );
      
      product.createdAt = new Date(data.createdAt);
      product.updatedAt = new Date(data.updatedAt);
      
      return product;
    }
  }