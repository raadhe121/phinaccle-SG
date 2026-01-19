import { AnimatedSectionList, BoldText, CMarkdown, Height, MenuItem, ReactQueryChild, TitleText } from "@/common/components/AntdText";
import SupportScreen from "./layout";
import { LayoutAnimation, View } from 'react-native';
import { useState } from "react";
import { Modal } from "@ant-design/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { faqV2ApiSupportV2FaqGet, FaqV2ApiSupportV2FaqGetResponse } from "@/services/client";

type QA = {
    Q: string;
    A: string;
}

export default function FaqScreen() {
    const insets = useSafeAreaInsets();
    const [ modalVisible, setModalVisible ] = useState(false);
    const [ selectedFaq, setSelectedFaq ] = useState<QA>();
    const [ expanded, setExpanded ] = useState<string>();
    
    const rq = useQuery({
        queryKey: ['faq'],
        queryFn: faqV2ApiSupportV2FaqGet,
    })

    const renderItems = (data: FaqV2ApiSupportV2FaqGetResponse) => {
        const childs = [];

        for (let section of data) {
            childs.push(
                <MenuItem 
                    key={section.title}
                    arrow={ expanded == section.title ? 'down' : 'horizontal'}
                    onPress={() => toggleLayout(section.title)}>
                    <BoldText>{section.title}</BoldText>
                </MenuItem>
            );
            for (let qa of JSON.parse(section.content)) {
                if (expanded !== section.title) {
                    childs.push(false);
                } else {
                    childs.push(
                        <MenuItem
                            key={qa.Q}
                            arrow=''
                            onPress={() => {
                                // showFaqContent(qa);
                                setSelectedFaq(qa);
                                setModalVisible(true);
                            }}>{qa.Q}</MenuItem>
                    );
                }
            }
        }
        return childs
    }

    const toggleLayout = (item: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => prev == item ? undefined : item);
    }

    return <SupportScreen title="FAQ">
        <ReactQueryChild query={rq}>
            {
                rq.data && 
                <AnimatedSectionList title={<Height h={12} />}>
                    {renderItems(rq.data)}
                </AnimatedSectionList>
            }
        </ReactQueryChild>
        <Modal
            popup
            visible={modalVisible}
            animationType="slide-up"
            style={{ paddingBottom: 12 + insets.bottom, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            onClose={() => setModalVisible(false)}
            maskClosable={true}
            >
            <View style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <TitleText>{selectedFaq?.['Q']}</TitleText>
                <View style={{ marginLeft: 12, marginRight: 12 }}>
                    <CMarkdown size={14}>{selectedFaq?.A.replaceAll('\n\n', '\n\n[]()\n')}</CMarkdown>
                </View>
            </View>
        </Modal>
    </SupportScreen>
}