import React, { useState, useMemo } from 'react';
import { Redirect, router } from 'expo-router';
import {
  View,
  useWindowDimensions,
  ScrollView,
  ImageBackground,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Button, Input } from '@ant-design/react-native';
import { colors } from '@/common/utils/config';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { BoldText, CCheckbox, CText, FormPicker, Height, Label, ListItemView, Section } from '@/common/components/AntdText';
import { idLabel, idTypes, idValidators, loginApi } from '@/apis/auth';
import { modal } from '@/common/utils/modal';
import dayjs from 'dayjs';
import Svg, { Path, SvgProps } from 'react-native-svg';
import { bgImages } from '@/common/components/AntdMiniIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SGiMedICType } from '@/services/client';
import { COUNTRIES, Country } from '@/common/countrylisting';
import { isValidMobileNumber } from '@/apis/user';
import { localStorageNotificationsOptInKey, setItem } from '@/common/utils/async_storage';

export type { Country };

// --- Searchable Country Picker Modal ---
interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  selectedCountry: Country;
}

export const CountryPickerModal = ({
  visible,
  onClose,
  onSelect,
  selectedCountry,
}: CountryPickerModalProps) => {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const term = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.dialCode.includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHeader}>
            <CText size={18} style={{ fontWeight: '600' }}>Select Country</CText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CText size={16} style={{ color: colors.action }}>Close</CText>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, marginVertical: 8 }}>
            <Input
              placeholder="Search country or code..."
              value={search}
              onChangeText={setSearch}
              allowClear
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCountry.code;
              return (
                <TouchableOpacity
                  style={[styles.countryItem, isSelected && styles.selectedItem]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                    setSearch('');
                  }}
                >
                  <CText size={20} style={{ marginRight: 12 }}>{item.flag}</CText>
                  <CText size={15} style={{ flex: 1, fontWeight: isSelected ? '600' : '400' }}>
                    {item.name}
                  </CText>
                  <CText size={15} style={{ color: '#666', fontWeight: isSelected ? '600' : '400' }}>
                    {item.dialCode}
                  </CText>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

// --- Country Selector Trigger ---
export const CountrySelector = ({
  country,
  onPress,
}: {
  country: Country;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: colors.light,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 6,
      }}
    >
      <CText size={14} style={{ marginRight: 4 }}>{country.flag}</CText>
      <CText size={13} style={{ fontWeight: '500' }}>{country.dialCode}</CText>
      <CText size={10} style={{ marginLeft: 2, color: '#666' }}>▼</CText>
    </TouchableOpacity>
  );
};

