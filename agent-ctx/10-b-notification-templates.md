# Task 10-b: Fix Notification Message Templates

## Summary

Updated notification message templates in both `whatsapp.ts` and `email.ts` to be status-aware, so completed/rejected processes no longer say "Harap segera ditindaklanjuti" (Please follow up immediately).

## Changes Made

### `/home/z/my-project/src/lib/whatsapp.ts`

1. **`buildFooter` function** — Added optional `status` parameter:
   - `'selesai'` or `'check_out'` → `_Proses telah selesai._` (Process is complete)
   - `'ditolak'` → `_Proses ditolak._` (Process rejected)
   - All other statuses (including `undefined`/`null`) → `_Harap segera ditindaklanjuti._` (default)
   - Login link always included regardless of status

2. **Template function updates** — All now pass appropriate status to `buildFooter`:
   - `sendGuestArrivalWhatsApp` → `'menunggu'` (new guest needs follow-up)
   - `sendGuestStatusWhatsApp` → `data.status` (reflects actual guest status)
   - `sendDispositionWhatsApp` (update) → `data.status`; (new) → `'menunggu'`
   - `sendAppointmentWhatsApp` (update) → `data.status`; (new) → `'menunggu'`

### `/home/z/my-project/src/lib/email.ts`

1. **`sendDispositionEmail`** (update branch) — Added status-aware closing text:
   - `'selesai'` → "Disposisi telah selesai." (green)
   - `'ditolak'` → "Disposisi ditolak." (red)
   - Other statuses → "Harap segera ditindaklanjuti." (gray, default)
   - New disposition branch unchanged — still says "Harap segera ditindaklanjuti."

2. **`sendAppointmentEmail`** (update branch) — Added `'selesai'` handling:
   - `'selesai'` → "Janji temu telah selesai." (green) — **newly added**
   - `'dikonfirmasi'` and `'ditolak'` messages preserved as-is
   - New appointment branch unchanged — still says "Harap segera dikonfirmasi."

3. **`sendGuestArrivalEmail`** — Unchanged ("Harap segera dilayani." is appropriate for new arrivals)

## Backward Compatibility

- `buildFooter` second parameter is optional (`status?: string`), so existing callers without status will get the original default behavior
- All template function signatures remain unchanged — no breaking API changes

## Lint

Passed with no errors.
