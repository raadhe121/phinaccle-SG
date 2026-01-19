import React, { useEffect } from "react";
import { colors } from "@/common/utils/config";
import { BoldText, CText, ListItem, TextLink, TitleText } from "@/common/components/AntdText";
import { Button, Modal, View } from "@ant-design/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TeleconsultWarningMessage } from "@/services/client";
import dayjs from "dayjs";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";

export default function VideoInfoBar({ elapsedTime, warningConfig, clinicInfo }: { elapsedTime: number, warningConfig?: TeleconsultWarningMessage | null, clinicInfo?: string | null }) {
    const insets = useSafeAreaInsets();
    const [ showInfoModal, setShowInfoModal ] = useState(true);
    const [ currSecs, setCurrSecs ] = useState(elapsedTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrSecs((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const clinicName = clinicInfo?.split('\n')[1] ?? 'Pinnacle Family Clinic'

    return (
        <>
            <View style={{margin: 12}}>
                <ListItem
                    onPress={() => setShowInfoModal(true)}
                    divider={false}
                    styles={{ Item: { borderRadius: 4, backgroundColor: colors.action }}}
                    >
                    <View
                        style={{ flexDirection: 'row', alignItems: 'center', color: colors.primary }}>
                        <Ionicons name="videocam-outline" size={24} color={colors.primary}/>
                        <Text testID="info-button" style={{flexGrow: 1, marginLeft: 4, color: colors.primary}}>Important Information</Text>
                        <Text style={{ color: colors.primary }}>Read</Text>
                    </View>
                </ListItem>
            </View>
            {
                warningConfig && warningConfig.state === "on" && currSecs >= warningConfig.display_after_secs && (
                    <View style={{margin: 12, marginTop: 0 }}>
                        <ListItem
                            divider={false}
                            styles={{ Item: { borderRadius: 4, backgroundColor: colors.alert }}}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <AntdMiniIcon name="ExclamationCircleFill" size={24} color={colors.warning} />
                                    <BoldText style={{ marginLeft: 4, color: colors.warning }}>Consultation Duration: {dayjs().startOf('day').second(currSecs).format('mm:ss')}</BoldText>
                                </View>
                                <CText style={{ color: colors.warning }}>{warningConfig.message}</CText>
                        </ListItem>
                    </View>
                )
            }
            {
                clinicInfo && (
                    <View style={{margin: 12, marginTop: 0, padding: 12, borderRadius: 4, backgroundColor: '#0000008C' }}>
                        <CText style={{ color: 'white' }}>
                            {clinicInfo}
                        </CText>
                    </View>
                )
            }
            {/* Modal to display Important Information */}
            <Modal
                popup
                visible={showInfoModal}
                animationType="slide-up"
                style={{ paddingBottom: 12 + insets.bottom, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
                onClose={() => setShowInfoModal(false)}>
                <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                    <TitleText style={{ textAlign: 'center' }}>Important Info</TitleText>
                    <Text>
                        {clinicName} is licensed to provide outpatient medical service by remote provision.
                        {'\n\n'}
                        Please note telemedicine services are designed to manage non-emergency issues. In the event of emergency, please go to the nearest Accident and Emergency department or call 995.
                        {'\n\n'}
                        For assistance, please call {clinicName} at 
                        <TextLink href="tel:62351852">62351852</TextLink>
                        or email
                        <TextLink href="mailto:connect@pinnaclefamilyclinic.com.sg">connect@pinnaclefamilyclinic.com.sg</TextLink>
                    </Text>
                </View>
                <Button
                    style={{ margin: 12 }}
                    type="primary"
                    onPress={() => setShowInfoModal(false)}>
                    Close
                </Button>
            </Modal>
        </>
    )
}
