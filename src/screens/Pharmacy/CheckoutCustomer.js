import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Card,
  Label,
  Field,
  Button,
  Badge,
  s,
  blue,
  usePalette,
} from './PharmacyUI';
import { usePharmacy, update, setCustomerMobile } from './pharmacyData';
import { choosePrescription } from '../../services/prescriptionPicker';

export default function CheckoutCustomer({ navigation, needsRx }) {
  const data = usePharmacy();
  const p = usePalette();
  const customer = data.customers.find(c => c.id === data.customerId);
  const attachment = data.checkoutPrescription;
  const upload = async source => {
    try {
      const file = await choosePrescription(source);
      if (file) update({ checkoutPrescription: { file: file.name, ...file, source, verified: false }, draft: true });
    } catch (error) {
      Alert.alert('Prescription', error.message);
    }
  };
  return (
    <>
      <Card>
        <View style={[s.pair, { marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <Label bold size={18}>
              Customer details
            </Label>
            <Label muted size={12}>
              Enter mobile to find an existing customer
            </Label>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View customer history"
            accessibilityState={{ disabled: !customer }}
            disabled={!customer}
            onPress={() =>
              navigation.navigate('CustomerDetail', {
                id: customer.id,
                displayName: data.customerName.trim() || customer.name,
              })
            }
            style={{
              padding: 12,
              borderRadius: 14,
              backgroundColor: p.soft,
              opacity: customer ? 1 : 0.4,
            }}
          >
            <Icon name="history" size={24} color={blue} />
          </TouchableOpacity>
        </View>
        <Field
          label="Mobile number"
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          value={data.customerMobile}
          onChangeText={setCustomerMobile}
        />
        {data.customerMobile.length === 10 && (
          <View style={{ marginBottom: 12 }}>
            <Badge tone={customer ? 'green' : 'blue'}>
              {customer
                ? 'Existing customer found'
                : 'New customer · Enter their name'}
            </Badge>
          </View>
        )}
        <Field
          label="Customer name"
          placeholder="Enter customer name"
          value={data.customerName}
          editable={!customer}
          onChangeText={value => update({ customerName: value, draft: true })}
        />
        <Label muted size={11}>
          {customer
            ? 'Existing customer found. Tap history to view saved bills.'
            : 'Customer details are optional for a walk-in sale. History is available when an existing mobile number is found.'}
        </Label>
      </Card>
      <Card>
        <View style={s.pair}>
          <Label bold size={18}>
            Prescription
          </Label>
          <Badge tone={needsRx ? 'orange' : 'blue'}>
            {needsRx ? 'Required for Rx items' : 'Optional'}
          </Badge>
        </View>
        {!attachment ? (
          <>
            <Label muted size={12} style={{ marginBottom: 16 }}>
              Select a photo or PDF for the pharmacist check. The file is not stored with the invoice.
            </Label>
            {data.prescriptionSource && (
              <Button
                title="Use scanned prescription"
                icon="file-check-outline"
                secondary
                onPress={() =>
                  update({
                    checkoutPrescription: {
                      file: data.prescriptionSource.name,
                      uri: data.prescriptionSource.uri,
                      type: data.prescriptionSource.type,
                      source: 'Prescription scan',
                      verified: false,
                    },
                    draft: true,
                  })
                }
              />
            )}
            <Button
              title="Select prescription"
              icon="cloud-upload-outline"
              secondary
              onPress={() =>
                Alert.alert(
                  'Upload prescription',
                  'Choose a photo or PDF from this device.',
                  [
                    {
                      text: 'Photo library',
                      onPress: () => upload('library'),
                    },
                    { text: 'Document', onPress: () => upload('document') },
                    { text: 'Cancel', style: 'cancel' },
                  ],
                )
              }
            />
          </>
        ) : (
          <>
            <View style={[s.pair, { marginVertical: 14 }]}>
              <Icon name="file-document-outline" size={28} color={blue} />
              <View style={{ flex: 1 }}>
                <Label bold>{attachment.file}</Label>
                <Label muted size={11}>
                  {attachment.source} · Selected on this device
                </Label>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remove prescription"
                onPress={() =>
                  update({ checkoutPrescription: null, draft: true })
                }
                style={{ padding: 10 }}
              >
                <Icon name="close" size={20} color={p.muted} />
              </TouchableOpacity>
            </View>
            <Button
              title={
                attachment.verified
                  ? '✓ Prescription checked by pharmacist'
                  : 'Confirm pharmacist prescription check'
              }
              secondary
              icon={
                attachment.verified
                  ? 'checkbox-marked-outline'
                  : 'checkbox-blank-outline'
              }
              onPress={() =>
                update({
                  checkoutPrescription: {
                    ...attachment,
                    verified: !attachment.verified,
                  },
                  draft: true,
                })
              }
            />
            <Label muted size={11} style={{ marginTop: 10 }}>
              Check patient, medicine, strength and directions before
              confirming.
            </Label>
          </>
        )}
      </Card>
    </>
  );
}
