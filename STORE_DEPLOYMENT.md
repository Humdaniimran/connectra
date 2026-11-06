# Connectra — Chat & Call: Store Release & Deployment Guide

## 1. Application Identifiers
- **App Name**: Connectra — Chat & Call
- **Android Package Name**: `io.connectra.chat`
- **iOS Bundle Identifier**: `io.connectra.chat`
- **Current Version**: `2.4.0` (Build `100`)

---

## 2. Platform Permissions Disclosure

| Permission | Android Manifest Key | iOS Info.plist Key | Purpose / Justification |
| :--- | :--- | :--- | :--- |
| **Camera** | `android.permission.CAMERA` | `NSCameraUsageDescription` | Required for peer-to-peer HD video calling, taking photo statuses, and scanning contact QR codes. |
| **Microphone** | `android.permission.RECORD_AUDIO` | `NSMicrophoneUsageDescription` | Required for crystal-clear voice calling, recording voice messages, and group audio conferences. |
| **Geolocation** | `android.permission.ACCESS_FINE_LOCATION` | `NSLocationWhenInUseUsageDescription` | Allows users to share their live or static location in chats with explicit user confirmation. |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` | `NSPushNotificationsUsageDescription` | Delivers background incoming call alerts, direct messages, and group mentions. |
| **Media / Photos** | `android.permission.READ_MEDIA_IMAGES` | `NSPhotoLibraryUsageDescription` | Allows sharing images and videos in conversations and updating profile photos. |

---

## 3. Real-Time Architecture & Backend Stack

- **Runtime**: Node.js + Express
- **Real-Time Layer**: Native WebSocket (`ws`) on port 3000 handling:
  - Real-time message broadcast (`status: 'sent'`, `'delivered'`, `'read'`)
  - Live typing indicators (`isTyping: true/false`)
  - Bidirectional WebRTC signaling (`call:initiate`, `call:accept`, `call:reject`, `call:end`, `call:signal`)
  - Group conference room join/leave synchronization
- **Audio Synthesizer**: Web Audio API engine producing phone ringtones, outgoing PBX ringback buzzes, and call tones with zero external asset dependencies.
- **Client**: React 19 + TypeScript + Tailwind CSS v4, optimized for mobile touch ergonomics (44px+ hitboxes, zero-pill metadata, tabular numerals).

---

## 4. Google Play Store Submission Checklist
1. **Target SDK**: Android 14+ (API 34).
2. **Data Safety Form**:
   - End-to-end encryption active for private messaging and calls.
   - User account deletion workflow available under `Settings > Account > Delete Account`.
   - Data export compliant with GDPR/CCPA (`Settings > Account > Export Data`).
3. **Release Artifact**: Android App Bundle (`.aab`) signed with release keystore (`upload-keystore.jks`).

---

## 5. Apple App Store Submission Checklist
1. **Target iOS**: iOS 16.0+.
2. **App Privacy Labels**:
   - Contact Info (Phone number, Email) used for App Functionality.
   - User Content (Messages, Photos, Audio) end-to-end encrypted; not linked for third-party tracking.
3. **In-App Account Deletion**: Fully functional deletion trigger with complete persona wipe.
