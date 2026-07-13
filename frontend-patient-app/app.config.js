const bundleID = process.env.APP_VARIANT === 'production' ? "sg.com.pinnaclefamilyclinic.pinnaclesgplus" : "sg.com.pinnaclefamilyclinic.test.pinnaclesgplus"
const appName = process.env.APP_VARIANT === 'production' ? "PinnacleSG+" : "PinnacleSG+ (Test)"
const googleServicesiOS = process.env.APP_VARIANT === 'production' ? "./GoogleService-Info-prod.plist" : "./GoogleService-Info-test.plist"
const googleServicesAndroid = process.env.APP_VARIANT === 'production' ? "./google-services-prod.json" : "./google-services-test.json"
// const bundleID = "sg.com.pinnaclefamilyclinic.test.pinnaclesgplus";
// const appName = "PinnacleSG+ (Test)";
// const googleServicesiOS = "./GoogleService-Info-test.plist";
// const googleServicesAndroid = "./google-services-test.json";

export default {
    "expo": {
        "name": appName,
        "slug": "pinnaclesg",
        "runtimeVersion": "runtime-1.6",
        "version": "1.6.8",
        "orientation": "portrait",
        "icon": "./assets/images/icon.png",
        "scheme": "pinnaclesgplus",
        "userInterfaceStyle": "automatic",
        "newArchEnabled": true,
        "notification": {
            "icon": "./assets/notification-icon.png"
        },
        "ios": {
            "supportsTablet": false,
            "infoPlist": {
                "NSCameraUsageDescription": "App needs camera access for Telemedicine video call",
                "NSMicrophoneUsageDescription": "App needs microphone access for Telemedicine video call",
                "NSBluetoothPeripheralUsageDescription": "Required for Bluetooth audio devices"
            },
            "bundleIdentifier": bundleID,
            "associatedDomains": ["applinks:pinnacle-admin.geddit-apps.com"],
            "googleServicesFile": googleServicesiOS,
            "config": {
                "usesNonExemptEncryption": false
            }
        },
        "android": {
            "softwareKeyboardLayoutMode": "pan",
            "adaptiveIcon": {
                "foregroundImage": "./assets/images/android-icon.png",
                "backgroundColor": "#ffffff"
            },
            "permissions": [
                "CAMERA",
                "RECORD_AUDIO"
            ],
            "package": bundleID,
            "googleServicesFile": googleServicesAndroid,
            "intentFilters": [
                {
                    "action": "VIEW",
                    "autoVerify": true,
                    "data": [
                        {
                            "scheme": "https",
                            "host": "pinnacle-admin.geddit-apps.com",
                            "pathPrefix": "/landing"
                        }
                    ],
                    "category": ["BROWSABLE", "DEFAULT"]
                }
            ]
        },
        "plugins": [
            "@react-native-firebase/app",
            "@react-native-firebase/auth",
            "@react-native-firebase/crashlytics",
            [
                "expo-build-properties",
                {
                    "android": {
                        "compileSdkVersion": 36,
                        "targetSdkVersion": 36,
                        "buildToolsVersion": '36.0.0',
                        "minSdkVersion": 28,
                        "useLegacyPackaging": false
                    },
                    "ios": {
                        "useFrameworks": "static"
                    }
                }
            ],
            // "./plugins/disable_android_tablet.js",
            "expo-asset",
            [
                "expo-splash-screen",
                {
                    "resizeMode": 'cover',
                    "ios": {
                        "backgroundColor": "#D6E6F1",
                        "image": "./common/assets/splash-screen.png",
                        "enableFullScreenImage_legacy": true
                    },
                    "android": {
                        "backgroundColor": "#D6E6F1",
                        "image": "./common/assets/icon.png",
                        "imageWidth": 100
                    }
                }
            ],
            ["expo-router", { "sitemap": false }],
            [
                "expo-video", {
                    "supportsBackgroundPlayback": false,
                    "supportsPictureInPicture": false
                }
            ],
            "expo-font",
            [
                "expo-local-authentication",
                {
                    "faceIDPermission": "Allow PinnacleSG+ to use Face ID."
                }
            ],
            // For react-native-full-screen-notification-incoming-call: 1.0.2
            // "./plugins/voip-notifications.js",
            "react-native-full-screen-notification-incoming-call",
            "@config-plugins/react-native-callkeep",
            "patch-project"
        ],
        "experiments": {
            "typedRoutes": true
        },
        "extra": {
            "router": {
                "origin": false
            },
            "eas": {
                "projectId": "2ed6046b-f06c-47fc-bc71-6632e83de644"
            }
        },
        "updates": {
            "url": "https://u.expo.dev/2ed6046b-f06c-47fc-bc71-6632e83de644"
        },
        "owner": "pinnacle_medical_group"
    }
}
