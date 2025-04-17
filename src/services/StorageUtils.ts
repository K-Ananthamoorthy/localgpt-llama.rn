import { PermissionsAndroid, Platform } from 'react-native';

export const requestStoragePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const version = Platform.Version as number;

    if (version >= 33) {
      const read = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      return read === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const read = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      const write = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      return (
        read === PermissionsAndroid.RESULTS.GRANTED &&
        write === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};
