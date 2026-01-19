import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

export default function VideoScreen({ fullScreen, miniScreen, controls }: { fullScreen: ReactNode, miniScreen?: ReactNode, controls: ReactNode }) {
    return (
        <View style={styles.container}>
            <View style={styles.videoContainer}>
                {fullScreen}
            </View>
            
            <View style={styles.controls}>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                    { miniScreen && <View style={styles.overlay}>{miniScreen}</View> }
                </View>
                {controls}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: "100%"
    },
    videoContainer: {
        backgroundColor: 'grey',
        flexGrow: 1,
    },
    buttonContainer: {
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        height: 68,
    },
    overlay: {
        width: 121,
        height: 176,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    controls: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
    }
});