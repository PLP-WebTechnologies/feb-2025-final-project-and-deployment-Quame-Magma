class User {
    constructor(id, firstName, lastName, email, phone = '') {
      this.id = id;                     // Unique identifier (string)
      this.firstName = firstName;       // First name (string)
      this.lastName = lastName;         // Last name (string)
      this.email = email;               // Email address (string)
      this.phone = phone;               // Phone number (string)
      this.addresses = [];              // User addresses (array)
      this.orders = [];                 // Order history (array)
      this.wishlist = [];               // Product IDs in wishlist (array)
      this.createdAt = new Date();      // Account creation date (Date)
      this.lastLogin = new Date();      // Last login timestamp (Date)
      this.isGuest = false;             // Guest user flag (boolean)
    }
  
    // Get user's full name
    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  
    // Add shipping address
    addAddress(address) {
      this.addresses.push(address);
    }
  
    // Remove address
    removeAddress(addressId) {
      const index = this.addresses.findIndex(address => address.id === addressId);
      if (index !== -1) {
        this.addresses.splice(index, 1);
        return true;
      }
      return false;
    }
  
    // Add product to wishlist
    addToWishlist(productId) {
      if (!this.wishlist.includes(productId)) {
        this.wishlist.push(productId);
        return true;
      }
      return false;
    }
  
    // Remove product from wishlist
    removeFromWishlist(productId) {
      const index = this.wishlist.indexOf(productId);
      if (index !== -1) {
        this.wishlist.splice(index, 1);
        return true;
      }
      return false;
    }
  
    // Check if product is in wishlist
    isInWishlist(productId) {
      return this.wishlist.includes(productId);
    }
  
    // Add order to history
    addOrder(order) {
      this.orders.push(order);
    }
  
    // Get order by ID
    getOrder(orderId) {
      return this.orders.find(order => order.id === orderId);
    }
  
    // Update user profile
    updateProfile(data) {
      if (data.firstName) this.firstName = data.firstName;
      if (data.lastName) this.lastName = data.lastName;
      if (data.phone) this.phone = data.phone;
      // Email change would typically require verification in a real app
    }
  
    // Static method to create guest user
    static createGuest() {
      const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
      const user = new User(guestId, 'Guest', 'User', '');
      user.isGuest = true;
      return user;
    }
  
    // Convert user to JSON for storage
    toJSON() {
      return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        addresses: this.addresses,
        orders: this.orders,
        wishlist: this.wishlist,
        createdAt: this.createdAt.toISOString(),
        lastLogin: this.lastLogin.toISOString(),
        isGuest: this.isGuest
      };
    }
  
    // Create User from JSON data
    static fromJSON(data) {
      const user = new User(
        data.id,
        data.firstName,
        data.lastName,
        data.email,
        data.phone
      );
      
      user.addresses = data.addresses || [];
      user.orders = data.orders || [];
      user.wishlist = data.wishlist || [];
      user.createdAt = new Date(data.createdAt);
      user.lastLogin = new Date(data.lastLogin);
      user.isGuest = data.isGuest || false;
      
      return user;
    }
  }
  
  class Address {
    constructor(id, firstName, lastName, company = '') {
      this.id = id;                // Unique identifier (string)
      this.firstName = firstName;  // First name for address (string)
      this.lastName = lastName;    // Last name for address (string)
      this.company = company;      // Company name (string, optional)
      this.address1 = '';          // Street address line 1 (string)
      this.address2 = '';          // Street address line 2 (string, optional)
      this.city = '';              // City (string)
      this.state = '';             // State/province/region (string)
      this.postcode = '';          // Postal/ZIP code (string)
      this.country = '';           // Country (string)
      this.phone = '';             // Phone number (string)
      this.isDefault = false;      // Default address flag (boolean)
    }
  
    // Format address as string
    getFormattedAddress() {
      const parts = [
        this.firstName + ' ' + this.lastName,
        this.company,
        this.address1,
        this.address2,
        `${this.city}, ${this.state} ${this.postcode}`,
        this.country
      ];
  
      return parts.filter(part => part && part.trim() !== '').join('\n');
    }
  
    // Convert to JSON
    toJSON() {
      return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        company: this.company,
        address1: this.address1,
        address2: this.address2,
        city: this.city,
        state: this.state,
        postcode: this.postcode,
        country: this.country,
        phone: this.phone,
        isDefault: this.isDefault
      };
    }
  
    // Create from JSON
    static fromJSON(data) {
      const address = new Address(
        data.id,
        data.firstName,
        data.lastName,
        data.company
      );
      
      address.address1 = data.address1 || '';
      address.address2 = data.address2 || '';
      address.city = data.city || '';
      address.state = data.state || '';
      address.postcode = data.postcode || '';
      address.country = data.country || '';
      address.phone = data.phone || '';
      address.isDefault = data.isDefault || false;
      
      return address;
    }
  }