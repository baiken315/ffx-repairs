# Admin Interface Security Audit

## Current Implementation
Your admin interface uses **HTTP Basic Authentication** with bcrypt-hashed passwords.

**Flow:**
1. User submits username/password on `/admin/login`
2. Credentials encoded as Base64 and sent with `Authorization: Basic` header
3. Backend validates against `ADMIN_PASSWORD_HASH` (bcrypt)
4. Token stored in `sessionStorage` and sent with subsequent admin API calls

## Risk Analysis

### Risk to Your Neon Account
**MEDIUM-HIGH RISK**

- **No rate limiting**: Brute force attacks possible with thousands of login attempts per second
- **Stateless authentication**: Compromised credentials provide immediate full access with no revocation option
- **XSS vulnerability**: Base64-encoded credentials stored in `sessionStorage` can be stolen if frontend is compromised
- **Direct database access**: If credentials are stolen, attacker can modify programs, income thresholds, administrator contacts, and other core data

### Risk to Your Database
**HIGH RISK**

If admin credentials are compromised, attacker can:
- Insert/update malicious data across all admin-accessible tables
- Corrupt program information, income benchmarks, help categories
- Modify administrator contact information

**Mitigating factor**: No DELETE operations are exposed, so database cannot be completely nuked. However, manual cleanup would be required for any poisoned data.

---

## Three Security Options

### Option 1: Safeguard Current Setup (Recommended for now)
**Effort**: Low | **Cost**: Free | **Security gain**: HIGH

Keep your existing Basic Auth but add protective layers:
- Rate limiting on failed login attempts
- HTTPS enforcement in production
- Audit logging of all admin actions
- Stronger password requirements
- Optional: Two-factor authentication

**Best for**: Your current stage (single admin, community project)

**Pros**:
- Minimal code changes (~30 minutes)
- No external dependencies (except standard Express middleware)
- Improves security significantly without major refactor
- Can upgrade later if needed

**Cons**:
- Still relies on Basic Auth (outdated pattern)
- Credentials stored in sessionStorage
- No token revocation between sessions

---

### Option 2: JWT Session Tokens
**Effort**: Medium | **Cost**: Free | **Security gain**: VERY HIGH

Replace Basic Auth with proper session tokens:
- Admin logs in with credentials
- Backend generates JWT or opaque session token
- Token expires after 8 hours (or configurable duration)
- Token can be revoked immediately if needed
- Backend validates token signature on each request

**Best for**: Multi-admin scenarios or when you need session management

**Pros**:
- Industry-standard authentication pattern
- Can revoke tokens without password change
- Expiration prevents indefinite access from stolen tokens
- Easier to add additional features (remember-me, SSO)
- More secure than Basic Auth

**Cons**:
- Requires refactoring auth middleware
- Need to implement token generation and validation
- Slightly more complex to debug

---

### Option 3: Third-Party Auth (Neon Auth, Auth0, etc.)
**Effort**: High | **Cost**: $25+/month | **Security gain**: EXTREME (but overkill)

Delegate authentication to a managed service.

**Best for**: Large teams, multi-tenant systems, compliance requirements

**Pros**:
- Professional security management
- Built-in MFA, audit logs, SSO
- No password storage responsibility
- Offload security burden

**Cons**:
- **Overkill for your use case** - single admin account
- Adds external dependency and vendor lock-in
- Monthly cost
- Neon Auth is for database pooling, not user authentication (Auth0 would be the right choice, but still excessive)
- Over-engineered for a community project
- Adds latency to every auth check

---

## Implementation Steps for Option 1

### Step 1: Install Rate Limiting Package
```bash
npm install express-rate-limit --workspace=backend
```

### Step 2: Create Rate Limiter Middleware
Create `backend/src/middleware/rateLimiter.ts`:

