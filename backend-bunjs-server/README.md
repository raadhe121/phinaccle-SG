# backend-bunjs-server
## Start Server
```bash
bun install
bun index.ts
```

## Test PDF Generation
```bash
curl --request POST 'https://backend-bunjs-server.onrender.com/api/health-report-pdf' \
  --header 'Authorization: Bearer <SUPABASE_WEBHOOK_API_KEY>' \
  --header 'Content-Type: application/json' \
  -d @test-health-report.json \
  --output test-health-report.pdf
```


# Legacy Supabase Functions Implementation
Source: https://supabase.com/docs/guides/functions/local-quickstart
1. Initialise Project
```bash
supabase init
```
2. Function Development
```bash
supabase start
supabase functions serve
supabase status # Get anon key
curl --request POST 'http://localhost:54321/functions/v1/health-report-pdf' \
  --header 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  -d @test-health-report.json \
  --output test-health-report.pdf
supbase stop
```
3. Production Deployment
```bash
supabase functions deploy health-report-pdf
# Test Production Curl
curl --request POST 'https://<PROJECT_REF>.supabase.co/functions/v1/health-report-pdf' \
  --header 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  -d @test-health-report.json \
  --output test-health-report-prod.pdf
```

