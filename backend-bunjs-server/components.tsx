import React from "react"
import { Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { healthReportMapping, profiles, getProfileIcon, getTest } from "./health_report_mapping.ts"

interface TestResult {
  test_code: string;
  value: string;
  desirable_range: string | null;
  tag_id: string | null;
  messages: string[] | null;
}

interface OverallResult {
  tag_id: string;
  messages: string[];
}

interface HealthProfile {
  profile_id: string;
  overalls: OverallResult[];
  results: TestResult[];
  lab_report_id: string;
}

const TitleSection = ({ id }) => {
  const profile = profiles[id]

  return (
    <View style={styles.reportHeader}>
      <Text style={styles.reportTitle}>{profile.title}</Text>
      <Image
        src={getProfileIcon(id)}
        style={styles.reportIcon}
      />
    </View>
  )
}

const OverallSection = ({ profile }: { profile: HealthProfile}) => {
  const profileObj = healthReportMapping.find((p) => p.profile === profile.profile_id)
  
  return (
    <View style={styles.section}>
      <View style={[styles.sectionContent, styles.bottomBorder]}>
        <Text style={styles.dataLabel}>Overall result</Text>
        <Text style={profile.overalls[0].tag_id === 'out_of_range' ? styles.resultDanger : styles.resultNormal}>
          {profile.overalls[0].tag_id === 'out_of_range' ? 'Out of Range' : 'Normal'}
        </Text>

        { profileObj?.description && <Text style={styles.adviceBox}>
          {profileObj.description}
        </Text> }
      </View>
    </View>
  )
}

const TestSection = ({ test, isLast }: { test: TestResult, isLast: boolean }) => {
  const testMeta = getTest(test.test_code)
  
  // console.log(testMeta?.desirable_range_image)

  
  const extractBoldText = (text) => {
    const boldRegex = /\*\*(.+?)\*\*\n(.+)/;
    const match = text.match(boldRegex);
    if (match) {
      return {
        boldText: match[1],
        regularText: match[2]
      };
    }
    return null;
  }

  // const { boldText, regularText } = extractBoldText(testMeta?.high_writeup)

  return (
    <View style={styles.section}>
      <View style={[styles.sectionContent, isLast ? {} : styles.bottomBorder]}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>{test.test_code}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {test.tag_id && <View style={[
                styles.tag,
                test.tag_id === 'out_of_range' ? styles.tagDanger : styles.tagNormal
              ]}>
              <Text>{test.tag_id === 'out_of_range' ? 'Out of Range' : 'Normal'}</Text>
            </View>}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.valueLarge}>{test.value}</Text>
              {/* <Text style={styles.unit}>mmHg, bpm</Text> */}
            </View>
          </View>
        </View>

        {test.desirable_range && <View style={{ flexDirection: "row-reverse", gap: 8 }}>
          <Text style={styles.desirableRangeValue}>{test.desirable_range}</Text>
          <Text style={styles.desirableRangeLabel}>Desirable Range:</Text>
        </View>}
        {
          test.messages && testMeta?.[test.messages[0]] && <Text>
            <Text style={styles.adviceBoxBold}>{extractBoldText(testMeta[test.messages[0]])?.boldText}</Text>
            {`\n`}
            <Text style={styles.adviceBox}>{extractBoldText(testMeta[test.messages[0]])?.regularText}</Text>
          </Text>
        }
        {
          testMeta?.desirable_range_image && <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image src={testMeta.desirable_range_image} style={{ height: 120, width: (120 * testMeta.desirable_range_image_ratio) }} />
          </View>
        }
      </View>
    </View>
  )
}

export const ProfileSection = ({ profile }: { profile: HealthProfile}) => {
  return (
    <View style={styles.reportContainer}>
      <TitleSection id={profile.profile_id} />
      <OverallSection profile={profile} />
      {
        profile.results.map((test, i) => (
          // <View wrap={false}>
            <TestSection key={i} test={test} isLast={i === profile.results.length - 1} />
          // </View>
        ))
      }
    </View>
  )
}

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  reportContainer: {
    // marginBottom: 20,
    border: "1px solid #D6E6F1",
    borderRadius: 8,
    overflow: "hidden",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottom: "1px solid #D6E6F1",
  },
  reportTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: -0.25,
    color: "#15405F",
  },
  reportIcon: {
    width: 30,
    height: 30,
    quality: 100,
  },
  section: {
    // borderBottom: "1px solid #D6E6F1",
    padding: 0,
    marginBottom: 0,
    breakInside: "avoid",
  },
  sectionContent: {
    padding: 8,
    breakInside: "avoid",
  },
  bottomBorder: {
    borderBottom: "1px solid #D6E6F1",
  },
  resultNormal: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#52c41a",
    // marginBottom: 10,
  },
  resultWarning: {
    color: "#FF8F1F",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.4,
    // marginBottom: 10,
  },
  resultDanger: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#f5222d",
    // marginBottom: 10,
  },
  adviceBoxBold: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.4,
    marginTop: 10,
    marginBottom: 10,
  },
  adviceBox: {
    color: "#15405F",
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 1.4,
    marginTop: 4,
    // marginBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: 8,
    paddingHorizontal: 0,
    // borderBottom: "1px solid #D6E6F1",
    breakInside: "avoid",
  },
  dataLabel: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  dataValue: {
    fontSize: 11,
    fontWeight: "bold",
    flexDirection: "row",
    alignItems: "center",
  },
  valueLarge: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: -0.36,
  },
  unit: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: -0.36,
    marginLeft: 8,
  },
  tag: {
    padding: "2 6",
    borderRadius: 4,
    fontSize: 8,
    marginLeft: 5,
  },
  tagNormal: {
    backgroundColor: "#f6ffed",
    color: "#52c41a",
    border: "1px solid #b7eb8f",
  },
  tagWarning: {
    backgroundColor: "#fff7e6",
    color: "#fa8c16",
    border: "1px solid #ffd591",
  },
  tagDanger: {
    backgroundColor: "#fff1f0",
    color: "#f5222d",
    border: "1px solid #ffa39e",
  },
  desirableRangeLabel: {
    fontSize: 10,
    fontFamily: "Manrope",
    fontWeight: 400,
    color: "#15405F",
    marginTop: 4,
  },
  desirableRangeValue: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.4,
    marginTop: 4,
  },
  emptyChart: {
    height: 80,
    backgroundColor: "#D6E6F1",
    marginVertical: 10,
    borderRadius: 4,
  },
  // bulletList: {
  //   marginLeft: 0,
  //   marginTop: 5,
  // },
  // bulletItem: {
  //   fontSize: 12,
  //   marginBottom: 5,
  //   color: "#595959",
  // },
  reportDate: {
    fontSize: 9,
    color: "#666666",
    textAlign: "right",
    marginBottom: 15,
  },
})
