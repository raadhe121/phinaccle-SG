import { StyleSheet, Dimensions, View, TouchableHighlight } from 'react-native';
import { fetchHtmlApi, getFullApiUrl } from "@/apis/teleconsult";
import { useNavigation } from "expo-router";
import { shareAsync } from "expo-sharing";
import { useEffect, useState } from "react";
import { toast } from "@/common/utils/modal";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import Pdf from "react-native-pdf";
import AntdMiniIcon from '@/common/components/AntdMiniIcon';
import { colors } from '@/common/utils/config';
import { get } from '@/apis';
import { FileViewerType } from '@/services/client';

type FileViewerProps = {
  id: string;
  url: string;
  filename: string;
  fileType: FileViewerType;
}

const getFileExt = (filename: string) => filename.substring(filename.lastIndexOf('.') + 1);

export default function FileViewer({ id, url, filename, fileType }: FileViewerProps) {
  const [uri, setUri] = useState<string>();
  // Used to convert fileType: url into specific filetype (pdf, image)
  const [filetype, setFiletype] = useState<FileViewerType>(fileType);
  const navigation = useNavigation();

  useEffect(() => {
    const close = toast.loading();
    const loadFile = async () => {
      const fileUri = `${FileSystem.cacheDirectory}${id}.${getFileExt(filename)}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const pastCacheTime = (new Date().getTime() / 1000) > (fileInfo.modificationTime + 30);
        if (!pastCacheTime) {
          setUri(fileUri);
          close();
          return;
        }
      }

      // API returns HTML Content
      if (fileType === 'html') {
        const resp = await fetchHtmlApi({ url: url!.toString() })
        if (resp) {
          const { uri } = await Print.printToFileAsync({ html: resp.html });
          await FileSystem.moveAsync({
            from: uri,
            to: fileUri,
          })
        }
      } else {
        // Three types of URL
        // 1. Signed URL (Requires REST API call to fetch Signed PDF URL)
        // 2. Backend PDF URL (PDF provided by backend server)
        // 3. PDF URL (PDF provided by third party server)
        let pdfUrl = url;
        // Extra call for Signed PDF URL
        if (fileType === 'url') {
          if (url.startsWith('/')) {
            const resp = await get({
              url, 
              onError: (status, msg) => toast.fail(JSON.stringify(msg))
            })
            if (resp) {
              pdfUrl = resp.url;
              setFiletype(resp.filetype)
            } else {
              toast.fail('Failed to get Signed URL');
              return;
            }
          } else {
            toast.fail('Invalid URL');
            return;
          }
        }

        // API returns PDF Payload
        // Can be used for both to fetch URL or PDF
        if (pdfUrl.startsWith('/')) {
          const { url: _pdfUrl, headers } = await getFullApiUrl(pdfUrl);
          await FileSystem.downloadAsync(
            _pdfUrl,
            fileUri,
            { headers }
          );
        } else {
          await FileSystem.downloadAsync(
            pdfUrl,
            fileUri,
          );
        }
      }

      setUri(fileUri);
      close();
    }

    loadFile();
  }, []);

  const onShare = async () => {
    if (!uri) return;
    const shareUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: shareUri,
    })
    await shareAsync(shareUri);
  }

  useEffect(() => {
    navigation.setOptions({
      title: filename,
      headerRight: () => (
        <TouchableHighlight underlayColor={colors.underlay} onPressOut={onShare}>
          <View style={{ margin: 4 }}>
            <AntdMiniIcon name="UploadOutline" size={24} />
          </View>
        </TouchableHighlight>
      ),
    });
  }, [navigation, uri]);

  if (!uri) return <View />
  if (filetype === 'image') {
    return <ImageZoom isDoubleTapEnabled uri={uri} maxScale={20} />
  }
  return <Pdf source={{ uri, cache: false }} style={styles.pdf} />;
}

const styles = StyleSheet.create({
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  }
});
