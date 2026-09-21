import { CText, HeaderTitleTag, Height, ListItemView, ReactQueryChild, Section, SubtitleText } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { Switch } from '@ant-design/react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPreferencesApiNotificationPreferencesGet, PreferenceUpdateReq, updatePreferencesApiNotificationPreferencesPatch } from '@/services/client';
import { onError } from '@/common/utils/lib';

export default function NotificationSettingsScreen() {
    const queryClient = useQueryClient();

    const qry = useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: getPreferencesApiNotificationPreferencesGet,
    });

    const updateMutation = useMutation({
        mutationFn: (requestBody: PreferenceUpdateReq) => updatePreferencesApiNotificationPreferencesPatch({ requestBody }),
        onSuccess: (data) => {
            queryClient.setQueryData(['notificationPreferences'], data);
        },
        onError,
    });

    const enableNotifications = qry.data?.enable_notifications ?? true;
    const marketingOptIn = qry.data?.marketing_opt_in ?? true;

    return <KeyboardView
        navBack={() => router.back()}
        title={<HeaderTitleTag tag='My Profile' title='Notification Settings' />}
    >
        <ReactQueryChild query={qry}>
            <Section title={<Height h={24} />}>
                <ListItemView extra={
                    <Switch
                        checked={enableNotifications}
                        loading={updateMutation.isPending && updateMutation.variables?.enable_notifications !== undefined}
                        onChange={(checked) => updateMutation.mutate({ enable_notifications: checked })}
                    />
                }>
                    <CText size={16}>All notifications</CText>
                    <SubtitleText size={12}>Appointment reminders, health-report alerts and marketing</SubtitleText>
                </ListItemView>
                <ListItemView extra={
                    <Switch
                        checked={enableNotifications && marketingOptIn}
                        disabled={!enableNotifications}
                        loading={updateMutation.isPending && updateMutation.variables?.marketing_opt_in !== undefined}
                        onChange={(checked) => updateMutation.mutate({ marketing_opt_in: checked })}
                    />
                }>
                    <CText size={16} style={!enableNotifications ? { opacity: 0.4 } : undefined}>Marketing & health-info notifications</CText>
                    <SubtitleText size={12} style={!enableNotifications ? { opacity: 0.4 } : undefined}>
                        {enableNotifications ? 'Newsletters and health tips' : 'Muted while all notifications are off'}
                    </SubtitleText>
                </ListItemView>
            </Section>
            <Height h={12} />
        </ReactQueryChild>
    </KeyboardView>
}
