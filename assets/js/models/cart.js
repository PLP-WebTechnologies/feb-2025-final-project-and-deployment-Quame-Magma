class CartItem {
    constructor(product, quantity = 1, options = {}) {
      this.productId = product.id;
      this.name = product.name;
      this.price = product.price;
      this.image = product.imageUrls[0];
      this.quantity = quantity;
      this.options = options; // Size, color, etc.
    }
  
    getSubtotal() {
      return this.price * this.quantity;
    }
  
    toJSON() {
      return {
        productId: this.productId,
        name: this.name,
        price: this.price,
        image: this.image,
        quantity: this.quantity,
        options: this.options
      };
    }
  
    static fromJSON(data) {
      const item = new CartItem(
        { id: data.productId, name: data.name, price: data.price, imageUrls: [data.image] },
        data.quantity,
        data.options
      );
      return item;
    }
  }
  
  class Cart {
    constructor() {
      this.items = [];
      this.discountCode = null;
      this.discountAmount = 0;
    }
  
    addItem(product, quantity = 1, options = {}) {
      // Check if product is already in cart
      const existingItemIndex = this.items.findIndex(item => 
        item.productId === product.id && this.areOptionsEqual(item.options, options)
      );
  
      if (existingItemIndex !== -1) {
        // Update quantity if product already exists
        this.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if product doesn't exist in cart
        this.items.push(new CartItem(product, quantity, options));
      }
    }
  
    updateItemQuantity(index, quantity) {
      if (index >= 0 && index < this.items.length) {
        this.items[index].quantity = Math.max(1, quantity);
        return true;
      }
      return false;
    }
  
    removeItem(index) {
      if (index >= 0 && index < this.items.length) {
        this.items.splice(index, 1);
        return true;
      }
      return false;
    }
  
    clearCart() {
      this.items = [];
      this.discountCode = null;
      this.discountAmount = 0;
    }
  
    getItemCount() {
      return this.items.reduce((total, item) => total + item.quantity, 0);
    }
  
    getSubtotal() {
      return this.items.reduce((subtotal, item) => subtotal + item.getSubtotal(), 0);
    }
  
    getShippingCost() {
      // Simple flat rate shipping
      const subtotal = this.getSubtotal();
      if (subtotal >= 100) {
        return 0; // Free shipping over $100
      }
      return 10; // $10 flat rate
    }
  
    applyDiscount(code) {
      // Simple discount logic - in real app would validate against backend
      if (code === 'WELCOME20') {
        this.discountCode = code;
        this.discountAmount = this.getSubtotal() * 0.2; // 20% off
        return true;
      }
      return false;
    }
  
    removeDiscount() {
      this.discountCode = null;
      this.discountAmount = 0;
    }
  
    getTotal() {
      return this.getSubtotal() + this.getShippingCost() - this.discountAmount;
    }
  
    areOptionsEqual(options1, options2) {
      if (!options1 && !options2) return true;
      if (!options1 || !options2) return false;
      
      const keys1 = Object.keys(options1);
      const keys2 = Object.keys(options2);
      
      if (keys1.length !== keys2.length) return false;
      
      return keys1.every(key => 
        options2.hasOwnProperty(key) && options1[key] === options2[key]
      );
    }
  
    toJSON() {
      return {
        items: this.items.map(item => item.toJSON()),
        discountCode: this.discountCode,
        discountAmount: this.discountAmount
      };
    }
  
    static fromJSON(data) {
      const cart = new Cart();
      cart.items = data.items.map(itemData => CartItem.fromJSON(itemData));
      cart.discountCode = data.discountCode;
      cart.discountAmount = data.discountAmount;
      return cart;
    }
  }