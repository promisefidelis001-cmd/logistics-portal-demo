const express = require('express');
const Joi = require('joi');
const shipmentModel = require('../models/shipment');
const {
  authenticateToken,
  requireRole
} = require('../middleware/auth');

const router = express.Router();

const createShipmentSchema = Joi.object({
  trackingNumber: Joi.string().trim().min(3).max(50).required(),
  status: Joi.string().trim().max(50),
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
    email: Joi.string().email().allow(''),
    phone: Joi.string().trim().allow('')
  }).required(),
  recipient: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().allow(''),
    phone: Joi.string().trim().allow('')
  }).required(),
  package: Joi.object({
    description: Joi.string().trim().required(),
    weight: Joi.number().positive().required(),
    weightUnit: Joi.string().trim().required(),
    dimensions: Joi.object({
      length: Joi.number().positive().required(),
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required(),
      unit: Joi.string().trim().required()
    }).required(),
    contents: Joi.string().trim().allow('')
  }).required(),
  estimatedDelivery: Joi.string().isoDate().allow('')
});

const updateShipmentSchema = Joi.object({
  status: Joi.string().trim().max(50),
  origin: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim(),
    address: Joi.string().trim().allow('')
  }),
  destination: Joi.object({
    city: Joi.string().trim(),
    state: Joi.string().trim().allow(''),
    country: Joi.string().trim(),
    address: Joi.string().trim().allow('')
  }),
  sender: Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email().allow(''),
    phone: Joi.string().trim().allow('')
  }),
  recipient: Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email().allow(''),
    phone: Joi.string().trim().allow('')
  }),
  package: Joi.object({
    description: Joi.string().trim(),
    weight: Joi.number().positive(),
    weightUnit: Joi.string().trim(),
    contents: Joi.string().trim().allow('')
  }),
  estimatedDelivery: Joi.string().isoDate().allow('')
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(
    'Pending',
    'Picked up',
    'In transit',
    'Out for delivery',
    'Delivered',
    'Delayed',
    'Cancelled'
  ).required(),
  location: Joi.string().trim().max(200).allow(''),
  event: Joi.string().trim().max(100).allow(''),
  details: Joi.string().trim().max(500).allow('')
});

router.get('/public/:trackingNumber', (req, res) => {
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

router.use(authenticateToken);

router.get('/', requireRole('admin', 'super_admin'), (req, res) => {
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
});

router.get('/search', requireRole('admin', 'super_admin'), (req, res) => {
  const results = shipmentModel.search(req.query.q);

  return res.json({
    success: true,
    count: results.length,
    shipments: results
  });
});

router.get('/:trackingNumber', requireRole('admin', 'super_admin'), (req, res) => {
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
});

router.post(
  '/',
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = createShipmentSchema.validate(req.body, {
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
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  }
);

router.patch(
  '/:trackingNumber',
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = updateShipmentSchema.validate(req.body, {
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

router.patch(
  '/:trackingNumber/status',
  requireRole('admin', 'super_admin'),
  (req, res) => {
    const { error, value } = statusSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
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

router.delete(
  '/:trackingNumber',
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
