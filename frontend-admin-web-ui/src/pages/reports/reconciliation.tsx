import { ContentView } from "@/components/Content";
import { Button, Form, Space, DatePicker, message } from "antd";
import { Dayjs } from "dayjs";
import { useDownload } from "@/hooks/useDownload";
import { useState } from "react";
import xlsx from "json-as-xlsx";
import dayjs from "dayjs";
import { OpenAPI } from "@/services/client";

const { RangePicker } = DatePicker;

type FormFields = {
    dateRange: [Dayjs, Dayjs];
}

type ReportType = 'reconciliation' | 'teleconsultation' | 'yuu-transactions' | 'yuu-enrollments';

const BASE_URL = import.meta.env.VITE_ADMIN_API_URL ?? "";

export default function ReconciliationScreen() {
    const [exportingReport, setExportingReport] = useState<ReportType | null>(null);
    const [form] = Form.useForm<FormFields>();

    // --- 1. Standard Downloads (Ensure these URLs are NOT undefined) ---
    const reconciliationDownload = useDownload(
        (params: { start_date: string; end_date: string }) =>
            `/api/admin/reports/reconciliation?start_date=${params.start_date}&end_date=${params.end_date}`,
        'reconciliation_report.csv'
    );

    const teleconsultationDownload = useDownload(
        (params: { start_date: string; end_date: string }) =>
            `/api/admin/teleconsult/report?start_date=${params.start_date}&end_date=${params.end_date}`,
        'teleconsultation_report.csv'
    );

    const yuuTransactionsDownload = useDownload(
        (params: { start_date: string; end_date: string }) =>
            `/api/admin/yuu/transactions/export-csv?start_date=${params.start_date}&end_date=${params.end_date}`,
        'yuu_transactions_report.csv'
    );

    // --- 2. Custom Enrollment Excel Logic ---
    const handleEnrollmentExport = async (startDate: string, endDate: string) => {
        try {
            const token = typeof OpenAPI.TOKEN === "function" 
                ? await OpenAPI.TOKEN({ method: "GET", url: "/api/admin/yuu/enrollments" }) 
                : OpenAPI.TOKEN;

            const fetchUrl = (page: number) => 
                `${BASE_URL}/api/admin/yuu/enrollments?start_date=${startDate}&end_date=${endDate}&page=${page}`;

            const res = await fetch(fetchUrl(1), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const initialJson = await res.json();
            
            const totalRows = initialJson?.pager?.rows ?? 0;
            if (totalRows === 0) {
                message.warning("No records found for selected dates.");
                return;
            }

            const totalPages = Math.ceil(totalRows / (initialJson?.pager?.n ?? 20));
            
            // Fetch remaining pages
            const results = await Promise.all(
                Array.from({ length: totalPages }, (_, i) =>
                    fetch(fetchUrl(i + 1), { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
                )
            );
            
            const allData = results.flatMap((r) => r.data ?? []);

            xlsx(
                [{
                    sheet: "Yuu Enrollments",
                    columns: [
                        { label: "Patient Name", value: "patient_name" },
                        { label: "NRIC", value: "nric" },
                        { label: "Tomo ID", value: "tomo_id" },
                        { label: "Linked Date", value: (row: any) => dayjs(row.linked_at).format("YYYY-MM-DD HH:mm") },
                        { label: "Status", value: () => "Active" },
                    ],
                    content: allData,
                }],
                { fileName: `Yuu_Enrollments_${startDate}_to_${endDate}` }
            );
        } catch (error) {
            console.error(error);
            message.error("Failed to export enrollment data.");
        }
    };

    const handleDownload = (reportType: ReportType) => {
        form.validateFields().then(async (values) => {
            const start = values.dateRange[0].format('YYYY-MM-DD');
            const end = values.dateRange[1].format('YYYY-MM-DD');
            setExportingReport(reportType);

            if (reportType === 'yuu-enrollments') {
                await handleEnrollmentExport(start, end);
                setExportingReport(null);
            } else {
                const mutationMap = {
                    'reconciliation': reconciliationDownload,
                    'teleconsultation': teleconsultationDownload,
                    'yuu-transactions': yuuTransactionsDownload,
                };
                
                mutationMap[reportType].mutate({ start_date: start, end_date: end }, {
                    onSettled: () => setExportingReport(null)
                });
            }
        });
    };

    return (
        <ContentView title="Reports">
            <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
                <Form.Item name="dateRange" label="Date Range" rules={[{ required: true, message: 'Please select a date range' }]}>
                    <RangePicker style={{ width: '100%' }} />
                </Form.Item>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Button 
                        type="primary" block 
                        loading={exportingReport === 'reconciliation'} 
                        onClick={() => handleDownload('reconciliation')}
                    >
                        Download Reconciliation Report
                    </Button>
                    <Button 
                        type="primary" block 
                        loading={exportingReport === 'teleconsultation'} 
                        onClick={() => handleDownload('teleconsultation')}
                    >
                        Download Teleconsultation Report
                    </Button>
                    <Button 
                        type="primary" block 
                        loading={exportingReport === 'yuu-transactions'} 
                        onClick={() => handleDownload('yuu-transactions')}
                    >
                        Download Yuu Transactions Report
                    </Button>
                    <Button 
                        type="primary" block 
                        style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                        loading={exportingReport === 'yuu-enrollments'} 
                        onClick={() => handleDownload('yuu-enrollments')}
                    >
                        Download Yuu Enrollments (Excel)
                    </Button>
                </Space>
            </Form>
        </ContentView>
    );
}
