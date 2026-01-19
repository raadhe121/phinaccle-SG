import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { antd, colors } from '@/common/utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntdMiniIcon from '@/common/components/AntdMiniIcon';
import { tabBarHeight } from '@/common/utils/config';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: colors.brands3,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    backgroundColor: colors.primary,

                    height: tabBarHeight + insets.bottom,
                    paddingTop: 8,
                    paddingBottom: 8 + insets.bottom,
                    borderTopLeftRadius: 50,
                },
                tabBarLabelStyle: {
                    ...antd.tabBarLabel,
                },
                headerShown: false,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <AntdMiniIcon name='HomeOutline' color={color} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="visits"
                options={{
                    title: 'My Visits',
                    tabBarIcon: ({ color, focused }) => (
                        <AntdMiniIcon name='UnorderedListOutline' color={color} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <AntdMiniIcon name='UserCircleOutline' color={color} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="support"
                options={{
                    title: 'Support',
                    tabBarIcon: ({ color, focused }) => (
                        <AntdMiniIcon name='HeadsetOutline' color={color} size={20} />
                    ),
                }}
            />
        </Tabs>
    );
}
