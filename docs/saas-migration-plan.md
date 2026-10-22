# SaaS migration plan

## Product boundary

- A tenant is an independent medical business. A tenant owns stores and staff users.
- The web app and MD Desk serve every subscribed tenant.
- MD Partners is enabled only for the Meri Davai Medihub tenant and operated by Prikind. Its API access must be enforced by the backend.
- Medicine identity is shared; prices belong to each tenant. Initial onboarding is admin-led.
- Preserve existing record IDs and API response shapes during migration.

## Current constraints found in code

- Backend has store-scoped operational data but no tenant entity or membership.
- Supplier and sales-agent bootstrap data, role permissions, and several reports are global.
- `super-admin` currently bypasses store scope. Tenant owner and platform operator need separate privileges.
- Product catalog identity and prices are stored together globally.
- Web and MD Desk invoice generators contain fixed Prikind company and payment details.
- Signup creates a user without a store or business.

## Delivery sequence

1. Introduce tenants and backfill all existing business records into the legacy tenant. Keep migration additive and reversible until verified.
2. Resolve the tenant from authenticated user on every request. Scope reads, writes, foreign-key lookups, reports, uploads, and role administration server-side.
3. Split platform administration from tenant ownership. Restrict MD Partners endpoints to its entitled tenant.
4. Introduce tenant/store business profile and tenant-specific pricing. Render both web and mobile invoices from the profile.
5. Build invited onboarding for a second business and its first store/user. Add subscription lifecycle after isolation is proven.
6. Test cross-tenant access using two fixtures on every endpoint and document migration/rollback checks.

## Release gates

- Existing business has identical stock, customers, invoices, and permissions after backfill.
- Tenant A cannot read or mutate tenant B records by guessing IDs, changing request bodies, or requesting reports/files.
- Both web and MD Desk show the active tenant's business identity and invoice details.
- A non-entitled tenant cannot use MD Partners APIs.
- Production migration is run only after backup and dry run against a staging copy.
