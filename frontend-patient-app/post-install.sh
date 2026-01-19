#!/bin/bash
if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  echo "Run commands for Android builds here"
elif [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
    # APP_VARIANT=development pnpm expo prebuild --clean --platform ios
    echo "Build Postinstall..."
    # 1. Callkit Patch
    if [[ "$APP_VARIANT" == "production" ]]; then
        patch < native/migrations/20241231_voip_notifications/AppDelegate.mm.prod.patch
    else
        echo "Patching AppDelegate.mm for test variant"
        patch < native/migrations/20241231_voip_notifications/AppDelegate.mm.patch
    fi
    # 2. PGW SDK
    echo "Installing PGW SDK..."
    cd node_modules/@2c2p/pgw-sdk-react-native && pnpm run ios-frameworks && cd ../../..
    RCT_NEW_ARCH_ENABLED=1 cd ios && pod install && cd ..
fi