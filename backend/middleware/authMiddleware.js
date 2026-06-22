import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isAdminEmail } from "../utils/adminAccess.js";

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

      // // Debug: log decoded token id
      // console.log("authMiddleware - decoded token id:", decoded && decoded.id);

      req.user = await User.findById(decoded.id).select("-password");

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

export const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authorized, not an admin" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (isAdminEmail(req.user.email)) {
    try {
      req.user.role = "admin";
      await req.user.save();
      return next();
    } catch (error) {
      console.error("authMiddleware - failed to synchronize admin role:", error.message);
      return res.status(500).json({ error: "Unable to synchronize admin access" });
    }
  }

  return res.status(401).json({ error: "Not authorized, not an admin" });
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
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    }
    return next();
  } catch (err) {
    // If token invalid, treat as guest (do not block)
    return next();
  }
};

export const requirePlacementProgram = (req, res, next) => {
  if (["Placement Sprint", "Both"].includes(req.user?.programSelection)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Placement access is not enabled for this account.",
  });
};
