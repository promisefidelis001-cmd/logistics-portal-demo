const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * In-memory admin store
 * In production, replace with a real database (MongoDB, PostgreSQL, etc.)
 */
class AdminModel {
  constructor() {
    this.admins = new Map();
    this.initializeSuperAdmin();
  }

  /**
   * Initialize default super admin from environment variables
   */
  initializeSuperAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@logistics-portal.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password_in_production';

    // Only create if not already exists
    if (!this.admins.has(adminEmail)) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      this.admins.set(adminEmail, {
        id: uuidv4(),
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'super_admin',
        createdAt: new Date(),
        lastLogin: null,
        isActive: true
      });

      console.log(`[ADMIN] Super admin created: ${adminEmail}`);
    }
  }

  /**
   * Find admin by email
   */
  findByEmail(email) {
    return this.admins.get(email) || null;
  }

  /**
   * Find admin by ID
   */
  findById(id) {
    for (const admin of this.admins.values()) {
      if (admin.id === id) {
        return admin;
      }
    }
    return null;
  }

  /**
   * Create new admin
   */
  create(email, passwordHash, role = 'admin') {
    if (this.admins.has(email)) {
      return {
        success: false,
        error: 'Admin with this email already exists'
      };
    }

    const admin = {
      id: uuidv4(),
      email,
      passwordHash,
      role,
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };

    this.admins.set(email, admin);
    return {
      success: true,
      admin
    };
  }

  /**
   * Update admin last login
   */
  updateLastLogin(id) {
    const admin = this.findById(id);
    if (admin) {
      admin.lastLogin = new Date();
      return true;
    }
    return false;
  }

  /**
   * Verify password
   */
  verifyPassword(passwordHash, plainPassword) {
    return bcrypt.compareSync(plainPassword, passwordHash);
  }

  /**
   * Hash password
   */
  hashPassword(plainPassword) {
    return bcrypt.hashSync(plainPassword, 10);
  }

  /**
   * Get all admins (excluding passwords)
   */
  getAll() {
    const admins = [];
    for (const admin of this.admins.values()) {
      admins.push(this.sanitize(admin));
    }
    return admins;
  }

  /**
   * Remove sensitive data from admin object
   */
  sanitize(admin) {
    const { passwordHash, ...safe } = admin;
    return safe;
  }
}

// Export singleton instance
module.exports = new AdminModel();
