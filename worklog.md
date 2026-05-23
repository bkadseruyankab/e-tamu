---
Task ID: 1
Agent: Main Agent
Task: Implement dynamic favicon that follows the logo uploaded to database

Work Log:
- Created DynamicFavicon.tsx component that updates browser favicon from database settings
- Updated layout.tsx to include DynamicFavicon inside SettingsProvider
- Updated SettingsPage.tsx to auto-set favicon_url when logo is uploaded
- Added favicon preview and info section in Settings page
- Fixed corrupted SQLite database and permissions
- All code passes ESLint check

Stage Summary:
- Favicon now dynamically follows the logo uploaded in Settings
- Priority: favicon_url > logo_url > default /logo.svg

---
Task ID: 2
Agent: Main Agent
Task: Fix appointment name not appearing in disposition + Fix Fonnte WhatsApp test connection

Work Log:
- Added `appointmentId` (optional) field to Disposition model in Prisma schema
- Added `dispositions` relation to Appointment model
- Ran `bun run db:push` to sync database schema
- Updated `/api/dispositions` GET to include appointment data in the response
- Updated `/api/dispositions` POST to accept `appointmentId` and verify appointment exists
- Updated `/api/dispositions/[id]` GET and PATCH to include appointment data
- Updated notification messages to show appointment visitor name when linked
- Completely rewrote DispositionManager.tsx to:
  - Show appointment visitor name (with "Janji Temu" badge) when disposition is linked to appointment
  - Show detailed appointment info section in the detail dialog
  - Add appointment selection dropdown in the create disposition dialog
  - Use `getDisplayName()` and `getDisplayInstitution()` helpers to prioritize appointment data
- Created `/api/whatsapp/test/route.ts` - new API endpoint for Fonnte WhatsApp test connection
- Added `whatsapp_device_id` field to SettingsPage form
- Added Device ID input field in WhatsApp API settings section
- Updated WhatsApp test API to pass `device` parameter (device_id) in Fonnte API request body
- Updated guests API to also pass device_id when sending WhatsApp notifications
- All code passes ESLint check

Stage Summary:
- Dispositions now support linking to Appointments via `appointmentId`
- Appointment visitor names are displayed in the disposition table with "Janji Temu" badge
- Appointment detail info is shown in the disposition detail dialog
- Fonnte WhatsApp test connection now works with Device ID support
- Device ID field added to Settings page under WhatsApp API configuration

---
Task ID: 1
Agent: main
Task: Fix appointment name not showing in disposition (Janji Temu name missing in Disposisi)

Work Log:
- Analyzed the DispositionManager, AppointmentManager, and API routes to understand the relationship
- Identified root cause: Dispositions required a guestId but appointments had no way to create a disposition directly
- The DispositionManager's appointment dropdown only showed "dikonfirmasi" status, excluding pending appointments
- No "Buat Disposisi" button existed in the AppointmentManager

Changes made:
1. **Updated `/api/dispositions/route.ts` POST handler**: Now supports creating a disposition from an appointment without a pre-existing guest. When `appointmentId` is provided but no `guestId`, the API auto-creates a Guest record from the appointment data (visitorName, institution, phone, etc.), then creates the Disposition linked to both the new Guest and the Appointment.
2. **Updated `AppointmentManager.tsx`**: Added a "Buat Disposisi" button in the appointment detail dialog for all statuses (menunggu, dikonfirmasi, selesai). Added a full disposition creation dialog with department/user selectors and notes. Moved UserOption interface outside the component to avoid re-render issues.
3. **Updated `DispositionManager.tsx`**: Changed appointment fetch from `status=dikonfirmasi` to fetch all appointments, allowing linking of any appointment status.

Stage Summary:
- Appointments can now directly create dispositions via the "Buat Disposisi" button
- When a disposition is created from an appointment, the appointment's visitorName shows in the disposition list
- The "Janji Temu" badge appears next to the visitor name when a disposition is linked to an appointment
- Auto-created Guest records from appointments maintain data integrity

---
Task ID: 2-b
Agent: main
Task: Update all notification creation points to include login links (link field in Notification model)

