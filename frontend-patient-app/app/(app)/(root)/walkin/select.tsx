import { CCheckbox, CText, GRButton2, H1Text, NavHeader3, ReactQueryChild, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { onError } from "@/common/utils/lib";
import { toast } from "@/common/utils/modal";
import { addFamilyApiWalkinFamilyPost, getFamilyApiWalkinFamilyGet } from "@/services/client";
import { Button, View } from "@ant-design/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router"
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { TouchableHighlight } from "react-native";

const SelectRow = ({ id, checked, setSelectedPatientIds, children }: { id: string, checked: boolean, setSelectedPatientIds: Dispatch<SetStateAction<string[]>>, children: React.ReactNode }) => {
    const onPress = () => setSelectedPatientIds((s) => checked 
        ? s.filter((p) => p != id)
        : [...s, id])
    
    return <TouchableHighlight underlayColor={colors.underlay} onPress={onPress}>
        <View style={{ flexDirection: 'row', margin: 12, marginTop: 16, marginBottom: 16, alignItems: 'center' }}>
            <CCheckbox checked={checked} />
            <CText size={16} style={{ flexShrink: 1, marginLeft: 8 }}>{children}</CText>
        </View>
    </TouchableHighlight>
}

export default function FamilySelectScreen() {
    const [ selectedPatientIds, setSelectedPatientIds ] = useState<string[]>([]);

    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['family', 'walkin'],
        queryFn: getFamilyApiWalkinFamilyGet,
    });

    const addMutation = useMutation({
        mutationFn: addFamilyApiWalkinFamilyPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family', 'walkin'] })
            router.back()
        },
        onError
    });

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['family', 'walkin'] })
        }, [])
    )

    useEffect(() => {
        if (qry.isFetching) {
            const close = toast.loading()
            return () => close()
        }
    }, [qry.isFetching])

    const action = (
        <Button
            type="primary"
            onPress={() => addMutation.mutate({ requestBody: {patient_ids: selectedPatientIds}})}
            disabled={selectedPatientIds.length == 0 || addMutation.isPending}
            loading={addMutation.isPending}
            >
            Add Dependant(s)
        </Button>
    )

    return (
        <KeyboardView
            navBack={() => router.back()}
            header={<NavHeader3 navBack={router.back} />}
            action={action}
            >
            <ReactQueryChild query={qry}>
                { 
                    qry.data && (
                        <Section title={<H1Text>Select Patients ({selectedPatientIds.length})</H1Text>}>
                            {
                                qry.data.map((p) => (
                                    <SelectRow
                                        key={p.id}
                                        id={p.id}
                                        checked={selectedPatientIds.includes(p.id)}
                                        setSelectedPatientIds={setSelectedPatientIds}
                                        >
                                        {p.name}
                                    </SelectRow>
                                ))
                            }
                        </Section>
                    )
                }
            </ReactQueryChild>

            <GRButton2 onPress={() => router.navigate('/family')} style={{ margin: 12 }}>
                Manage Family Members
            </GRButton2>
        </KeyboardView>
    )
}
