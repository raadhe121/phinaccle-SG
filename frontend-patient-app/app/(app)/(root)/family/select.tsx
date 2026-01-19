import { CCheckbox, CText, GRButton2, H1Text, ListItem, NavHeader3, ReactQueryChild, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { FamilyMember, getFamilyApiFamilyListGet } from "@/services/client";
import { Button, View } from "@ant-design/react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router"
import { Dispatch, SetStateAction, useState } from "react";
import { TouchableHighlight } from "react-native";

// This will filter out invalid patient IDs as manage family page is within the walkin pages
export const useFamilyHook = (patientIds?: string[]) => {
    const qry = useQuery({
        queryKey: ['family'],
        queryFn: getFamilyApiFamilyListGet
    });

    if (!qry.data || qry.data.length == 0) return { hasFamily: false };
    return { patients: qry.data.filter((p) => patientIds?.includes(p.id)), hasFamily: true };
}

export function FamilyPicker({ includeUser, patients, returnPath }: { includeUser: boolean, patients?: FamilyMember[], returnPath: '/teleconsult/payment' | '/walkin' }) {
    let patientIdsStr = patients?.map((p) => p.id).join(',') ?? '';
    if (includeUser && patientIdsStr) patientIdsStr = ',' + patientIdsStr;
    const patientNames = ((includeUser ? 'Myself\n' : '') + (patients?.map((p) => p.name).join('\n') ?? '')).trim();

    return (
        <ListItem
            onPress={() => router.push({
                    pathname: '/family/select', 
                    params: { pathname: returnPath, patientIdsStr }
                })}
            arrow="horizontal"
            divider={false}
            >
            <View>
                <CText size={17}>
                    {patientNames}
                </CText>
            </View>
        </ListItem>
    )
}

type SelectFamilyParams = {
    pathname: '/teleconsult/payment' | '/walkin';
    patientIdsStr: string;
}

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
    // Note: expo-router converts string[] -> string. ",2,3"
    const localParams = useLocalSearchParams();
    const { pathname, patientIdsStr }: SelectFamilyParams = localParams as any;
    const [ selectedPatientIds, setSelectedPatientIds ] = useState<string[]>(patientIdsStr.split(',') ?? ['']);

    const qry = useQuery({
        queryKey: ['family'],
        queryFn: getFamilyApiFamilyListGet
    });

    // Filter out invalid patient IDs
    const filteredSelectedIds = selectedPatientIds.filter((id) => id === '' || qry.data?.find((p) => p.id == id));
    const navBack = () => {
        router.dismissTo({
            pathname,
            params: { ...localParams, patientIdsStr: filteredSelectedIds },
        })
    }

    const action = (
        <Button type="primary" onPress={navBack} disabled={selectedPatientIds.length == 0}>Done</Button>
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
                        <Section title={<H1Text>Select Patients ({filteredSelectedIds.length})</H1Text>}>
                            {
                                [
                                    <SelectRow key='' id={''} checked={selectedPatientIds.includes('')} setSelectedPatientIds={setSelectedPatientIds}>Myself</SelectRow>,
                                    ...qry.data.map((p) => <SelectRow key={p.id} id={p.id} checked={selectedPatientIds.includes(p.id)} setSelectedPatientIds={setSelectedPatientIds}>{p.name} ({p.relation})</SelectRow>)
                                ]
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