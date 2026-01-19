# Troubleshooting Guide

This document provides solutions for common issues encountered when developing on the PinnacleSG platform.

## Backend Issues

### Database Connection

#### "Connection refused" error
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Causes & Solutions:**
1. **Infisical not running**: Ensure you're running with secrets
   ```bash
   infisical run --env=staging -- uvicorn main:app --reload
   ```

2. **Wrong environment**: Check you're using the correct environment
   ```bash
   infisical run --env=staging -- echo $POSTGRES_URL
   ```

3. **VPN/Network issues**: Supabase requires network access

#### "Connection pool exhausted"
```
sqlalchemy.exc.TimeoutError: QueuePool limit of size 40 overflow 10 reached
```

**Solutions:**
1. Check for unclosed sessions in code
2. Increase pool size if needed:
   ```python
   # In config.py
   POSTGRES_POOL_SIZE = int(os.getenv("POSTGRES_POOL_SIZE", "50"))
   ```

### Authentication Issues

#### "Firebase token validation failed"
```
ValueError: Could not verify token signature
```

**Solutions:**
1. Check Firebase credentials in Infisical
2. Verify token hasn't expired
3. Ensure correct Firebase project is configured

#### "User not found" after login
**Causes:**
- Account doesn't exist in `patient_accounts` table
- Firebase UID not linked in `patient_firebase_auths`

**Debug:**
```python
# Check Firebase auth record
from models import AccountFirebase
auth = db.query(AccountFirebase).filter(
    AccountFirebase.firebase_uid == firebase_uid
).first()
```

### SGiMed Integration

#### "SGiMed API timeout"
**Solutions:**
1. Check SGiMed API status
2. Increase timeout in httpx client:
   ```python
   async with httpx.AsyncClient(timeout=30.0) as client:
       response = await client.get(url)
   ```

#### "Patient not found in SGiMed"
**Causes:**
- Patient not yet synced
- NRIC mismatch

**Debug:**
```bash
# Check scheduler logs
infisical run --env=staging -- python scheduler.py
```

### Scheduler Issues

#### Scheduler not running jobs
**Solutions:**
1. Check scheduler is running as separate process
2. Verify cron expressions in `scheduler.py`
3. Check `backend_crons` table for last run times

#### Jobs timing out
**Solutions:**
1. Increase job timeout
2. Check for blocking database queries
3. Review job implementation for inefficiencies

---

## Frontend Mobile Issues

### Build Errors

#### "Module not found" in Expo
```
Unable to resolve module X from Y
```

**Solutions:**
1. Clear Metro cache:
   ```bash
   pnpm start --clear
   ```
2. Reinstall node_modules:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
3. Reset Expo cache:
   ```bash
   expo start -c
   ```

#### iOS build fails with CocoaPods
```
[!] Unable to find a specification for `ExpoModulesCore`
```

**Solutions:**
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
npx expo prebuild --clean
```

#### Android build fails
```
Execution failed for task ':app:bundleReleaseJsAndAssets'
```

**Solutions:**
1. Clean Android build:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```
2. Rebuild:
   ```bash
   eas build --platform android --profile preview
   ```

### Runtime Errors

#### "Network request failed"
**Causes:**
1. Incorrect API URL in `Config.ts`
2. No internet connection
3. SSL certificate issues on Android

**Solutions:**
1. Check API URL configuration
2. For Android development, ensure cleartext traffic is allowed in `AndroidManifest.xml`

#### Firebase auth not working
**Solutions:**
1. Check Firebase configuration in `app.config.js`
2. Verify GoogleService-Info.plist (iOS) or google-services.json (Android)
3. Ensure Firebase project settings match

#### Push notifications not received
**Debug steps:**
1. Check FCM token is saved:
   ```typescript
   console.log(await messaging().getToken());
   ```
2. Verify token is sent to backend
3. Check Firebase console for delivery status

### Navigation Issues

#### Screen not found
```
The action 'NAVIGATE' was not handled by any navigator
```

