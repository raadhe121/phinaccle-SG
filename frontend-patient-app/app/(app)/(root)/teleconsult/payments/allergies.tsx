import { CText, ErrorText, Label, ListItemView, Row, Section, TitleText, ToggleButton } from '@/common/components/AntdText';
import { Input } from '@ant-design/react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image'
import { drugIcon } from '@/common/components/AntdMiniIcon';
import { FamilyMember } from '@/services/client';
import React from 'react';
import { useTeleconsultProvider } from '../teleconsult_provider';

type FamilyAllergiesProps = {
    [key: string]: string
}

type FamilyToggleProps = {
    [key: string]: boolean
}

const AllergyRow = ({ patient, familyToggles, familyAllergies, onTogglePress, onAllergyChange }: { patient: FamilyMember, familyToggles: FamilyToggleProps, familyAllergies: FamilyAllergiesProps, onTogglePress: Function, onAllergyChange: Function }) => {
    const { patientInitialAllergies, formSubmitted } = useTeleconsultProvider();
    const allergyOptionsError = formSubmitted && familyToggles?.[patient.id] === undefined ? 'Please select an option' : null;
    const allergyError = formSubmitted && familyToggles?.[patient.id] && !familyAllergies?.[patient.id] ? 'Please key in drug allergies' : null;

    return <>
            <ListItemView>
                <View style={{ marginBottom: 10 }}>
                    <CText>For {patient.name} ({patient.relation})</CText>
                </View>
                <View style={{ flexDirection: 'row'}}>
                    <ToggleButton selected={familyToggles?.[patient.id] === false} onPress={() => onTogglePress(patient.id, false)}>No</ToggleButton>
                    <ToggleButton selected={familyToggles?.[patient.id] === true} style={{ marginLeft: 20 }} onPress={() => onTogglePress(patient.id, true)}>Yes</ToggleButton>
                </View>
                <ErrorText style={{ marginTop: 6 }} error={allergyOptionsError} />
            </ListItemView>
            {
                familyToggles?.[patient.id] && <Label label='Please specify drugs' error={allergyError}>
                    <Input
                        allowClear
                        value={familyAllergies?.[patient.id] ?? patientInitialAllergies?.allergies?.[patient.id] ?? ''}
                        onChangeText={(val) => onAllergyChange(patient.id, val)}
                        placeholder="Enter here"
                    />
                </Label>
            }
        </>
}

export const DrugAllergiesForm = () => {
    const { rates, patientInitialAllergies, formSubmitted, includeUser, formVals, patients, setAllergies } = useTeleconsultProvider();

    // This track which option has been selected
    const [ userAllergy, setUserAllergy ] = useState<string>();
    const [ familyAllergies, setFamilyAllergies ] = useState<FamilyAllergiesProps>({}) 
    const [ userToggle, setUserToggle ] = useState<boolean>();
    const [ familyToggles, setFamilyToggles ] = useState<FamilyToggleProps>({})

    const validateAllergies = () => {
        const userOk = !includeUser || ((userToggle === true && userAllergy) || (userToggle === false));
        let familyOk = true;
        if ( patients ) {
            for ( const patient of patients ) {
                // There are some family toggles not selected
                if (familyToggles?.[patient.id] !== true && familyToggles?.[patient.id] !== false) {
                    familyOk = false;
                    break;
                }
                // There are some family toggles Yes but the input box is empty
                if (familyToggles?.[patient.id] === true && !familyAllergies?.[patient.id]) {
                    familyOk = false;
                }
            }
        }

        return userOk && familyOk;
    }

    // The following will update the allergy values to provider whenever a toggle is pressed or value is changed
    useEffect(() => {
        const userVal = userToggle === true ? userAllergy : undefined;
        const patientVals: { [key: string]: string } = {}
        for (const key in familyToggles) {
            if (familyToggles[key] === true) {
                patientVals[key] = familyAllergies?.[key]
            }
        }

        setAllergies(userVal, patientVals, validateAllergies())
    }, [rates, userAllergy, familyAllergies, userToggle, familyToggles])

    const onTogglePress = (patientId: string | null, isYes: boolean) => {
        if (!patientId) {
            setUserToggle(isYes);
            if (!userAllergy && patientInitialAllergies?.userAllergy) onAllergyChange(null, patientInitialAllergies?.userAllergy);
        } else {
            setFamilyToggles((prev) => ({ ...prev, [patientId]: isYes }));
            if (!familyAllergies?.[patientId] && patientInitialAllergies?.allergies?.[patientId]) onAllergyChange(patientId, patientInitialAllergies?.allergies?.[patientId] as string);
        }
    }

    const onAllergyChange = (patientId: string | null, val: string) => {
        if (!patientId) {
            setUserAllergy(val);
        } else {
            setFamilyAllergies((prev) => ({ ...prev, [patientId]: val }));
        }
    }

    const rows = [
        includeUser && <View key='user'>
            <ListItemView>
                <View>
                    {
                        patients && patients?.length != 0 && <View style={{ marginBottom: 10 }}>
                            <CText>For Myself</CText>
                        </View>
                    }
                    <View style={{ flexDirection: 'row'}}>
                        <ToggleButton selected={userToggle === false} onPress={() => onTogglePress(null, false)}>No</ToggleButton>
                        <ToggleButton selected={userToggle === true} style={{ marginLeft: 20 }} onPress={() => onTogglePress(null, true)}>Yes</ToggleButton>
                    </View>
                    <ErrorText style={{ marginTop: 6 }} error={formSubmitted && userToggle === undefined && 'Please select an option'} />
                </View>
            </ListItemView>
            {
                userToggle && <Label label='Please specify drugs' error={formSubmitted && !userAllergy && 'Please key in drug allergies'}>
                    <Input
                        allowClear
                        value={userAllergy ?? patientInitialAllergies?.userAllergy ?? ''}
                        onChangeText={(val) => onAllergyChange(null, val)}
                        placeholder="Enter here"
                    />
                </Label>
            }
        </View>,
        patients?.length != 0 && patients?.map((p) => <AllergyRow key={p.id} patient={p} familyToggles={familyToggles} familyAllergies={familyAllergies} onTogglePress={onTogglePress} onAllergyChange={onAllergyChange} />)
    ]

    return <Section title={
        <Row style={{ marginLeft: 12, marginTop: 12 }}>
            <Image source={drugIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Drug Allergies</TitleText>
        </Row>
        }>
        {rows.flat()}
    </Section>
}