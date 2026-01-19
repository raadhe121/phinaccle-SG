import { Modal, Toast } from "@ant-design/react-native";
import { colors } from './config';
import { BoldText, CText } from "../components/AntdText";
import AntdMiniIcon from "../components/AntdMiniIcon";
import React from "react";
import { View } from "react-native";

type ErrorType = {
    code: string;
    title: string;
    message: string;
}
type onErrorCallback = (status: number, msg: ErrorType) => void

type ModalType = {
    icon?: 'ExclamationCircleFill' | 'CloseCircleFill';
    iconColor?: string;
    title: string;
    content?: string | React.ReactNode;
    labels: string | React.ReactNode[];
    onCancel?: () => void;
    onOk?: () => void;
}

export const toast = {
    loading: () => {
        const key = Toast.loading({ content: 'Loading...', duration: 15, stackable: false })
        return () => Toast.remove(key);
    },
    success: (content: string, duration = 1) => Toast.success({ content, duration, stackable: true }),
    fail: (content: string, duration = 1) => Toast.fail({ content, duration, stackable: true }),
}

const defaultModal = ({ icon, iconColor, title, content, labels, onCancel, onOk}: ModalType) => {
    return Modal.alert(
        <>
            <AntdMiniIcon name={icon as string} size={64} color={iconColor} />
            <CText size={10}>{'\n\n'}</CText>
            <BoldText size={15} style={{ marginTop: 10 }}>{title}</BoldText>
        </>, 
        content 
            ? React.isValidElement(content) ? content : <CText size={15} style={{ textAlign: 'center' }}>{content}</CText>
            : <View />,
        // Disabling a typescript error where text only take in a string
        [
            { text: labels[0], onPress: onCancel, style: 'cancel' },
            { text: labels[1], onPress: onOk },
        ].filter(({ onPress }) => onPress) as any,
        () => {
            return false;
        }
    )
}

export const modal = {
    warn: (m: ModalType) => defaultModal({ icon: 'ExclamationCircleFill', iconColor: colors.warning, ...m }),
    error: (m: ModalType) => defaultModal({ icon: 'CloseCircleFill', iconColor: colors.danger, ...m }),
}

export const defaultOnError: onErrorCallback = (status, msg) => {
    modal.error({
        title: msg.title ?? 'Unknown Error', 
        content: msg.message ?? 'Please contact an administrator', 
        labels: ["Try Again"],
        onCancel: () => console.log('Cancel'),
    })
}