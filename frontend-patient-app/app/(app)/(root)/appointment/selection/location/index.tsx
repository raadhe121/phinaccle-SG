import React, { useState } from "react";
import {
  BoldText,
  NavHeader3,
  CMarkdown,
  Row,
} from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  View,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableHighlight,
  ViewStyle,
} from "react-native";
import { colors } from "@/common/utils/config";
import { useAppointmentStore } from "@/hooks/useAppointment";
import { BranchList } from "./branch";
import { Route, TabBar, TabView } from "react-native-tab-view";
import {
  ApptBranch,
  getLocationsApiAppointmentV1LocationsPost,
  GetLocationsResp,
} from "@/services/client";

// Location selection screen for appointments
export default function LocationSelectScreen() {
  const { serviceGroups, corporateCode, branchIds } = useAppointmentStore();

  const services = serviceGroups
    ?.map((sg) => sg.items?.map((i) => i.id).join(","))
    .join(",");
  const qry = useQuery({
    queryKey: [
      "appointment",
      "branches",
      services,
      corporateCode?.code,
      branchIds,
    ],
    queryFn: ({ queryKey }) =>
      getLocationsApiAppointmentV1LocationsPost({
        requestBody: {
          services: (queryKey[2] as string).split(","),
          code: queryKey[3] as string,
          branch_ids: queryKey[4] as string[] | null,
        },
      }),
  });

  return (
    <KeyboardView
      navBack={() => router.back()}
      header={<NavHeader3 navBack={router.back} />}
      wrapScroll={false}
      edges={[]}
    >
      {!qry.data && (
        <ScrollView>
          {qry.isPending && <ActivityIndicator />}
          {qry.isError && <BoldText>{qry.error.message}</BoldText>}
        </ScrollView>
      )}
      {qry.data &&
        (qry.data.type === "onsite" ? (
          <OnsiteLocations data={qry.data} />
        ) : (
          <ClinicLocations data={qry.data} />
        ))}
    </KeyboardView>
  );
}

export function ClinicLocations({ data }: { data: GetLocationsResp }) {
  const [tabViewIndex, setTabViewIndex] = useState(0);

  const branchesByCategory: { [key: string]: ApptBranch[] } =
    data?.branches.reduce(
      (acc, b) => {
        if (!acc[b.category]) {
          acc[b.category] = [];
        }
        acc[b.category].push(b);
        return acc;
      },
      {} as { [key: string]: ApptBranch[] },
    ) ?? {};

  const tabBarKeys = ["All Clinics", ...Object.keys(branchesByCategory).sort()];

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={{ backgroundColor: "transparent" }}
      scrollEnabled={true}
      tabStyle={{ height: 60, width: "auto", marginLeft: 12 }}
      renderIndicator={() => <></>}
      renderLabel={({ route, focused, color }) => (
        <View
          style={{
            marginLeft: -10,
            marginRight: -10 + (tabBarKeys.at(-1) === route.key ? 12 : 0),
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: focused ? colors.brands2 : colors.brands4,
            borderRadius: 8,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BoldText
            size={14}
            style={{
              color: focused ? colors.brands2 : colors.brands1,
              marginLeft: 20,
              marginRight: 20,
            }}
          >
            {route.title}
          </BoldText>
        </View>
      )}
    />
  );

  return (
    <TabView
      lazy
      renderTabBar={renderTabBar}
      navigationState={{
        index: tabViewIndex,
        routes: tabBarKeys.map((key) => ({ key, title: key })),
      }}
      onIndexChange={setTabViewIndex}
      renderScene={({ route }: { route: Route }) => {
        if (route.key === "All Clinics") {
          return <BranchList type={data.type} branches={data.branches} />;
        }
        return (
          <BranchList
            type={data.type}
            branches={data.branches.filter((b) => b.category === route.key)}
          />
        );
      }}
    />
  );
}

export function OnsiteLocations({ data }: { data: GetLocationsResp }) {
  const handleAllClinicsPress = () => {
    Alert.alert(
      "Not Available",
      "You can schedule a clinic appointment once the onsite service period has ended or schedule a booking without a corporate code",
      [{ text: "OK" }],
    );
  };

  const BranchButton = ({
    onPress,
    children,
    disabled = false,
    style,
  }: {
    onPress: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    style?: ViewStyle;
  }) => {
    return (
      <TouchableHighlight
        onPress={onPress}
        underlayColor={colors.underlay}
        style={{
          borderWidth: disabled ? 0 : 1,
          borderColor: colors.brands2,
          borderRadius: 8,
          ...style,
        }}
      >
        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <BoldText style={{ color: disabled ? colors.weak : colors.brands2 }}>
            {children}
          </BoldText>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <>
      <Row style={{ margin: 12 }}>
        <BranchButton onPress={() => {}}>On-site Services</BranchButton>
        <BranchButton
          onPress={handleAllClinicsPress}
          disabled={true}
          style={{ marginLeft: 12 }}
        >
          All Clinics
        </BranchButton>
      </Row>
      <BranchList
        header={
          data.header && (
            <View style={{ margin: 12 }}>
              <CMarkdown size={14}>{data.header}</CMarkdown>
            </View>
          )
        }
        type="onsite"
        branches={data.branches}
      />
    </>
  );
}
