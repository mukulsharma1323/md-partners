import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// User-provided sample; imageUrl can be supplied per medicine when data is connected.
export const sampleMedicineImage = require('./assets/medicine-sample.jpg');
export default function MedicineImage({ medicine, size = 64, large = false }) {
  const [expanded, setExpanded] = useState(false);
  const [failedUrl, setFailedUrl] = useState(null);
  const insets = useSafeAreaInsets();
  const name = medicine?.name || 'Medicine';
  const uri = medicine?.imageUrl;
  const source = uri && uri !== failedUrl ? { uri } : sampleMedicineImage;
  const close = () => setExpanded(false);
  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Enlarge image of ${name}`}
        accessibilityHint="Opens a full-screen medicine image"
        onPress={event => {
          event?.stopPropagation();
          setExpanded(true);
        }}
        style={[
          styles.thumbnail,
          large
            ? { width: '100%', height: 120, marginTop: 12 }
            : { width: size, height: size },
        ]}
      >
        <Image
          source={source}
          resizeMode="contain"
          style={styles.image}
          onError={() => setFailedUrl(uri)}
        />
        <View style={styles.expand}>
          <Icon name="arrow-expand" size={12} color="#0077FF" />
        </View>
      </TouchableOpacity>
      {expanded && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={close}
          statusBarTranslucent
        >
          <View
            style={[
              styles.overlay,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 24,
              },
            ]}
            accessibilityViewIsModal
          >
            <View style={styles.header}>
              <Text style={styles.title}>{name}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close enlarged medicine image"
                onPress={close}
                style={styles.close}
              >
                <Icon name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.preview}>
              <Image
                accessibilityLabel={`${name} enlarged image`}
                source={source}
                resizeMode="contain"
                style={styles.image}
                onError={() => setFailedUrl(uri)}
              />
            </View>
            <Text style={styles.caption}>
              {uri && uri !== failedUrl
                ? 'Medicine image'
                : 'Sample medicine image'}
            </Text>
          </View>
        </Modal>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  thumbnail: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EDF4',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  expand: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    backgroundColor: '#EAF3FF',
    padding: 3,
    borderRadius: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#08111FED',
    paddingHorizontal: 20,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: '#FFFFFF', fontFamily: 'DMSans-Bold', fontSize: 20 },
  close: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF20',
  },
  preview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 12,
  },
  caption: {
    color: '#D6E2F2',
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
