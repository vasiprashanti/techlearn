import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // // Debug: log incoming authorization header for troubleshooting
  // console.log(
  //   "authMiddleware - authorization header:",
  //   req.headers.authorization,
  // );

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // // Debug: log token presence (do NOT log full token in production)
      // console.log("authMiddleware - token present:", !!token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Support for hardcoded admin token fast-path
      if (decoded.id === "admin_hardcoded") {
        req.user = { 
          _id: "admin_hardcoded", 
          role: "admin", 
          email: "admintls@123", 
          firstName: "Admin",
          isClub: false
        };
      } else {
        req.user = await User.findById(decoded.id).select("-password");
      }

      // // Debug: log found user id and role
      // console.log(
      //   "authMiddleware - req.user:",
      //   req.user ? { id: req.user._id.toString(), role: req.user.role } : null,
      // );

      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Not authorized, user not found" });
      }

      return next();
    } catch (error) {
      console.error("authMiddleware - token error:", error.message);
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
  }

  return res.status(401).json({
    error: "Not authorized - Only valid Admins can access this endpoint",
  });
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(401).json({ error: "Not authorized, not an admin" });
  }
};

// Optional protect: if Authorization header present and valid, set req.user, otherwise continue as guest
export const optionalProtect = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id === "admin_hardcoded") {
        req.user = { 
          _id: "admin_hardcoded", 
          role: "admin", 
          email: "admintls@123", 
          firstName: "Admin"
        };
      } else {
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
        }
      }
    }
    return next();
  } catch (err) {
    // If token invalid, treat as guest (do not block)
    return next();
  }
};
