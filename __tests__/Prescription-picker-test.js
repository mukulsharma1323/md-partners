import { TurboModuleRegistry } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { choosePrescription } from '../src/services/prescriptionPicker';
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  types: { pdf: 'application/pdf', images: 'image/*' },
  errorCodes: { OPERATION_CANCELED: 'cancel' },
  isErrorWithCode: e => !!e.code,
}));
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue({});
});
afterEach(() => jest.restoreAllMocks());
it('handles native cancellation without uploading', async () => {
  launchCamera.mockResolvedValue({ didCancel: true });
  expect(await choosePrescription('camera')).toBeNull();
});
it('returns uploadable local file metadata and blocks oversized photos', async () => {
  launchImageLibrary.mockResolvedValue({
    assets: [
      {
        uri: 'file:///test.jpg',
        type: 'image/jpeg',
        fileSize: 50,
        fileName: 'test.jpg',
      },
    ],
  });
  expect(await choosePrescription('photo')).toMatchObject({
    uri: 'file:///test.jpg',
    name: 'test.jpg',
    type: 'image/jpeg',
    size: 50,
  });
  launchImageLibrary.mockResolvedValue({
    assets: [{ uri: 'file:///large.jpg', fileSize: 4000000 }],
  });
  await expect(choosePrescription('photo')).rejects.toThrow('3 MB');
});
it('accepts a PDF content URI and explains denied camera permission', async () => {
  pick.mockResolvedValue([
    {
      uri: 'content://docs/a',
      name: 'a.pdf',
      type: 'application/pdf',
      size: 50,
    },
  ]);
  expect(await choosePrescription('document')).toMatchObject({
    uri: 'content://docs/a',
    type: 'application/pdf',
  });
  launchCamera.mockResolvedValue({ errorCode: 'permission' });
  await expect(choosePrescription('camera')).rejects.toThrow('device settings');
});

it('reports an outdated native binary without invoking the crashing picker', async () => {
  TurboModuleRegistry.get.mockReturnValue(null);
  await expect(choosePrescription('document')).rejects.toThrow(
    'updated app build',
  );
  expect(pick).not.toHaveBeenCalled();
  await expect(choosePrescription('camera')).rejects.toThrow(
    'updated app build',
  );
  expect(launchCamera).not.toHaveBeenCalled();
});
