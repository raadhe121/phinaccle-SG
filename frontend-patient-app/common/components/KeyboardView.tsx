import { colors } from "@/common/utils/config";
import { StyleSheet, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, View, ScrollView, Platform } from "react-native";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineHeader from "./OfflineHeader";
import { CNavHeader, Height } from "./AntdText";

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'space-between',// 'flex-end',
    },
    content: {
        backgroundColor: 'white',
    }
});

type KeyboardViewProps = {
    header?: React.ReactNode,
    title?: string | React.ReactNode,
    showLogo?: boolean,
    wrapScroll?: boolean,
    scrollOverflow?: 'scroll' | 'visible' | 'hidden',
    top?: number,
    bottom?: number,
    children: React.ReactNode,
    background?: string,
    safeAreaBgColor?: string,
    navBack?: () => void,
    action?: React.ReactNode,
    edges?: Edge[],
    hasKeyboard?: boolean,
}

export default function KeyboardView(
    { header, title, showLogo, wrapScroll = true, scrollOverflow = 'visible', top, bottom, children, background, safeAreaBgColor = 'white', navBack, action, edges = ['bottom'], hasKeyboard = false }: KeyboardViewProps
) {
    const insets = useSafeAreaInsets();

    if (action) {
        background = colors.action;
    }

    const content = (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            // keyboardVerticalOffset={0}
            style={{
                ...styles.background,
                // paddingTop: top ?? insets.top,
                backgroundColor: '#00000000',
                // marginBottom: bottom ?? insets.bottom
            }}>
            { header }
            { !header && title && <CNavHeader title={title} showLogo={showLogo} navBack={navBack} /> }
            <OfflineHeader />
            {
                wrapScroll
                    ? <ScrollView style={{ overflow: scrollOverflow }} keyboardShouldPersistTaps="handled">
                        {children}
                    </ScrollView>
                    : children
            }
            {
                action && <View style={{ backgroundColor: colors.action }}>
                    <View style={{ margin: 12, marginTop: 24, marginBottom: 24 }}>
                        {action}
                    </View>
                </View>
            }
        </KeyboardAvoidingView>
    );

    return <>
        {/* <SafeAreaView
            edges={["top"]}
            style={{ flex: 0, backgroundColor: "white" }}
            /> */}
        <SafeAreaView edges={[]} style={[styles.background, { backgroundColor: safeAreaBgColor }]}>
            {
                // When TouchableWithoutFeedback is used, ScrollView cannot be used
                hasKeyboard
                    ? <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>{content}</TouchableWithoutFeedback>
                    : content
            }
            {edges.includes('bottom') && <Height h={insets.bottom} style={{ backgroundColor: background ?? 'white' }} />}
        </SafeAreaView>
    </>
}