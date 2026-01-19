import { View } from 'react-native';
import { Image } from 'expo-image'
import KeyboardView from '@/common/components/KeyboardView';
import { H1Text, InfoButton, MenuItem, Row, Section, TabBarPadding } from '@/common/components/AntdText';
import { modal } from '@/common/utils/modal';
import { useSession } from '@/ctx';
import { router } from 'expo-router';
import { userIcon } from '@/common/components/AntdMiniIcon';
import { ApiError, logoutApiUserLogoutGet } from '@/services/client';
import { Toast } from '@ant-design/react-native';
import { useMutation } from '@tanstack/react-query';
import { removeLocalKeys } from '@/common/utils/async_storage';
import { TestingLaunchButton, useTestingHook } from '../testing/_layout';
import dayjs from 'dayjs';

export default function ProfileScreen() {
    const { testingEnabled } = useTestingHook();
    const { signOut } = useSession();
    const logoutMutate = useMutation({
        mutationFn: logoutApiUserLogoutGet,
        onSuccess: () => {
            removeLocalKeys();
            signOut()
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            });
            signOut()
        }
    })

    const onLogout = () => {
        modal.warn({
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            labels: ["Cancel", "Logout"],
            onCancel: () => {},
            onOk: () => logoutMutate.mutate(),        
        })
    }

    const yuuLaunched = testingEnabled || dayjs().isAfter(dayjs('2025-06-26'));

    return <KeyboardView edges={[]} 
        showLogo={true}
        title={
            <Row style={{ margin: 12 }}>
                <H1Text style={{ margin: 0, marginTop: 0, marginRight: 8 }}>My Profile</H1Text>
                <TestingLaunchButton>
                    <Image source={userIcon} resizeMode="contain" style={{ width: 32, height: 32 }} />
                </TestingLaunchButton>
            </Row>
        }
        >
        <Section title={<View style={{ height: 12 }}></View>}>
            <MenuItem icon="UserOutline" onPress={() => router.navigate('/profile/details')}>
                Personal Information
            </MenuItem>
            <MenuItem icon="PhonebookOutline" onPress={() => router.navigate('/profile/mobile')}>
                Contact Details
            </MenuItem>
            <MenuItem icon="LocationOutline" onPress={() => router.navigate('/profile/address')}>
                Address
            </MenuItem>
            <MenuItem icon="BankcardOutline" onPress={() => router.navigate('/profile/payment_methods')}>
                Payment Methods
            </MenuItem>
            {
                yuuLaunched && <MenuItem 
                    icon={<Image source={require('@/assets/images/yuu_icon.png')} style={{ width: 24, height: 24 }} />} 
                    onPress={() => router.navigate('/profile/yuu')} 
                >
                    yuu Rewards Club
                </MenuItem>
            }
        </Section>
        <View style={{ margin: 12, marginBottom: 0 }}>
            <InfoButton style={{ height: 40 }} onPress={onLogout}>Logout</InfoButton>
        </View>
        {/* This is to add padding required for the tabBar + margin */}
        <TabBarPadding />
    </KeyboardView>
}