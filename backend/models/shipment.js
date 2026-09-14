const { v4: uuidv4 } = require('uuid');

class ShipmentModel {
  constructor() {
    this.shipments = new Map();
    this.initializeDemoData();
  }

  normalizeTrackingNumber(trackingNumber) {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return null;
    }

    return trackingNumber.trim().toUpperCase();
  }

  initializeDemoData() {
    const demoShipments = [
      {
        trackingNumber: 'LXD-2026-00001',
        status: 'In transit',
        origin: {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          address: ''
        },
        destination: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          address: ''
        },
        sender: {
          name: 'Demo Sender',
          email: '',
          phone: ''
        },
        recipient: {
          name: 'Demo Recipient',
          email: '',
          phone: ''
        },
        package: {
          description: 'Demo package',
          weight: 5,
          weightUnit: 'kg',
          dimensions: {
            length: 30,
            width: 20,
            height: 15,
            unit: 'cm'
          },
          contents: 'Demo items'
        },
        estimatedDelivery: '2026-09-20T18:00:00.000Z',
        timeline: [
          {
            timestamp: '2026-08-25T09:12:00.000Z',
            location: 'New York, NY',
            event: 'Picked up',
            details: 'Shipment picked up from sender.'
          },
          {
            timestamp: '2026-08-26T14:30:00.000Z',
            location: 'Philadelphia, PA',
            event: 'In transit',
            details: 'Shipment is moving through the network.'
          },
          {
            timestamp: '2026-08-27T08:10:00.000Z',
            location: 'Baltimore, MD',
            event: 'Arrived at facility',
            details: 'Shipment arrived at processing facility.'
          }
        ],
        isDemoData: true
      },
      {
        trackingNumber: 'LXD-2026-00002',
        status: 'Delivered',
        origin: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          address: ''
        },
        destination: {
          city: 'Houston',
          state: 'TX',
          country: 'USA',
          address: ''
        },
        sender: {
          name: 'Demo Sender',
          email: '',
          phone: ''
        },
        recipient: {
          name: 'Demo Recipient',
          email: '',
          phone: ''
        },
        package: {
          description: 'Demo package',
          weight: 3,
          weightUnit: 'kg',
          dimensions: {
            length: 25,
            width: 20,
            height: 10,
            unit: 'cm'
          },
          contents: 'Demo items'
        },
        estimatedDelivery: '2026-08-30T18:00:00.000Z',
        timeline: [
          {
            timestamp: '2026-08-27T10:00:00.000Z',
            location: 'Chicago, IL',
            event: 'Picked up',
            details: 'Shipment picked up.'
          },
          {
            timestamp: '2026-08-29T13:00:00.000Z',
            location: 'Houston, TX',
            event: 'Out for delivery',
            details: 'Shipment is out for delivery.'
          },
          {
            timestamp: '2026-08-29T16:45:00.000Z',
            location: 'Houston, TX',
            event: 'Delivered',
            details: 'Shipment delivered successfully.'
          }
        ],
        isDemoData: true
      },
      {
        trackingNumber: 'LXD-2026-00050',
        status: 'Out for delivery',
        origin: {
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          address: ''
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          country: 'USA',
          address: ''
        },
        sender: {
          name: 'Demo Sender',
          email: '',
          phone: ''
        },
        recipient: {
          name: 'Demo Recipient',
          email: '',
          phone: ''
        },
        package: {
          description: 'Demo package',
          weight: 7,
          weightUnit: 'kg',
          dimensions: {
            length: 35,
            width: 25,
            height: 20,
            unit: 'cm'
          },
          contents: 'Demo items'
        },
        estimatedDelivery: '2026-09-14T18:00:00.000Z',
        timeline: [
          {
            timestamp: '2026-09-10T09:00:00.000Z',
            location: 'Miami, FL',
            event: 'Picked up',
            details: 'Shipment picked up.'
          },
          {
            timestamp: '2026-09-12T12:00:00.000Z',
            location: 'Atlanta, GA',
            event: 'In transit',
            details: 'Shipment arrived in destination city.'
          },
          {
            timestamp: '2026-09-14T08:00:00.000Z',
            location: 'Atlanta, GA',
            event: 'Out for delivery',
            details: 'Shipment is out for final delivery.'
          }
        ],
        isDemoData: true
      }
    ];

    demoShipments.forEach(shipment => {
      this.create(shipment);
    });
  }

  create(data) {
    const trackingNumber = this.normalizeTrackingNumber(data.trackingNumber);

    if (!trackingNumber) {
      return {
        success: false,
        error: 'Tracking number is required'
      };
    }

    if (this.shipments.has(trackingNumber)) {
      return {
        success: false,
        error: 'Tracking number already exists'
      };
    }

    const shipment = {
      id: uuidv4(),
      ...data,
      trackingNumber,
      timeline: Array.isArray(data.timeline) ? data.timeline : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoData: data.isDemoData === true
    };

    this.shipments.set(trackingNumber, shipment);

    return {
      success: true,
      shipment
    };
  }

  getByTrackingNumber(trackingNumber) {
    const normalized = this.normalizeTrackingNumber(trackingNumber);

    if (!normalized) {
      return null;
    }

    const shipment = this.shipments.get(normalized);

    if (!shipment) {
      return null;
    }

    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      estimatedDelivery: shipment.estimatedDelivery,
      timeline: shipment.timeline
    };
  }

  getByTrackingNumberAdmin(trackingNumber) {
    const normalized = this.normalizeTrackingNumber(trackingNumber);

    if (!normalized) {
      return null;
    }

    return this.shipments.get(normalized) || null;
  }

  getAll(filters = {}) {
    let shipments = Array.from(this.shipments.values());

    if (filters.status) {
      shipments = shipments.filter(
        shipment =>
          shipment.status &&
          shipment.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.originCity) {
      shipments = shipments.filter(
        shipment =>
          shipment.origin &&
          shipment.origin.city &&
          shipment.origin.city.toLowerCase() === filters.originCity.toLowerCase()
      );
    }

    if (filters.destinationCity) {
      shipments = shipments.filter(
        shipment =>
          shipment.destination &&
          shipment.destination.city &&
          shipment.destination.city.toLowerCase() === filters.destinationCity.toLowerCase()
      );
    }

    if (filters.excludeDemo) {
      shipments = shipments.filter(
        shipment => shipment.isDemoData !== true
      );
    }

    return shipments;
  }

  search(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
      return [];
    }

    return Array.from(this.shipments.values()).filter(shipment => {
      return (
        shipment.trackingNumber.toLowerCase().includes(searchTerm) ||
        (shipment.sender &&
          shipment.sender.name &&
          shipment.sender.name.toLowerCase().includes(searchTerm)) ||
        (shipment.recipient &&
          shipment.recipient.name &&
          shipment.recipient.name.toLowerCase().includes(searchTerm)) ||
        (shipment.origin &&
          shipment.origin.city &&
          shipment.origin.city.toLowerCase().includes(searchTerm)) ||
        (shipment.destination &&
          shipment.destination.city &&
          shipment.destination.city.toLowerCase().includes(searchTerm))
      );
    });
  }

  update(trackingNumber, updates) {
    const normalized = this.normalizeTrackingNumber(trackingNumber);

    if (!normalized || !this.shipments.has(normalized)) {
      return {
        success: false,
        error: 'Shipment not found'
      };
    }

    const existing = this.shipments.get(normalized);

    const updated = {
      ...existing,
      ...updates,
      trackingNumber: normalized,
      updatedAt: new Date().toISOString()
    };

    this.shipments.set(normalized, updated);

    return {
      success: true,
      shipment: updated
    };
  }

  updateStatus(
    trackingNumber,
    status,
    location = '',
    event = '',
    details = ''
  ) {
    const normalized = this.normalizeTrackingNumber(trackingNumber);

    if (!normalized || !this.shipments.has(normalized)) {
      return {
        success: false,
        error: 'Shipment not found'
      };
    }

    const shipment = this.shipments.get(normalized);

    const timelineEntry = {
      timestamp: new Date().toISOString(),
      location,
      event: event || status,
      details
    };

    const updated = {
      ...shipment,
      status,
      timeline: [...(shipment.timeline || []), timelineEntry],
      updatedAt: new Date().toISOString()
    };

    this.shipments.set(normalized, updated);

    return {
      success: true,
      shipment: updated
    };
  }

  delete(trackingNumber) {
    const normalized = this.normalizeTrackingNumber(trackingNumber);

    if (!normalized || !this.shipments.has(normalized)) {
      return {
        success: false,
        error: 'Shipment not found'
      };
    }

    this.shipments.delete(normalized);

    return {
      success: true,
      message: 'Shipment deleted successfully'
    };
  }
}

module.exports = new ShipmentModel();