Work Log:
- Updated `/api/guests/route.ts` POST handler: Added `link: '/guests'` to admin notification creation for new guests
- Updated `/api/guests/route.ts` POST handler: Added `app_url` to WhatsApp settings query, extracted base URL from `settingsMap.app_url` or request origin, and added `🔗 *Login Sistem:* ${baseUrl}` line to WhatsApp message body
- Updated `/api/dispositions/route.ts` POST handler: Added `link: '/dispositions'` to notification creation for new dispositions
- Updated `/api/dispositions/[id]/route.ts` PATCH handler: Added `link: '/dispositions'` to notification creation for disposition status updates
- Verified `/api/notifications/route.ts` GET endpoint already returns `link` field (Prisma returns all model fields by default)
- All code passes ESLint check

Stage Summary:
- All notification creation points now include the `link` field pointing to the relevant page
- Guest notifications link to `/guests`, disposition notifications link to `/dispositions`
- WhatsApp messages now include a login link (`🔗 *Login Sistem:*`) using `app_url` setting or request origin as fallback
- The `link` field values correspond to PageId values in the frontend store for navigation

---
Task ID: 2-c
Agent: Main Agent
Task: Build notification dropdown in AppHeader with clickable links

Work Log:
- Added `formatRelativeTime()` helper function to `/home/z/my-project/src/lib/utils.ts` for Indonesian relative time display ("Baru saja", "5 menit lalu", "1 jam lalu", etc.)
- Completely rewrote the notification bell section in `AppHeader.tsx` from a simple badge-only button to a full DropdownMenu with:
  - Bell icon trigger with unread count badge (gold/navy styled)
  - Header: "Notifikasi" title with unread count badge + "Tandai semua dibaca" button
  - Scrollable notification list (max 400px, max 10 items) with:
    - Color-coded type icons (info=blue, success=green, warning=yellow, error=red)
    - Unread dot indicator with color matching notification type
    - Bold title for unread, muted for read
    - Truncated message (line-clamp-2)
    - Relative time display
    - Gold dot indicator for notifications with links
  - Empty state with BellRing icon and "Tidak ada notifikasi" message
  - Footer: "Lihat semua notifikasi" link
- Implemented notification interaction logic:
  - Clicking a notification marks it as read via PATCH /api/notifications
  - If notification has a `link` field, navigates using setCurrentPage (maps to PageId)
  - "Tandai semua dibaca" calls PATCH with { userId, markAll: true }
  - Local state updates optimistically for immediate UI feedback
- Changed fetchNotifications from unread-only to full list (limit=10) to populate dropdown
- Added ScrollArea import from shadcn/ui for scrollable notification list
- Added new icon imports: Info, CheckCircle2, AlertTriangle, XCircle, CheckCheck, BellRing
- All code passes ESLint check

Stage Summary:
- Notification bell now opens a full dropdown with notification list
- Each notification is clickable: marks as read + navigates to linked page
- "Tandai semua dibaca" marks all notifications as read at once
- Notification `link` field maps to PageId for in-app navigation (e.g., 'guests', 'dashboard', 'login')
- Relative time is displayed in Indonesian (e.g., "5 menit lalu", "1 jam lalu")

---
Task ID: 2-a
Agent: Main Agent
Task: Create email notification API route and update Settings page with SMTP configuration

Work Log:
- Installed `nodemailer@8.0.7` and `@types/nodemailer@8.0.0`
- Created `/api/email/send/route.ts` - Email sending API endpoint:
  - Accepts POST with `to`, `subject`, `message`, `html` fields
  - Reads SMTP settings from database (Setting model): `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure`, `email_notification_enabled`
  - Uses nodemailer to send emails with configurable transport
  - Validates SMTP configuration before attempting to send
  - Handles connection errors gracefully with user-friendly Indonesian error messages
  - Specific handling for ECONNREFUSED, ETIMEDOUT, EAUTH, ENOTFOUND, ESOCKET, and SSL cert errors
  - Connection timeouts (10s connect, 15s socket) to prevent hanging
- Created `/api/email/test/route.ts` - Email test API endpoint:
  - Accepts POST with optional SMTP override settings (useful for testing before saving)
  - Falls back to database settings for any missing fields
  - Sends a professionally styled HTML test email with navy/gold E-Tamu BKAD branding
  - Test email includes timestamp, SMTP server info, and success confirmation
  - Recipient is `contact_email` from DB, or falls back to `smtp_user`
  - Same graceful error handling as send endpoint
