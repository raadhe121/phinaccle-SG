import { CMarkdown, FormPicker, H1Text, Height, ReactQueryChild, Section, TitleText } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { ApiError, createWalkinQueueApiWalkinRequestPost, getServicesApiWalkinServicesGet } from "@/services/client";
import { Button, PickerValue, Toast } from "@ant-design/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from 'react-native';
import { BranchPicker } from "./branches";
import { modal } from "@/common/utils/modal";
import { FamilyPicker, useFamilyHook } from "../family/select";
import dayjs from 'dayjs';

export default function WalkInScreen() {
    const { patientIdsStr, branchService, branchId, branchName } = useLocalSearchParams();

    const [ family, setFamily ] = useState<{ ids: string[], include_user: boolean }>({ ids: [], include_user: true });
    const [ branch, setBranch ] = useState<{ id: string, service: string, name: string }>();
    const { patients, hasFamily } = useFamilyHook(family?.ids);
    
    // Convert any localsearchparams back into state
    useEffect(() => {
        if (branchId) setBranch({ id: branchId as string, service: branchService as string, name: branchName as string });
        if (patientIdsStr !== undefined) {
            const patientIds = (patientIdsStr as string).split(',');
            setFamily({ include_user: patientIds.includes(''), ids: patientIds.filter((p) => p != '') })
        }
    }, [branchId, patientIdsStr])
    
    const [ service, setService ] = useState<string>();

    const qry = useQuery({
        queryKey: ['services'],
        queryFn: getServicesApiWalkinServicesGet,
    })

    const walkinReqMutation = useMutation({
        mutationFn: createWalkinQueueApiWalkinRequestPost,
        onSuccess: () => {
            router.replace('/walkin/consultation')
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            })
        }
    })

    const selectedBranchId = service == branch?.service ? branch?.id : undefined;
    const onRequestQueue = () => {
        if (!selectedBranchId || !service) {
            Toast.fail({
                content: 'Please select a service and clinic',
                duration: 1,
                stackable: true,
            })
            return;
        }

        modal.warn({
            title: 'Confirm Queue Request?',
            content: (
                <CMarkdown size={14} textAlign="center">
                    Kindly note that the clinic will respond to your queue request **within 30 mins**. A notification will be sent to you once the clinic responds to your queue request. We seek your kind patience. Thank you.
                </CMarkdown>
            ),
            labels: ["Cancel", "Yes, Proceed"],
            onCancel: () => {},
            onOk: () => {
                walkinReqMutation.mutate({
                    requestBody: {
                        patient_ids: patients?.map((p) => p.id),
                        include_user: family.include_user,
                        branch_id: selectedBranchId,
                        service: service,
                    }
                });
            }
        })        
    }

    const currDate = dayjs();

    return <KeyboardView
        navBack={router.back}
        title={
            <H1Text style={{ marginTop: 8 }}>Queue Request</H1Text>
        }
        action={
            <Button
                onPress={onRequestQueue}
                type="primary"
                disabled={!selectedBranchId || walkinReqMutation.isPending}
                loading={walkinReqMutation.isPending}
                >
                Request Queue Number
            </Button>
        }
        >
        <ReactQueryChild query={qry}>
            {
                currDate.isAfter(dayjs('2024-12-15 00:00')) && currDate.isBefore(dayjs('2024-12-15 13:00')) && 
                <Section title={<Height h={12} />}>
                    <CMarkdown style={{ margin: 12 }} textAlign="center">Please be informed that **our clinics will be closed on the morning of 15 December 2024 (Sunday)**. We will resume our usual operating hours thereafter.</CMarkdown>
                </Section>
            }
            {qry.data && (
                <>
                    { 
                        hasFamily && <Section title={<TitleText>Select Patients</TitleText>}>
                            <FamilyPicker includeUser={family.include_user} patients={patients} returnPath='/walkin' />
                        </Section>
                    }

                    <Section title={<TitleText>Select Service</TitleText>}>
                        <FormPicker
                            data={qry.data.sort().map((label: string) => ({ label, value: label }))}
                            value={service ? [service] : undefined}
                            onChange={(value: PickerValue[]) => setService(value[0] as string)}
                            placeholder="Select Service"
                            />
                    </Section>

                    {
                        service && <Section title={<TitleText>Select Clinic</TitleText>}>
                            <BranchPicker branch={selectedBranchId && branch?.name} service={service} />
                        </Section>
                    }
                    <View style={{ height: 12 }} />
                </>
            )}
        </ReactQueryChild>
    </KeyboardView>
}
