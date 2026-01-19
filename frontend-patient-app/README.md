# Frontend Patient App

> Synced from [pinnaclesg-monorepo](https://github.com/GRMedicalApp/pinnaclesg-monorepo) - 2025-12-30

# Project Wide Diagnostics
```
Ctrl + .
"typescript.tsserver.experimental.enableProjectDiagnostics": true
```

# Testing Procedure for using Expo Update on older versions
- iOS - TestFlight > Previous Builds (At the bottom)
- Android - Test and release > App bundle explorer > (version) > Downloads > Copy shareable link
```bash
eas update --branch production --message "<Update message>"
```

# Production Builds

> [!IMPORTANT]
> **Build Checklist**
> 1. Ensure `eas-cli` is up to date: `npm install -g eas-cli`
> 2. **Bump the version** in `package.json` AND `app.config.js`.
> 3. Run the build command below.

**Expo Build (Recommended)**
```bash
eas build --platform ios --auto-submit # For iOS
eas build --platform android --auto-submit # For Android
eas build --auto-submit # For both
```

**Git Tagging**
```bash
git tag -d v1.6.8 # Remove tag if previously it exists
git tag -a v1.6.8 -m "Update message"
git push origin tag v1.6.8
```

**Built Locally**
```bash
eas build --profile production --local
eas submit -p android --path=*.apk
```

# Development Builds
```bash
eas build --profile development # Built in Expo
eas build --profile development --local # Built Locally
# Drag IPA into XCode > Window > Devices and Simulators > Select iPhone > Drag into "Installed Apps"
pnpm start
```

# Legacy Documentation caa 12 Feb 2025

# Android fail to build preview
https://github.com/expo/expo/issues/30413#issuecomment-2231390774
```
nano ~/.gradle/gradle.properties

org.gradle.jvmargs=-Xmx14g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
```
# Building for TestFlight
```bash
eas build:configure
```

[EAS Build](https://egghead.io/lessons/react-native-create-an-internal-distribution-build-for-android-with-eas)
[Play Store Service Account to Automatically Upload to Play Store](https://egghead.io/lessons/react-native-upload-an-android-app-to-the-google-play-store-automatically-using-expo-publish)
[Install different build variants on the same device](https://egghead.io/lessons/react-native-install-multiple-variants-of-your-ios-and-android-apps-on-the-same-device)

# Building Development Clients
https://docs.expo.dev/develop/development-builds/create-a-build/

# Building for Production
OTP Requirements: https://stackoverflow.com/a/71291385

# Other EAS Commands
```bash
eas device:create
eas build --configure
eas credentials
```

# Provisioning Devices for EAS Internal Build
[Guide](https://docs.expo.dev/build/internal-distribution/)
- Update `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```
- Run the following command
```bash
eas device:create
# Select Website
```

[Guide](https://docs.expo.dev/submit/ios/)

# Zoom Video SDK Bugs
- If back button while video is running, it will cause video to not load
- If reload on expo, could cause it to crash as well

# Setting Up Development Environment (New PC)
1. Setup Expo/React Native Environment
```bash
brew install nvm pnpm
nano ~/.zshrc
source ~/.zshrc
nvm install --lts

npx create-expo-app
```

# Setting up Zoom Video SDK

1. Install React Native Dependencies [Zoom Video SDK](https://developers.zoom.us/docs/video-sdk/react-native/1.11.0/get-started/#add-video-sdk-into-your-expo-project)
```bash
pnpm add @zoom/react-native-videosdk
```

2. Update `app.json` on permissions
```json
{
 "expo": {
   "ios": {
     "infoPlist": {
       "NSCameraUsageDescription": "This app uses the camera to share your video.",
       "NSMicrophoneUsageDescription": "This app uses the microphone to share your audio.",
       "NSBluetoothPeripheralUsageDescription": "Required for Bluetooth audio devices"
     }
   },
   "android": {
      "permissions": ["CAMERA", "RECORD_AUDIO"]
   }
 }
}
```
3. Generate `npx expo prebuild` for native android and ios folders
```
Package Name: sg.com.pinnaclefamilyclinic.pinnaclesgplus
```
4. Install iOS Dependencies
```
npx pod-install

Error: Cause: Failed to load 'glog' podspec:`
https://stackoverflow.com/a/72060578
Xcode > Settings... > Locations > Command Line Tools > Select latest XCode
```

# Building Application (iOS)

1. Setting up iPhone as developer mode for the first time.
```
Open XCode project and select iPhone.
On the iOS device, select Trust, open Settings > Privacy & Security > Developer Mode.
```

2. Running app on iOS developer device
```bash
# If clean prebuild, need to rebuild all
npx expo prebuild --clean
sudo xcodebuild -license # Whenever expo start bundle js local not found
npx react-native-asset
pnpm ios --device
# On Device Settings > General > VPN & Device Management > Trust Cert

pnpm start # Starts the bundler only
```

# Building Application (Android)

1. Android Device for Development
```bash
nano ~.zshrc

export ANDROID_HOME=/Users/jx/Library/Android/sdk
# Reference from `Android Studio > Settings... > Build, Execution,
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="/Users/jx/Library/Android/sdk/platform-tools:$PATH"

pnpm android --device

pnpm start # Starts the bundler only

# Package signatures do not match the previously installed version: https://stackoverflow.com/a/53396378/6944050
adb uninstall "sg.com.pinnaclefamilyclinic.pinnaclesgplus"
```

## Install Ant Design React Native
[Guide](https://www.npmjs.com/package/@ant-design/react-native)
1. Install Dependencies
```bash
pnpm add @ant-design/react-native@5.2.0-rc.0
pnpm add @react-native-community/segmented-control @react-native-community/slider @ant-design/icons-react-native react-native-gesture-handler
npx pod-install
```
2. Create `nano react-native.config.js`
```js
module.exports = {
    assets: ['node_modules/@ant-design/icons-react-native/fonts'],
};
```
3. Run asset generation
```bash
npx react-native-asset
```
4. Set to English Language
```js
import enUS from '@ant-design/react-native/lib/locale-provider/en_US';

<Provider locale={enUS}>
  ...
</Provider>
```

## Bugs: Expo not updating the assets
```
npx expo prebuild --clean
```

## Install Firebase SDK
[Medium Guide](https://zaferayan.medium.com/expo-firebase-integration-95a745ae2dfe)
[Expo Guide](https://docs.expo.dev/guides/using-firebase/#install-and-initialize-react-native-firebase)
1. Install Dependencies `pnpm add @react-native-firebase/app @react-native-firebase/crashlytics @react-native-firebase/auth`
2. Download `google-services.json` and `GoogleService-Info.plist` from Firebase Console and place in the root folder
3. Update `app.json`
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
   "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
  }
}
```
4. Install `npx expo install expo-build-properties`
5. Create `firebase.json` on root
```json
{
  "react-native": {
    "crashlytics_debug_enabled": true
  }
}
```
6. Run `npx expo prebuild --clean`


## Install Expo Notifications
[Guide](https://docs.expo.dev/push-notifications/push-notifications-setup/)
[Test Tool](https://expo.dev/notifications)
1. Install Dependencies `npx expo install expo-notifications expo-device expo-constants`
2. Install EAS CLI
```
pnpm install -g eas-cli
eas login -s
```
3. Download Service Account from Firebase for Android & Upload Service Account to EAS
```
eas credentials
- Android > development > Google Service Account > Upload a Google Service Account Key
- A Google Service Account JSON key has been found at ... > Y
- Android > development > Google Service Account > Manage your Google Service Account Key for Push Notifications (FCM V1) > <Select the Key uploaded>
```
4. Setup for iOS
```
eas credentials
- iOS > Push Notifications: Manage your Apple Push Notifications Key > Set up your project to use Push Notifications
NOTE: Need to use the Team certificate and same package name as deployment for the same project
TODO: Setting up different environments using different Firebase projects https://stackoverflow.com/a/76176896/6944050

Enable Push Notifications Capability
https://developer.apple.com/account
Certificates > Identifiers > <App Name> > Push Notifications
```

## Setting up for Production
Update the Bundle ID
Create a production Firebase setup

[Compiling using EAS](https://docs.expo.dev/build-reference/apk/#configuring-a-profile-to-build-apks)
```
eas build -p android --profile preview --local

adb install build-*.apk
```

[Compiling using Expo](https://docs.expo.dev/more/expo-cli/#compiling-android)
```
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

# Telemedicine User Flow
Patient clicks on Telemedicine
Patient selects Clinic Branch, and patient (this can be themselves, or family members)
Patient does prepayment based on a specific amount (eNets Click / Omise / Stripe).
Patient is placed into "pending" state
Admin/Coordinator will see the patient and assign it to an onsite doctor
Patient is placed into "queue" state with a queue number which updates in realtime
Patient can navigate back to the home page while waiting, or request for another queue number (TBD on the user flow on how two telemedicine can be in a queue, it could be one after another)
Patient will receive a notification when the queue is near (e.g. 5 patients before)
Once patient turn has reached, patient click to enter telemedicine call
Once completed, patient to be redirected to wait for invoice or notification once invoice is issued.
Patient makes payment before documents (MCs) and medication are issued

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
pnpm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.
