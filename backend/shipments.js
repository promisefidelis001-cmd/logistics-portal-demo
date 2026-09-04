const express = require('express');
const Joi = require('joi');
const shipmentModel = require('../models/shipment');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const shipmentSchema = Joi.object({
  trackingNumber: Joi.string().trim().min(3).max(100).required(),
  status: Joi.string()
    .valid(
      'Pending',
      'Picked up',
      'In transit',
      'Out for delivery',
      'Delivered',
      'Delayed',
      'Cancelled'
    )
    .default('Picked up'),
  origin: Joi.object({
    city: Joi.string().trim().required(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim().required(),
    address: Joi.string().trim().allow('')
  }).required(),
  destination: Joi.object({
    city: Joi.string().trim().required(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim().required(),
    address: Joi.string().trim().allow('')
  }).required(),
  sender: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().required()
  }).required(),
  recipient: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().required()
  }).required(),
  package: Joi.object({
    description: Joi.string().trim().required(),
    weight: Joi.number().positive().required(),
    weightUnit: Joi.string().valid('kg', 'lb').required(),
    dimensions: Joi.object({
      length: Joi.number().positive().required(),
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required(),
      unit: Joi.string().valid('cm', 'in').required()
    }).required(),
    contents: Joi.string().trim().allow('')
  }).required(),
  estimatedDelivery: Joi.string().isoDate().optional()
});

const updateSchema = Joi.object({
  status: Joi.string()
    .valid(
      'Pending',
      'Picked up',
      'In transit',
      'Out for delivery',
      'Delivered',
      'Delayed',
      'Cancelled'
    )
    .optional(),
  origin: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim(),
    address: Joi.string().trim().allow('')
  }).optional(),
  destination: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim(),
    address: Joi.string().trim().allow('')
  }).optional(),
  sender: Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email(),
    phone: Joi.string().trim()
  }).optional(),
  recipient: Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email(),
    phone: Joi.string().trim()
  }).optional(),
  package: Joi.object({
    description: Joi.string().trim(),
    weight: Joi.number().positive(),
    weightUnit: Joi.string().valid('kg', 'lb'),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'in')
    }),
    contents: Joi.string().trim().allow('')
  }).optional(),
  estimatedDelivery: Joi.string().isoDate().optional()
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'Pending',
      'Picked up',
      'In transit',
      'Out for delivery',
      'Delivered',
      'Delayed',
      'Cancelled'
    )
    .required(),
  location: Joi.string().trim().max(200).optional(),
  event: Joi.string().trim().max(200).optional(),
  details: Joi.string().trim().max(500).allow('').optional()
});

// Public tracking endpoint
router.get('/track/:trackingNumber', (req, res) => {
  const shipment = shipmentModel.getByTrackingNumber(
    req.params.trackingNumber
  );

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: 'Shipment not found'
    });
  }

  return res.json({
    success: true,
    shipment
  });
});

// Admin: get all shipments
router.get(
  '/',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const filters = {
      status: req.query.status,
      originCity: req.query.originCity,
      destinationCity: req.query.destinationCity,
      excludeDemo: req.query.excludeDemo === 'true'
    };

    const shipments = shipmentModel.getAll(filters);

    return res.json({
      success: true,
      count: shipments.length,
      shipments
    });
  }
);

// Admin: search shipments
router.get(
  '/search',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const shipments = shipmentModel.search(q);

    return res.json({
      success: true,
      count: shipments.length,
      shipments
    });
  }
);

// Admin: get shipment by ID
router.get(
  '/id/:id',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const shipment = shipmentModel.getById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    return res.json({
      success: true,
      shipment
    });
  }
);

// Admin: get full shipment by tracking number
router.get(
  '/admin/:trackingNumber',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const shipment = shipmentModel.getByTrackingNumberAdmin(
      req.params.trackingNumber
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    return res.json({
      success: true,
      shipment
    });
  }
);

// Admin: create shipment
router.post(
  '/',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = shipmentSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const result = shipmentModel.create(value);

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.status(201).json(result);
  }
);

// Admin: update shipment
router.patch(
  '/:trackingNumber',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = updateSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const result = shipmentModel.update(
      req.params.trackingNumber,
      value
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  }
);

// Admin: update shipment status
router.patch(
  '/:trackingNumber/status',
  authenticateToken,
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = statusSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const result = shipmentModel.updateStatus(
      req.params.trackingNumber,
      value.status,
      value.location,
      value.event,
      value.details
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  }
);

// Super admin only: delete shipment
router.delete(
  '/:trackingNumber',
  authenticateToken,
  requireRole('super_admin'),
  (req, res) => {
    const result = shipmentModel.delete(
      req.params.trackingNumber
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  }
);

module.exports = router;
