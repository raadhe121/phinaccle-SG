import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { ProfileSection } from "./components.tsx"

// Register Manrope font with direct TTF URLs
// Using more reliable URLs for the font files
Font.register({
  family: "Manrope",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/manrope@4.5.0/files/manrope-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/manrope@4.5.0/files/manrope-latin-500-normal.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/manrope@4.5.0/files/manrope-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
})

// Register Inter font
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.0/files/inter-latin-400-normal.woff",
      fontWeight: 400,
    },
  ],
})

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    marginBottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 150,
    height: 60,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTop: "1px solid #D6E6F1",
    paddingTop: 10,
  },
  clinicInfo: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 9,
    textAlign: "center",
  },
  reportContainer: {
    marginBottom: 20,
    border: "1px solid #D6E6F1",
    borderRadius: 8,
    overflow: "hidden",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
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
    padding: 0,
    marginBottom: 0,
    breakInside: "avoid",
  },
  sectionContent: {
    padding: 15,
    breakInside: "avoid",
    borderBottom: "1px solid #D6E6F1",
  },
  resultNormal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#52c41a",
    marginBottom: 10,
  },
  resultDanger: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#f5222d",
    marginBottom: 10,
  },
  adviceBox: {
    color: "#15405F",
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: 400,
    lineHeight: 1.4,
    marginTop: 10,
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: 8,
    paddingHorizontal: 8,
    breakInside: "avoid",
  },
  dataLabel: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
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
    fontSize: 15,
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
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: 400,
    color: "#15405F",
    marginTop: 4,
  },
  desirableRangeValue: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 12,
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
  reportDate: {
    position: "absolute",
    right: 0,
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
    width: '200',
  },
  sectionBox: {
    // padding: 15,
    border: "1px solid #D6E6F1",
    borderRadius: 8,
  },
  disclaimer: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: 400,
    color: "#15405F",
    lineHeight: 1.4,
    // marginTop: 20,
  },
  bold: {
    color: "#15405F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: -0.36,
  },
  sectionRow: {
    padding: 8,
  },
  borderBottom: {
    borderBottom: "1px solid #D6E6F1",
  }
})

const PDFPage = (props: any) => {
  return (
    <Page size="A4" style={styles.page} wrap={true}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          src="https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/health_reports/pdf/clinic-logo.png" 
          style={styles.logoImage} 
        />
      </View>
      {props.children}
      {/* Footer with Clinic Information */}
      <View style={styles.footer}>
        <Text style={styles.clinicInfo}>
          Pinnacle Familiy Clinic{'\n'}
          Tel: 62351852 Website: www.pinnaclefamilyclinic.com.sg
        </Text>
      </View>
    </Page>
  )
}

export const ReportContent = ({ header, reportSummary, profiles }: { header: any, reportSummary: any, profiles: any }) => {
  return (
    <>
      <PDFPage>
        <View style={{
          // position: "absolute", 
          // bottom: 100, // Adjust this value as needed (higher than footer)
          // left: 30,
          // right: 30,
          display: "flex",
          height: "85%",
          justifyContent: "space-between",
        }}>
          <Image src="https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/health_reports/pdf/boot.png" />
          <View style={styles.sectionBox}>
            <View style={[styles.sectionRow, styles.borderBottom]}>
              <Text style={styles.reportTitle}>My Health Report</Text>
            </View>
            
            <View style={[styles.sectionRow, styles.borderBottom]}>
              <Text style={styles.disclaimer}>
                The health report is generated based on common test profiles and their key components.  Please note that this summary is not exhaustive and should not be interpreted in isolation. It may not include all blood tests in the full laboratory report. For a comprehensive assessment, please refer to the detailed laboratory report and seek medical advice for professional interpretation.
              </Text>
            </View>
            <View style={[styles.sectionRow, styles.borderBottom, styles.dataRow]}>
              <Text style={styles.dataLabel}>Name</Text>
              <Text style={styles.valueLarge}>{header.name}</Text>
            </View>
            <View style={[styles.sectionRow, styles.borderBottom, styles.dataRow]}>
              <Text style={styles.dataLabel}>Identity Number</Text>
              <Text style={styles.valueLarge}>{header.identity_number}</Text>
            </View>
            <View style={[styles.sectionRow, styles.dataRow, styles.borderBottom]}>
              <Text style={styles.dataLabel}>Gender</Text>
              <Text style={styles.valueLarge}>{header.gender}</Text>
            </View>
            <View style={[styles.sectionRow, styles.dataRow, styles.borderBottom]}>
              <Text style={styles.dataLabel}>Report Date</Text>
              <Text style={styles.valueLarge}>{header.report_date}</Text>
            </View>
            <View style={[styles.sectionRow, styles.dataRow]}>
              <Text style={styles.dataLabel}>Lab Reference Number</Text>
              <Text style={styles.valueLarge}>{header.lab_reference_number}</Text>
            </View>
          </View>
        </View>
      </PDFPage>
      {
        reportSummary.profiles.map((profile: any, index: number) => {
          if (profiles?.[profile.profile_id] == null) {
            return null
          }

          return <PDFPage key={index}>
            <ProfileSection profile={profiles[profile.profile_id]} />
          </PDFPage>
        })
      }
      <PDFPage>
        <Text style={styles.disclaimer}>
          <Text style={styles.bold}>Disclaimer of warranties</Text>{'\n'}
          The product and content are provided on an "as is" basis. Pinnacle Family Clinic expressly disclaim all warranties of any kind with respect to the product or content, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, title and non-infringement. Pinnacle Family Clinic makes no warranty that the product and/or any content therein will meet your requirements, or will be uninterrupted, timely, secure, current, accurate, complete or error-free or the results may be obtained by use of the product or any content therein will be accurate or reliable. You understand and acknowledge that your sole and exclusive remedy with respect to any defect in or dissatisfaction with the product is to cease its use.
          {'\n\n'}
          The content on the product is presented as an educational service intended for licensed healthcare professionals. While the content in the product is about specific medical and healthcare issues, the content is not a substitute for, or replacement of personalized medical advice and is not intended to be used as the sole bases for making individualized medical or health related decisions. The contents provided by the product are solely based on published clinical studies and clinical guidelines, and do not represent a Pinnacle Family Clinic endorsement or evaluation of these studies. The content on the product is not intended to present the only, or necessarily the best, methods, or procedures for the medical situations addressed. Any reference to a specific therapy or commercial product or service in this product does not constitute a guarantee or endorsement by Pinnacle Family Clinic of the quality or value of such a therapy or product or service or any claims made by the manufacturer or provider of such therapy or commercial product or service.
        </Text>
      </PDFPage>
    </>
  )
}

export const HealthReportPdf = ({ data }: { data: any }) => {
  return (
    <Document>
      <ReportContent header={data.header} reportSummary={data.summary} profiles={data.profiles} />
    </Document>
  );
};