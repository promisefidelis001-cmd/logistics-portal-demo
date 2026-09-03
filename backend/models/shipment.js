const { v4: uuidv4 } = require('uuid');

/**
 * Shipment Model
 * In-memory storage for shipment records
 * In production, replace with MongoDB, PostgreSQL, etc.
 * 
 * Tracking number normalization:
 * - All tracking numbers are stored in UPPERCASE after trim()
 * - All lookups normalize the input to UPPERCASE
 * - This ensures consistent matching regardless of input case
 */

class ShipmentModel {
  constructor() {
    this.shipments = new Map(); // key: trackingNumber (normalized), value: shipment object
    this.initializeDemoData();
  }

  /**
   * Normalize tracking number: trim and uppercase
   * Used consistently for all lookups, creates, updates, deletes
   * @param {string} trackingNumber - Raw tracking number
   * @returns {string|null} - Normalized tracking number or null if invalid
   */
  normalizeTrackingNumber(trackingNumber) {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return null;
    }
    return trackingNumber.trim().toUpperCase();
  }

  /**
   * Initialize demo shipment data for testing
   * Clearly marked as DEMO - separate from production data
   * Tracking numbers are normalized when stored
   */
  initializeDemoData() {
    const demoShipments = [
      {
        id: uuidv4(),
        trackingNumber: 'DEMO-2026-00001',
        status: 'In transit',
        origin: { city: 'New York', state: 'NY', country: 'USA', address: '123 Main St' },
        destination: { city: 'Los Angeles', state: 'CA', country: 'USA', address: '456 Oak Ave' },
        sender: { name: 'Demo Sender', email: 'sender@demo.com', phone: '555-0001' },
        recipient: { name: 'Demo Recipient', email: 'recipient@demo.com', phone: '555-0002' },
        package: {
          description: 'Electronics package',
          weight: 2.5,
          weightUnit: 'kg',
          dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
          contents: 'Laptop and accessories'
        },
        currentLocation: 'New York, NY',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [
          { time: '2026-08-25T09:12:00Z', location: 'New York, NY', event: 'Picked up', details: 'Package received from sender' },
          { time: '2026-08-26T14:30:00Z', location: 'Philadelphia, PA', event: 'In transit', details: 'Arrived at sort facility' }
        ],
        createdAt: new Date('2026-08-25T09:12:00Z'),
        updatedAt: new Date('2026-08-26T14:30:00Z'),
        isDemoData: true
      },
      {
        id: uuidv4(),
        trackingNumber: 'DEMO-2026-00002',
        status: 'Delivered',
        origin: { city: 'Chicago', state: 'IL', country: 'USA', address: '789 Pine Rd' },
        destination: { city: 'Miami', state: 'FL', country: 'USA', address: '321 Beach Blvd' },
        sender: { name: 'Demo Sender 2', email: 'sender2@demo.com', phone: '555-0003' },
        recipient: { name: 'Demo Recipient 2', email: 'recipient2@demo.com', phone: '555-0004' },
        package: {
          description: 'Documents',
          weight: 0.5,
          weightUnit: 'kg',
          dimensions: { length: 30, width: 20, height: 2, unit: 'cm' },
          contents: 'Legal documents'
        },
        currentLocation: 'Miami, FL',
        estimatedDelivery: new Date('2026-08-24T11:00:00Z').toISOString(),
        timeline: [
          { time: '2026-08-24T08:00:00Z', location: 'Chicago, IL', event: 'Picked up', details: 'Package received from sender' },
          { time: '2026-08-24T11:00:00Z', location: 'Miami, FL', event: 'Delivered', details: 'Delivered to recipient' }
        ],
        createdAt: new Date('2026-08-24T08:00:00Z'),
        updatedAt: new Date('2026-08-24T11:00:00Z'),
        isDemoData: true
      }
    ];

    demoShipments.forEach(shipment => {
      const normalizedTN = this.normalizeTrackingNumber(shipment.trackingNumber);
      this.shipments.set(normalizedTN, shipment);
    });

    console.log(`[SHIPMENT] Initialized ${demoShipments.length} demo shipments`);
  }

  /**
   * Create a new shipment
   * Tracking number is normalized before storage and duplicate check
   */
  create(shipmentData) {
    try {
      const normalizedTN = this.normalizeTrackingNumber(shipmentData.trackingNumber);

      if (!normalizedTN) {
        return {
          success: false,
          error: 'Invalid tracking number'
        };
      }

      // Check if tracking number already exists (using normalized version)
      if (this.shipments.has(normalizedTN)) {
        return {
          success: false,
          error: 'Shipment with this tracking number already exists'
        };
      }

      const shipment = {
        id: uuidv4(),
        trackingNumber: normalizedTN, // Store normalized version
        status: shipmentData.status || 'Picked up',
        origin: shipmentData.origin,
        destination: shipmentData.destination,
        sender: shipmentData.sender,
        recipient: shipmentData.recipient,
        package: shipmentData.package,
        currentLocation: `${shipmentData.origin.city}, ${shipmentData.origin.state}`,
        estimatedDelivery: shipmentData.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [
          {
            time: new Date().toISOString(),
            location: `${shipmentData.origin.city}, ${shipmentData.origin.state}`,
            event: 'Shipment created',
            details: 'Package ready for pickup'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDemoData: false
      };

      this.shipments.set(normalizedTN, shipment);

      return {
        success: true,
        shipment: this.sanitize(shipment)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get shipment by tracking number (public - minimal info for customers)
   * Normalizes tracking number for lookup
   */
  getByTrackingNumber(trackingNumber) {
    const normalizedTN = this.normalizeTrackingNumber(trackingNumber);
    if (!normalizedTN) {
      return null;
    }
    const shipment = this.shipments.get(normalizedTN);
    if (!shipment) {
      return null;
    }
    return this.sanitizeForPublic(shipment);
  }

  /**
   * Get shipment by tracking number (admin - full info)
   * Normalizes tracking number for lookup
   */
  getByTrackingNumberAdmin(trackingNumber) {
    const normalizedTN = this.normalizeTrackingNumber(trackingNumber);
    if (!normalizedTN) {
      return null;
    }
    const shipment = this.shipments.get(normalizedTN);
    if (!shipment) {
      return null;
    }
    return this.sanitize(shipment);
  }

  /**
   * Get shipment by ID (admin only)
   */
  getById(id) {
    for (const shipment of this.shipments.values()) {
      if (shipment.id === id) {
        return this.sanitize(shipment);
      }
    }
    return null;
  }

  /**
   * Get all shipments (admin only, with optional filtering)
   */
  getAll(filters = {}) {
    const results = [];

    for (const shipment of this.shipments.values()) {
      // Skip demo data if filter requests non-demo only
      if (filters.excludeDemo && shipment.isDemoData) {
        continue;
      }

      // Filter by status if provided
      if (filters.status && shipment.status !== filters.status) {
        continue;
      }

      // Filter by destination city if provided
      if (filters.destinationCity && shipment.destination.city.toLowerCase() !== filters.destinationCity.toLowerCase()) {
        continue;
      }

      // Filter by origin city if provided
      if (filters.originCity && shipment.origin.city.toLowerCase() !== filters.originCity.toLowerCase()) {
        continue;
      }

      results.push(this.sanitize(shipment));
    }

    return results;
  }

  /**
   * Search shipments by tracking number (partial match)
   * Uses normalized tracking number
   */
  search(query) {
    const results = [];
    const normalizedQuery = this.normalizeTrackingNumber(query);

    if (!normalizedQuery) {
      return results;
    }

    for (const shipment of this.shipments.values()) {
      if (shipment.trackingNumber.includes(normalizedQuery)) {
        results.push(this.sanitize(shipment));
      }
    }

    return results;
  }

  /**
   * Update shipment
   * Normalizes tracking number for lookup
   * Does NOT allow changing trackingNumber
   */
  update(trackingNumber, updateData) {
    try {
      const normalizedTN = this.normalizeTrackingNumber(trackingNumber);
      if (!normalizedTN) {
        return {
          success: false,
          error: 'Invalid tracking number'
        };
      }

      const shipment = this.shipments.get(normalizedTN);

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        };
      }

      // Update allowed fields (do NOT allow trackingNumber changes)
      if (updateData.status) shipment.status = updateData.status;
      if (updateData.origin) shipment.origin = { ...shipment.origin, ...updateData.origin };
      if (updateData.destination) shipment.destination = { ...shipment.destination, ...updateData.destination };
      if (updateData.sender) shipment.sender = { ...shipment.sender, ...updateData.sender };
      if (updateData.recipient) shipment.recipient = { ...shipment.recipient, ...updateData.recipient };
      if (updateData.package) shipment.package = { ...shipment.package, ...updateData.package };
      if (updateData.estimatedDelivery) shipment.estimatedDelivery = updateData.estimatedDelivery;

      shipment.updatedAt = new Date();
      // NOTE: createdAt is NEVER modified

      return {
        success: true,
        shipment: this.sanitize(shipment)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update shipment status and add timeline event
   * Normalizes tracking number for lookup
   * Appends to timeline, updates currentLocation
   */
  updateStatus(trackingNumber, newStatus, location, event, details) {
    try {
      const normalizedTN = this.normalizeTrackingNumber(trackingNumber);
      if (!normalizedTN) {
        return {
          success: false,
          error: 'Invalid tracking number'
        };
      }

      const shipment = this.shipments.get(normalizedTN);

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found'
        };
      }

      shipment.status = newStatus;
      shipment.currentLocation = location || shipment.currentLocation;
      shipment.timeline.push({
        time: new Date().toISOString(),
        location: location || `${shipment.destination.city}, ${shipment.destination.state}`,
        event: event || newStatus,
        details: details || ''
      });
      shipment.updatedAt = new Date();
      // NOTE: createdAt is NEVER modified

      return {
        success: true,
        shipment: this.sanitize(shipment)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete shipment
   * Normalizes tracking number for lookup
   */
  delete(trackingNumber) {
    try {
      const normalizedTN = this.normalizeTrackingNumber(trackingNumber);
      if (!normalizedTN) {
        return {
          success: false,
          error: 'Invalid tracking number'
        };
      }

      if (!this.shipments.has(normalizedTN)) {
        return {
          success: false,
          error: 'Shipment not found'
        };
      }

      this.shipments.delete(normalizedTN);

      return {
        success: true,
        message: 'Shipment deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sanitize shipment for admin (remove internal fields but keep all data)
   */
  sanitize(shipment) {
    const { ...safe } = shipment;
    return safe;
  }

  /**
   * Sanitize shipment for public (customer-facing, minimal info)
   * Does NOT include: sender/recipient names/emails, package contents, internal IDs
   */
  sanitizeForPublic(shipment) {
    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      currentLocation: shipment.currentLocation,
      origin: shipment.origin,
      destination: shipment.destination,
      estimatedDelivery: shipment.estimatedDelivery,
      timeline: shipment.timeline,
      updatedAt: shipment.updatedAt
    };
  }

  /**
   * Get count of shipments
   */
  count() {
    return this.shipments.size;
  }
}

// Export singleton instance
module.exports = new ShipmentModel();
