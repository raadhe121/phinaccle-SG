import { GRButton } from '@/common/components/AntdText';
import { Modal } from "@ant-design/react-native";
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Item: any = Picker.Item;

export default function PickerModalExample() {
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);
    const [value, setValue] = useState('key1');
    return <>
        <GRButton title="Open Modal" onPress={() => setModalVisible(true)} type={'primary'} />
        <Modal
            popup
            visible={modalVisible}
            animationType="slide-up"
            style={{ paddingBottom: 12 + insets.bottom, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'black' }}
            onClose={() => setModalVisible(false)}
            maskClosable={true}
            >
            <Picker
            selectedValue={value}
            onValueChange={(v) => setValue(v)}
            mode="dropdown"
            >
                <Item label="hello" value="key0" />
                <Item label="world" value="key1" />
            </Picker>
        </Modal>
    </>
}