# API Documentation

The PinnacleSG backend provides a RESTful API powered by FastAPI.

## Documentation Access
- **Swagger UI**: [https://pinnacle-api.geddit-apps.com/docs](https://pinnacle-api.geddit-apps.com/docs)
- **Redoc**: [https://pinnacle-api.geddit-apps.com/redoc](https://pinnacle-api.geddit-apps.com/redoc)

## Core API Sections

### Patient Authentication (`/api/auth`)
- **Login/Register**: `/api/auth/login` (Supports Firebase UID validation).
- **OTP Verification**: `/api/auth/verify_otp` for mobile number validation.
- **Profile Management**: `/api/user/profile` for updating patient details.

### Teleconsultation (`/api/teleconsult`)
- **Queue Management**: `/api/teleconsult/queue` for checking in and monitoring status.
- **Prepayment**: `/api/teleconsult/prepayment/rate` to fetch rates before checkout.

### Appointments (`/api/appointment`)
- **Booking**: `/api/appointment/book` for scheduling clinic visits.
- **Availability**: `/api/appointment/slots` to check branch specific availability.

## Authentication Mechanism
The API uses **Firebase Authentication** for user identity.
- Client passes `Authorization: Bearer <Firebase_ID_Token>` in headers.
- Backend validates the token using `firebase-admin` SDK mapping the `uid` to a local `Account` record.

## Client Generation
Frontend SDKs are automatically generated from the [openapi.json](file:///Users/jx/Documents/Codes/GRMedicalApp/_modules/250315_appointment/main/backend-patient-app/monorepo/pinnaclesg-monorepo/openapi.json) file found in the root.
