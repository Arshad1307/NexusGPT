import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.nexus_token;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required. Please log in.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.sub || !Number.isInteger(payload.tokenVersion)) {
      return res.status(401).json({
        error: "Invalid authentication session.",
      });
    }

    const user = await User.findById(payload.sub);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({
        error: "Your session is invalid. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Your session has expired. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      error: "Unable to verify authentication.",
    });
  }
}
