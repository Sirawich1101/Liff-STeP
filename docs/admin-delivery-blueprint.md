# Admin Delivery Blueprint

## n8n Workflows

### 1. `submit-request`
1. Webhook `submit-request`
2. Set `Normalize Request`
3. Set `Generate Metadata`
4. Google Sheets `Append Row`
5. HTTP Request `Push Confirm to User`
6. HTTP Request `Push Notify Admin`
7. Respond to Webhook

Required fields:
- `request_code`
- `line_user_id`
- `status = PENDING_ADMIN`
- `pdf_file_name`
- `pdf_download_token`
- `updated_at`

### 2. `check-status`
1. Webhook `check-status`
2. Set `Extract requestCode`
3. Google Sheets `Lookup by request_code`
4. IF `Found?`
5. Respond to Webhook

### 3. `admin-approve`
1. Webhook `admin-approve`
2. Set `Extract requestCode/adminUserId/action`
3. IF `Secret OK`
4. Google Sheets `Lookup Request`
5. IF `Request Found`
6. IF `Admin Authorized`
7. IF `Status Pending`
8. Set `Delivery Payload`
9. Google Sheets `Update Row`
10. HTTP Request `Push User Download/Confirm`
11. HTTP Request `Push Admin Success`
12. Respond to Webhook

### 4. `user-confirm-receipt`
1. Webhook `user-confirm-receipt`
2. Set `Extract requestCode/lineUserId/token`
3. IF `Secret OK`
4. Google Sheets `Lookup Request`
5. IF `User Matches Request`
6. Google Sheets `Update Row`
7. HTTP Request `Push Thank You`
8. Respond to Webhook

### 5. `upload-revised-plan`
1. Webhook `upload-revised-plan`
2. IF `Secret OK`
3. Google Sheets `Lookup Request`
4. Google Drive `Upload Files` or storage target
5. Google Sheets `Update Row`
6. HTTP Request `Push Notify Admin`
7. Respond to Webhook

## Status Model

- `PENDING_ADMIN`
- `APPROVED`
- `DELIVERED`
- `RECEIVED`
- `WAITING_USER_UPLOAD`
- `UNDER_REVIEW`
- `NEEDS_REVISION`
- `PASSED`
- `CLOSED`

## Security

- Every LIFF proxy route should pass `x-step-secret` to n8n when available.
- `admin-approve` must validate `adminUserId` against an allowlist.
- `user-confirm-receipt` must validate `line_user_id`.
- PDF download should validate `code + token`.

## Vercel Files

- `admin.html`: admin-only approval UI
- `document.html`: preview + confirm receipt UI
- `status.html`: status lookup UI
- `api/pdf.js`: actual PDF download endpoint
- `api/admin-approve.js`: secure proxy to n8n
- `api/confirm.js`: secure proxy to n8n
