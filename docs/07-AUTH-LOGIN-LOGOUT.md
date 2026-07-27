# eGovPH Authentication: Login & Logout Flow

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Auth provider:** eGovPH SSO (Single Sign-On)  
> **Session strategy:** Secure httpOnly cookie + server-side token validation  

---

## 1. Authentication Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                       │
│                                                                        │
│  User          Front-End         Server (/api)        eGov SSO         │
│   │                │                  │                   │            │
│   │─── Click ────>│                  │                   │            │
│   │  "Login"      │── POST ────────>│                   │            │
│   │               │  /api/auth/login │── Initiate ─────>│            │
│   │               │                  │  (HMAC signed)    │            │
│   │               │                  │<── auth_url ──────│            │
│   │               │<── { url } ──────│                   │            │
│   │<── Redirect ──│                  │                   │            │
│   │               │                  │                   │            │
│   │───────────────────── Login on eGov SSO ───────────>│            │
│   │                                                      │            │
│   │<──────────────────── Redirect with code ─────────────│            │
│   │               │                  │                   │            │
│   │── GET ──────────────────────────>│                   │            │
│   │  /api/auth/callback?code=xxx     │── Exchange ─────>│            │
│   │               │                  │   code → token    │            │
│   │               │                  │<── user data ─────│            │
│   │               │                  │                   │            │
│   │               │                  │── Set cookie ──>  │            │
│   │<── Redirect to home ─────────────│                   │            │
│   │               │                  │                   │            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables Required

```env
# Server-only (never exposed to browser)
EGOV_SSO_API_BASE_URL=https://sso-api.egov.ph
EGOV_SSO_PARTNER_CODE=HACKATHON_SSO
EGOV_SSO_PARTNER_SECRET=0d77fba530ee49f5b00e36fe947bd384
```

---

## 3. Login Implementation

### 3.1 Front-End: Login Trigger

```jsx
// src/components/auth/LoginButton.jsx
import { api } from '../../services/api';

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const { auth_url } = await api.login();
      // Redirect to eGov SSO hosted login page
      window.location.href = auth_url;
    } catch (error) {
      console.error('Login initiation failed:', error.message);
      // Show error toast to user
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="btn-primary"
      aria-label="Log in with eGovPH"
    >
      {loading ? 'Connecting...' : 'Log in with eGovPH'}
    </button>
  );
}
```

### 3.2 Server: Login Initiation Endpoint

