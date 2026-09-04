const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const token = authHeader.substring(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[AUTH] JWT_SECRET is not configured');

      return res.status(500).json({
        success: false,
        error: 'Server authentication configuration error'
      });
    }

    const decoded = jwt.verify(token, secret);

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
