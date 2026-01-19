import React, { useState } from 'react'
import { BoldText, CCheckbox, CText, ListItemView, NavHeader3, ReactQueryChild, ScrollbarPadding } from "@/common/components/AntdText"
import KeyboardView from "@/common/components/KeyboardView"
import { useAppointmentStore } from "@/hooks/useAppointment"
import { router, useLocalSearchParams } from "expo-router"
import { View, StyleSheet, TouchableHighlight } from "react-native"
import { Image } from 'expo-image'
import { QueryObserverResult, useQuery } from "@tanstack/react-query"
import { colors } from '@/common/utils/config'
import AntdMiniIcon from '@/common/components/AntdMiniIcon'
import { Button } from '@ant-design/react-native'
import { getServiceApiAppointmentV1ServiceIdGet, ServiceGroup, ServiceItem } from '@/services/client'

export interface ServiceDetail {
  type: 'single' | 'multiple'
  id: string
  title: string
  description?: string
  services: ServiceItem[]
}

const ServiceItemRow = ({ service, isSelected, onPress, showCheckbox = false }: { service: ServiceItem, isSelected: boolean, onPress: () => void, showCheckbox?: boolean }) => {
  return (
    <TouchableHighlight
      key={service.id}
      underlayColor={colors.underlay}
      onPress={onPress}
      style={[
        styles.packageItem,
        isSelected && styles.selectedItem
      ]}
    >
      <ListItemView extra={showCheckbox ? <CCheckbox checked={isSelected} onChecked={onPress} style={{ marginLeft: 8 }}/> : null}>
        <View>
          <View style={styles.packageHeader}>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              {
                service.tests 
                  ? <BoldText size={18}>{service.name}</BoldText> 
                  : <CText size={16}>{service.name}</CText> 
              }
              {
                service.remarks && (
                  <CText size={15} style={{ color: colors.weak }}>{service.remarks}</CText>
                )
              }
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CText size={16}>{service.price ? `S$${service.price?.toFixed(2)}` : ''}</CText>
              { 
                !showCheckbox 
                  ? <AntdMiniIcon name="RightOutline" size={20} color={colors.primary} style={{ marginLeft: 8 }}/> 
                  : null 
              }
            </View>
          </View>
          {service.tests?.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <AntdMiniIcon name="CheckOutline" size={17} color={colors.success} />
              <View style={{ marginLeft: 8 }}>
                <CText size={14}>{test.name}</CText>
                {test.exclusion ? (
                  <CText size={12} style={{ color: colors.weak }}>{test.exclusion}</CText>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </ListItemView>
    </TouchableHighlight>
  )
}

export const ServiceDetailLayout = ({ qry, action, children }: { qry: QueryObserverResult<ServiceDetail>, action: React.ReactNode, children: React.ReactNode }) => {
  return (
    <KeyboardView
      edges={!action ? [] : undefined}
      action={action}
      navBack={router.back}
      header={<NavHeader3 navBack={router.back} />}
      scrollOverflow='scroll'
    >
      {qry.data && (
          <>
            <View style={styles.header}>
              <View style={{ marginLeft: 16 }}>
                <BoldText size={25}>{qry.data.title}</BoldText>
                {qry.data.description && (
                  <CText size={14} style={{ marginTop: 4 }}>
                    {qry.data.description}
                  </CText>
                )}
              </View>
            </View>
          </>
      )}
      {children}
    </KeyboardView>
  )
}

export default function ServiceDetailScreen() {
  const { index, serviceGroup } = useLocalSearchParams()
  const serviceGroupObj: ServiceGroup = JSON.parse(serviceGroup as string)
  const { serviceGroups, setServiceGroups, branchIds } = useAppointmentStore()
  const query = useQuery({
    queryKey: ['service-detail', serviceGroupObj.id, branchIds],
    queryFn: ({ queryKey }) => getServiceApiAppointmentV1ServiceIdGet({
      id: queryKey[1] as string,
      branchIds: queryKey[2] ? (queryKey[2] as string[]).join(',') : null
    })
  })

  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>(serviceGroups?.find((sg) => sg.id == serviceGroupObj.id)?.items ?? []) 

  const onToggleSelectService = (service: ServiceItem) => {
    if (selectedServices.includes(service)) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== service.id))
    } else {
      setSelectedServices((prev) => [...prev, service])
    }
    if (query.data?.type === 'single') {
      router.dismissTo('/appointment');
      setServiceGroups(
        index as string, 
        {
          ...serviceGroupObj,
          items: [service]
        }
      );
    }
  }

  const onActionPress = () => {
    setServiceGroups(
      index as string,
      {
        ...serviceGroupObj,
          items: selectedServices
      }
    );
    router.dismissTo('/appointment');
  }

  const action = (
    <Button
      onPress={onActionPress}
      type="primary"
      disabled={selectedServices.length === 0}
    >
      Continue
    </Button>
  )

  return (
    <KeyboardView
      edges={query.data?.type === 'multiple' ? undefined : [] }
      action={query.data?.type === 'multiple' ? action : null}
      navBack={router.back}
      header={<NavHeader3 navBack={router.back} />}
      scrollOverflow='scroll'
    >
      <ReactQueryChild query={query}>
        {query.data && (
          <>
            <View style={styles.header}>
              <BoldText size={25}>{query.data.title}</BoldText>
              {query.data.description && (
                <CText size={14} style={{ marginTop: 4 }}>
                  {query.data.description}
                </CText>
              )}
            </View>
            <View style={{ margin: 12 }}>
              { 
                query.data.services.map((service: ServiceItem) => (
                  <ServiceItemRow
                    key={service.id} 
                    service={service} 
                    isSelected={selectedServices.includes(service)} 
                    onPress={() => onToggleSelectService(service)} 
                    showCheckbox={query.data.type === 'multiple'}
                  />
                ))
              }
            </View>
          </>
        )}
        { query.data?.type === 'single' && <ScrollbarPadding /> }
      </ReactQueryChild>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 12, 
    marginTop: 16, 
    marginBottom: 12
  },
  packageItem: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  selectedItem: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
});
