import React, {  } from 'react';
import { useLocalSearchParams } from 'expo-router';
import FileViewer from '@/components/file_viewer';
import { FileViewerType } from '@/services/client';

export default function PDFScreen() {
    const { id, url, filename, fileType }: { id: string, url: string, filename: string, fileType: FileViewerType } = useLocalSearchParams();
    return <FileViewer id={id} url={url} filename={filename} fileType={fileType} />
}
