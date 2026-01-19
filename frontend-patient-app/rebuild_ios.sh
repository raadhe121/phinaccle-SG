# Throw error if ios/ directory exists
if [ -d "ios/" ]; then
    echo "Error: ios/ directory exists. Please delete it before running this script."
    exit 1
fi
# Change newArch
#!/bin/bash
pnpm expo install --check
pnpm expo-doctor

APP_VARIANT=development pnpm expo prebuild --clean --platform ios
# Patch Callkit and Pushkit
patch < native/migrations/20241231_voip_notifications/AppDelegate.mm.patch
# 2C2P Old Architecture
cd node_modules/@2c2p/pgw-sdk-react-native && pnpm run ios-frameworks && cd ../../..
RCT_NEW_ARCH_ENABLED=1 cd ios && pod install && cd ..

pnpm expo run:ios --device
