import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { updatePreferencesApiNotificationPreferencesPatch } from '@/services/client';
import { toast } from '@/common/utils/modal';
import { onError } from '@/common/utils/lib';

// Must match MARKETING_CHOICE_CATEGORY in the backend (scheduler_actions/campaign_updates.py).
export const MARKETING_CHOICE_CATEGORY = 'marketing_choice';
const ACTION_KEEP = 'MARKETING_KEEP';
const ACTION_OPT_OUT = 'MARKETING_OPT_OUT';

/**
 * Registers the "Keep receiving" / "Turn off" buttons shown on consent-notice and marketing
 * notifications. Both buttons open the app so the request runs with the patient's logged-in
 * session.
 */
export async function registerNotificationCategories() {
    await Notifications.setNotificationCategoryAsync(MARKETING_CHOICE_CATEGORY, [
        {
            identifier: ACTION_KEEP,
            buttonTitle: 'Keep receiving',
            options: { opensAppToForeground: true },
        },
        {
            identifier: ACTION_OPT_OUT,
            buttonTitle: 'Turn off',
            options: { opensAppToForeground: true, isDestructive: true },
        },
    ]);
}

type TapData = { pathname?: string; params?: { [key: string]: any }; url?: string };

// Expo puts the push "data" field in content.data on both platforms. The trigger payload
// shapes differ per platform/SDK, so they are only used as a fallback.
function getTapData(response: Notifications.NotificationResponse): TapData | undefined {
    const content = response.notification.request.content?.data as TapData | undefined;
    if (content?.pathname || content?.url) return content;

    const trigger = response.notification.request.trigger as Notifications.PushNotificationTrigger | null;
    const payload = trigger?.payload as { data?: TapData; body?: TapData } | undefined;
    return payload?.data ?? payload?.body;
}

async function setMarketingOptIn(next: boolean) {
    try {
        await updatePreferencesApiNotificationPreferencesPatch({ requestBody: { marketing_opt_in: next } });
        toast.success(next
            ? 'You will keep receiving marketing & health-info notifications'
            : 'Unsubscribed from marketing & health-info notifications');
    } catch (e) {
        onError(e as any);
    }
}

/**
 * Single entry point for a notification tap or button press. Call it only once the patient is
 * logged in: it needs the session both to navigate inside the app and to save the preference.
 */
export async function handleNotificationResponse(response: Notifications.NotificationResponse) {
    switch (response.actionIdentifier) {
        case ACTION_OPT_OUT:
            await setMarketingOptIn(false);
            return;
        case ACTION_KEEP:
            await setMarketingOptIn(true);
            return;
    }

    const data = getTapData(response);
    if (data?.pathname) {
        router.navigate({ pathname: data.pathname as any, params: data.params });
    } else if (data?.url) {
        Linking.openURL(data.url);
    }
}
