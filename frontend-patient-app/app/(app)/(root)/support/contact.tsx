import { CText, Section, TextLink, TitleText } from "@/common/components/AntdText";
import SupportScreen from "./layout";

export default function ContactScreen() {
    return <SupportScreen title='Contact Us / Feedback'>
        <Section title={<TitleText>24/7 Hotline</TitleText>}>
            <CText size={13} style={{ margin: 12 }}>
                24/7 Hotline: <TextLink href="tel:62351852" size={13}>6235 1852</TextLink>
            </CText>
        </Section>
        <Section title={<TitleText>Email Us</TitleText>}>
            <CText size={13} style={{ margin: 12 }}>
                <TextLink href="mailto:connect@pinnaclefamilyclinic.com.sg" size={13}>connect@pinnaclefamilyclinic.com.sg</TextLink>
            </CText>
        </Section>
    </SupportScreen>
}