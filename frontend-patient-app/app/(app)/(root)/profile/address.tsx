import { BoldText, CCheckbox, HeaderTitleTag, Height, Label, ListItemView, Section, TitleText } from "@/common/components/AntdText";
import KeyboardView from '@/common/components/KeyboardView';
import { Button, Input, Toast } from "@ant-design/react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableHighlight } from "react-native";
import { colors } from "@/common/utils/config";
import { AddressParams, ApiError, fetchAddressApiUserAddressGet, updateAddressApiUserAddressPost } from "@/services/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AddressScreen() {
    const queryClient = useQueryClient();
    const [ currVals, setCurrVals ] = useState<AddressParams>();
    const [ postal, setPostal ] = useState<string>();
    const [ address, setAddress ] = useState<string>();
    const [ unit, setUnit ] = useState<string>();
    const [ building, setBuilding ] = useState<string>();
    
    const [ sameAddress, setSameAddress ] = useState(true);
    const [ residentialPostal, setResidentialPostal ] = useState<string>();
    const [ residentialAddress, setResidentialAddress ] = useState<string>();
    const [ residentialUnit, setResidentialUnit ] = useState<string>();
    const [ residentialBuilding, setResidentialBuilding ] = useState<string>();

    // Field Validation
    const [ errors, setErrors ] = useState<AddressParams>({});
    const [ submitPressedOnce, setSubmitPressedOnce ] = useState(false); // This is to only show errors after the first submit

    const qry = useQuery({
        queryKey: ['profile', 'address'],
        queryFn: fetchAddressApiUserAddressGet
    })

    const updateMutation = useMutation({
        mutationFn: updateAddressApiUserAddressPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'address'] });
            Toast.success({
                content: 'Address updated',
                duration: 0.5,
                stackable: false,
            })
            router.back()
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            })
        }
    })

    useEffect(() => {
        if (!qry.data) return;
        const d = qry.data;

        if (d) setCurrVals(d);
        if (d.postal) setPostal(d.postal);
        if (d.address) setAddress(d.address);
        if (d.unit) setUnit(d.unit);
        if (d.building) setBuilding(d.building);
        
        if (d.residential_postal) setResidentialPostal(d.residential_postal);
        if (d.residential_address) setResidentialAddress(d.residential_address);
        if (d.residential_unit) setResidentialUnit(d.residential_unit);
        if (d.residential_building) setResidentialBuilding(d.residential_building);
        setSameAddress(d.residential_postal == null && d.residential_address == null && d.residential_unit == null && d.residential_building == null);

    }, [qry.data])


    // useEffect(() => {
    //     const close = toast.loading();
    //     const fetchAddress = async () => {
    //         const resp = await fetchAddressApi(defaultOnError);
    //         if (resp) {
    //             setCurrVals(resp);
    //             setPostal(resp.postal);
    //             setAddress(resp.address);
    //             setUnit(resp.unit);
    //             setBuilding(resp.building);
    //         }
    //         close();
    //     }
    //     fetchAddress();
    // }, [])

    const validateRecords = () => {
        let errors: AddressParams = {};
        if (!postal) errors.postal = 'Postal code is required';
        if (postal && postal?.length !== 6) errors.postal = 'Postal code is invalid';
        if (!address) errors.address = 'Street address is required';
        
        if (!sameAddress) {
            if (!residentialAddress) errors.residential_address = 'Street address is required';
            if (!residentialPostal) errors.residential_postal = 'Postal code is required';
            if (residentialPostal && residentialPostal?.length !== 6) errors.residential_postal = 'Postal code is invalid';
        }
        
        setErrors(errors);
        console.log(errors);
        return Object.keys(errors).length === 0;
    }
    useEffect(() => {
        if (submitPressedOnce) {
            validateRecords();
        }
    }, [ postal, address, unit, building, residentialPostal, residentialAddress, residentialUnit, residentialBuilding, sameAddress ]);
    
    const saveAddress = async () => {
        setSubmitPressedOnce(true);        
        if (!validateRecords()) {
            Toast.fail({
                content: 'Please fix the errors above',
                duration: 1,
                stackable: true,
            })
            return;
        }
        
        updateMutation.mutate({
            requestBody: {
                postal: postal!,
                address: address!,
                unit,
                building,
                residential_postal: sameAddress ? null : residentialPostal,
                residential_address: sameAddress ? null : residentialAddress,
                residential_unit: sameAddress ? null : residentialUnit,
                residential_building: sameAddress ? null : residentialBuilding,
            }
        })
    }

    const updatePostalCode = (postalCode: string) => {
        setPostal(postalCode.substring(0, 6));
    }

    const disabled = Object.keys(errors).length > 0 || updateMutation.isPending;
    const action = <Button type="primary" onPress={saveAddress} disabled={disabled} loading={updateMutation.isPending}>
            Update
        </Button>

    return <KeyboardView
        action={action}
        navBack={() => router.back()}
        title={<HeaderTitleTag tag='My Profile' title='Address' />}
        >
            <Section title={<TitleText style={{ marginTop: 24 }}>Delivery Address</TitleText>}>
                <Label label="Street Address" error={errors?.address}>
                    <Input
                        allowClear
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Unit No. (if any)" error={errors?.unit}>
                    <Input
                        allowClear
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Building Name (if any)" error={errors?.building}>
                    <Input
                        allowClear
                        value={building}
                        onChangeText={setBuilding}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Postal Code" error={errors?.postal}>
                    <Input
                        allowClear
                        type="number"
                        maxLength={6}
                        value={postal}
                        onChangeText={updatePostalCode}
                        placeholder="Enter here"
                        />
                </Label>
            </Section>

            {sameAddress && <Section title={<TitleText style={{ marginTop: 24 }}>Residential Address</TitleText>}>
                <TouchableHighlight underlayColor={colors.underlay} onPress={() => setSameAddress(!sameAddress)}>
                    <ListItemView thumb={<CCheckbox checked={sameAddress} />}>
                        <BoldText style={{ marginLeft: 8 }}>Same as delivery address</BoldText>
                    </ListItemView>
                </TouchableHighlight>
            </Section>}
            {!sameAddress && <Section title={<TitleText style={{ marginTop: 24 }}>Residential Address</TitleText>}>
                <TouchableHighlight underlayColor={colors.underlay} onPress={() => setSameAddress(!sameAddress)}>
                    <ListItemView thumb={<CCheckbox checked={sameAddress} />}>
                        <BoldText style={{ marginLeft: 8 }}>Same as delivery address</BoldText>
                    </ListItemView>
                </TouchableHighlight>
                
                <Label label="Street Address" error={errors?.residential_address}>
                    <Input
                        allowClear
                        value={residentialAddress}
                        onChangeText={setResidentialAddress}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Unit No. (if any)" error={errors?.residential_unit}>
                    <Input
                        allowClear
                        value={residentialUnit}
                        onChangeText={setResidentialUnit}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Building Name (if any)" error={errors?.residential_building}>
                    <Input
                        allowClear
                        value={residentialBuilding}
                        onChangeText={setResidentialBuilding}
                        placeholder="Enter here"
                        />
                </Label>
                <Label label="Postal Code" error={errors?.residential_postal}>
                    <Input
                        allowClear
                        type="number"
                        maxLength={6}
                        value={residentialPostal}
                        onChangeText={(val) => setResidentialPostal(val.substring(0, 6))}
                        placeholder="Enter here"
                        />
                </Label>
            </Section>}
            <Height h={12} />
    </KeyboardView>
}