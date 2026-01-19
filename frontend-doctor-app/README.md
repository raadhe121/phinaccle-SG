# Doctor Teleconsult Mobile Application

## Bugs
### Android Keyboard Opens and has a padding at the bottom before going away after selecting another input
[Source](https://stackoverflow.com/a/57442705/6944050)
1. Open `AndroidManifest.xml` and replace with `android:windowSoftInputMode="adjustResize"` or `adjustPan`

Notifications Setup
- Expo Project, Firebase Project
  - Upload service-account to Expo project
- https://docs.expo.dev/push-notifications/push-notifications-setup/

Setup expo.dev project to repo
```bash
eas build:configure
```

```bash
# Creating development builds for development
# Register iOS devices
eas device:create
eas build --profile development --platform ios --local
eas build --profile development --platform android --local

# Able to link to channels. branch can be version-1.x.x. Channels are the env production, preview, development
eas update --branch production --message "Remove restriction for ongoing teleconsult"
eas update --branch development --message "Fixes typo" 

# Staging Build for TestFlight internal testing
eas build --profile staging --platform ios --local
eas build --profile staging --platform android --local
eas submit -p ios --path=

# Production Build for TestFlight to be released to users
eas build --profile production --platform android --local
eas build --profile production --platform ios --local
eas submit -p ios --path=

eas build:version:set
```

```
npx expo prebuild --clean
sudo xcodebuild -license # Whenever expo start bundle js local not found
npx react-native-asset
yarn ios --device
yarn android --device
```

## Login Screen
- Doctors login using Supabase Auth (email + password)
- Doctors login accounts are created under admin web app for now

## Upcoming Screen
- Connect to `teleconsults` table in supabase via RLS to get the updated queue information in realtime

## Consultation Screen
- Start Consult, End Consult, No Show
- These functions would call APIs from `backend-doctor-app` repository

## Teleconsult Screen
- Video call room with Patient

## Ended Screen
- View the past consults done

# GUIDES
### Password Reset Article for React Native (For reference, reset password will host at backend)
  - https://blog.theodo.com/2023/03/supabase-reset-password-rn/

### Basic setup push notification guide 
`https://docs.expo.dev/push-notifications/push-notifications-setup/`

### Before setup
- run following commands
- `eas login`
- `eas init`
- `eas build:configure`

### According to firebase console guide, firebase package need to be installed, gradle will only be able to initialize FirebaseApp using the package
`https://rnfirebase.io/`
- run following command as stated from the guide
- `npm install @react-native-firebase/app

### Remember do cleaning after every installation
- run `npx expo prebuild --clean`

### Then setup minimal boildercode to test out the push notification, check whether is projectId able to retrieve
- This can be done on local development environment using usual command `npx expo run:android`

### Then, configure Firebase Cloud Messaging (FCM), this can be done following the guide
`https://docs.expo.dev/push-notifications/fcm-credentials/`
- make sure create android app, with package name same as repo package name
- create service account key in json format, put into repo, make sure specify in .gitignore
- Run `eas credentials`
- Select `Android` > `development` > `Google Service Account`
- Select `Manage your Google Service Account Key for Push Notifications (FCM V1)`
- Select `Set up a Google Service Account Key for Push Notifications (FCM V1)`
- Select `Upload a key`, then redirect to path where the service account json file store at

### Then, download google-services.json file, place it at root directory, make sure app.json is updated and point to this file

### Finally, it is ready to test.

## To activate push notification security, folow guide
`https://levelup.gitconnected.com/push-notifications-with-react-native-expo-and-node-js-30aa824c7956`
- Direct to expo.dev dashboard, at Access Token setting, activate notification security
- Create access token (if necessary) and use in backend server header in order to send push notification

## Server side send notification
`https://github.com/expo-community/expo-server-sdk-python`
- Remember to activate push security
- Better Approach : Store push token into database, so that notification can be sent to end user even though not on app
- Remember to remove push token when user logged out from app

### Expo notifications 
`https://docs.expo.dev/push-notifications/faq/`
- The ExpoPushToken will remain the same across app upgrades.
- On iOS, it will also remain the same even after uninstalling the app and reinstalling it. 
- On Android, this results in the push token changing.
- The ExpoPushToken will never expire. However, if one of your users uninstalls the app, you'll receive a DeviceNotRegistered error back from Expo's servers.
- From Testing, ExpoPushToken is associated to device + app (for android), be careful when a device is used for multiple accounts
- From Testing, the error might not be raised at exception, in fact send as success response back to fastapi, hence, handle both response and exception to handle inactive token