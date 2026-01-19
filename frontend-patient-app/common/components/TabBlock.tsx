import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { BoldText, ScrollbarPadding } from "@/common/components/AntdText";
import { colors } from "@/common/utils/config";
import { ReactNode, useState } from "react";
import { ScrollView, View } from "react-native";
import { NavigationState, Route, SceneRendererProps, TabBar, TabView } from "react-native-tab-view";

export type TabBlockRoute = Route & {
    iconColor?: string
}

type TabBlockProps = {
    lazy?: boolean
    routes: TabBlockRoute[]
    activeRoute?: string
    bottomPadding?: boolean
    onRender: (route: TabBlockRoute) => ReactNode
}

const TabBarItem = ({ routes, route, focused }: { routes: TabBlockRoute[], route: TabBlockRoute, focused: boolean }) => (
    <View style={{ 
            marginLeft: -10, 
            marginRight: -10 + (routes.at(-1)!.key === route.key ? 12 : 0), 
            backgroundColor: 'transparent', 
            borderWidth: 1, 
            borderColor: focused ? colors.brands2 : colors.brands4, 
            borderRadius: 8, 
            height: 36,
        }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 20, marginRight: 20}}>
            {
                route.icon && <>
                    <AntdMiniIcon name={route.icon} size={20} color={route.iconColor ?? (focused ? colors.brands2 : colors.brands1)} />
                    <View style={{ width: 10 }} />
                </>
            }
            <BoldText size={14} style={{ color: focused ? colors.brands2 : colors.brands1 }}>
                {route.title}
            </BoldText>
        </View>
    </View>
)

export default function TabBlock({ lazy, routes, activeRoute, onRender, bottomPadding = true }: TabBlockProps) {
    const [ index, setIndex ] = useState(activeRoute === undefined ? 0 : routes.findIndex(route => route.key === activeRoute));

    const renderTabBar = (props: SceneRendererProps & {
        navigationState: NavigationState<TabBlockRoute>;
    }) => (
        routes.length == 1
            ? <View style={{ marginLeft: 22, flex: 1, flexDirection: 'row', maxHeight: 60, alignItems: 'center' }}>
                <TabBarItem
                    routes={routes}
                    route={routes[index]}
                    focused={true} 
                />
            </View>
            : <TabBar
                {...props}
                style={{ backgroundColor: 'transparent' }}
                scrollEnabled={true}
                tabStyle={{ height: 60, width: 'auto', marginLeft: 12 }}
                renderIndicator={() => <></>}
                renderLabel={({ route, focused }) => (
                    <TabBarItem
                        routes={routes}
                        route={route}
                        focused={focused}
                    />
                )}
            />
    )    

    return <TabView<TabBlockRoute>
        lazy={lazy}
        renderTabBar={renderTabBar}
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={({ route }) => (
            <ScrollView>
                {onRender(route)}
                {bottomPadding && <ScrollbarPadding />}
            </ScrollView>
        )}
    />
}
