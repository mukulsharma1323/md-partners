# Pharmacy mobile app

The app uses the existing `md-tracker-backend` API. Login and catalog search are authenticated. On opening the pharmacy workspace, it loads the assigned store's catalog, batches, customers, suppliers, purchases, stock adjustments and retail invoices through `/pharmacy/bootstrap`.

The Billing tab implements the **retail** flow. Users select a stocked batch and pack, strip or loose unit; the cart validates stock and posts a retail invoice to `/pharmacy/invoices/retail`. The app refreshes stock and sales after a successful save. Purchase entry posts to `/pharmacy/purchases`; stock adjustment requests and approvals use the existing inventory endpoints. The dashboard, sales history, customer bills, supplier history and reports use the same backend records. Wholesale billing is not part of this app.

The backend currently has no endpoints or tables for retail returns, purchase returns, payment collection, shift closing or purchase orders. The former local demo actions for these features are not in the live navigation. Prescription extraction is live, and a checkout file can be selected for the pharmacist check; the invoice endpoint does not persist the file. Printing is still a preview.

See [backend-integration.md](../../../docs/backend-integration.md) for endpoint details and manual verification steps. Run `npm test -- --runInBand` and `npm run lint -- --quiet` from the project root.
