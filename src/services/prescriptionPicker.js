import { TurboModuleRegistry } from 'react-native';
import { MAX_PRESCRIPTION_BYTES } from '../api/prescriptions';

export async function choosePrescription(source) {
  let file;
  if (source === 'document') {
    if (!TurboModuleRegistry.get('RNDocumentPicker')) {
      throw new Error(
        'Document upload needs the updated app build. Rebuild and reopen the app; Metro reload alone is not enough.',
      );
    }
    // Load only after checking the native binary, avoiding getEnforcing's red screen.
    const {
      pick,
      types,
      isErrorWithCode,
      errorCodes,
    } = require('@react-native-documents/picker');
    try {
      const [selected] = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
        mode: 'import',
      });
      file = {
        uri: selected.uri,
        name: selected.name || 'prescription.pdf',
        type: selected.type,
        size: selected.size,
      };
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return null;
      }
      throw error;
    }
  } else {
    if (!TurboModuleRegistry.get('ImagePicker')) {
      throw new Error(
        'Camera/photo upload needs the updated app build. Rebuild and reopen the app.',
      );
    }
    const {
      launchCamera,
      launchImageLibrary,
    } = require('react-native-image-picker');
    const options = {
      mediaType: 'photo',
      quality: 0.85,
      maxWidth: 2200,
      maxHeight: 2200,
      selectionLimit: 1,
      assetRepresentationMode: 'compatible',
      saveToPhotos: false,
    };
    const result = await (source === 'camera'
      ? launchCamera(options)
      : launchImageLibrary(options));
    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      throw new Error(
        result.errorCode === 'permission'
          ? 'Allow camera/photo access in device settings to upload a prescription.'
          : result.errorMessage ||
            'Unable to open the camera or photo library.',
      );
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      throw new Error('No prescription image was selected.');
    }
    file = {
      uri: asset.uri,
      name: asset.fileName || 'prescription.jpg',
      type: asset.type || 'image/jpeg',
      size: asset.fileSize,
    };
  }
  if (
    !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
      file.type,
    )
  ) {
    throw new Error(
      'Choose a PDF, JPEG, PNG or WebP image. For HEIC photos, use the Photo library option.',
    );
  }
  if (file.size > MAX_PRESCRIPTION_BYTES) {
    throw new Error(
      'Prescription must be 3 MB or smaller. Choose a smaller file.',
    );
  }
  return file;
}
