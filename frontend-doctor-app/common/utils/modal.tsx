import { Modal, Toast } from "@ant-design/react-native";
import { Ionicons } from '@expo/vector-icons';
import { colors } from './config';
import { BoldText, CText } from "../components/AntdText";
import AntdMiniIcon from "../components/AntdMiniIcon";
import React from "react";
import axios from "axios";
import { Alert } from "react-native";

export const axiosErrorAlert = (error: any) => {
    if (axios.isAxiosError(error) && error.response) {
        const serverResponse = error.response.data;
        console.log(error)
        console.error('Error [axios error]:', serverResponse.detail);
        Alert.alert('Error [axios error]:', serverResponse.detail)
    } else {
        console.error('Error :', error);
        Alert.alert('Error :', error)
    }
}
  
type ErrorType = {
    code: string;
    title: string;
    message: string;
}
type onErrorCallback = (status: number, msg: ErrorType) => void

type ModalType = {
    title: string;
    content: string | React.ReactNode;
    labels: string[];
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

export const modal = {
    warn: ({ title, content, labels, onCancel, onOk}: ModalType) => {
        Modal.alert(
            <>
                <AntdMiniIcon name="ExclamationCircleFill" size={64} color={colors.warning} />
                <CText size={10}>{'\n\n'}</CText>
                <BoldText size={15} style={{ marginTop: 10 }}>{title}</BoldText>
            </>, 
            React.isValidElement(content) ? content : <CText size={15} style={{ textAlign: 'center' }}>{content}</CText>,
            [
                { text: labels[0], onPress: onCancel, style: 'cancel' },
                { text: labels[1], onPress: onOk },
            ].filter(({ onPress }) => onPress),
            () => {
                return false;
            }
        )
    },
    error: ({ title, content, labels, onCancel, onOk}: ModalType) => {
        Modal.alert(
            <>
                <Ionicons name="close-circle" size={60} color="red" />{"\n"}
                <BoldText>{title}</BoldText>
            </>, 
            <CText style={{ textAlign: 'center' }}>{content}</CText>,
            [
                { text: labels[0], onPress: onCancel, style: 'cancel' },
                { text: labels[1], onPress: onOk },
            ].filter(({ onPress }) => onPress),
            () => {
                return false;
            }
        )
    }
}

export const defaultOnError: onErrorCallback = (status, msg) => {
    modal.error({
        title: msg.title ?? 'Unknown Error', 
        content: msg.message ?? 'Please contact an administrator', 
        labels: ["Try Again"],
        onCancel: () => console.log('Cancel'),
    })
}