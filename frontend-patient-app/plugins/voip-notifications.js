// @ts-check
// https://github.com/expo/config-plugins/blob/main/packages/react-native-callkeep/src/withCallkeep.ts

const { AndroidConfig, withAndroidManifest, withAndroidStyles } = require("@expo/config-plugins")

module.exports = function withSupportsScreens(config) {
    // Add Permissions
    config = AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
        'android.permission.USE_FULL_SCREEN_INTENT',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.WAKE_LOCK',
        'android.permission.DISABLE_KEYGUARD',
        'android.permission.CALL_PHONE',
        'android.permission.MANAGE_OWN_CALLS',
        'android.permission.DIALER'
    ]);
    config = withAndroidManifestService(config);
    config = withAndroidStylesService(config);
    return config
};

function withAndroidManifestService(config) {
    // Add Services & Activities
    return withAndroidManifest(config, (config) => {
        const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
            config.modResults,
        );

        if (!Array.isArray(app.service)) app.service = [];

        const additions = [
            {
                'type': 'service',
                'name': 'com.fullscreennotificationincomingcall.IncomingCallService',
                'payload': {
                    "android:name": "com.fullscreennotificationincomingcall.IncomingCallService",
                    "android:enabled": "true",
                    "android:stopWithTask": "false",
                    "android:foregroundServiceType": "phoneCall",
                    "android:exported": "true"
                }
            },
            {
                'type': 'activity',
                'name': 'com.fullscreennotificationincomingcall.IncomingCallActivity',
                'payload': {
                    "android:name": "com.fullscreennotificationincomingcall.IncomingCallActivity",
                    "android:theme": "@style/incomingCall",
                    "android:launchMode": "singleTask",
                    "android:excludeFromRecents": "true",
                    "android:exported": "true",
                    "android:showWhenLocked": "true",
                    "android:turnScreenOn": "true"
                },
            },
            {
                'type': 'activity',
                'name': 'com.fullscreennotificationincomingcall.NotificationReceiverActivity',
                'payload': {
                    "android:name": "com.fullscreennotificationincomingcall.NotificationReceiverActivity",
                    "android:theme": "@style/incomingCall",
                    "android:launchMode": "singleTask",
                    "android:excludeFromRecents": "true",
                    "android:exported": "true",
                    "android:showWhenLocked": "true",
                    "android:turnScreenOn": "true"
                }
            }
        ]

        additions.forEach((item) => {
            if (!app[item.type].find((row => row.$['android:name'] === item.name))) {
                app[item.type].push({ $: item.payload })
            }
        })

        return config;
    });
}

function withAndroidStylesService(config) {
    return withAndroidStyles(config, (config) => {
        const additions = [
            {
                'name': 'incomingCall',
                'payload': {
                    "$": {
                        "name": "incomingCall",
                        "parent": "Theme.AppCompat.Light.NoActionBar"
                    },
                    "item": [
                        {
                            "_": "#000000",
                            "$": {
                                "name": "colorPrimaryDark"
                            }
                        }
                    ]
                }
            }
        ]

        additions.forEach((item) => {
            if (!config.modResults.resources.style?.find((row) => row.$.name === item.name)) {
                config.modResults.resources.style?.push(item.payload)
            }
        });

        return config
    })
}
