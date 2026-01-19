import React from 'react';
import { StyleSheet, View } from 'react-native';

import { supabase } from '../lib/supabase';
import Biometric from '../components/setting/Biometric';
import { removeExpoToken } from '../notifications/NotificationHandler';
import { useAppSelector } from '../store/store';
import { modal } from '../common/utils/modal';
import KeyboardView from '../common/components/KeyboardView';
import { GRButton, TitleText } from '../common/components/AntdText';
import TestFeatures from '@/components/video/TestFeatures';

const SettingScreen: React.FC = () => {
    const { accessToken } = useAppSelector(state => state.auth);
    const { pushToken } = useAppSelector(state => state.notification)

    const handleLogout = async () => {
        console.log(pushToken)
        await removeExpoToken(accessToken, pushToken)
        supabase.auth.signOut()
    }


    return (
        <KeyboardView
            edges={[]}
            showLogo={true}
            title={<TitleText size={25}>Settings</TitleText>}
            >
            <TestFeatures />
            {/* <Biometric/> */}
            <View style={{ margin: 12 }}>
                <GRButton
                    type='danger'
                    border
                    title='Logout'
                    onPress={() => modal.error({
                        title: "Confirm Logout",
                        content: "Are you sure you want to logout?",
                        labels: ["Cancel", "Logout"],
                        onCancel: () => { },
                        onOk: () => { handleLogout() },
                    })}
                />
            </View>
        </KeyboardView>
    );
};

const styles = StyleSheet.create({
    paddingContainer: {
        paddingTop: 10,
    },
    container: {
        backgroundColor: "white",
        paddingTop: 10,
        height: "100%",
    },
    buttonContainer: {
        width: "90%",
        marginHorizontal: "auto"
    },

})

export default SettingScreen;
