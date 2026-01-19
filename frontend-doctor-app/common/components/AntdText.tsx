import React from 'react';
import { ActivityIndicator, ImageBackground, Linking, StyleProp, Text, TextStyle, TouchableHighlight, View, ViewStyle, useWindowDimensions } from 'react-native';
import { antd, colors, tabBarHeight } from '@/common/utils/config';
import { Button, DatePicker, List, Picker, PickerValue, PickerValueExtend } from '@ant-design/react-native';
import { PickerDate } from '@ant-design/react-native/lib/date-picker/util';
import dayjs from 'dayjs';
import { ListItemProps } from '@ant-design/react-native/lib/list/ListItem';

import AntdMiniIcon, { ImageRef, bgImages } from './AntdMiniIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UseQueryResult } from '@tanstack/react-query';

interface ListItemExtendedProps extends ListItemProps {
    divider?: boolean;
    mx?: number;
    my?: number;
}

export const ListItemView = (props: ListItemExtendedProps) => {
    return <View>
        <ListItem {...props} />
    </View>
}

export const ListItem = (props: ListItemExtendedProps) => (
    <>
        <List.Item thumb={props.thumb} arrow={props.arrow} extra={props.extra} styles={{ Arrow: { color: colors.brands3 }, Line: { borderBottomWidth: 0 }, Item: { paddingLeft: 12, marginTop: 4, marginBottom: 4, backgroundColor: 'transparent' } , ...props.styles }} onPress={props.onPress}>
            {props.children}
        </List.Item>
        {/* {props.divider === true && <Divider mx={props.mx ?? 12} my={props.my ?? 0} />} */}
    </>
)

type TextType = {
    numberOfLines?: number;
    style?: object;
    size?: number;
    children: React.ReactNode;
    onPress?: () => void;
}
export const MText = ({ style, size, children, onPress }: TextType) => <Text style={{ ...antd.manropeText, color: colors.text,  ...style, fontSize: size }} onPress={onPress}>{children}</Text>
export const CText = ({ style, size, numberOfLines, children, onPress }: TextType) => <Text numberOfLines={numberOfLines} style={{ ...antd.defaultText, color: colors.text,  ...style, fontSize: size }} onPress={onPress}>{children}</Text>
export const SubtitleText = ({ style, size, children }: TextType) => <CText style={{ ...antd.subtitleText, ...style }} size={size}>{children}</CText>
export const H1Text = ({ style, size = 25, children }: TextType) => <CText numberOfLines={1} style={{...antd.h1Text, ...style}} size={size}>{children}</CText>
export const H3Text = ({ style, size, children }: TextType) => <CText style={{...antd.h3Text, ...style}} size={size}>{children}</CText>
export const TitleText = ({ style, size = 18, children }: TextType) => <CText style={{...antd.titleText, ...style}} size={size}>{children}</CText>
export const BoldText = ({ style, size, children }: TextType) => <MText style={{...antd.boldText, ...style }} size={size}>{children}</MText>
export const Divider = ({ mx = 8, my = 4 }) => <View style={{ height: 1, backgroundColor: colors.border, marginLeft: mx, marginRight: mx, marginTop: my, marginBottom: my }} />
export const CTag = ({ color, children }: { color: string, children: React.ReactNode }) => (<View style={{backgroundColor: color, borderRadius: 4}}>
        <SubtitleText style={{ color: 'white', margin: 4}}>{children}</SubtitleText>
    </View>);

export const HeaderTag = ({ color, children }: { color: string, children: React.ReactNode }) => (<View style={{borderColor: color, borderWidth: 1, borderRadius: 4}}>
    <BoldText size={10} style={{ color, margin: 2}}>{children}</BoldText>
</View>);

export const HeaderTitleTag = ({ tag, title }: { tag: string, title: string }) => (
    <View>
        <View style={{ flexDirection: 'row', marginLeft: 12 }}>
            <HeaderTag color={colors.brands2}>{tag}</HeaderTag>
        </View>
        <H1Text style={{ marginTop: 8 }}>{title}</H1Text>
    </View>
)

export const ExtraTag = ({ color, children }: { color: string, children: React.ReactNode }) => (<View style={{borderColor: color, borderWidth: 1, borderRadius: 4}}>
    <CText size={11} style={{ color, margin: 4}}>{children}</CText>
</View>);


