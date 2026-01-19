import { Redirect } from 'expo-router'
import { Alert } from 'react-native'

export default function Page() {
  Alert.alert('Error: Invalid Page. Please contact customer support if error persists')
  return <Redirect href='/' />
}