import { supportIcon } from "@/common/components/AntdMiniIcon";
import { H1Text, MenuItem, Row, Section, TabBarPadding } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { router } from "expo-router";
import { View } from 'react-native';
import { Image } from 'expo-image'

export default function SupportScreen() {
    return <KeyboardView edges={[]} 
        showLogo={true}
        title={
            <Row style={{ margin: 12 }}>
                <H1Text style={{ margin: 0, marginTop: 0, marginRight: 8 }}>Support</H1Text>
                <Image source={supportIcon} resizeMode="contain" style={{ width: 32, height: 32 }} />
            </Row>
        }
        >
        <Section title={<View style={{ height: 12 }}></View>}>
            <MenuItem icon="InformationCircleOutline" onPress={() => router.navigate('/support/about_us')}>
                About Us
            </MenuItem>
            <MenuItem icon="LocationOutline" onPress={() => router.navigate('/support/locations')}>
                Clinic Locations
            </MenuItem>
            <MenuItem icon="PhonebookOutline" onPress={() => router.navigate('/support/contact')}>
                Contact Us / Feedback
            </MenuItem>
            <MenuItem icon="QuestionCircleOutline" onPress={() => router.navigate('/support/faq')}>
                FAQ
            </MenuItem>
            <MenuItem icon="CheckShieldOutline" onPress={() => router.navigate('/support/privacy')}>
                Privacy Policy
            </MenuItem>
        </Section>
        <TabBarPadding />
    </KeyboardView>
}