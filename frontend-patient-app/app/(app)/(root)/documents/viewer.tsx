import { useLocalSearchParams } from "expo-router";
import { FileViewerType } from '@/services/client';
import { getDocumentAccessCode } from '@/providers/documents';
import FileViewer from '@/components/file_viewer';

// PDF, HTML -> PDF, Image Viewer
export default function DocumentViewerScreen() {
  const { id, pdfUrl, filename, fileType }: { id: string, pdfUrl?: string, filename: string, fileType: FileViewerType } = useLocalSearchParams();
  const { code } = getDocumentAccessCode();

  // 1. PDF URL, 2. HTML, 3. Document URL
  let url = pdfUrl
  if (fileType === 'html') {
    url = `/api/document/${id}/html?code=${code}`
  } else if (!url) {
    url = `/api/document/${id}?code=${code}`
  }
  return <FileViewer id={id} url={url} filename={filename} fileType={fileType} />
}