export function ArcComponent(props: SvgProps) {
  return (
    <View style={{ width: '100%', aspectRatio: 393 / 58 }}>
      <Svg width="100%" height="100%" viewBox="0 0 393 58" {...props}>
        <Path d="M0 58V58C119.898 -18.2712 273.102 -18.2712 393 58V58H232H145.5H0Z" fill={colors.action} />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, setLoginParams } = useSession();

  const [isLoading, setIsLoading] = useState(false);

  // Country code modal state
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default Singapore

  const [idType, setIdType] = useState<SGiMedICType>(idTypes[0]);
  const [idNumber, setIdNumber] = useState<string>('');
  const [idNumberError, setIdNumberError] = useState<string>();
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [mobileNumberError, setMobileNumberError] = useState<string>();
  const [notificationsOptIn, setNotificationsOptIn] = useState(true);

  const toggleNotificationsOptIn = () => {
    setNotificationsOptIn((prev) => {
      const next = !prev;
      setItem(localStorageNotificationsOptInKey, next);
      return next;
    });
  };

  const validateIdNumber = (type: SGiMedICType, val: string) => {
    const upperVal = val.toUpperCase();
    setIdNumber(upperVal);
    let error: string | undefined = undefined;

    if (upperVal.length > 0 && !idValidators[type].test(upperVal)) {
      error = 'Please enter a valid ' + (idLabel[type] ?? 'ID No.');
    }

    if (['PINK IC', 'BLUE IC'].includes(type) && upperVal.length >= 3 && upperVal.startsWith('T')) {
      const currYear = dayjs().year();
      const yearPart = parseInt(upperVal.substring(1, 3), 10);
      const age = currYear - (2000 + yearPart);

      if (age < 12) {
        error = 'You must be at least 12 years old';
      }
    }

    setIdNumberError(error);
  };

  const validateMobileNumber = (val: string, country: Country) => {
    const cleanVal = val.replace(/\D/g, '').substring(0, country.maxLength);
    setMobileNumber(cleanVal);
    let error: string | undefined = undefined;

    // Same rule the backend applies, so the server can never disagree with this screen
    if (cleanVal.length > 0 && !isValidMobileNumber(country.dialCode, cleanVal)) {
      error =
        country.code === 'SG'
          ? 'Please enter a valid Singapore phone number'
          : 'Please enter a valid phone number, without the leading 0';
    }
    setMobileNumberError(error);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    // Re-validate current phone input against new country rule
    validateMobileNumber(mobileNumber, country);
  };

  const onButtonPress = async () => {
    if (!idNumber || !mobileNumber || idNumberError || mobileNumberError) return;

    setIsLoading(true);
    const resp = await loginApi(
      { idType, idNumber, mobileCode: selectedCountry.dialCode, mobileNumber },
      (status, msg) => {
        if (msg.code === 'invalid_login') {
          modal.warn({
            title: msg.title,
            content: msg.message,
            labels: ['Try Again', ''],
            onCancel: () => console.log('Cancel'),
          });
        } else {
          modal.error({
            title: msg.title ?? 'Unknown Error',
            content: msg.message ?? 'Please contact an administrator',
            labels: ['Try Again', ''],
            onCancel: () => console.log('Cancel'),
          });
        }
      }
    );

    if (resp) {
      setLoginParams({
        idType,
        idNumber,
        mobileCode: selectedCountry.dialCode,
        mobileNumber,
        sessionId: resp.session_id,
        otpExpiresAt: dayjs(resp.otp_expires_at),
      });
      router.navigate('/otp');
      setMobileNumber('');
    }
    setIsLoading(false);
  };

  const disableSubmit =
    idNumberError != null || mobileNumberError != null || !idNumber || !mobileNumber;

  if (user) {
    return <Redirect href="/" />;
  }

  const action = (
    <Button
      onPress={onButtonPress}
      disabled={disableSubmit || isLoading}
      loading={isLoading}
      type="primary"
    >
      Continue
    </Button>
  );

  return (
    <ImageBackground style={{ flex: 1 }} source={bgImages.SplashScreen.uri} resizeMode="cover">
      <KeyboardView action={action} hasKeyboard={false} wrapScroll={false} safeAreaBgColor="transparent">
        <ScrollView
          overScrollMode="never"
          bounces={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
          keyboardShouldPersistTaps="handled"
        >
          <Height h={insets.top} />

          <View style={{ marginBottom: -1 }}>
            <ArcComponent />
            <View style={{ backgroundColor: colors.action }}>
              <View style={{ width: '100%', backgroundColor: colors.action, alignItems: 'center' }}>
                <Image
                  source={bgImages.HeaderLogo.uri}
                  resizeMode="contain"
                  style={{
                    margin: 12,
                    width: width * 0.65,
                    height: (width * 0.65) * bgImages.HeaderLogo.height / bgImages.HeaderLogo.width,
                  }}
                />
              </View>
              <Section title="Login / Sign Up">
                <Label label="ID Type" wrap={false}>
                  <FormPicker
                    data={idTypes.map((v) => ({ label: v, value: v }))}
                    value={[idType]}
                    onChange={(val) => {
                      setIdType(val[0] as SGiMedICType);
                      validateIdNumber(val[0] as SGiMedICType, idNumber);
                    }}
                    placeholder="Select ID Type"
                  />
                </Label>
                <Label label={idLabel[idType] ?? 'ID No.'} error={idNumberError}>
                  <Input
                    allowClear
                    value={idNumber}
                    status={idNumberError != null ? 'error' : undefined}
                    onChangeText={(val) => validateIdNumber(idType, val)}
                    placeholder="Enter here"
                  />
                </Label>
                <Label label="Mobile Number" error={mobileNumberError}>
                  <Input
                    prefix={
                      <CountrySelector
                        country={selectedCountry}
                        onPress={() => setIsCountryModalOpen(true)}
                      />
                    }
                    type="number"
                    maxLength={selectedCountry.maxLength}
                    value={mobileNumber}
                    status={mobileNumberError != null ? 'error' : undefined}
                    onChangeText={(val) => validateMobileNumber(val, selectedCountry)}
                    placeholder="Enter here"
                  />
                </Label>
               
              </Section>
              <View style={{ height: 12 }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardView>

      {/* Searchable Modal Selection */}
      <CountryPickerModal
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={handleCountrySelect}
        selectedCountry={selectedCountry}
      />
    </ImageBackground>
  );
}

// Display-only country code chip. Kept with this exact signature because
// app/(app)/(root)/appointment/selection/patients.tsx imports it.
export const CountryCode = ({ mobileCode }: { mobileCode: string }) => {
  return (
    <View style={{ borderColor: colors.light, borderWidth: 1, borderRadius: 4 }}>
      <CText size={13} style={{ margin: 4 }}>{mobileCode}</CText>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeBtn: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f5f5f5',
  },
});
