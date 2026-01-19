import { CText, Height, ReactQueryChild, ScrollbarPadding, Section, TitleText } from "@/common/components/AntdText";
import SupportScreen from "./layout";
import { useQuery } from "@tanstack/react-query";
import { privacyPolicyApiSupportPrivacyPolicyGet } from "@/services/client";
import { FlatList, ScrollView } from "react-native";

export default function PrivacyScreen() {
    const rq = useQuery({
        queryKey: ['privacyPolicy'],
        queryFn: privacyPolicyApiSupportPrivacyPolicyGet,
    });

    // There is a bug where the text is wrapping and causing Android ScrollView to be stuck midway.
    return <SupportScreen title="Privacy Policy" wrapScroll={false}>
        <ScrollView style={{ marginTop: -100, paddingTop: 100 }}>
            <ReactQueryChild query={rq}>
                {
                    rq.data && rq.data.map((item) => <Section key={item.title} title={<TitleText>{item.title}</TitleText>}>
                        <CText size={13} style={{ margin: 12, textAlign: 'justify' }}>{item.content}</CText>
                        </Section>
                    )
                }
                <ScrollbarPadding />
            </ReactQueryChild>
            <Height h={100} />
        </ScrollView>
    </SupportScreen>
}