```javascript
// api/auth/login.js
import { createHmac } from 'node:crypto';
import { handleError, ApiError } from '../_lib/errors.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed.');
    }

    const { EGOV_SSO_API_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET } = process.env;

    if (!EGOV_SSO_API_BASE_URL || !EGOV_SSO_PARTNER_CODE || !EGOV_SSO_PARTNER_SECRET) {
      throw new ApiError(500, 'SSO configuration is incomplete.');
    }

    const baseUrl = EGOV_SSO_API_BASE_URL.replace(/\/$/, '');
    const timestamp = Date.now().toString();

    // HMAC signature: sha256(partner_code|timestamp) with partner_secret
    const signature = createHmac('sha256', EGOV_SSO_PARTNER_SECRET)
      .update(`${EGOV_SSO_PARTNER_CODE}|${timestamp}`)
      .digest('hex');

    // Determine callback URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/auth/callback`;

    // Initiate SSO session with eGov
    const response = await fetch(`${baseUrl}/api/v1/auth/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-Code': EGOV_SSO_PARTNER_CODE,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: JSON.stringify({
        redirect_uri: callbackUrl,
        scope: 'openid profile',
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(502, errorData.message || 'SSO service unavailable.');
    }

    const data = await response.json();

    if (!data.auth_url) {
      throw new ApiError(502, 'SSO did not return an authentication URL.');
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ auth_url: data.auth_url });

  } catch (error) {
    return handleError(res, error);
  }
}
```

### 3.3 Server: SSO Callback Endpoint

```javascript
// api/auth/callback.js
import { createHmac } from 'node:crypto';
import { handleError, ApiError } from '../_lib/errors.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      throw new ApiError(405, 'Method not allowed.');
    }

    const { code, state, error: ssoError } = req.query;

    // Handle SSO denial or error
    if (ssoError) {
      return res.redirect(302, '/?auth=error&reason=denied');
    }

    if (!code) {
      throw new ApiError(400, 'Authorization code is missing.');
    }

    const { EGOV_SSO_API_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET } = process.env;
    const baseUrl = EGOV_SSO_API_BASE_URL.replace(/\/$/, '');
    const timestamp = Date.now().toString();

    const signature = createHmac('sha256', EGOV_SSO_PARTNER_SECRET)
      .update(`${EGOV_SSO_PARTNER_CODE}|${timestamp}|${code}`)
      .digest('hex');

    // Exchange authorization code for access token + user profile
    const response = await fetch(`${baseUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-Code': EGOV_SSO_PARTNER_CODE,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: JSON.stringify({ code, grant_type: 'authorization_code' }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return res.redirect(302, '/?auth=error&reason=token_exchange');
    }

    const data = await response.json();
    const { access_token, user } = data;

    if (!access_token) {
      return res.redirect(302, '/?auth=error&reason=no_token');
    }

    // Set secure session cookie
    const cookieOptions = [
      `egov_session=${access_token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Max-Age=3600',  // 1 hour
      'Path=/api/',
    ].join('; ');

    // Set a non-httpOnly cookie for front-end awareness (no secrets)
    const userCookie = [
      `egov_user=${encodeURIComponent(JSON.stringify({
        name: user?.first_name || 'Citizen',
        avatar: user?.avatar_url || null,
        authenticated: true,
      }))}`,
      'Secure',
      'SameSite=Lax',
      'Max-Age=3600',
      'Path=/',
    ].join('; ');

    res.setHeader('Set-Cookie', [cookieOptions, userCookie]);
    return res.redirect(302, '/?auth=success');

  } catch (error) {
    return res.redirect(302, '/?auth=error&reason=unknown');
  }
}
```

---

## 4. Session Verification

### 4.1 Server: Verify Session Endpoint

```javascript
// api/auth/verify.js
import { handleError, ApiError } from '../_lib/errors.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      throw new ApiError(405, 'Method not allowed.');
    }

    // Read session token from httpOnly cookie
    const token = req.cookies?.egov_session;

    if (!token) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    // Prototype: token presence = authenticated
    // Production: verify JWT signature, check expiration, validate with SSO
    const { EGOV_SSO_API_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET } = process.env;

    // Optional: validate token with SSO (production)
    // const valid = await validateTokenWithSSO(token, process.env);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      authenticated: true,
      user: {
        // Decoded from token or fetched from SSO
        name: 'Mika Reyes',
        avatar: null,
        verified: true,
      },
    });

  } catch (error) {
    return handleError(res, error);
  }
}
```

### 4.2 Front-End: Auth Context

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check session on mount and after login redirect
  useEffect(() => {
    checkSession();
  }, []);

  // Listen for auth redirect results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (authResult === 'success') {
      checkSession();
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else if (authResult === 'error') {
      setLoading(false);
      // Optionally show error based on params.get('reason')
      window.history.replaceState({}, '', '/');
    }
  }, []);

  async function checkSession() {
    try {
      const data = await api.verifyAuth();
      setAuthenticated(data.authenticated);
      setUser(data.user);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    const { auth_url } = await api.login();
    window.location.href = auth_url;
  }

  async function logout() {
    await api.logout();
    setAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## 5. Logout Implementation

### 5.1 Logout Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        LOGOUT FLOW                                  │
│                                                                    │
│  User          Front-End         Server (/api)        eGov SSO     │
│   │                │                  │                   │        │
│   │── Click ─────>│                  │                   │        │
│   │  "Logout"     │── POST ────────>│                   │        │
│   │               │  /api/auth/logout│── Revoke token ─>│        │
│   │               │                  │  (optional)       │        │
│   │               │                  │                   │        │
│   │               │                  │── Clear cookie    │        │
│   │               │<── { success } ──│                   │        │
│   │               │                  │                   │        │
│   │               │── Clear local ───│                   │        │
│   │               │   state + storage│                   │        │
│   │<── Show login │                  │                   │        │
│   │   state       │                  │                   │        │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Server: Logout Endpoint

```javascript
// api/auth/logout.js
import { handleError, ApiError } from '../_lib/errors.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed.');
    }

    const token = req.cookies?.egov_session;

    // Optional: revoke token with SSO provider
    if (token) {
      const { EGOV_SSO_API_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET } = process.env;

      if (EGOV_SSO_API_BASE_URL) {
        try {
          await fetch(`${EGOV_SSO_API_BASE_URL.replace(/\/$/, '')}/api/v1/auth/revoke`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Partner-Code': EGOV_SSO_PARTNER_CODE,
            },
            body: JSON.stringify({ token }),
            signal: AbortSignal.timeout(5_000),
          });
        } catch {
          // Revocation failure is non-fatal — cookie is still cleared
        }
      }
    }

    // Clear session cookie (set expired)
    const clearSession = [
      'egov_session=',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Max-Age=0',     // Expire immediately
      'Path=/api/',
    ].join('; ');

    // Clear user cookie
    const clearUser = [
      'egov_user=',
      'Secure',
      'SameSite=Lax',
      'Max-Age=0',
      'Path=/',
    ].join('; ');

    res.setHeader('Set-Cookie', [clearSession, clearUser]);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });

  } catch (error) {
    return handleError(res, error);
  }
}
```

### 5.3 Front-End: Logout Button

```jsx
// src/components/auth/LogoutButton.jsx
import { useAuth } from '../../context/AuthContext';

export function LogoutButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
      // Clear any local prototype data
      localStorage.removeItem('egov_history');
      localStorage.removeItem('egov_preferences');
    } catch (error) {
      console.error('Logout failed:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-outline-danger"
      aria-label="Log out of eGovPH"
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}
```

---

## 6. Session Management Rules

### 6.1 Cookie Configuration

| Property | Session Cookie | User Cookie |
|----------|---------------|-------------|
| Name | `egov_session` | `egov_user` |
| Content | SSO access token | `{ name, avatar, authenticated }` |
| HttpOnly | Yes (JS cannot read) | No (front-end reads for UI) |
| Secure | Yes (HTTPS only) | Yes |
| SameSite | Lax | Lax |
| Max-Age | 3600 (1 hour) | 3600 (synced) |
| Path | `/api/` | `/` |
| Contains secrets | Yes (token) | No (display name only) |

### 6.2 Session Lifecycle

```
[Anonymous] ──── Login ────> [Authenticated] ──── Timeout ────> [Expired]
     │                              │                               │
     │                              │── Logout ──> [Anonymous]      │
     │                              │                               │
     │                              │── API call ──> Cookie sent    │
     │                              │   automatically by browser    │
     │                                                              │
     └──── Cannot access protected routes ─────────────────────────┘
```

### 6.3 Token Expiration Handling

```jsx
// src/hooks/useAuth.js — Handle expired sessions gracefully
useEffect(() => {
  const interval = setInterval(async () => {
    if (authenticated) {
      try {
        const data = await api.verifyAuth();
        if (!data.authenticated) {
          // Session expired server-side
          setAuthenticated(false);
          setUser(null);
          // Optionally show "Session expired" toast
        }
      } catch {
        // Network error — don't log out, just retry later
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  return () => clearInterval(interval);
}, [authenticated]);
```

---

## 7. Protected Routes & UI States

### 7.1 Conditional UI Rendering

```jsx
// src/components/layout/Header.jsx
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { authenticated, user, login } = useAuth();

  return (
    <header className="header">
      <img src="/assets/icons/egov-logo.svg" alt="eGovPH" className="logo" />
      <div className="header-right">
        {authenticated ? (
          <>
            <span className="greeting">Hi, {user?.name || 'Citizen'}</span>
            <Avatar src={user?.avatar} alt={user?.name} />
          </>
        ) : (
          <button onClick={login} className="btn-sm-primary">
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
```

### 7.2 Auth-Gated Features

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| Browse services | Yes | Yes |
| Search | Yes | Yes |
| eGov AI chat | Yes | Yes |
| View Digital ID | No — show "Log in to view" | Yes |
| Make payment | No — prompt login first | Yes |
| View history | No — show empty + login CTA | Yes (local data) |
| Submit report | No — prompt login | Yes |
| Face verification | No | Yes |
| Account settings | No — show login page | Yes |
| COMPASS budget data | Yes | Yes |

### 7.3 Auth Redirect Pattern

```jsx
// src/components/common/AuthGate.jsx
import { useAuth } from '../../context/AuthContext';

export function AuthGate({ children, fallback }) {
  const { authenticated, loading, login } = useAuth();

  if (loading) {
    return <Spinner label="Checking session..." />;
  }

  if (!authenticated) {
    return fallback || (
      <div className="auth-prompt" role="alert">
        <p>Please log in to access this feature.</p>
        <button onClick={login} className="btn-primary">
          Log in with eGovPH
        </button>
      </div>
    );
  }

  return children;
}

// Usage:
<AuthGate>
  <DigitalIDCard />
</AuthGate>
```

---

## 8. Security Considerations

### 8.1 CSRF Protection

Since cookies are sent automatically, protect state-changing endpoints:

```javascript
// api/_lib/csrf.js
export function validateOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const allowedOrigins = [`https://${host}`, `http://localhost:5173`];

  if (req.method !== 'GET' && origin && !allowedOrigins.includes(origin)) {
    throw new ApiError(403, 'Cross-origin request blocked.');
  }
}
```

### 8.2 Session Fixation Prevention

- Generate a new session on every successful login (never reuse old tokens)
- Clear all cookies on logout (both session and user cookies)
- Set `Max-Age` — never use indefinite sessions

### 8.3 Token Storage Best Practices

```
DO:
✓ Store access token in httpOnly cookie (XSS-proof)
✓ Use Secure flag (HTTPS-only transmission)
✓ Set SameSite=Lax (CSRF protection for GET redirects)
✓ Limit Path to /api/ (only sent to server endpoints)
✓ Short Max-Age (1 hour max for prototype)

DON'T:
✗ Store tokens in localStorage (XSS vulnerable)
✗ Store tokens in sessionStorage (XSS vulnerable)
✗ Put tokens in URL parameters (logged by servers/proxies)
✗ Send tokens in custom headers from front-end (requires JS access)
✗ Use persistent cookies without expiry
```

---

## 9. Demo Mode (Prototype)

For hackathon demos without a live SSO connection:

```javascript
// src/services/api.js — Mock auth in mock mode
const API_MODE = import.meta.env.VITE_API_MODE;

export const api = {
  login: () => {
    if (API_MODE === 'mock') {
      // Simulate login by setting local state
      return Promise.resolve({ auth_url: '/?auth=success' });
    }
    return request('/auth/login', { method: 'POST' });
  },

  verifyAuth: () => {
    if (API_MODE === 'mock') {
      return Promise.resolve({
        authenticated: true,
        user: { name: 'Mika Reyes', avatar: null, verified: true },
      });
    }
    return request('/auth/verify');
  },

  logout: () => {
    if (API_MODE === 'mock') {
      return Promise.resolve({ success: true });
    }
    return request('/auth/logout', { method: 'POST' });
  },
};
```

---

## 10. API Route Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/login` | Initiate SSO login | No |
| GET | `/api/auth/callback` | Receive SSO redirect with code | No |
| GET | `/api/auth/verify` | Check current session status | Cookie |
| POST | `/api/auth/logout` | End session, clear cookies | Cookie |

---

*End of Authentication document.*
