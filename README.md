# DataKart

Standalone mock product-data service for Parakh.

DataKart has its own GitHub repository and its own Supabase project. It is intentionally separate from the Parakh application database.

## What it does

- Admin login using Supabase Auth
- Add products
- Delete products
- Browse and search the product catalogue
- Lookup a product by GTIN
- Expose a lightweight read-only GTIN API for future Parakh integration

## Stack

- React + Vite
- Supabase PostgreSQL + Auth
- Node.js + Express API

## Supabase

Project: `datakart`
Project ref: `iaghrncbfpxpwcdgyuen`
Region: `ap-south-1`

The frontend only uses the Supabase publishable/anon key. Never put a service-role key in the frontend.

## Local setup

1. Create `.env` files from the examples.
2. Install dependencies from the repository root with `npm install`.
3. Run `npm run dev`.

The frontend runs on port 5173 and the API on port 4000.

## Admin

Create an account through the Admin Login screen. Read access is public for active products; product creation and deletion require an authenticated Supabase user.

## GTIN API

`GET /api/products/gtin/:gtin`

Example:

`http://localhost:4000/api/products/gtin/890000000001`

This is a mock DataKart implementation for the Parakh project. It is not the official GS1 India DataKart service and should not be presented as one.
