import {
  BoldText,
  CCheckbox,
  CText,
  Height,
  ListItemView,
  Section,
  TitleText,
  TextLink
} from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { Button, Modal } from "@ant-design/react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { TouchableHighlight, View, Text } from "react-native";

import { colors } from "@/common/utils/config";
import {
  langOrder,
  teleconsultTranslations,
  clinics,
} from "@/apis/teleconsult";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const t = (key: string, locale: string) => {
  // @ts-ignore
  return teleconsultTranslations[locale][key] || key;
};

export default function TeleconsultScreen() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<string>("en");
  const [tncChecked, setTncChecked] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const nextScreen = () => {
    router.navigate("/teleconsult/payment");
  };

  const action = (
    <Button onPress={nextScreen} type="primary" disabled={!tncChecked}>
      {t("continue", language)}
    </Button>
  );

  return (
    <KeyboardView
      action={action}
      navBack={() => router.back()}
      title="Book Telemedicine"
    >
      <CText size={16} style={{ marginHorizontal: 12, marginTop: 12 }}>
        Pinnacle Family Clinic* is a Ministry of Health (MOH) licensed provider
        of telemedicine services.
      </CText>
      <Section title="Select Language">
        {langOrder.map((key) => (
          <ListItemView
            key={key}
            extra={key == language && <Ionicons name="checkmark" size={24} />}
            onPress={() => setLanguage(key)}
          >
            {teleconsultTranslations[key].telemedicine}
          </ListItemView>
        ))}
      </Section>
      <View style={{ height: 12 }}></View>
      <Section title="Terms & Conditions">
        <View style={{ margin: 12 }}>
          <BoldText size={13}>Please note :{"\n"}</BoldText>
          <CText size={13} style={{ lineHeight: 20 }}>
            {t("tnc_notes", language)}
            {'\n\n'}
            <CText
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              onPress={() => setShowInfoModal(true)}
            >
              {t("tnc_providers", language)}
              {/* List of Providers */}
            </CText>
            {'\n\n'}
            {t("tnc_assistance", language)}
            {/* For assistance, please call Pinnacle Family Clinic at */}
            <TextLink href="tel:62351852">62351852</TextLink>
            {t("tnc_email", language)}
            {/* or email */}
            <TextLink href="mailto:connect@pinnaclefamilyclinic.com.sg">connect@pinnaclefamilyclinic.com.sg</TextLink>
          </CText>
        </View>
        <View style={{ margin: 12 }}>
          <BoldText size={13}>Disclaimer :{"\n"}</BoldText>
          <CText size={13} style={{ lineHeight: 20 }}>
            {t("tnc_disclaimer", language)}
          </CText>
        </View>
        <TouchableHighlight
          underlayColor={colors.underlay}
          onPress={() => setTncChecked(!tncChecked)}
        >
          <ListItemView thumb={<CCheckbox checked={tncChecked} />}>
            <BoldText style={{ marginLeft: 8 }}>{t("tnc_agree", language)}</BoldText>
          </ListItemView>
        </TouchableHighlight>
      </Section>
      <Height h={12} />
      {/* Modal to display Important Information */}
      <Modal
        popup
        visible={showInfoModal}
        animationType="slide-up"
        style={{
          paddingBottom: 12 + insets.bottom,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        onClose={() => setShowInfoModal(false)}
      >
        <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
          <TitleText style={{ textAlign: "center" }}>
            List of Providers
          </TitleText>
          <Text>{clinics}</Text>
        </View>
        <Button
          style={{ margin: 12 }}
          type="primary"
          onPress={() => setShowInfoModal(false)}
        >
          Close
        </Button>
      </Modal>
    </KeyboardView>
  );
}
