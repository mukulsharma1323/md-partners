import React, { useState } from 'react';
import {
  Screen,
  MedicineHeading,
  Card,
  Label,
  Button,
  Badge,
  SearchField,
  Section,
  Notice,
  Empty,
  money,
  s,
} from './PharmacyUI';
import { View } from 'react-native';
import { usePharmacy, update } from './pharmacyData';

export default function Orders({ navigation }) {
  const { orders } = usePharmacy();
  const [q, setQ] = useState('');
  const filtered = orders.filter(o => `${o.id} ${o.customer}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen
      title="Retail sales"
      subtitle="Retail invoices from your store"
      navigation={navigation}
      action="plus"
      onAction={() => navigation.navigate('POS')}
    >
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search order ID or customer…"
      />
      {filtered.map(o => (
        <Card key={o.id}>
          <View style={s.pair}>
            <Badge>{o.channel}</Badge>
            <Badge
              tone={
                ['Delivered', 'Handed over'].includes(o.status)
                  ? 'green'
                  : 'orange'
              }
            >
              {o.status}
            </Badge>
          </View>
          <Section title={o.customer} />
          <Label muted size={12}>{o.id} · {String(o.createdAt || '').slice(0, 10)}</Label>
          <MedicineHeading medicine={{ name: o.items }} />
          <View style={s.pair}>
            <Label bold size={20}>
              {money(o.amount)}
            </Label>
            <Button
              title="View order"
              small
              secondary
              onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
            />
          </View>
        </Card>
      ))}
      {!filtered.length && <Empty />}
    </Screen>
  );
}
export function OrderDetail({ navigation, route }) {
  const data = usePharmacy();
  const o = data.orders.find(x => x.id === route.params.id);
  if (!o) {
    return <Screen title="Invoice" navigation={navigation}><Empty title="Invoice unavailable" /></Screen>;
  }
  const stages = [
    'Received',
    'Verified',
    'Packed',
    o.channel === 'Counter' ? 'Handed over' : 'Delivered',
  ];
  const index = stages.indexOf(o.status);
  const verified =
    !o.rx ||
    data.prescriptions.some(
      p =>
        (p.customerId && o.customerId
          ? p.customerId === o.customerId
          : p.customer === o.customer) && p.status === 'Verified',
    );
  return (
    <Screen
      title={o.id}
      subtitle={`${o.channel} sale · ${String(o.createdAt || '').slice(0, 10)}`}
      navigation={navigation}
    >
      <Card>
        <Label bold size={22}>
          {o.customer}
        </Label>
        <MedicineHeading medicine={{ name: o.items }} />
        <Label bold size={28} style={{ marginTop: 14 }}>
          {money(o.amount)}
        </Label>
      </Card>
      <Section title="Order progress" />
      <Card>
        {stages.map((stage, i) => (
          <View
            key={stage}
            style={{
              flexDirection: 'row',
              gap: 14,
              alignItems: 'center',
              paddingVertical: 14,
            }}
          >
            <Badge tone={i <= index ? 'green' : 'blue'}>
              {i < index ? '✓' : `${i + 1}`}
            </Badge>
            <View>
              <Label bold>{stage}</Label>
              <Label muted size={12}>
                {i < index
                  ? 'Completed'
                  : i === index
                  ? 'Current stage'
                  : 'Upcoming'}
              </Label>
            </View>
          </View>
        ))}
      </Card>
      {o.rx && (
        <Notice
          warning={!verified}
          text={
            verified
              ? 'Prescription reviewed by pharmacist.'
              : 'Pharmacist verification required before this order can advance.'
          }
        />
      )}
      {!verified && (
        <Button
          title="Review prescription"
          secondary
          onPress={() => {
            const prescription = data.prescriptions.find(p =>
              p.customerId
                ? p.customerId === o.customerId
                : p.customer === o.customer,
            );
            navigation.navigate(
              prescription ? 'PrescriptionReview' : 'POS',
              prescription ? { id: prescription.id } : undefined,
            );
          }}
        />
      )}
      {o.invoice && (
        <View style={{ marginTop: 12 }}>
          <Button
            title="View invoice"
            secondary
            onPress={() => {
              update({ invoice: o.invoice });
              navigation.navigate('Invoice');
            }}
          />
        </View>
      )}
    </Screen>
  );
}
