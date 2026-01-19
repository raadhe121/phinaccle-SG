const bundleID = process.env.APP_VARIANT === 'production' ? "sg.com.pinnaclefamilyclinic.pinnaclesgplus.doctor" : "sg.com.pinnaclefamilyclinic.test.pinnaclesgplus.doctor"
const appName = process.env.APP_VARIANT === 'production' ? "PinnacleSG+ (Doctor)" : "PinnacleSG+ (Test - Doctor)"
const googleServicesiOS = process.env.APP_VARIANT === 'production' ? "./GoogleService-Info-prod.plist" : "./GoogleService-Info-test.plist"
const googleServicesAndroid = process.env.APP_VARIANT === 'production' ? "./google-services-prod.json" : "./google-services-test.json"

export default {
    "expo": {
        "name": appName,
        "slug": "pinnaclesg-doctor",
        "scheme": "pinnaclesgplus.doctor",
        "runtimeVersion": {
            "policy": "appVersion"
        },
        "version": "1.1.2",
        "orientation": "portrait",
        "icon": "./assets/ios-icon.png",
        "userInterfaceStyle": "light",
        "splash": {
            "image": "./assets/doctor-splash-screen.png",
            "resizeMode": "cover",
            "backgroundColor": "#ffffff"
        },
        "notification": {
            "icon": "./assets/notification-icon.png"
        },
        "ios": {
            "supportsTablet": false,
            "infoPlist": {
                "NSCameraUsageDescription": "This app uses the camera to share your video.",
                "NSMicrophoneUsageDescription": "This app uses the microphone to share your audio.",
                "NSBluetoothPeripheralUsageDescription": "Required for Bluetooth audio devices",
                "NSPhotoLibraryUsageDescription": "Required to use screen share feature"
            },
            "bundleIdentifier": bundleID,
            "googleServicesFile": googleServicesiOS,
            "config": {
                "usesNonExemptEncryption": false
            }
        },
        "android": {
            "versionCode": 1,
            "permissions": [
                "CAMERA",
                "RECORD_AUDIO"
            ],
            "package": bundleID,
            "googleServicesFile": googleServicesAndroid,
        },
        "web": {
            "favicon": "./assets/favicon.png"
        },
        "plugins": [
            "@react-native-firebase/app",
            [
                "expo-build-properties",
                {
                    "ios": {
                        "useFrameworks": "static"
                    }
                }
            ],
            "expo-font",
            "expo-router"
        ],
        "extra": {
            "eas": {
                "projectId": "aabb780b-d11a-4484-b2f7-c5d54c2d8048"
            }
        },
        "owner": "pinnacle_medical_group",
        "updates": {
            "url": "https://u.expo.dev/aabb780b-d11a-4484-b2f7-c5d54c2d8048"
        }
    }
}
