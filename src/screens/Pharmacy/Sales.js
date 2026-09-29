import React, { useState } from 'react';
import {
  Screen,
  Card,
  Row,
  SearchField,
  Section,
  Notice,
  Empty,
  money,
} from './PharmacyUI';
import { usePharmacy, update } from './pharmacyData';
export default function Sales({ navigation }) {
  const data = usePharmacy();
  const [q, setQ] = useState('');
  const rows = data.orders.filter(o =>
    `${o.id} ${o.customer}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Screen
      title="Sales history"
      subtitle="Today’s bills and counter sales"
      navigation={navigation}
    >
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search bill number or customer…"
      />
      <Notice text="Retail invoices saved at your assigned store." />
      <Section title={`${rows.length} records`} />
      {rows.map(o => (
        <Card key={o.id}>
          <Row
            title={o.id}
            subtitle={`${o.customer} · ${o.invoice?.payment || ''}`}
            value={money(o.amount)}
            onPress={() => {
              if (o.invoice) {
                update({ invoice: o.invoice });
                navigation.navigate('Invoice');
              } else {
                navigation.navigate('OrderDetail', { id: o.id });
              }
            }}
          />
        </Card>
      ))}
      {!rows.length && <Empty />}
    </Screen>
  );
}
