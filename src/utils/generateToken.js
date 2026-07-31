import jwt from "jsonwebtoken";
import getJwtSecret from "./getJwtSecret.js";

const generateToken = (id) => {
  const secret = getJwtSecret();
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;
