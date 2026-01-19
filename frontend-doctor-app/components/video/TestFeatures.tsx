import React, { useEffect, useState } from 'react';

import { modal } from '@/common/utils/modal';
import { GRButton } from '@/common/components/AntdText';
import { useMutation } from '@tanstack/react-query';
import { Toast } from '@ant-design/react-native';
import { ApiError, startTestSessionApiDoctorTeleconsultStartTestSessionGet } from '@/services/client';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Linking, View } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TestFeatures() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [camPerm, camReqPerm] = useCameraPermissions();
    const [micPerm, micReqPerm] = useMicrophonePermissions();
    const [ visible, setVisible ] = useState(false);
    
    // Check if user can see this screen
    useEffect(() => {
        const checkUser = async () => {
            const user = await supabase.auth.getUser();
            if (['junxiang@geddit.sg', 'test@test.com'].includes(user.data.user?.email ?? '')) {
                setVisible(true);
            }
            console.log(user.data.user?.email);
            // 
        }
        checkUser();
    }, []);

    const handlePermission = async () => {
        const camResult = await camReqPerm()
        const micResult = await micReqPerm()
        if (camResult.granted && micResult.granted) {
            return true
        } else {
            modal.error({
                title: "Unable to access microphone and camera",
                content: 'Allow Pinnacle App to access your camera and microphone from device menu under "Settings"',
                labels: ["Open Settings", ""],
                onCancel: async () => await Linking.openSettings()
            })
            return false
        }
    }
    
    const startTestMutation = useMutation({
        mutationFn: startTestSessionApiDoctorTeleconsultStartTestSessionGet,
        onSuccess: async (data) => {
            navigation.navigate("ZoomScreen", { zoomConfig: data });
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            });
        }
    });

    if (!visible) {
        return null;
    }

    return (
        <View style={{ margin: 16, marginBottom: 0 }}> 
            <GRButton
                type='primary'
                title='Test Video'
                icon="VideoOutlineAlt"
                onPress={async () => {
                    if (await handlePermission()) {
                        startTestMutation.mutate();
                    }
                } }
                disabled={startTestMutation.isPending}
                loading={startTestMutation.isPending} />
        </View>
    )
}
