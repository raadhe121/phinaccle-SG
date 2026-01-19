import React from "react";
import { BoldText, CCheckbox, CText, H1Text, Height, Label, MText, NavHeader3, ReactQueryChild, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { antd, colors } from "@/common/utils/config";
import { FamilyMember, getFamilyApiFamilyListGet } from "@/services/client";
import { Button, Input, Modal, View } from "@ant-design/react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, StyleSheet, TouchableHighlight } from "react-native";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { CountryCode } from "@/app/(app)/signin";
import { useAppointmentStore } from "@/hooks/useAppointment";
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

const SelectRow = ({ name, relation, mobileNumber, isSelected = false, selectRow, editRow, deleteRow, patientSurveyOptions, patientSurveyOption, onPatientSurveyOptionChange }:
  { name: string, relation?: string, mobileNumber?: string, isSelected?: boolean, selectRow?: () => void, editRow?: () => void, deleteRow?: () => void, patientSurveyOptions?: string[], patientSurveyOption?: string, onPatientSurveyOptionChange?: (type: string) => void }) => {

  return (
    <>
      <TouchableHighlight
        underlayColor={colors.underlay}
        onPress={selectRow}
      >
        <View style={styles.patientRow}>
          <CCheckbox checked={isSelected} />
          <View style={styles.patientInfo}>
            <>
              <CText size={16} style={styles.patientName}>
                {relation ? `${name} (${relation})` : name}
              </CText>
              {mobileNumber && (
                <CText size={14} style={styles.mobileNumber}>
                  {mobileNumber}
                </CText>
              )}
            </>
          </View>


          <View style={styles.actionsContainer}>
            {
              editRow && (
                <TouchableHighlight
                  underlayColor={colors.underlay}
                  onPress={editRow}
                  style={styles.iconButton}
                >
                  <AntdMiniIcon name="EditFill" size={18} />
                </TouchableHighlight>
              )
            }
            {
              deleteRow && (
                <TouchableHighlight
                  underlayColor={colors.underlay}
                  onPress={deleteRow}
                  style={styles.iconButton}
                >
                  <AntdMiniIcon name="DeleteOutline" size={18} />
                </TouchableHighlight>
              )
            }
          </View>
        </View>
      </TouchableHighlight>
      {patientSurveyOptions && isSelected && onPatientSurveyOptionChange && (
        <CorporatePatientTypeSection
          patientSurveyOptions={patientSurveyOptions}
          patientSurveyOption={patientSurveyOption}
          onPatientSurveyOptionChange={onPatientSurveyOptionChange}
        />
      )}
    </>
  );
};


type OthersSectionProps = {
  selectedPatients: string[];
  togglePatientSelection: (id: string) => void;
  setSelectedPatients: React.Dispatch<React.SetStateAction<string[]>>;
}

const OthersSection = ({ selectedPatients, togglePatientSelection, setSelectedPatients }: OthersSectionProps) => {
  const { others, setOthers } = useAppointmentStore();
  const keyboard = useAnimatedKeyboard();

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState<string>();
  const [mobileCode, setMobileCode] = useState<string>('+65');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileNumberError, setMobileNumberError] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const showAddOtherModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFullName('');
    setMobileNumber('');
    setMobileNumberError(undefined);
    setFullNameError(undefined);
    setIsModalVisible(true);
  };

  const validateMobileNumber = (val: string) => {
    val = val.substring(0, 8);
    setMobileNumber(val);
    let error = undefined;
    // Ignore empty values
    if (val.length > 0 && !/^\d{8}$/.test(val)) {
      error = 'Please enter a valid phone number';
    }
    setMobileNumberError(error);
  };

  const validateFullName = (val: string) => {
    setFullName(val);
    let error = undefined;
    if (val.length > 0 && val.length < 2) {
      error = 'Name must be at least 2 characters';
    }
    setFullNameError(error);
  };

  const showEditOtherModal = (id: string) => {
    const personToEdit = others?.find(person => person.id === id);
    if (personToEdit) {
      setIsEditing(true);
      setEditingId(id);
      setFullName(personToEdit.name);
      // Extract mobile number without country code
      const mobileWithoutCode = personToEdit.mobileNumber.split(' ')[1] || '';
      setMobileNumber(mobileWithoutCode);
      setMobileCode(personToEdit.mobileNumber.split(' ')[0] || '+65');
      setMobileNumberError(undefined);
      setFullNameError(undefined);
      setIsModalVisible(true);
    }
  };

  const hideAddOtherModal = () => {
    setIsModalVisible(false);
    setFullName('');
    setMobileNumber('');
    setMobileNumberError(undefined);
    setFullNameError(undefined);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (fullName && mobileNumber && !mobileNumberError && !fullNameError) {
      // Update existing person
      if (isEditing && editingId) {
        setOthers(
          others?.map((person) =>
            person.id === editingId
              ? { ...person, name: fullName, mobileNumber: `${mobileCode} ${mobileNumber}` }
              : person
          ) || []
        );
        // Add new person
      } else {
        const newPerson = {
          id: `other_${Date.now()}`,
          name: fullName,
          mobileNumber: `${mobileCode} ${mobileNumber}`
        };
        setOthers([...(others || []), newPerson]);
      }
      hideAddOtherModal();
    }
  };

  const handleDelete = (id: string) => {
    setOthers(others?.filter((person) => person.id !== id) || []);
    setSelectedPatients((prev: string[]) => prev.filter(patientId => patientId !== id));
  };

  const disableSave = !fullName || !mobileNumber || mobileNumberError !== undefined || fullNameError !== undefined;

  return (
    <>
      <BoldText size={14} style={{ color: colors.weak, marginHorizontal: 12, marginBottom: 8 }}>Others</BoldText>
      {others && others.length > 0 && <Section title={<></>}>
        {/* Display the others with edit/delete icons */}
        {others.map((other) => (
          <SelectRow
            key={other.id}
            name={other.name}
            mobileNumber={other.mobileNumber}
            isSelected={selectedPatients.includes(other.id)}
            selectRow={() => togglePatientSelection(other.id)}
            editRow={() => showEditOtherModal(other.id)}
            deleteRow={() => handleDelete(other.id)}
          />
        ))}
      </Section>}
      <Button
        type="ghost"
        onPress={showAddOtherModal}
        style={styles.manageButton}
      >
        <View style={styles.addOthersContent}>
          <AntdMiniIcon name="AddOutline" size={16} color={colors.primary} />
          <BoldText size={18} style={{ color: colors.primary, marginLeft: 8 }}>Add others</BoldText>
        </View>
      </Button>


      <Modal
        popup
        visible={isModalVisible}
        animationType="slide-up"
        onClose={hideAddOtherModal}
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        maskClosable={true}
      >
        <Animated.View style={animatedStyles}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableHighlight
                underlayColor={colors.underlay}
                onPress={hideAddOtherModal}
                style={styles.closeButton}
              >
                <AntdMiniIcon name="CloseOutline" size={24} color={colors.primary} />
              </TouchableHighlight>
              <BoldText size={25} style={{ marginTop: 12 }}>{isEditing ? 'Edit person' : 'Add others'}</BoldText>
            </View>
            <Section title={<></>}>
              <Label label="Full Name" error={fullNameError}>
                <Input
                  autoFocus={true}
                  allowClear
                  // maxLength={9}
                  defaultValue={fullName}
                  status={fullNameError != null ? "error" : undefined}
                  onChangeText={(val) => validateFullName(val)}
                  placeholder="Enter here" />
              </Label>
              <Label label="Mobile Number" error={mobileNumberError}>
                <Input
                  prefix={<CountryCode mobileCode={mobileCode} />}
                  type="number"
                  maxLength={8}
                  defaultValue={mobileNumber}
                  status={mobileNumberError != null ? "error" : undefined}
                  onChangeText={(val) => validateMobileNumber(val)}
                  placeholder="Enter here" />
              </Label>
            </Section>
            <Height h={24} />
            <View style={{ backgroundColor: colors.brands4 }}>
              <View style={styles.modalFooter}>
                <TouchableHighlight
                  underlayColor={colors.underlay}
                  onPress={hideAddOtherModal}
                  style={styles.cancelButton}
                >
                  <BoldText size={17}>Cancel</BoldText>
                </TouchableHighlight>
                <TouchableHighlight
                  underlayColor={colors.underlay}
                  onPress={handleSave}
                  style={[styles.saveButton, disableSave && styles.disabledButton]}
                  disabled={disableSave}
                >
                  <BoldText size={17} style={{ color: 'white' }}>Save</BoldText>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </>
  )
}