export const Row = ({ children, style }: { children: React.ReactNode | React.ReactNode[], style?: ViewStyle }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', ...style }}>
        {children}
    </View>
)

export const CCheckbox = ({ checked, onChecked = () => {} }: { checked: boolean, onChecked?: (state: boolean) => void}) => {
    return <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: checked ? colors.brands2 : colors.light,
            backgroundColor: checked ? colors.brands2 : colors.brands5,
            justifyContent: 'center',
            alignItems: 'center' 
        }}
        >
        <TouchableHighlight underlayColor={colors.underlay} onPress={() => onChecked(!checked)}>
            <AntdMiniIcon name='CheckOutline' color='white' size={16} />
        </TouchableHighlight>
    </View>
}

export const MenuItem = ({ icon, children, onPress }: { icon?: string, children: React.ReactNode, onPress: () => void }) => (
    <ListItemView thumb={icon && <AntdMiniIcon name={icon} size={24} />} arrow='horizontal' onPress={onPress}>
        <View style={{ marginTop: 12, marginBottom: 12 }}>
            <CText size={17} style={{marginLeft: 10 }}>{children}</CText>
        </View>
    </ListItemView>
)

export const Label = ({ label, error, wrap = true, children }: { label: string, error?: string | null, wrap?: boolean, children: React.ReactNode }) => {
    return <>
        <CText style={antd.inputLabel}>{label}</CText>
        {wrap && <ListItem mx={0} divider={false}>{children}</ListItem>}
        {!wrap && children}
        {error && <CText style={{ color: 'red', marginLeft: 12 }}>{error}</CText>}
        <View style={{ height: 6 }} />
    </>
}

export const Height = ({ h, style }: { h: number, style?: ViewStyle }) => {
    return <View style={{ height: h, ...style }} />
}

export const ToggleButton = ({ selected, children, style, onPress }: { selected: boolean, children: React.ReactNode, style?: ViewStyle, onPress?: () => void }) => {
    return <View style={{
            minWidth: 100, 
            backgroundColor: colors.greyButton, 
            borderRadius: 6, 
            borderWidth: 1, 
            borderColor: selected ? colors.brands2 : colors.greyButton,
            overflow: 'hidden',
            ...style,
        }}>
        <TouchableHighlight underlayColor={colors.underlay} onPress={onPress}>
            <View>
                <CText size={15} style={{ textAlign: 'center', margin: 8, color: selected ? colors.brands2 : colors.text }}>{children}</CText>
                {selected && <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
                    <AntdMiniIcon name="Triangle" size={20} color={colors.brands2} />
                </View>}
            </View>
        </TouchableHighlight>
    </View>
}

const btnNormal = {
    borderColor: colors.brands2,
    backgroundColor: colors.brands2,
    width: 32, 
    height: 32, 
    borderRadius: 16,
}

