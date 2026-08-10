import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_lift_amc_2026';
const TOKEN_COOKIE_NAME = 'auth_token';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(req) {
  let token = null;

  // Check header first
  if (req && req.headers) {
    const authHeader = typeof req.headers.get === 'function' 
      ? req.headers.get('authorization') 
      : req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Fallback to cookie
  if (!token) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    } catch (e) {
      // Cookies might fail outside Next request context or during unit tests
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export { TOKEN_COOKIE_NAME };
