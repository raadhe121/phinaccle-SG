https://developer.2c2p.com/docs/sdk-download-sdk-react-native

```bash
pnpm add @2c2p/pgw-sdk-react-native@4.0.2
```

# Android
app/build.gradle
```bash


ndk {
    abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86_64'
}

```

## iOS
```bash
cd node_modules/@2c2p/pgw-sdk-react-native && pnpm run ios-frameworks && cd ../../..
pod install
```