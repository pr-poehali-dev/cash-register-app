const CODE_KEY = "pos_connect_code";
const CODE_EXPIRES_KEY = "pos_connect_code_expires";
const CODE_USER_KEY = "pos_connect_code_user";
const CODE_TOKEN_KEY = "pos_connect_code_token";

export interface ConnectPayload {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    balance: number;
  };
}

function generateCode(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function createConnectCode(token: string, user: object): string {
  const code = generateCode();
  const expires = Date.now() + 5 * 60 * 1000;
  localStorage.setItem(CODE_KEY, code);
  localStorage.setItem(CODE_EXPIRES_KEY, String(expires));
  localStorage.setItem(CODE_USER_KEY, JSON.stringify(user));
  localStorage.setItem(CODE_TOKEN_KEY, token);
  return code;
}

export function refreshConnectCode(token: string, user: object): string {
  return createConnectCode(token, user);
}

export function redeemConnectCode(code: string): ConnectPayload | null {
  const storedCode = localStorage.getItem(CODE_KEY);
  const expires = Number(localStorage.getItem(CODE_EXPIRES_KEY) || 0);
  const userStr = localStorage.getItem(CODE_USER_KEY);
  const token = localStorage.getItem(CODE_TOKEN_KEY);

  if (!storedCode || !userStr || !token) return null;
  if (storedCode !== code) return null;
  if (Date.now() > expires) return null;

  try {
    const user = JSON.parse(userStr);
    return { token, user };
  } catch {
    return null;
  }
}

export function getActiveCode(): { code: string; expiresAt: number } | null {
  const code = localStorage.getItem(CODE_KEY);
  const expires = Number(localStorage.getItem(CODE_EXPIRES_KEY) || 0);
  if (!code || Date.now() > expires) return null;
  return { code, expiresAt: expires };
}