const CorporatePatientTypeSection = ({ 
  patientSurveyOption,
  onPatientSurveyOptionChange,
  patientSurveyOptions
}: {
  patientSurveyOption?: string;
  onPatientSurveyOptionChange: (option: string) => void;
  patientSurveyOptions: string[];
}) => {
  return (
    <View style={{
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.brands4,
      marginTop: 0,
      margin: 16,
      borderRadius: 8,
    }}>
      <BoldText size={14} style={{ marginBottom: 12, color: colors.primary }}>Please select (Required)</BoldText>
      {patientSurveyOptions.map((option, i) => (
        <TouchableHighlight
          key={i}
          underlayColor={colors.underlay}
          onPress={() => onPatientSurveyOptionChange(option)}
          style={{ marginVertical: 4 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CCheckbox onChecked={() => onPatientSurveyOptionChange(option)} checked={patientSurveyOption === option} />
            <CText size={16} style={{ marginLeft: 12, flex: 1 }}>{option}</CText>
          </View>
        </TouchableHighlight>
      ))}
    </View>
  );
};

export default function PatientsSelectScreen() {
  const { maxPatients } = useLocalSearchParams();
  const maxPatientsInt = parseInt(maxPatients as string);
  const { corporateCode, patientSurvey, others, patients, setPatients, setPatientSurvey } = useAppointmentStore();
  const [selectedPatients, setSelectedPatients] = useState<string[]>(patients?.map(({ id }) => id) || []);
  const [patientSurveyOptions, setPatientSurveyOptions] = useState<Record<string, string>>(patientSurvey || {});

  const queryClient = useQueryClient();

  const qry = useQuery({
    queryKey: ['family'],
    queryFn: getFamilyApiFamilyListGet
  });

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['family'] })
    }, [])
  );

  const togglePatientSelection = (id: string) => {

    setSelectedPatients(prev => {
      // Check if patient is already selected
      if (prev.includes(id)) {
        return prev.filter(patientId => patientId !== id);
      }
      if (prev.length >= maxPatientsInt) {
        Alert.alert('Error', 'You can only select up to ' + maxPatientsInt + ' patients (including yourself). For more, please contact Pinnacle Clinic');
        return prev;
      }
      return [...prev, id];
    });
  };


  const handleDone = () => {
    // Validate corporate patient types if corporate code is active
    if (corporateCode && corporateCode.patientSurveyTemplate && corporateCode.patientSurveyTemplate.length > 0) {
      const selectedPatientsWithoutType = selectedPatients.filter(
        patientId => !patientSurveyOptions[patientId]
      );
      
      if (selectedPatientsWithoutType.length > 0) {
        Alert.alert('Error', 'Please select a corporate patient type for all selected patients');
        return;
      }
    }

    // Populate the patient information
    let patients = [];
    if (selectedPatients.includes('myself')) {
      patients.push({
        id: 'myself',
        name: 'Myself',
      });
    }

    qry.data?.forEach(patient => {
      if (selectedPatients.includes(patient.id)) {
        patients.push({
          id: patient.id,
          name: `${patient.name} (${patient.relation})`,
        });
      }
    });

    others?.forEach(patient => {
      if (selectedPatients.includes(patient.id)) {
        patients.push({
          id: patient.id,
          name: patient.name,
        });
      }
    });

    setPatients(patients);
    
    // Save corporate patient types if corporate code is active
    if (corporateCode) {
      setPatientSurvey(patientSurveyOptions);
    }

    // Handle the done action - save selected patients and navigate back
    router.back();
  };

  const action = (
    <Button
      type="primary"
      onPress={handleDone}
      style={styles.doneButton}
      disabled={selectedPatients.length === 0}
    >
      <BoldText size={17} style={{ color: 'white' }}>Done</BoldText>
    </Button>
  )

  return (
    <KeyboardView
      navBack={router.back}
      header={<NavHeader3 navBack={router.back} />}
      action={action}
      scrollOverflow='hidden'
    >
      <View>
        <H1Text>Select Patients ({selectedPatients.length})</H1Text>
        <MText size={14} style={{ marginHorizontal: 12 }}>
          You can only select up to {maxPatientsInt} patients (including yourself). For more, please contact Pinnacle Clinic
          {' '}<MText onPress={() => Linking.openURL('tel:62351852')} style={{ ...antd.boldText, color: colors.primary, textDecorationLine: 'none' }}>here</MText>
        </MText>
      </View>

      <Height h={16} />

      <ReactQueryChild query={qry}>
        <Section title={<BoldText size={14} style={{ color: colors.weak, marginHorizontal: 12, marginBottom: 8 }}>Families</BoldText>}>
          {/* Family members */}
          {[
            <SelectRow
              key="myself"
              name="Myself"
              isSelected={selectedPatients.includes('myself')}
              selectRow={() => togglePatientSelection('myself')}
              patientSurveyOptions={corporateCode?.patientSurveyTemplate ?? undefined}
              patientSurveyOption={patientSurveyOptions['myself']}
              onPatientSurveyOptionChange={(option) => setPatientSurveyOptions(prev => ({ ...prev, 'myself': option }))}
            />,
            ...(qry.data || []).map((member: FamilyMember) => (
              <SelectRow
                key={member.id}
                name={member.name}
                relation={member.relation}
                isSelected={selectedPatients.includes(member.id)}
                selectRow={() => togglePatientSelection(member.id)}
                patientSurveyOptions={corporateCode?.patientSurveyTemplate ?? undefined}
                patientSurveyOption={patientSurveyOptions[member.id]}
                onPatientSurveyOptionChange={(option) => setPatientSurveyOptions(prev => ({ ...prev, [member.id]: option }))}
              />
            ))
          ]}

        </Section>
      </ReactQueryChild>
      <Button
        type="ghost"
        onPress={() => router.navigate('/family')}
        style={styles.manageButton}
      >
        <BoldText size={18} style={{ color: colors.primary }}>Manage Family Members</BoldText>
      </Button>
      <Height h={16} />
      {
        !corporateCode && <OthersSection selectedPatients={selectedPatients} togglePatientSelection={togglePatientSelection} setSelectedPatients={setSelectedPatients} />
      }
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    padding: 12,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  patientName: {
    marginLeft: 12,
    flexShrink: 1,
  },
  patientInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  mobileNumber: {
    color: colors.weak,
    marginLeft: 12,
    marginTop: 4,
  },
  manageButton: {
    margin: 12,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
  },
  addOthersButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
  },
  addOthersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonContainer: {
    padding: 12,
    marginTop: 'auto',
  },
  doneButton: {
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  modalContent: {
    padding: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    color: colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
    marginBottom: 16,
  },
  countryCode: {
    padding: 12,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
    minWidth: 48,
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    backgroundColor: colors.brands4,
    flexDirection: 'row',
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: colors.weak || '#cccccc',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 4,
  },
});