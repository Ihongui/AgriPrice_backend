import jwt from "jsonwebtoken";
import User from "../models/User.js";
import getJwtSecret from "../utils/getJwtSecret.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired, please log in again" });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

export default protect;
