const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check if the request has the 'authtoken' header
  if (req.headers.authtoken) {
    try {
      // Get the token directly from the 'authtoken' header
      token = req.headers.authtoken;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user ID to the request object
      req.userId = decoded.userId;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };