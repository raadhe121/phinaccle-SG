# Throw error if ios/ directory exists
if [ -d "ios/" ]; then
    echo "Error: ios/ directory exists. Please delete it before running this script."
    exit 1
fi
# Change newArch
#!/bin/bash
pnpm expo install --check
pnpm expo-doctor

APP_VARIANT=production pnpm expo prebuild --clean --platform ios
# Patch Callkit and Pushkit
patch < native/migrations/20241231_voip_notifications/AppDelegate.mm.prod.patch
# 2C2P Old Architecture
cd node_modules/@2c2p/pgw-sdk-react-native && pnpm run ios-frameworks && cd ../../..
RCT_NEW_ARCH_ENABLED=1 cd ios && pod install && cd ..

# eas build --profile development --platform ios --local
eas build --profile production --platform ios --local
eas submit -p ios --path=...ipa

# eas build --profile production-internal --platform android --local
# eas submit -p android --path=