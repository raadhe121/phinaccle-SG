import KeyboardView from "@/common/components/KeyboardView";
import { router } from "expo-router";
import { DocumentsList } from "../list";

export default function HealthReportListScreen() {
    return (
        <KeyboardView 
            edges={[]}     
            title='Health Reports'
            navBack={router.back}
            wrapScroll={false}
            >
            <DocumentsList type='Health Report' />
        </KeyboardView>
    )
}