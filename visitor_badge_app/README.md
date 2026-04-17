# Badge Printer — Flutter App

A Flutter mobile application for exhibition visitor registration and badge printing, integrated with the Laravel v2 backend.

## Features

- **Mode 1 — Self-Serve Registration**: Visitors fill in a form manually, a unique `formID` and `badgeID` are generated, the record is saved to the server, and a PDF badge is printed.
- **Mode 2 — Online Register (QR Scan)**: Scan a QR code URL (e.g. `https://eventxcrm.com/api/attendance/LZ26-VIS-APP-508571`) to extract the `onlineRegID`, retrieve visitor data from the server, and print the badge.
- **Settings** (PIN-protected, default PIN: `1234`):
  - Server IP address
  - Active event selection
  - App mode selection
  - Badge copies count
  - Change settings PIN

## Getting Started

### Prerequisites
- Flutter SDK 3.x
- Android Studio / Xcode
- The v2 Laravel backend running on your local network

### Setup

```bash
cd visitor_badge_app
flutter pub get
flutter run
```

### First Launch
1. Enter the **Server IP** on the login screen (e.g. `192.168.1.100:8000`)
2. Login with your phone/email and password
3. Open **Settings** (tap ⚙ icon, enter PIN `1234`)
4. Tap **Load Events from Server** and select your event
5. Choose your operating mode
6. Tap **Save Settings**
7. Start registering!

## Architecture

```
lib/
├── app/           # App shell, theme, routing
├── core/
│   ├── api/       # Dio HTTP clients (auth, events, visitors)
│   ├── models/    # EventModel, VisitorModel
│   ├── services/  # SettingsService, AuthService, PrintService
│   └── utils/     # FormIdGenerator
├── features/
│   ├── login/         # Login screen
│   ├── home/          # Home / mode dispatcher
│   ├── manual_register/  # Mode 1 registration form
│   ├── qr_scanner/       # Mode 2 QR scanner + visitor preview
│   └── settings/         # PIN screen + settings screen
└── widgets/       # BadgePreview, LoadingOverlay
```

## API Endpoints Used

| Action | Endpoint |
|--------|----------|
| Login | `POST /api/login` |
| List Events | `GET /api/events` |
| Next Badge ID | `GET /api/events/{id}/visitors/next-badge-id` |
| Save Visitor | `POST /api/events/{id}/visitors` |
| Search Visitor | `GET /api/events/{id}/visitors/search?q=...` |
| Increment Print | `POST /api/events/{id}/visitors/{id}/increment-print` |

## Notes
- The app uses **cleartext HTTP** to connect to the local server (no HTTPS needed on LAN)
- Camera permission is required for QR scanning (Mode 2)
- Badges are generated as PDF and sent to the system print dialog
- Settings PIN default: `1234`
