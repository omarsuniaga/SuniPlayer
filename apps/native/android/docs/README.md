# SuniPlayer — Android Notes

## Target
Android 10+ (API 29+), phones and tablets

## File Access
Uses `expo-document-picker` with `READ_EXTERNAL_STORAGE` permission.
Files copied to app's internal storage (persistent).

## Distribution
- Development: `npx expo run:android`
- Play Store: `eas build --platform android --profile production`
