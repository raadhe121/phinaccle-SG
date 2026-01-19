import { HeaderTitleTag, ScrollbarPadding } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { router } from "expo-router";

export default function SupportScreen({ title, children, wrapScroll = true }: { title: string, children: React.ReactNode | React.ReactNode[], wrapScroll?: boolean }) {
    return <KeyboardView
        edges={[]} 
        navBack={router.back}
        title={<HeaderTitleTag tag='Support' title={title} />}
        wrapScroll={wrapScroll}
        >
        {children}
        {wrapScroll && <ScrollbarPadding />}
    </KeyboardView>
}