const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured. Add it to backend/.env before using auth.",
    );
  }

  return secret;
};

export default getJwtSecret;