- Updated `SettingsPage.tsx` with SMTP configuration:
  - Added `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure` to SettingsForm interface and defaultSettings
  - Added state: `showSmtpPass`, `testingEmail`
  - Added `handleTestEmail()` function that calls `/api/email/test` with current form values
  - Added SMTP Configuration section in the "Kontak & Notifikasi" card under Email Settings:
    - SMTP Server input (placeholder: smtp.gmail.com)
    - Port input (default: 587) with hint "587 (TLS) atau 465 (SSL)"
    - SSL/TLS switch toggle with dynamic label (SSL/TLS vs STARTTLS)
    - Username/Email SMTP input
    - Password SMTP input with show/hide toggle (eye icon)
    - "Gunakan App Password untuk Gmail" hint
    - "Test Email" button with loading state, disabled when SMTP host/user not filled
  - All SMTP fields are integrated into the existing save flow (saved via PUT /api/settings)
  - Design matches existing navy (#0c2d57) and gold (#c9a84c) color scheme
- All code passes ESLint check

Stage Summary:
- Email sending now uses configurable SMTP from database settings instead of hardcoded values
- SMTP configuration is fully managed from the Settings page UI
- Test Email button allows verifying SMTP configuration before relying on it for notifications
- Error messages are clear and actionable (in Indonesian), guiding users to fix configuration issues
- Connection timeouts prevent the app from hanging when SMTP is unreachable

---
Task ID: 3
Agent: Main Agent
Task: Fix email notifications not working - add email notification triggers and granular settings

Work Log:
- Created `/src/lib/email.ts` - Shared email utility library:
  - `getEmailSettings()` - Reads SMTP + email settings from database
  - `isEmailNotificationEnabled()` - Checks if email is globally enabled and configured
  - `isEmailEventEnabled(eventKey)` - Checks if a specific email event is enabled (granular control)
  - `sendEmailNotification()` - Low-level email sending via nodemailer
  - `sendStyledEmail()` - Sends email with professional navy/gold HTML template
  - `sendGuestArrivalEmail()` - Pre-built template for new guest notifications
  - `sendGuestStatusEmail()` - Pre-built template for guest status change notifications
  - `sendDispositionEmail()` - Pre-built template for disposition notifications (create + update)
  - `sendAppointmentEmail()` - Pre-built template for appointment notifications (create + update)
- Updated `/api/guests/route.ts` POST: Added email notification when new guest arrives (event: email_on_guest_arrival)
- Updated `/api/guests/[id]/route.ts` PATCH: Added email notification on guest status change (event: email_on_guest_status)
- Updated `/api/dispositions/route.ts` POST: Added email notification on new disposition (event: email_on_disposition)
- Updated `/api/dispositions/[id]/route.ts` PATCH: Added email notification on disposition status update (event: email_on_disposition_status)
- Updated `/api/appointments/route.ts` POST: Added email notification on new appointment (event: email_on_appointment)
- Updated `/api/appointments/[id]/route.ts` PUT: Added email notification on appointment status change (event: email_on_appointment_status), including sending to visitor's email when confirmed/rejected
- Enhanced SettingsPage.tsx with:
  - Added `app_url` field for setting the application URL (used in email/WhatsApp links)
  - Added 6 granular email event toggles (visible when email notifications enabled):
    - email_on_guest_arrival - Tamu Baru Mendaftar
    - email_on_guest_status - Status Tamu Berubah
    - email_on_disposition - Disposisi Baru
    - email_on_disposition_status - Status Disposisi Berubah
    - email_on_appointment - Janji Temu Baru
    - email_on_appointment_status - Status Janji Temu Berubah
  - Added email configuration status badge (Siap/Belum Lengkap/Nonaktif)
  - All email event settings are saved to database via existing PUT /api/settings flow
- All code passes ESLint check

Stage Summary:
- Email notifications are now actually triggered when events occur (guests, dispositions, appointments)
- Each notification type has a professional HTML email template with navy/gold branding
- Granular control allows enabling/disabling specific email events
- Email status indicator shows if SMTP is properly configured
- Appointment confirmation/rejection emails are also sent to the visitor's email
- Added app_url setting for proper link generation in notifications

---
Task ID: 4
Agent: Main Agent
Task: Fix setup wizard repeating after setup is completed

Work Log:
- Investigated the setup flow: SetupCheck component → GET /api/setup → database Setting table
- Found root cause: The `setup_complete` key was MISSING from the database (value was null)
- The GET /api/setup endpoint returned `setupComplete: false`, which overwrote localStorage and showed the wizard every time
- The setup was clearly done (had org settings, whatsapp_api_key, 5 users), but the key was lost
- Added `setup_complete: 'true'` to the database immediately via Prisma script
- Updated GET /api/setup endpoint with smarter fallback logic:
  - If `setup_complete` key is missing but admin users exist → auto-repair DB and return `setupComplete: true`
  - Returns `hasNoUsers` flag so client knows if setup truly hasn't been done
- Updated SetupCheck component to not blindly overwrite localStorage with `false`:
  - Only sets `isSetupComplete(false)` if API confirms `hasNoUsers: true`
  - On API failure, trusts localStorage persisted value instead of defaulting to false
- Fixed Zustand store partialize: changed `undefined` fallback for currentPage to `'dashboard'` to avoid undefined page rendering
- All code passes ESLint check

Stage Summary:
- Setup wizard no longer repeats after completion
- Auto-repairs missing `setup_complete` key if admin users exist
- More resilient to API failures (trusts localStorage when API is down)
- Fixed currentPage persistence edge case

---
Task ID: 3-a
Agent: Main Agent
Task: Fix WhatsApp/Fonnte notifications - create centralized WhatsApp utility and integrate into all API routes

Work Log:
- Created `/src/lib/whatsapp.ts` - Shared WhatsApp/Fonnte utility library (mirroring email.ts pattern):
  - `getWhatsAppSettings()` - Reads WhatsApp settings from database (whatsapp_api_key, whatsapp_api_url, whatsapp_device_id, whatsapp_notification_enabled, contact_whatsapp, app_name, app_url)
  - `isWhatsAppEnabled()` - Checks if WhatsApp notifications are globally enabled and API key configured
  - `isWhatsAppEventEnabled(eventKey)` - Checks if a specific WhatsApp event is enabled (granular control per event)
  - `sendWhatsAppMessage(target, message)` - Sends message via Fonnte API with Authorization header and device_id in body
  - `sendGuestArrivalWhatsApp(data)` - Pre-built template for new guest notifications with login URL
  - `sendGuestStatusWhatsApp(data)` - Pre-built template for guest status change notifications with login URL
  - `sendDispositionWhatsApp(data)` - Pre-built template for disposition notifications (create + update) with login URL
  - `sendAppointmentWhatsApp(data)` - Pre-built template for appointment notifications (create + update) with login URL
  - All messages include login URL at bottom using `app_url` from settings
  - Device ID is included in request body as `device` parameter (Fonnte API requirement)
  - Fonnte API format: POST with Authorization header + JSON body { target, message, device }
- Updated `/api/guests/route.ts` POST: Replaced inline WhatsApp code with centralized `isWhatsAppEventEnabled('whatsapp_on_guest_arrival')` + `sendGuestArrivalWhatsApp()` call
- Updated `/api/guests/[id]/route.ts` PATCH: Added WhatsApp notification on guest status change using `isWhatsAppEventEnabled('whatsapp_on_guest_status')` + `sendGuestStatusWhatsApp()`
- Updated `/api/dispositions/route.ts` POST: Added WhatsApp notification on new disposition using `isWhatsAppEventEnabled('whatsapp_on_disposition')` + `sendDispositionWhatsApp()`
- Updated `/api/dispositions/[id]/route.ts` PATCH: Added WhatsApp notification on disposition status change using `isWhatsAppEventEnabled('whatsapp_on_disposition_status')` + `sendDispositionWhatsApp()`
- Updated `/api/appointments/route.ts` POST: Added WhatsApp notification on new appointment using `isWhatsAppEventEnabled('whatsapp_on_appointment')` + `sendAppointmentWhatsApp()`
- Updated `/api/appointments/[id]/route.ts` PUT: Added WhatsApp notification on appointment status change using `isWhatsAppEventEnabled('whatsapp_on_appointment_status')` + `sendAppointmentWhatsApp()`, including sending to visitor's phone when confirmed/rejected
- Updated `SettingsPage.tsx` with 6 granular WhatsApp event toggles (visible when WhatsApp notifications enabled):
  - whatsapp_on_guest_arrival - Tamu Baru Mendaftar
  - whatsapp_on_guest_status - Status Tamu Berubah
  - whatsapp_on_disposition - Disposisi Baru
  - whatsapp_on_disposition_status - Status Disposisi Berubah
  - whatsapp_on_appointment - Janji Temu Baru
  - whatsapp_on_appointment_status - Status Janji Temu Berubah
  - All settings stored in Setting table as key-value pairs (no schema change needed)
  - WhatsApp event toggles appear in green-themed section, matching email's amber-themed section
- All WhatsApp errors are handled gracefully - WhatsApp failures do NOT break main operations
- All modified files pass ESLint and TypeScript type checks

Stage Summary:
- WhatsApp/Fonnte notifications are now fully integrated with centralized utility library
- All 6 event types (guest arrival, guest status, disposition, disposition status, appointment, appointment status) have WhatsApp notification support
- Granular per-event toggle controls in Settings page (green-themed section matching email's amber section)
- Fonnte API properly sends device_id in request body and API key in Authorization header
- All WhatsApp messages include login URL link at bottom using app_url setting
- Appointment confirmation/rejection WhatsApp also sent to visitor's phone number
- Error handling: WhatsApp failures silently fail without affecting main API operations

---
Task ID: 5
Agent: Main Agent
Task: Add Save button for employee notification toggles

Work Log:
- Added `notifyEmail` (Boolean, default true) and `notifyWhatsApp` (Boolean, default true) fields to Employee model in Prisma schema
- Ran `bun run db:push` to sync database schema
- Updated `/api/employees/route.ts` POST handler: Now accepts and saves `notifyEmail` and `notifyWhatsApp` fields (default true)
- Updated `/api/employees/[id]/route.ts` PUT handler: Now accepts and updates `notifyEmail` and `notifyWhatsApp` fields
- Updated `EmployeeManager.tsx`:
  - Added `notifyEmail` and `notifyWhatsApp` to Employee interface
  - Added `formNotifyEmail` and `formNotifyWhatsApp` state variables (default true)
  - Updated `resetForm()` to reset notification states
  - Updated `openEdit()` to populate notification states from employee data
  - Updated `handleCreate()` and `handleUpdate()` to include notification fields in API request body
  - Added "Preferensi Notifikasi" section in both Create and Edit dialogs with:
    - Bell icon header with gold accent
    - Notifikasi Email toggle (Mail icon + Switch)
    - Notifikasi WhatsApp toggle (MessageCircle icon + Switch)
    - Bordered card-style toggle rows for visual clarity
  - Updated Edit dialog Save button: Changed from "Simpan Perubahan" to prominent "Simpan" with Bell icon
  - Updated success toast on update: "Data pegawai dan preferensi notifikasi berhasil disimpan"
  - Added Bell and MessageCircle icon imports
- Verified DepartmentManager has no notification settings (no changes needed)
- All code passes ESLint check

Stage Summary:
- Employee model now has `notifyEmail` and `notifyWhatsApp` boolean fields (default true)
- Both Create and Edit employee dialogs include notification preference toggles
- The Edit dialog has a prominent "Simpan" button with Bell icon that saves both employee details AND notification preferences
- Toast notification confirms successful save of both data and notification preferences
- DepartmentManager was checked and requires no changes (no notification fields)

---
Task ID: 1, 2, 3
Agent: Main Agent
Task: Fix Setup Wizard loop, JSON parse error "Server act...", Email SMTP IPv6 issue, and Disposisi dari Janji Temu

Work Log:
- Fixed SetupCheck component to check content-type before parsing JSON (prevents "Server act..." error)
- Added early return if isSetupComplete is already true in Zustand/localStorage (prevents flash of setup wizard)
- Fixed SetupWizard handleFinish to handle "Setup sudah pernah dilakukan" (400) response - still marks as complete
- Fixed SetupWizard to check content-type before res.json() to prevent SyntaxError
- Added fallback GET /api/setup check in catch block of handleFinish
- Fixed Zustand store to use createJSONStorage with SSR-safe localStorage (prevents hydration mismatch)
- Fixed SettingsProvider to check content-type before parsing JSON
- Fixed LoginPage to check content-type before parsing JSON
- Fixed AppointmentManager handleCreateDisposition to check content-type before parsing JSON
- Fixed email.ts transporter to force IPv4 (family: 4) to prevent ECONNREFUSED on IPv6 addresses
- Added requireTLS: true for port 587 STARTTLS connections

Stage Summary:
- Setup loop fixed: If isSetupComplete is true in localStorage, app skips setup check entirely
- JSON parse error fixed: All API calls now check content-type before parsing JSON
- Email SMTP IPv6 fix: Transporter forces IPv4 to avoid ECONNREFUSED on IPv6-only connections
- "Buat Disposisi dari Janji Temu" now has safe JSON parsing
- WhatsApp notifications integrated by subagent (Task 3-a): Created /src/lib/whatsapp.ts, integrated into all 6 API routes, added event toggles to SettingsPage
- Employee notification toggles added by subagent (Task 5): notifyEmail/notifyWhatsApp fields in Employee model, toggle UI in EmployeeManager

---
Task ID: 7
Agent: Main Agent
Task: Fix image upload failure and WhatsApp connection test not working

Work Log:
- Discovered /api/upload and /api/whatsapp/test API routes were completely missing
- Created /src/app/api/upload/route.ts - handles image upload with validation (2MB max, PNG/JPG/SVG/WebP/GIF)
- Created /src/app/api/whatsapp/test/route.ts - sends test message via Fonnte API with device_id support
- Fixed AbortSignal.timeout() crash in WhatsApp test route - replaced with AbortController + setTimeout (more compatible)
- Fixed SettingsPage.tsx to safely parse JSON on all API calls (upload, email test, WhatsApp test, QR generate, settings save, settings fetch)
- Fixed email/test and email/send routes to force IPv4 (family: 4) and use requireTLS for port 587
- Verified upload API works: file saved to public/uploads with unique filename
- Verified WhatsApp test API works: returns proper Fonnte response (tested with invalid key, got "invalid token")

Stage Summary:
- Created 2 new API routes: /api/upload (POST) and /api/whatsapp/test (POST)
- Upload saves files to public/uploads/ with validation
- WhatsApp test calls Fonnte API with Authorization header and device_id in body
- Both routes tested and working

---
Task ID: 8
Agent: Main Agent
Task: Fix image upload crash in production deployment and WhatsApp test not showing feedback

Work Log:
- Identified root cause: upload API saves to `public/uploads/` which doesn't work in standalone production builds (Next.js copies public/ at build time, runtime files not served)
- Changed upload directory from `public/uploads/` to `data/uploads/` (outside public, persists across rebuilds)
- Created `/api/files/[filename]/route.ts` - serves uploaded files from `data/uploads/` with proper MIME types and caching
- Changed upload API return URL from `/uploads/...` to `/api/files/...`
- Added `UPLOAD_DIR` env variable support for custom upload directories (aaPanel/Docker)
- Added smart `getUploadDir()` that detects `.next/standalone` and adjusts path accordingly
- Updated GuestForm photo upload from base64 (stored in DB) to server-side file upload via `/api/upload`
- Updated GuestForm document upload to actually upload files instead of just storing filenames
- Added `uploadingPhoto` state with loading spinner UI in GuestForm
- Added `testingWhatsApp` state with loading spinner and "Mengirim..." text in SettingsPage
- Added 15-second timeout (AbortController) to `sendWhatsAppMessage()` in whatsapp.ts
- Added safe JSON response parsing to `sendWhatsAppMessage()` (handles non-JSON Fonnte responses)
- Added user-friendly error messages for timeout, DNS failure, connection refused in whatsapp.ts
- Changed DATABASE_URL from absolute path to relative path (`file:./db/custom.db`) for portability
- Added `UPLOAD_DIR=` env variable to .env for documentation
- Updated next.config.ts with `serverActions.bodySizeLimit: '10mb'` for large uploads
- Increased upload max size from 2MB to 5MB, added PDF support
- Migrated existing `public/uploads/` files to `data/uploads/`
- Removed old `public/uploads/` directory
- All code passes ESLint check

Stage Summary:
- Image upload now works in production (standalone mode) via `data/uploads/` + `/api/files/` serving
- WhatsApp test button shows loading spinner and feedback during test
- `sendWhatsAppMessage()` has timeout protection (15s) and safe JSON parsing
- Guest photos are now stored as files instead of base64 in database (better performance, smaller DB)
- Document uploads actually upload files instead of just storing filenames
- DATABASE_URL uses relative path for deployment portability
- Custom UPLOAD_DIR env variable for aaPanel/Docker deployments

---
Task ID: 9
Agent: Main Agent
Task: Fix notifications always going to Superadmin instead of disposition target + Auto-sync disposition/appointment status

Work Log:
- Fixed notification routing in POST /api/dispositions: Email/WhatsApp now sent to toUser's email/phone instead of admin contact
- Fixed notification routing in PATCH /api/dispositions/[id]: Status update notifications sent to the opposite party (toUser updating → notify fromUser, fromUser updating → notify toUser)
- Fixed notification routing in POST /api/appointments: Email/WhatsApp now sent to assigned employee's email/phone instead of only admin contact
- Fixed notification routing in PUT /api/appointments/[id]: Status change notifications sent to assigned employee's email/phone
- Fixed notification routing in POST /api/guests: Email/WhatsApp now sent to assigned employee if guest has employeeId
- Fixed notification routing in PATCH /api/guests/[id]: Status change notifications sent to assigned employee
- Added auto-confirm appointment when disposition status changes to "diproses"
- Added auto-complete linked dispositions when appointment status changes to "selesai"
- Added in-app notification for assigned employees when guests/appointments are directed to them
- Added in-app notification for both fromUser and toUser on disposition status changes
- Admin contact still receives notifications as backup (deduplicated to avoid double-sending)
- All code passes ESLint check

Stage Summary:
- Notifications (email, WhatsApp, in-app) now properly target the assigned employee/leader, not just Superadmin
- When a pegawai/pimpinan updates disposition to "diproses", the linked appointment auto-confirms to "dikonfirmasi"
- When an appointment is marked "selesai", all linked dispositions auto-complete to "selesai"
- Both parties (fromUser and toUser) receive in-app notifications on disposition updates
- Admin contact still receives a copy of all notifications as backup

---
Task ID: 10
Agent: Main Agent
Task: Implement role-based access control (RBAC) for sidebar, pages, APIs + Fix notification messages

Work Log:
- Added role-based sidebar navigation filtering in AppSidebar.tsx:
  - Added `roles?: string[]` to NavItem interface
  - Defined ALL_ROLES constant and assigned role permissions per nav item
  - NavContent filters items using React.useMemo based on currentUser.role
  - Empty groups automatically hidden
- Added role-based page guards in page.tsx:
  - Created pagePermissions mapping for all page IDs
  - Created isPageAllowed() helper function
  - PageRenderer redirects to dashboard if user lacks permission
  - Inline fallback renders DashboardPage if access denied
  - Public pages (home, login) are NOT guarded
- Added role-based API data filtering:
  - Dispositions GET API: accepts userId/userRole params; pegawai/pimpinan only see dispositions where they are toUser OR fromUser
  - Appointments GET API: accepts userId/userRole params; pegawai/pimpinan only see appointments assigned to their linked Employee record
  - Frontend components (DispositionManager, AppointmentManager) pass userId/userRole when role is pegawai/pimpinan
- Updated DispositionManager UI:
  - Pegawai/pimpinan see "Disposisi untuk Anda" instead of "Kelola disposisi tamu"
  - "Buat Disposisi" button hidden for pegawai/pimpinan
- Updated AppointmentManager UI:
  - Pegawai/pimpinan see "Janji temu yang ditugaskan kepada Anda"
  - "Buat Janji Temu" button hidden for pegawai/pimpinan
- Fixed notification messages in whatsapp.ts:
  - buildFooter() now accepts optional status parameter
  - Status 'selesai'/'check_out' → "_Proses telah selesai._"
  - Status 'ditolak' → "_Proses ditolak._"
  - Other/undefined → "_Harap segera ditindaklanjuti._" (default)
  - Login link ALWAYS included regardless of status
  - All template functions pass appropriate status to buildFooter
- Fixed notification messages in email.ts:
  - sendDispositionEmail (update) now shows status-aware text
  - sendAppointmentEmail (update) now handles 'selesai' status
- All code passes ESLint check

Stage Summary:
- Role-based sidebar: pegawai/pimpinan only see Dashboard, Janji Temu, Disposisi
- Role-based page guards: unauthorized page access redirects to dashboard
- Role-based API filtering: pegawai/pimpinan only see their own data
- "Buat Disposisi/Janji Temu" buttons hidden for pegawai/pimpinan
- Notification messages no longer say "mohon ditindaklanjuti" for completed/rejected items
- Login link always included in all notifications regardless of status
