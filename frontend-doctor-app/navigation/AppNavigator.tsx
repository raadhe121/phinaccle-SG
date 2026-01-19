import React from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import QueueScreen from '../screens/QueueScreen';
import ConsultationScreen from '../screens/ConsultationScreen';
import { Provider } from '@ant-design/react-native';
import enUS from '@ant-design/react-native/lib/locale-provider/en_US';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EndedQueueScreen from '../screens/EndedQueueScreen';
import SettingScreen from '../screens/SettingScreen';
import AuthCheck from '../auth/AuthCheck';
import ZoomScreen from '../components/video/Zoom';
import { antd, colors, tabBarHeight } from '../common/utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntdMiniIcon from '../common/components/AntdMiniIcon';
import { View } from 'react-native';
import { VideoResp } from '@/services/client';

export type RootStackParamList = {
    Root: undefined;
    Login: undefined;
    Queue: undefined;
    EndedQueue: undefined;
    Consultation: { id: string };
    ZoomScreen: { zoomConfig: VideoResp };
    Signup: undefined;

    Branches: undefined
    CreateBranch: undefined
    OperatingHour: undefined
    CreateHoliday: undefined
    WalkInQueue: undefined
    AdminWalkInQueue: undefined
    ViewWalkInQueue: undefined
    BlockOff: undefined
    ToggleNotification: undefined

    HomeStack: undefined
    UpcomingStack: undefined
    EndedStack: undefined
    SettingStack: undefined
};

export type TabParamList = {
    Upcoming: undefined
    Ended: undefined
    Setting: undefined
    Home: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// template for useNavigation, dont import, will cause cycle error
export const useAppNavigation = () => useNavigation<NavigationProp<RootStackParamList>>()

const createStackNavigator = (screenName: keyof RootStackParamList, component: React.ComponentType<any>, title: string, back: boolean) => {
    return () => (
        <Stack.Navigator>
            <Stack.Screen
                name={screenName}
                component={component}
                options={({ navigation }) => ({
                    headerShown: false
                })}
            />
        </Stack.Navigator>
    );
};

// Customize Tab Screen with header
const QueueStack = createStackNavigator("UpcomingStack", QueueScreen, "Upcoming", false)
const EndedQueueStack = createStackNavigator("EndedStack", EndedQueueScreen, "Ended", false)
const SettingStack = createStackNavigator("SettingStack", SettingScreen, "Setting", false)

const TabNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <AuthCheck>
            <View style={{ backgroundColor: "white", flex: 1 }}>
                <Tab.Navigator
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
                    <Tab.Screen
                        name="Upcoming"
                        component={QueueStack}
                        options={{
                            headerShown: false,
                            tabBarIcon: ({ color, focused }) => (
                                <AntdMiniIcon name='VideoOutlineAlt' color={color} size={20} />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Ended"
                        component={EndedQueueStack}
                        options={{
                            tabBarIcon: ({ color, focused }) => (
                                <AntdMiniIcon name='CheckCircleOutline' color={color} size={20} />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="Setting"
                        component={SettingStack}
                        options={{
                            tabBarIcon: ({ color, focused }) => (
                                <AntdMiniIcon name='SettingsOutline' color={color} size={20} />
                            ),
                        }}
                    />
                </Tab.Navigator>
            </View>
        </AuthCheck>
    )
}

const AppNavigator = () => {
    return (
        <Provider locale={enUS}>
            <Stack.Navigator initialRouteName="Root"
                screenOptions={{
                    headerShown: false
                }}>
                <Stack.Screen name="Root" component={TabNavigator} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerBackTitle: 'Go Back' }} />
                <Stack.Screen name="Queue" component={QueueScreen} options={{ headerBackTitle: 'Go Back' }} />
                <Stack.Screen name="EndedQueue" component={EndedQueueScreen} options={{ headerBackTitle: 'Go Back' }} />
                <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ headerBackTitle: 'Go Back' }}  />
                <Stack.Screen name="ZoomScreen" component={ZoomScreen} options={{ headerBackTitle: 'Go Back' }} />
            </Stack.Navigator>
        </Provider>
    );
};

export default AppNavigator;
