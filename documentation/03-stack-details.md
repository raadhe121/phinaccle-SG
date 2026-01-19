# Stack Version Details

This document lists the core technologies and dependency versions used across the PinnacleSG platform.

## Backend (FastAPI)
- **Runtime**: Python 3.13
- **Primary Frameworks**:
    - `fastapi`
    - `sqlalchemy` (ORM)
    - `pydantic v2` (Validation)
    - `alembic` (Migrations)
- **Key Integrations**:
    - `supabase`: PostgreSQL and Auth.
    - `firebase-admin`: Push notifications.
    - `stripe`: Payment processing.
    - `sentry-sdk`: Error monitoring.
    - `apscheduler`: Background task management.

## Frontend - Patient App (Mobile)
- **Framework**: Expo / React Native (v0.76.9)
- **Key Libraries**:
    - `@tanstack/react-query`: Server state management.
    - `nativewind`: Tailwind CSS for React Native.
    - `zustand`: Local state management.
    - `expo-router`: Navigation.
    - `@hey-api/openapi-ts`: Client generation.

## Frontend - Admin Web UI (Web)
- **Framework**: React (v18.2.0) with Vite
- **UI Components**: `antd` (Ant Design)
- **Key Libraries**:
    - `@tanstack/react-query`: Server state.
    - `@supabase/supabase-js`: Backend interaction.
    - `tailwindcss`: Styling.

## Service - BunJS Server
- **Runtime**: Bun.js
- **Purpose**: Specialized service for PDF generation.
