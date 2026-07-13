import React, { useState } from "react";
import { CMarkdown, CText, ListItemView, ScrollbarPadding, Section, TitleText } from "@/common/components/AntdText";
import { BranchDetailsView } from "@/common/components/BranchDetailsView";
import { colors } from "@/common/utils/config";
import { ApptBranch } from "@/services/client";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { LocationType, useAppointmentStore } from "@/hooks/useAppointment";

const BranchDetails = ({ type, branch }: { type: LocationType, branch: ApptBranch }) => {
  const { setLocation } = useAppointmentStore();

  const onSelectClinic = () => {
    console.log('onSelectClinic', branch);
    setLocation({
      id: branch.id,
      name: branch.name,
      type,
    });
    router.back();
  }

  return (
    <BranchDetailsView
      branchId={branch.id}
      buttonText="Select location"
      onButtonPress={onSelectClinic}
    />
  );
}

export const BranchList = ({ header, type, branches }: { header?: React.ReactNode, type: LocationType, branches: ApptBranch[] }) => {
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const branchesByCategory: { [key: string]: ApptBranch[] } = branches.reduce((acc, b) => {
    if (!acc[b.category]) {
      acc[b.category] = []
    }
    acc[b.category].push(b)
    return acc
  }, {} as { [key: string]: ApptBranch[] })

  return (
    <ScrollView>
      {header}
      {
        Object.keys(branchesByCategory).sort().map((category) => (
          <Section
            key={category}
            title={<TitleText>{category}</TitleText>}
            bottom={12}
          >
            {
              branchesByCategory[category].map((b) => {
                if (branchId === b.id) {
                  return <View
                    key={b.id}
                    style={{ backgroundColor: colors.brands4 }}
                  >
                    <ListItemView
                      onPress={() => setBranchId(undefined)}
                    >
                      {/* <CText size={16} style={{ marginTop: 14, marginBottom: 14 }}>{b.name}</CText> */}
                      <CMarkdown size={16} style={{ marginVertical: 12 }}>{`${b.name}${b.header ? `\n${b.header}` : ''}`}</CMarkdown>
                    </ListItemView>
                    <BranchDetails
                      type={type}
                      branch={b}
                    />
                  </View>
                }


                return <ListItemView
                  key={b.id}
                  onPress={() => setBranchId(b.id)}
                >
                  <CText size={16} style={{ marginTop: 14, marginBottom: 14 }}>{b.name}</CText>
                </ListItemView>
              })
            }
          </Section>
        ))
      }
      <ScrollbarPadding />
    </ScrollView>
  )
}