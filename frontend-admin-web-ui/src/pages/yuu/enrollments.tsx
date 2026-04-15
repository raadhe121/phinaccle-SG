import { Button, Input, Table, TableColumnsType, Tag, Space, DatePicker } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { stringSort } from "@/utils/table";
import dayjs from "dayjs";
import { FileExcelOutlined, SearchOutlined } from "@ant-design/icons";
import xlsx from "json-as-xlsx";
import { OpenAPI } from "@/services/client";

const { RangePicker } = DatePicker;

interface YuuEnrollment {
  id: string;
  patient_name: string;
  nric: string;
  tomo_id: string;
  linked_at: string;
}

const BASE_URL = import.meta.env.VITE_ADMIN_API_URL ?? "";

const fetchEnrollments = async (
  page: number,
  search: string,
  startDate?: string,   // plain "YYYY-MM-DD" — backend appends the time itself
  endDate?: string
) => {
  const params = new URLSearchParams();
  params.set("page", String(page));

  const trimmedSearch = search.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);

  // Send ONLY "YYYY-MM-DD" — backend does: linked_at >= f"{start_date} 00:00:00"
  if (startDate) params.set("start_date", startDate);
  if (endDate)   params.set("end_date",   endDate);

  const token =
    typeof OpenAPI.TOKEN === "function"
      ? await OpenAPI.TOKEN({ method: "GET", url: "/api/admin/yuu/enrollments" })
      : OpenAPI.TOKEN;

  const url = `${BASE_URL}/api/admin/yuu/enrollments?${params.toString()}`;
  console.log("[Enrollments] GET", url);

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  console.log("[Enrollments] response:", json);
  return json;
};

export function EnrollmentsScreen() {
  // Two separate states: raw input (what user sees) vs committed search (what hits the API)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");

  const [page, setPage] = useState(1);

  // Store as plain YYYY-MM-DD strings — extracted immediately from RangePicker
  // to avoid Ant Design's RangeValue type issues with Dayjs tuple indexing
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate,   setEndDate]   = useState<string | undefined>(undefined);

  const [isExporting, setIsExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSearch = (value: string) => {
    setSearch(value.trim());
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // If cleared, commit immediately — no need to wait 400ms
    if (!value) {
      commitSearch("");
      return;
    }
    debounceRef.current = setTimeout(() => commitSearch(value), 400);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const qry = useQuery({
    queryKey: ["yuu-enrollments", page, search, startDate, endDate],
    queryFn:  () => fetchEnrollments(page, search, startDate, endDate),
    staleTime: 0,
    gcTime:    0,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const totalRows  = qry.data?.pager?.rows ?? 0;
      const pageSize   = qry.data?.pager?.n    ?? 20;
      const totalPages = Math.ceil(totalRows / pageSize);

      if (totalPages === 0) {
        alert("No records found for the selected filters.");
        return;
      }

      const results  = await Promise.all(
        Array.from({ length: totalPages }, (_, i) =>
          fetchEnrollments(i + 1, search, startDate, endDate)
        )
      );
      const allData  = results.flatMap((r) => r.data ?? []);

      if (allData.length === 0) {
        alert("No records found for the selected filters.");
        return;
      }

      xlsx(
        [{
          sheet: "Yuu Enrollments",
          columns: [
            { label: "Patient Name", value: "patient_name" },
            { label: "NRIC",         value: "nric" },
            { label: "Tomo ID",      value: "tomo_id" },
            { label: "Linked Date",  value: (row: any) => dayjs(row.linked_at).format("YYYY-MM-DD HH:mm") },
            { label: "Status",       value: () => "Active" },
          ],
          content: allData,
        }],
        {
          fileName:    `Yuu_Enrollments_${startDate ?? "All"}_to_${endDate ?? "Today"}`,
          extraLength: 3,
          writeOptions: {},
        }
      );
    } finally {
      setIsExporting(false);
    }
  };

  const columns: TableColumnsType<YuuEnrollment> = [
    { title: "Patient Name", dataIndex: "patient_name", sorter: stringSort("patient_name"), width: "25%" },
    { title: "NRIC",         dataIndex: "nric",         width: "15%" },
    { title: "Tomo ID",      dataIndex: "tomo_id",      width: "15%" },
    {
      title:     "Linked Date",
      dataIndex: "linked_at",
      render:    (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      width:     "20%",
    },
    { title: "Status", render: () => <Tag color="green">Active</Tag>, width: "15%" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Yuu Enrollments</h2>
        <Space size="middle">

          <RangePicker
            onChange={(v) => {
              // KEY FIX: extract plain strings immediately — do NOT store the RangeValue object
              // Storing v directly in state then doing dates[0].format() fails because
              // antd's RangeValue is not a plain tuple and indexing can return undefined
              setStartDate(v?.[0] ? v[0].format("YYYY-MM-DD") : undefined);
              setEndDate(  v?.[1] ? v[1].format("YYYY-MM-DD") : undefined);
              setPage(1);
            }}
            placeholder={["Start Date", "End Date"]}
          />

          <Input
            placeholder="Search name/NRIC..."
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onPressEnter={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              commitSearch(searchInput);
            }}
            style={{ width: 220 }}
            allowClear
          />

          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting || !qry.data?.pager?.rows}
            style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
          >
            Export Excel
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={qry.data?.data ?? []}
        rowKey="id"
        pagination={{
          current:         qry.data?.pager?.p    ?? 1,
          total:           qry.data?.pager?.rows ?? 0,
          pageSize:        qry.data?.pager?.n    ?? 20,
          onChange:        setPage,
          showSizeChanger: false,
          showTotal:       (total) => `Total ${total} enrollments`,
        }}
        loading={qry.isLoading}
        bordered
      />
    </div>
  );
}
