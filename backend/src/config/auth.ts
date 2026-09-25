const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Configure it in the backend environment.');
}

export const JWT_SECRET = jwtSecret;
