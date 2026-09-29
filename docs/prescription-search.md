# Prescription search

New Sale → **Search prescription** (below Refresh medicines) opens camera, photo library and PDF/image upload choices. A successful scan shows a review row for every extracted medicine, including missing products. Each row supports quantity editing, dispensing-unit selection, rejection, and an explicit confirm action. A pharmacist can search the catalog and pick an alternative when no exact match exists. Confirmation adds the reviewed quantity to the cart once, and pins that product in New Sale. AI output never automatically finalizes a sale or verifies a prescription.

The scanned document is attached to checkout as unverified. If changing customer clears the attachment, **Use scanned prescription** can attach it again. Stock/batch/expiry and sale persistence remain the existing local demo behavior.

## Backend setup

Changes are in `/Users/mukulsharma/code/md-tracker-backend`:

- `POST /prescriptions/extract`, authenticated and protected by products-view permission.
- Multipart field: `prescription`, one PDF/JPEG/PNG/WebP, max 3 MB. The server validates file signatures and never writes uploaded prescriptions to public uploads or logs.
- Server environment: `OPENAI_API_KEY` (required), `OPENAI_PRESCRIPTION_MODEL=gpt-4.1-mini` (optional override). Never put this key in the mobile app.
- Deploy the updated backend to the URL in `src/api/config.js` before using the feature against the hosted API. The Vercel function duration is configured to 90 seconds; the OpenAI request times out after 65 seconds.
- Responses API uses image or PDF input, strict JSON schema, and `store: false`. This setting disables response storage; it is not a promise of zero provider retention. Upload UI explains that documents are sent to OpenAI.
- Quantity is transcribed only when an explicit dispensing count is readable. It is never calculated from dosage/frequency/duration. Unclear quantities remain empty for pharmacist entry. Uncertain names do not get an automatic exact-match suggestion. Catalog matches are not inventory availability checks.
- No clinical substitution recommendations are generated. Alternatives are manually searched and chosen by the pharmacist.

Backend checks: `node --test test/prescription*.test.js` (uses mocks, no live OpenAI or database calls).

## Native rebuild

Added `react-native-image-picker` and `@react-native-documents/picker`, along with iOS camera/photo permission descriptions. CocoaPods has been installed. A native app rebuild is required (Metro reload alone cannot add native modules): `npm run ios` or `npm run android`. Dependency installation currently uses `npm install --legacy-peer-deps` because the existing app has conflicting legacy peer dependencies.

On a device, verify camera permission denied/cancel, camera photo, image upload, PDF upload, oversized-file rejection, missing/unclear medicine, alternative selection, quantity/unit confirmation, duplicate taps, retry and scan cancellation. A real account with products-view permission and a configured backend OpenAI key are required for end-to-end extraction.

Implementation references: [OpenAI file inputs](https://developers.openai.com/api/docs/guides/file-inputs), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [image picker](https://github.com/react-native-image-picker/react-native-image-picker), [document picker](https://react-native-documents.github.io/docs/doc-picker-api).
