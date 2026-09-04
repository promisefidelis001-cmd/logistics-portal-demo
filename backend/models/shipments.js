const express = require('express');
const Joi = require('joi');
const shipmentModel = require('../models/shipment');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const trackingSchema = Joi.object({
  trackingNumber: Joi.string().trim().min(3).max(50).required()
});

const createShipmentSchema = Joi.object({
  trackingNumber: Joi.string().trim().min(3).max(50).required(),
  sender: Joi.object().required(),
  recipient: Joi.object().required(),
  origin: Joi.object().required(),
  destination: Joi.object().required(),
  status: Joi.string().trim().required(),
  currentLocation: Joi.object().optional(),
  estimatedDelivery: Joi.string().optional(),
  notes: Joi.string().max(2000).allow('').optional()
});

const updateShipmentSchema = Joi.object({
  sender: Joi.object().optional(),
  recipient: Joi.object().optional(),
  origin: Joi.object().optional(),
  destination: Joi.object().optional(),
  status: Joi.string().trim().optional(),
  currentLocation: Joi.object().optional(),
  estimatedDelivery: Joi.string().optional(),
  notes: Joi.string().max(2000).allow('').optional()
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().trim().required(),
  currentLocation: Joi.object().optional(),
  notes: Joi.string().max(2000).allow('').optional()
});

router.get('/track/:trackingNumber', (req, res) => {
  try {
    const { error, value } = trackingSchema.validate({
      trackingNumber: req.params.trackingNumber
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const shipment = shipmentModel.getByTrackingNumber(
      value.trackingNumber
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
  } catch (error) {
    console.error('[SHIPMENTS] Tracking error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get(
  '/',
  authenticateToken,
  requireRole('super_admin', 'admin', 'staff'),
  (req, res) => {
    try {
      const shipments = shipmentModel.getAll();

      return res.json({
        success: true,
        count: shipments.length,
        shipments
      });
    } catch (error) {
      console.error('[SHIPMENTS] Get all error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.get(
  '/:id',
  authenticateToken,
  requireRole('super_admin', 'admin', 'staff'),
  (req, res) => {
    try {
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
    } catch (error) {
      console.error('[SHIPMENTS] Get shipment error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.post(
  '/',
  authenticateToken,
  requireRole('super_admin', 'admin'),
  (req, res) => {
    try {
      const { error, value } = createShipmentSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const existing = shipmentModel.getByTrackingNumber(
        value.trackingNumber
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Tracking number already exists'
        });
      }

      const shipment = shipmentModel.create(value);

      return res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        shipment
      });
    } catch (error) {
      console.error('[SHIPMENTS] Create error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.patch(
  '/:id',
  authenticateToken,
  requireRole('super_admin', 'admin'),
  (req, res) => {
    try {
      const { error, value } = updateShipmentSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const shipment = shipmentModel.update(req.params.id, value);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: 'Shipment not found'
        });
      }

      return res.json({
        success: true,
        message: 'Shipment updated successfully',
        shipment
      });
    } catch (error) {
      console.error('[SHIPMENTS] Update error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('super_admin', 'admin', 'staff'),
  (req, res) => {
    try {
      const { error, value } = statusSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const shipment = shipmentModel.updateStatus(
        req.params.id,
        value.status,
        value.currentLocation,
        value.notes
      );

      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: 'Shipment not found'
        });
      }

      return res.json({
        success: true,
        message: 'Shipment status updated successfully',
        shipment
      });
    } catch (error) {
      console.error('[SHIPMENTS] Status update error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole('super_admin'),
  (req, res) => {
    try {
      const deleted = shipmentModel.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Shipment not found'
        });
      }

      return res.json({
        success: true,
        message: 'Shipment deleted successfully'
      });
    } catch (error) {
      console.error('[SHIPMENTS] Delete error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

module.exports = router;
