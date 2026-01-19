import React from 'react';
import { QueueCard } from '../components/queue-helper/QueueCard';
import { View } from 'react-native';
import { Toast } from '@ant-design/react-native';
import { Linking } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { modal } from '../common/utils/modal';
import { RootStackParamList } from '../navigation/AppNavigator';
import KeyboardView from '../common/components/KeyboardView';
import { GRButton, Height, ReactQueryChild, Section, TitleText } from '../common/components/AntdText';
import { colors } from '../common/utils/config';
import { ApiError, cancelSessionApiDoctorTeleconsultCancelSessionPost, endSessionApiDoctorTeleconsultEndSessionPost, readTeleconsultsByIdApiDoctorTeleconsultTeleconsultsIdGet, resumeSessionApiDoctorTeleconsultResumeSessionPost, startSessionApiDoctorTeleconsultStartSessionPost, TeleconsultStatus } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'Consultation'>;
export default function ConsultationScreen({ route, navigation }: Props) {
    const queryClient = useQueryClient();
    const { id } = route.params;
    const qry = useQuery({
        queryKey: [ 'teleconsults', id ],
        queryFn: () => readTeleconsultsByIdApiDoctorTeleconsultTeleconsultsIdGet({ id })
    })
    const [camPerm, camReqPerm] = useCameraPermissions();
    const [micPerm, micReqPerm] = useMicrophonePermissions();

    const onError = (error: ApiError) => {
        Toast.fail({
            content: (error.body as { detail?: string })?.detail ?? error.message,
            duration: 1,
            stackable: true,
        });
        navigation.goBack();
    }

    const startMutation = useMutation({
        mutationFn: startSessionApiDoctorTeleconsultStartSessionPost,
        onSuccess: async (data) => {
            queryClient.invalidateQueries({ queryKey: ['teleconsults', 'ongoing'] });
            queryClient.invalidateQueries({ queryKey: ['teleconsults', id] });
            navigation.navigate("ZoomScreen", { zoomConfig: data });
        },
        onError
    });
    const resumeMutation = useMutation({
        mutationFn: resumeSessionApiDoctorTeleconsultResumeSessionPost,
        onSuccess: async (data) => {
            navigation.navigate("ZoomScreen", { zoomConfig: data });
        },
        onError
    });
    const endMutation = useMutation({
        mutationFn: endSessionApiDoctorTeleconsultEndSessionPost,
        onSuccess: () => {
            Toast.success({ content: "Consultation Ended", duration: 1, stackable: true });
            queryClient.invalidateQueries({ queryKey: ['teleconsults', 'ongoing'] });
            navigation.goBack();
        },
        onError
    });
    const noShowMutation = useMutation({
        mutationFn: cancelSessionApiDoctorTeleconsultCancelSessionPost,
        onSuccess: () => {
            Toast.success({ content: "Done", duration: 1, stackable: true });
            queryClient.invalidateQueries({ queryKey: ['teleconsults', 'ongoing'] });
            navigation.goBack();
        },
        onError
    });

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

    const actions: { [key in TeleconsultStatus]: React.ReactNode } = {
        'Checked In': (
            <GRButton
                type='primary'
                title='Start Session'
                icon="VideoOutlineAlt"
                onPress={async () => {
                    if (await handlePermission()) {
                        startMutation.mutate({ requestBody: { teleconsult_id: id } });
                    }
                } }
                disabled={startMutation.isPending}
                loading={startMutation.isPending} />
        ),
        'Consult Start': (
            <>
                <GRButton
                    type='primary'
                    border
                    title='Resume Session'
                    icon="VideoOutlineAlt"
                    onPress={() => resumeMutation.mutate({ requestBody: { teleconsult_id: id } })}
                    disabled={resumeMutation.isPending}
                    loading={resumeMutation.isPending} />
                <GRButton
                    type='warning'
                    border
                    title='No Show'
                    disabled={noShowMutation.isPending}
                    loading={noShowMutation.isPending}
                    onPress={() => modal.warn({
                        title: "No Show",
                        content: "Are you sure you want to mark this patient as \"no show\"?",
                        labels: ["Cancel", "No Show"],
                        onCancel: () => { },
                        onOk: () => { noShowMutation.mutate({ requestBody: { teleconsult_id: id } }); }
                    })} />
                <GRButton
                    type='danger'
                    title='End Consult'
                    disabled={endMutation.isPending}
                    loading={endMutation.isPending}
                    onPress={() => modal.error({
                        title: "End Consultation",
                        content: "Are you sure you want to end this virtual consultation session?",
                        labels: ["Cancel", "End Session"],
                        onCancel: () => { },
                        onOk: () => { endMutation.mutate({ requestBody: { teleconsult_id: id } }); }
                    })} />
            </>
        ),
        Prepayment: <></>,
        'Consult End': <GRButton
            type='primary'
            border
            title='Resume Session'
            icon="VideoOutlineAlt"
            onPress={async () => {
                if (await handlePermission()) {
                    startMutation.mutate({ requestBody: { teleconsult_id: id } });
                }
            } }
            disabled={startMutation.isPending}
            loading={startMutation.isPending} />,
        Outstanding: <GRButton
            type='primary'
            border
            title='Resume Session'
            icon="VideoOutlineAlt"
            onPress={async () => {
                if (await handlePermission()) {
                    startMutation.mutate({ requestBody: { teleconsult_id: id } });
                }
            } }
            disabled={startMutation.isPending}
            loading={startMutation.isPending} />,
        // Unused State
        'Dispense Medication': <></>,
        'Checked Out': <></>,
        Cancelled: <></>,
        Missed: <></>
    }

    return (
        <KeyboardView
            title={<TitleText size={25}>Patient</TitleText>}
            navBack={() => navigation.goBack()}
            >
            <ReactQueryChild query={qry}>
                { qry.data && (
                    <>
                        <Section title={<Height h={24} />} backgroundColor={colors.brands5}>
                            <QueueCard teleconsult={qry.data} showIndex={false} />
                        </Section>
                        <View style={{ margin: 12 }}>
                            {qry.data && actions[qry.data.status]}
                        </View>
                    </>
                )}
            </ReactQueryChild>
            
        </KeyboardView>
    );
};
