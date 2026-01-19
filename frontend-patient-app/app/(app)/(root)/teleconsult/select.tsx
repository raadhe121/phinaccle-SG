import { drugIcon } from "@/common/components/AntdMiniIcon";
import { CCheckbox, CText, ErrorText, GRButton2, H1Text, Label, ListItemView, NavHeader3, ReactQueryChild, Row, Section, TitleText, ToggleButton } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { onError } from "@/common/utils/lib";
import { toast } from "@/common/utils/modal";
import { addFamilyApiTeleconsultV2FamilyPost, FamilyInTeleconsultRow, FamilyMember, getFamilyApiTeleconsultV2FamilyGet, GetFamilyApiTeleconsultV2FamilyGetResponse } from "@/services/client";
import { Button, Input, View } from "@ant-design/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router"
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Image, TouchableHighlight } from "react-native";

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
    // Form Fields
    const [ showErrors, setShowErrors ] = useState(false);
    const [ errors, setErrors ] = useState<{ [key: string]: any }>({});
    const [ toggleSelections, setToggleSelections ] = useState<{ [key: string]: boolean }>({});
    const [ allergiesInputs, setAllergiesInputs ] = useState<{ [key: string]: string }>({});
    
    useEffect(() => {
        let errors: { [key: string]: any } = {}
        selectedPatientIds.forEach((id) => {
            if (toggleSelections?.[id] == undefined) {
                errors[id] = { 'toggle': 'Please select an option' }
            } else if (toggleSelections[id] == true && (allergiesInputs?.[id]?.length == 0 || allergiesInputs?.[id] == undefined)) {
                errors[id] = { 'input': 'Please key in drug allergies' }
            }
        })

        setErrors(errors)
    }, [selectedPatientIds, showErrors, toggleSelections, allergiesInputs])
    
    // TanStack Query Hooks
    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['family', 'teleconsult'],
        queryFn: getFamilyApiTeleconsultV2FamilyGet,
    });

    const addMutation = useMutation({
        mutationFn: addFamilyApiTeleconsultV2FamilyPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family', 'teleconsult'] })
            router.back()
        },
        onError
    });

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['family', 'teleconsult'] })
        }, [])
    )

    useEffect(() => {
        if (qry.isFetching) {
            const close = toast.loading()
            return () => close()
        } else if (qry.data) {
            const allergies = qry.data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.allergy }), {});
            setAllergiesInputs(allergies)
        }
    }, [qry.isFetching, qry.isFetched])

    const onPress = () => {
        setShowErrors(true);
        if (Object.keys(errors).length > 0) return;

        const selectedPatientDetails = selectedPatientIds.reduce((acc: { [key: string]: string | null }, key) => {
            acc[key] = toggleSelections?.[key] === true ? allergiesInputs[key] : null;
            return acc
        }, {})

        addMutation.mutate({ requestBody: { patient_ids_allergies: selectedPatientDetails }})
    }

    const action = (
        <Button
            type="primary"
            onPress={onPress}
            disabled={selectedPatientIds.length == 0 || (showErrors && Object.keys(errors).length > 0) || addMutation.isPending}
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

            {
                qry.data && selectedPatientIds.length > 0 && (
                    <DrugAllergiesForm
                        // selectedPatientIds={qry.data.filter((p) => selectedPatientIds.includes(p.id)).map((p) => p.id)}
                        dependants={qry.data.filter((p) => selectedPatientIds.includes(p.id))}
                        errors={showErrors ? errors : {}}
                        toggleSelections={toggleSelections}
                        setToggleSelections={setToggleSelections}
                        allergiesInputs={allergiesInputs}
                        setAllergiesInputs={setAllergiesInputs}
                    />
                )
            }
            
            <GRButton2 onPress={() => router.navigate('/family')} style={{ margin: 12 }}>
                Manage Family Members
            </GRButton2>
        </KeyboardView>
    )
}

const DrugAllergiesForm = ({ dependants, errors, toggleSelections, setToggleSelections, allergiesInputs, setAllergiesInputs }: { dependants: GetFamilyApiTeleconsultV2FamilyGetResponse, errors: { [key: string]: any }, toggleSelections: { [key: string]: boolean }, setToggleSelections: Dispatch<SetStateAction<{ [key: string]: boolean }>>, allergiesInputs: { [key: string]: string }, setAllergiesInputs: Dispatch<SetStateAction<{ [key: string]: string }>> }) => {

    const onToggleChange = (id: string, val: boolean) => {
        setToggleSelections((s) => ({ ...s, [id]: val }))
    }

    const onInputChange = (id: string, val: string) => {
        setAllergiesInputs((s) => ({ ...s, [id]: val }))
    }

    return (
        <Section title={
            <Row style={{ marginLeft: 12, marginTop: 12 }}>
                <Image source={drugIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                <TitleText style={{ marginLeft: 8 }}>Drug Allergies</TitleText>
            </Row>
            }>
            { dependants.map((patient) => (
                <AllergyRow
                    key={`input_${patient.id}`}
                    patient={patient}
                    // Toggle Changes
                    toggle={toggleSelections?.[patient.id]}
                    toggleError={errors?.[patient.id]?.toggle}
                    onToggleChange={(val) => onToggleChange(patient.id, val)}
                    // Input Changes
                    input={allergiesInputs?.[patient.id]}
                    inputError={errors?.[patient.id]?.input}
                    onInputChange={(val) => onInputChange(patient.id, val)}
                    />
            ))}
        </Section>
    )
}

const AllergyRow = ({ patient, toggle, toggleError, onToggleChange, input, inputError, onInputChange }: { patient: FamilyInTeleconsultRow, toggle?: boolean, toggleError?: string, onToggleChange: (val: boolean) => void, input?: string, inputError?: string, onInputChange: (val: string) => void }) => {
   return (
        <>
            <ListItemView>
                <View style={{ marginBottom: 10 }}>
                    <CText>For {patient.name}</CText>
                </View>
                <View style={{ flexDirection: 'row'}}>
                    <ToggleButton selected={toggle === false} onPress={() => onToggleChange(false)}>No</ToggleButton>
                    <ToggleButton selected={toggle === true} style={{ marginLeft: 20 }} onPress={() => onToggleChange(true)}>Yes</ToggleButton>
                </View>
                <ErrorText style={{ marginTop: 6 }} error={toggleError} />
            </ListItemView>
            {
                toggle === true && <Label label='Please specify drugs' error={inputError}>
                    <Input
                        allowClear
                        value={input}
                        onChangeText={onInputChange}
                        placeholder="Enter here"
                    />
                </Label>
            }
        </>        
    )
}