```typescript
import rateLimit from 'express-rate-limit';

// Stricter limits for login attempts
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per IP per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip counting if it's a successful login (optional enhancement)
  skip: (req) => {
    return req.method === 'GET'; // Don't count GET requests
  },
});

// More relaxed limits for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 3: Apply Rate Limiter to Auth Middleware
Update `backend/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../config';

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Log failed auth attempt
    console.warn(`[AUTH] Failed login attempt from ${req.ip} - missing credentials`);
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const base64 = authHeader.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) {
    console.warn(`[AUTH] Failed login attempt from ${req.ip} - invalid format`);
    res.status(401).json({ error: 'Invalid credentials format' });
    return;
  }

  const username = decoded.slice(0, colonIdx);
  const password = decoded.slice(colonIdx + 1);

  if (username !== config.adminUsername) {
    console.warn(`[AUTH] Failed login attempt from ${req.ip} - invalid username: ${username}`);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!config.adminPasswordHash) {
    if (config.nodeEnv === 'development') {
      next();
      return;
    }
    res.status(500).json({ error: 'Admin auth not configured' });
    return;
  }

  const valid = await bcrypt.compare(password, config.adminPasswordHash);
  if (!valid) {
    console.warn(`[AUTH] Failed login attempt from ${req.ip} - invalid password`);
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  console.log(`[AUTH] Successful login for ${username} from ${req.ip}`);
  next();
}
```

### Step 4: Apply Limiter to Routes
Update `backend/src/index.ts`:

```typescript
import { adminLoginLimiter } from './middleware/rateLimiter';

// Apply rate limiter to the login endpoint (the test endpoint in AdminLoginView)
app.get('/api/v1/admin/lookups', adminLoginLimiter, adminRouter);

// Or apply to all admin routes for extra protection:
// app.use('/api/v1/admin', adminLoginLimiter);
```

### Step 5: Enforce HTTPS in Production
Update `backend/src/index.ts`:

```typescript
// Add at the top, after imports
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Step 6: Add Audit Logging
Update admin routes to log all write operations.

Create `backend/src/middleware/auditLog.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (data: any) {
      console.log(`[AUDIT] ${action} | IP: ${req.ip} | Status: ${res.statusCode} | Time: ${new Date().toISOString()}`);
      return originalJson.call(this, data);
    };
    next();
  };
}
```

Add to relevant routes in `backend/src/routes/admin/index.ts`:

```typescript
router.post('/income-benchmarks', auditLog('CREATE income_benchmark'), async (req, res, next) => {
  // existing code
});

router.put('/administrators/:id', auditLog('UPDATE administrator'), async (req, res, next) => {
  // existing code
});
```

### Step 7: Enforce Strong Password Policy
Update your password-setting script to require strong passwords.

Update `scripts/set-password.mjs` (or wherever you set the password):

```javascript
const password = process.argv[2];

// Strong password requirements
const minLength = 12;
const hasUpperCase = /[A-Z]/.test(password);
const hasLowerCase = /[a-z]/.test(password);
const hasNumbers = /[0-9]/.test(password);
const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

if (password.length < minLength) {
  console.error(`❌ Password must be at least ${minLength} characters long`);
  process.exit(1);
}

if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
  console.error('❌ Password must contain uppercase, lowercase, numbers, and special characters');
  process.exit(1);
}

console.log('✅ Password meets security requirements');
// Continue with hashing and storing
```

---

## Timeline for Implementation
- **Rate limiting**: 5 minutes
- **Audit logging**: 5 minutes
- **HTTPS enforcement**: 2 minutes
- **Strong password policy**: 5 minutes
- **Testing**: 10 minutes

**Total**: ~30 minutes

---

## Security Checklist
- [ ] Rate limiting configured (5 failed attempts = 15-minute lockout)
- [ ] HTTPS enforced in production
- [ ] Audit logs created for all admin actions
- [ ] Strong password enforced (12+ chars, mixed case, numbers, symbols)
- [ ] Credentials are NEVER logged or exposed
- [ ] sessionStorage token cleared on logout
- [ ] Admin login endpoint tested against brute force
- [ ] HTTPS certificate valid and auto-renewed (if hosting)

---

## Next Steps (Future)
1. If you add more admins, migrate to **Option 2** (JWT tokens)
2. Add 2FA when upgrading authentication
3. Implement API key system for programmatic admin access
4. Consider IP whitelisting if admin IPs are stable
5. Set up admin session timeout (auto-logout after 1 hour of inactivity)
