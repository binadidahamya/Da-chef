# Da Chef Restaurant — Frontend + Backend

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract this folder.
2. Open a terminal in this folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure an admin key before using the admin API.

   **Windows PowerShell**
   ```powershell
   $env:ADMIN_KEY="change-this-to-a-long-secret"
   npm start
   ```

   **Windows Command Prompt**
   ```cmd
   set ADMIN_KEY=change-this-to-a-long-secret
   npm start
   ```

   **macOS/Linux**
   ```bash
   ADMIN_KEY="change-this-to-a-long-secret" npm start
   ```

5. Open http://localhost:3000

## API endpoints
- `POST /api/reservations` — create a reservation request.
- `GET /api/admin/reservations` — list reservations; send the secret in the `x-admin-key` header.
- `PATCH /api/admin/reservations/:id` — update status to `pending`, `confirmed`, `cancelled`, or `completed`; send the `x-admin-key` header and JSON body such as `{"status":"confirmed"}`.
- `GET /api/health` — health check.

## Example POST body
```json
{
  "name": "Nimal Perera",
  "phone": "0771234567",
  "date": "2026-11-05",
  "time": "19:00",
  "guests": 2,
  "notes": "Window seat if available"
}
```

## Notes
- Reservation details are saved in `reservations.db`, created automatically.
- Do not publish your admin key or commit it to a public repository.
- Before using this for a real restaurant, add HTTPS, rate limiting, backups, privacy notice, and proper admin login.
- The phone number and WhatsApp number in the template are placeholders; replace them with the restaurant's actual contact details.
