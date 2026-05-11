# n8n Node-by-Node Blueprint

This blueprint aligns the LIFF app with the existing STeP CMU n8n setup.

## Shared Data Fields

- `request_code`
- `line_user_id`
- `requester_name`
- `company`
- `phone`
- `email`
- `document_type`
- `area`
- `room_number`
- `required_date`
- `note`
- `status`
- `pdf_file_name`
- `pdf_download_token`
- `approved_by`
- `approved_at`
- `delivered_at`
- `confirmed_at`
- `updated_at`

## Workflow 1: Submit Request

### Existing webhook
- `Webhook: submit-request`

### Add / adjust nodes
1. `Set: Normalize Request`
   - map incoming payload to canonical field names
   - convert `objective` to `room_number` if needed
2. `Code/Set: Generate Request Code`
   - keep existing request code logic if already stable
3. `Set: Delivery Metadata`
   - `status = PENDING_ADMIN`
   - `pdf_file_name = {{$json.request_code}}_{{$json.room_number || $json.objective}}.pdf`
   - `pdf_download_token = random token`
   - `updated_at = now`
4. `Google Sheets: Save Request`
5. `HTTP Request: Push Confirm to User`
6. `HTTP Request: Push Notify Admin`
   - include admin approval URL
   - `https://liff-s-te-p.vercel.app/admin.html?code={{$json.request_code}}`
7. `Respond to Webhook`

## Workflow 2: Check Status

### New webhook
- `Webhook: check-status`

### Nodes
1. `Set: Extract Request Code`
2. `Google Sheets: Lookup Request`
3. `IF: Row Found`
4. `Respond to Webhook`
   - found: `{ "found": true, "request": {...} }`
   - not found: `{ "found": false }`

## Workflow 3: Admin Approve

### New webhook
- `Webhook: admin-approve`

### Nodes
1. `Set: Extract Admin Payload`
   - `requestCode`
   - `action`
   - `adminUserId`
   - `adminDisplayName`
2. `IF: Secret Header OK`
3. `Google Sheets: Lookup Request`
4. `IF: Request Found`
5. `IF: Admin Allowed`
   - compare `adminUserId` to allowlist
6. `IF: Status Is Pending`
   - allow `PENDING_ADMIN`
   - optionally allow legacy Thai initial status
7. `Set: Approval Update`
   - `status = DELIVERED`
   - `approved_by = adminUserId`
   - `approved_at = now`
   - `delivered_at = now`
   - `updated_at = now`
8. `Google Sheets: Update Request`
9. `HTTP Request: Push Document to User`
   - send buttons/flex message with:
     - download URL `https://liff-s-te-p.vercel.app/document.html?code={{$json.request_code}}&token={{$json.pdf_download_token}}`
     - confirm URL or instruction
10. `HTTP Request: Push Result to Admin`
11. `Respond to Webhook`

## Workflow 4: User Confirm Receipt

### New webhook
- `Webhook: user-confirm-receipt`

### Nodes
1. `Set: Extract Confirm Payload`
   - `requestCode`
   - `lineUserId`
   - `token`
2. `IF: Secret Header OK`
3. `Google Sheets: Lookup Request`
4. `IF: Request Found`
5. `IF: User Matches`
   - compare `lineUserId` to `line_user_id`
   - optionally compare `token` to `pdf_download_token`
6. `Set: Confirm Update`
   - `status = RECEIVED`
   - `confirmed_at = now`
   - `updated_at = now`
7. `Google Sheets: Update Request`
8. `HTTP Request: Push Thank You`
9. `Respond to Webhook`

## Workflow 5: Upload Revised Plan

### Existing webhook
- `Webhook: upload-revised-plan`

### Add / adjust nodes
1. `Set: Normalize Upload`
2. `IF: Secret Header OK`
3. `Google Sheets: Lookup Request`
4. `IF: Request Found`
5. `Google Drive or Storage: Save Files`
6. `Set: Review Update`
   - `status = UNDER_REVIEW`
   - `updated_at = now`
7. `Google Sheets: Update Request`
8. `HTTP Request: Notify Admin`
9. `Respond to Webhook`

## Suggested LINE Message Formats

### Admin notification
- request code
- requester
- document type
- area / room number
- approval button

### User delivery
- request code
- ready for download
- download button
- confirm receipt button

### Confirm receipt reply
- thank you
- next step if upload revision is required

## Minimum Secrets

- `STEP_WEBHOOK_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- admin allowlist values
