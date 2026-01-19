```bash
cp -R native/staging/* .
```

https://docs.expo.dev/bare/upgrade/?fromSdk=51&toSdk=52


- Fix Android, ensure testing with newArch works
  - Notifications (Push, VoIP)
  - All the payment functions
  

app.config.js
```json
"newArch": true
```

```
pnpm expo prebuild --clean
```

patch < native/migrations/20241231_voip_notifications/AppDelegate.mm.patch

# 2C2P Old Architecture
```bash
cd node_modules/@2c2p/pgw-sdk-react-native && pnpm run ios-frameworks && cd ../../..
RCT_NEW_ARCH_ENABLED=1 cd ios && pod install && cd ..
pnpm ios --device
```

