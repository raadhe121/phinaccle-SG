import { CText, Height, ReactQueryChild, Section, TitleText } from "@/common/components/AntdText";
import SupportScreen from "./layout";
import { useQuery } from "@tanstack/react-query";
import { aboutUsApiSupportAboutUsGet } from "@/services/client";

export default function AboutUsScreen() {
    const rq = useQuery({
        queryKey: ['aboutUs'],
        queryFn: aboutUsApiSupportAboutUsGet,
    })

    return <SupportScreen title='About Us'>
        <ReactQueryChild query={rq}>
            {
                rq.data && rq.data.map((item, index) => (
                    <Section key={index} title={item.title ? <TitleText style={{ marginTop: 20 }}>{item.title}</TitleText> : <Height h={12} />}>
                        <CText size={13} style={{ margin: 12, lineHeight: 19 }}>
                            {item.content}
                        </CText>
                    </Section>
                ))
            }
        </ReactQueryChild>
    </SupportScreen>
}