**Solutions:**
1. Check route name matches file path in `app/` directory
2. Verify `_layout.tsx` files exist in parent directories
3. Check for typos in route names

---

## Frontend Web Issues

### Build Errors

#### TypeScript errors
```
error TS2322: Type 'X' is not assignable to type 'Y'
```

**Solutions:**
1. Run type check:
   ```bash
   pnpm typecheck
   ```
2. Fix type mismatches in code
3. Update generated client if API changed:
   ```bash
   pnpm run gen-client
   ```

#### Vite build fails
```
[vite]: Rollup failed to resolve import
```

**Solutions:**
1. Check import paths
2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```
3. Reinstall dependencies

### Runtime Errors

#### "Failed to fetch" API errors
**Solutions:**
1. Check API URL in `.env`:
   ```bash
   VITE_ADMIN_API_URL=http://localhost:8000
   ```
2. Verify backend is running
3. Check CORS configuration in backend

#### Supabase auth issues
**Solutions:**
1. Verify Supabase URL and key in environment
2. Check user has correct role in `user_metadata`
3. Clear browser storage and re-login

---

## API Client Issues

### Client generation fails
```
Error: Failed to fetch OpenAPI spec
```

**Solutions:**
1. Ensure backend is running:
   ```bash
   uvicorn main:app --port 8000
   ```
2. Check OpenAPI endpoint is accessible:
   ```bash
   curl http://localhost:8000/openapi.json
   ```

### Type mismatches after update
**Solutions:**
1. Regenerate client:
   ```bash
   pnpm run gen-client
   ```
2. Update calling code to match new types
3. Check for breaking API changes

---

## Payment Integration Issues

### Stripe

#### "Invalid API Key"
**Solutions:**
1. Check Stripe keys in Infisical
2. Ensure using test keys in development
3. Verify environment matches (test vs live)

#### Payment webhook not received
**Debug:**
1. Check webhook endpoint is registered in Stripe dashboard
2. Verify webhook secret matches
3. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:8000/api/stripe/v1/webhook
   ```

### NETS

#### "Transaction failed"
**Solutions:**
1. Check NETS credentials
2. Verify sandbox/production environment
3. Check transaction format

---

## Development Environment

### Infisical Issues

#### "Cannot fetch secrets"
**Solutions:**
1. Re-login to Infisical:
   ```bash
   infisical login
   ```
2. Check workspace access
3. Verify environment exists (staging/production)

### Database Migrations

#### Migration conflict
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xxx'
```

**Solutions:**
1. Check migration history:
   ```bash
   uv run alembic history
   ```
2. Fix revision chain
3. Consider `alembic stamp head` for fresh start (development only)

#### Migration fails to apply
**Solutions:**
1. Check for syntax errors in migration
2. Verify database connection
3. Check for conflicting changes

---

## Performance Issues

### Slow API responses
**Debug:**
1. Check database query performance
2. Add logging to identify slow operations
3. Check for N+1 query problems

### High memory usage
**Solutions:**
1. Check for memory leaks in background jobs
2. Review database connection pool settings
3. Monitor with Sentry performance

---

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `401 Unauthorized` | Invalid/expired token | Re-authenticate |
| `403 Forbidden` | Insufficient permissions | Check user role |
| `404 Not Found` | Resource doesn't exist | Verify ID/path |
| `422 Unprocessable Entity` | Invalid request body | Check request format |
| `500 Internal Server Error` | Backend crash | Check Sentry/logs |
| `502 Bad Gateway` | Backend not responding | Restart backend |
| `503 Service Unavailable` | Overloaded/maintenance | Wait and retry |

---

## Getting Help

1. **Check logs**: Backend logs, Sentry errors, browser console
2. **Search documentation**: Check if issue is documented
3. **Check recent changes**: Git blame for recently changed code
4. **Ask team**: Slack channel or direct message

---

**Last Updated**: 2026-01-16
