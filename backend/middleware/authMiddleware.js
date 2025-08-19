import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ error: "Not authorized, user not found" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
  }

  return res.status(401).json({ error: "Not authorized, no token" });
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
