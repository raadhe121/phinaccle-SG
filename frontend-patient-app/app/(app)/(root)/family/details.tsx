import { idLabel } from "@/apis/auth";
import { BoldText, CText, FormDatePicker, FormPicker, GRButton2, HeaderTitleTag, Height, Label, ReactQueryChild, ScrollbarPadding, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { getFamilyDetailsApiFamilyDetailsIdGet, removeFamilyMemberApiFamilyRemoveIdDelete } from "@/services/client";
import { Button, Input } from "@ant-design/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { UpdateProfileBanner } from "../profile/details";
import { modal, toast } from "@/common/utils/modal";
import { onError } from "@/common/utils/lib";

export default function FamilyDetailsScreen() {
    const { id, name } = useLocalSearchParams();

    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['family', id],
        queryFn: ({ queryKey }) => getFamilyDetailsApiFamilyDetailsIdGet({ id: queryKey[1] as string })
    })

    const removeMutation = useMutation({
        mutationFn: removeFamilyMemberApiFamilyRemoveIdDelete,
        onSuccess: () => {
            toast.success('Family member removed');
            queryClient.invalidateQueries({ queryKey: ['family'] });
            router.back();
        },
        onError
    })
    

    const onRemove = () => {
        modal.warn({
            title: 'Confirm remove family member?', 
            labels: [
                <CText size={18} style={{ color: colors.primary }}>Cancel</CText>,
                <BoldText size={18} style={{ color: colors.danger }}>Yes, Remove</BoldText>
            ],
            onCancel: () => {}, 
            onOk: () => removeMutation.mutate({ id: id as string })
        })
    }

    const action = <Button
        type='primary'
        style={{ backgroundColor: colors.danger, borderWidth: 0 }}
        activeStyle={{ backgroundColor: colors.danger + '5F'}}
        onPress={onRemove}
        >
        <BoldText size={18} style={{ color: 'white'}}>Remove From My Family</BoldText>
    </Button>

    return <KeyboardView
        // edges={[]}
        action={action}
        navBack={router.back}
        title={<HeaderTitleTag tag='My Family' title={name as string} />}
        >
            <ReactQueryChild query={qry}>
                { qry.data && (
                    <Section title={<UpdateProfileBanner />} bottom={12}>
                        <Label label='ID Type' wrap={false}>
                            <FormPicker value={[qry.data.id_type]} disabled />
                        </Label>
                        <Label label={idLabel[qry.data.id_type] ?? 'ID No.'}>
                            <Input value={qry.data.nric} disabled style={{ color: colors.light}} />
                        </Label>
                        <Label label='Date of Birth' wrap={false}>
                            <FormDatePicker value={qry.data.date_of_birth} disabled />
                        </Label>
        
                        <Label label='Relation' wrap={false}>
                            <FormPicker value={[qry.data.relation]} disabled />
                        </Label>

                        <Label label='Full Name'>
                            <Input value={qry.data.name} disabled style={{ color: colors.light}} />
                        </Label>
                    
        
                        <Label label='Gender' wrap={false}>
                            <FormPicker value={[qry.data.gender]} disabled />
                        </Label>
                    
        
                        <Label label='Nationality' wrap={false}>
                            <FormPicker value={[qry.data.nationality]} disabled />
                        </Label>
                    
        
                        <Label label='Language spoken' wrap={false}>
                            <FormPicker value={[qry.data.language]} disabled />
                        </Label>
                    

                        <Label label='Mobile Code' wrap={false}>
                            <FormPicker value={[qry.data.secondary_mobile_code]} disabled />
                        </Label>

        
                        <Label label='Mobile Number'>
                            <Input value={qry.data.secondary_mobile_number} disabled style={{ color: colors.light }} />
                        </Label>
                    </Section>
                )}
            </ReactQueryChild>
        </KeyboardView>
}