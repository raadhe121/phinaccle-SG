import { BoldText, CText, EmptySection, Height, ListItem, ReactQueryChild, ScrollbarPadding, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { getFamilyApiFamilyListGet } from "@/services/client";
import { Button } from "@ant-design/react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

export default function FamilyScreen() {
    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['family'],
        queryFn: getFamilyApiFamilyListGet
    })

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['family'] })
        }, [])
    )

    return <KeyboardView
        edges={[]} 
        navBack={router.back}
        title="My Family"
        >
        <Height h={24} />
        <ReactQueryChild query={qry}>
            { qry.data?.length == 0 && <EmptySection /> }
            { qry.data?.length != 0 && <Section title={<></>}>
                {
                    qry.data?.map((p) => (
                        <ListItem
                            key={p.id}
                            onPress={() => router.navigate({ pathname: '/family/details', params: { id: p.id, name: p.name } })}
                            arrow="horizontal"
                            divider={false}
                            >
                            <View>
                                <BoldText size={14} style={{ color: colors.brands2 }}>{p.relation}</BoldText>
                                <CText size={17} style={{ flexShrink: 1, marginTop: 4 }}>{p.name}</CText>
                            </View>

                        </ListItem>
                    ))
                }
            </Section>}
        </ReactQueryChild>
        
        <Button
            type="primary"
            onPress={() => router.navigate('/family/create')}
            style={{ margin: 12 }}
            >
            <BoldText size={17} style={{ color: 'white' }}>Add New +</BoldText>
        </Button>
        <ScrollbarPadding />
    </KeyboardView>
}