export const NavHeader3 = ({ navBack }: { navBack?: () => void }) => {
    const insets = useSafeAreaInsets();  
    const touchProps = {
        activeOpacity: 1,
        underlayColor: colors.underlay,
        style: btnNormal,
        onPress: navBack,
    }

    return (
        <View style={{ flexDirection: 'row', paddingLeft: 12, paddingRight: 12, marginTop: 8 + insets.top, marginBottom: 8, alignItems: 'center', justifyContent: navBack ? 'space-between' : 'center' }}>
            {navBack && <TouchableHighlight { ...touchProps }>
                <View style={{ ...btnNormal, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <AntdMiniIcon name="LeftOutline" size={20} color='white' />
                </View>
            </TouchableHighlight>}
        </View>
    )
}

export const CNavHeader = ({ title, navBack, showLogo }: { title: string | React.ReactNode, navBack?: () => void, showLogo?: boolean }) => {
    const insets = useSafeAreaInsets();  
    const { width } = useWindowDimensions();
    const bgImg = bgImages.Header;
    const bgHeight = width * bgImg.height / bgImg.width;

    const touchProps = {
        activeOpacity: 1,
        underlayColor: colors.underlay,
        style: btnNormal,
        // onHideUnderlay: () => setIsPress(false),
        // onShowUnderlay: () => setIsPress(true),
        onPress: navBack,
    }

    return (
        <ImageBackground source={bgImg.uri} resizeMode='stretch' style={{
                width: '100%',
                height: bgHeight,
                justifyContent: 'space-between',
                backgroundColor: 'transparent',
                zIndex: 10,
            }}>
            <View style={{ flexDirection: 'row', paddingLeft: 12, paddingRight: 12, marginTop: 8 + insets.top, marginBottom: 8, alignItems: 'center', justifyContent: navBack ? 'space-between' : 'center' }}>
                {navBack && <TouchableHighlight { ...touchProps }>
                    <View style={{ ...btnNormal, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <AntdMiniIcon name="LeftOutline" size={20} color='white' />
                    </View>
                </TouchableHighlight>}
                {showLogo && <ImageRef src='HeaderLogo' width={170} />}
                {navBack && <View style={{ width: 32, height: 32 }} />}
            </View>
            { React.isValidElement(title) ? title : <H1Text>{title}</H1Text> }
        </ImageBackground>
    )
}

const labelRenderer = (type: string, data: number) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    switch (type) {
        case 'month':
            return months[data - 1] // + '月'
    //   case 'year':
    //     return data + '年'
    //   case 'day':
    //     return data + '日'
      default:
        return data
    }
  }

export const FormDatePicker = ({ value, onChange, placeholder }: { value?: PickerDate, onChange?: (value: Date, extend: PickerValueExtend) => void, placeholder: string }) => {
    const formattedDate = value ? dayjs(value).format('D MMM YYYY') : placeholder;

    return <DatePicker
        value={value ?? dayjs().subtract(30, 'year').toDate()}
        minDate={dayjs().subtract(110, 'year').toDate()}
        maxDate={dayjs().subtract(1, 'day').toDate()}
        onChange={onChange}
        renderLabel={labelRenderer}
        format="DD-MM-YYYY">
        <ListItem styles={{
            Content: !value ? antd.disabledColor : { color: 'black' },
            Extra: { color: 'white' } // This disables the value on showing on the right side
        }} arrow="horizontal" divider={false}>{formattedDate}</ListItem>
    </DatePicker>
}

export const FormPicker = ({ data, value, onChange, placeholder, disabled = false }: { data: any, value?: PickerValue[], onChange?: (value: PickerValue[]) => void, placeholder: string, disabled?: boolean }) => {
    return <Picker
        disabled={disabled}
        data={data}
        cols={1}
        value={value}
        onChange={onChange}
        >
            {
                // @ts-ignore. Due to the Picker component not typing correctly
                ({extra, value, toggle}) => (
                    <ListItem
                        onPress={disabled ? undefined : toggle}
                        styles={{
                            Content: !value || disabled ? antd.disabledColor : { color: 'black' },
                            // Extra: { color: 'black', width: 10 } // This disables the value on showing on the right side
                        }} arrow="horizontal" divider={false}>{value ?? placeholder}</ListItem>
                    )
            }
    </Picker>
}

export const Section = ({ title, children, top = 0, bottom = 0, backgroundColor = 'white' }: { title?: string | React.ReactNode, children: React.ReactNode | React.ReactNode[], top?: number, bottom?: number, backgroundColor?: string }) => {
    const fChildren = Array.isArray(children) ? children.filter((child) => child) : [];
    const childsWithDivider = Array.isArray(children)
        ? fChildren.reduce<React.ReactNode[]>((acc, child, index) => {
            acc.push(child);
            if (index < fChildren.length - 1) { // Check if it's not the last item
                acc.push(<Divider key={`div${index}`} mx={0} my={0} />); // Add separator
            }
            return acc;
        }, [])
        : children;

    return <View>
        {title && React.isValidElement(title) ? title : <TitleText>{title}</TitleText>}
        <View style={{ marginLeft: 12, marginRight: 12, borderRadius: 10, backgroundColor, borderColor: colors.brands4, borderWidth: 1, overflow: 'hidden' }}>
            <View style={{ height: top }}></View>
            {childsWithDivider}
        </View>
        <View style={{ height: bottom }}></View>
    </View>
}

export const InfoButton = ({ onPress, children, style }: { onPress: () => void, children: React.ReactNode, style?: ViewStyle }) => {
    return <Button type="ghost" onPress={onPress} style={{ borderColor: colors.brands2, height: 28, ...style }}>
        <MText style={{ color: colors.brands2 }}>{children}</MText>
    </Button>
}

export const ButtonIcon = ({ icon, onPress, disabled, loading, children }: { icon?: string, disabled?: boolean, loading?: boolean, onPress?: () => void, children: string }) => {
    const color = (disabled || onPress == null) ? colors.border : colors.primary;
    return <View style={{ borderColor: color, borderWidth: 1, borderRadius: 8, overflow: 'hidden' }}>
        <TouchableHighlight underlayColor={colors.underlay} onPress={loading ? undefined : onPress}>
            <View style={{ margin: 12, marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center'}}>
                {!loading && icon && <AntdMiniIcon name={icon} size={16} color={color} style={{ marginRight: 6 }} />}
                {loading && <ActivityIndicator size='small' color={color} style={{ marginRight: 6 }} />}
                <MText size={17} style={{ color: color }}>{children}</MText>
            </View>
        </TouchableHighlight>
    </View>
}

export const TextLink = ({ href, size, children, style }: { href: string, size?: number, style?: TextStyle, children: React.ReactNode }) => {
    return <>
        {' '}
        <CText
            size={size}
            style={{ color: colors.primary, textDecorationLine: 'underline', ...style }}
            onPress={()=>{Linking.openURL(href);}}
            >
            {children}
        </CText>
        {' '}
    </>
}

export const WarningButton = ({ onPress, children, loading, disabled, type }: { onPress: () => void, children: React.ReactNode, loading?: boolean, disabled?: boolean, type?: 'ghost' }) => {
    if (type === 'ghost') {
        return <Button style={{ borderColor: 'red', borderRadius: 8 }} onPress={onPress} loading={loading} disabled={disabled}>
            <BoldText size={18} style={{ color: 'red'}}>{children}</BoldText>
        </Button>
    }
    
    return <Button style={{ borderColor: 'red', backgroundColor: 'red', borderRadius: 8 }} activeStyle={{ backgroundColor: '#EE0000'}} onPress={onPress} loading={loading} disabled={disabled}>
        <BoldText size={18} style={{ color: 'white' }}>{children}</BoldText>
    </Button>
}


interface ButtonProps {
    title: string,
    type: 'primary' | 'warning' | 'danger',
    border?: boolean,
    loading?: boolean,
    disabled?: boolean,
    icon?: any,
    onPress?: any,
}

const ButtonContent = ({ icon, title, color }: { icon: string, title: string, color: string }) => (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        {icon && <AntdMiniIcon name={icon} color={color} size={20} />}
        <View style={{ width: icon ? 6 : 0 }} />
        <MText size={18} style={{ color: color }}>
            {title}
        </MText>
    </View>
)

const buttonTypeToColor = {
    primary: colors.brands2,
    warning: colors.warning,
    danger: colors.danger,
}

export const GRButton = ({ title, loading, disabled, icon, onPress, type, border = false }: ButtonProps) => {
    const color = buttonTypeToColor[type];

    return <Button
        type={border ? 'ghost' : 'primary'}
        style={{
            backgroundColor: !border ? color : 'transparent',
            borderColor: color,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 10,
            borderRadius: 8,
        }}
        activeStyle={{
            backgroundColor: color,
            borderColor: color,
            opacity: 0.5,
        }}
        onPress={onPress}
        loading={loading}
        disabled={loading || disabled}
    >
        <ButtonContent icon={icon} title={title} color={border ? color : 'white'} />
    </Button>
}

export const TabBarPadding = () => {
    const insets = useSafeAreaInsets();
    
    return <View style={{ height: tabBarHeight + insets.bottom }}></View>
}

export const ScrollbarPadding = () => {
    const insets = useSafeAreaInsets();   
    return <View style={{ height: insets.bottom + 12 }}></View>
}

export const ReactQueryChild = ({ query, children }: { query: UseQueryResult, children: React.ReactNode }) => {
    const { isPending, isError, error } = query;

    if (isPending) {
        return <ActivityIndicator style={{ marginTop: 12 }} />;
    } else if (isError) {
        return <BoldText>{error.message}</BoldText>;
    }

    return children;
}
