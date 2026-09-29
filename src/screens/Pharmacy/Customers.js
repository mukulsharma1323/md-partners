import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Screen,
  Card,
  Label,
  Button,
  Badge,
  SearchField,
  Section,
  Row,
  Tabs,
  Field,
  Notice,
  Empty,
  money,
  s,
} from './PharmacyUI';
import { usePharmacy, update } from './pharmacyData';

export default function Customers({ navigation }) {
  const { customers } = usePharmacy();
  const [q, setQ] = useState('');
  const list = customers.filter(c =>
    `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Screen
      title="Customers"
      subtitle="A complete view of every customer"
      navigation={navigation}
    >
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search customer name or phone…"
      />
      <Section title={`${list.length} customers`} />
      {list.map(c => (
        <Card key={c.id}>
          <Row
            title={c.name}
            subtitle={c.phone}
            icon="account-outline"
            value={c.due ? `${money(c.due)} due` : 'Settled'}
            tone={c.due ? 'orange' : 'green'}
            onPress={() => navigation.navigate('CustomerDetail', { id: c.id })}
          />
        </Card>
      ))}
      {!list.length && <Empty />}
    </Screen>
  );
}
export function CustomerDetail({ navigation, route }) {
  const data = usePharmacy();
  const [tab, setTab] = useState('Purchases');
  const c = data.customers.find(x => x.id === route.params.id);
  if (!c) {
    return <Screen title="Customer" navigation={navigation}><Empty title="Customer unavailable" /></Screen>;
  }
  const belongs = x =>
    x.customerId ? x.customerId === c.id : x.customer === c.name;
  return (
    <Screen
      title={route.params.displayName || c.name}
      subtitle={c.phone}
      navigation={navigation}
    >
      <Card>
        <View style={s.pair}>
          <Badge>{c.customerCode || 'Retail customer'}</Badge>
          <Badge tone={c.due ? 'orange' : 'green'}>{money(c.due)} due</Badge>
        </View>
        <View style={[s.pair, { marginTop: 18 }]}>
          <View>
            <Label size={25} bold>
              {data.orders.filter(belongs).length}
            </Label>
            <Label muted size={12}>
              Visits
            </Label>
          </View>
          <View>
            <Label size={25} bold>
              {money(
                data.orders.filter(x => belongs(x) && x.invoice).reduce((sum, x) => sum + x.amount, 0),
              )}
            </Label>
            <Label muted size={12}>
              Lifetime purchases
            </Label>
          </View>
        </View>
      </Card>
      <Tabs
        items={['Purchases', 'Bills']}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Purchases' && (
        <>
          {data.orders.filter(belongs).map(o => (
            <Card key={o.id}>
              <Row
                medicine={{ name: o.items }}
                title={o.items}
                subtitle={o.id}
                value={money(o.amount)}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
              />
            </Card>
          ))}
        </>
      )}
      {tab === 'Bills' && (
        <Card>
          {data.orders
            .filter(x => belongs(x) && x.invoice)
            .map(o => (
              <Row
                key={o.id}
                title={o.id}
                subtitle={`Paid by ${o.invoice.payment}`}
                value={money(o.amount)}
                onPress={() => {
                  update({ invoice: o.invoice });
                  navigation.navigate('Invoice');
                }}
              />
            ))}
        </Card>
      )}
    </Screen>
  );
}
export function Returns({ navigation }) {
  const data = usePharmacy();
  const [bill, setBill] = useState('MD-1032');
  const [found, setFound] = useState(false);
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('Wrong item');
  const [condition, setCondition] = useState('Sealed & intact');
  const [refund, setRefund] = useState('UPI');
  const [saved, setSaved] = useState(false);
  return (
    <Screen
      title="Returns & refunds"
      subtitle="Always linked to the original bill"
      navigation={navigation}
    >
      <Field
        label="Original bill number"
        value={bill}
        onChangeText={v => {
          setBill(v);
          setFound(false);
          setSaved(false);
        }}
        placeholder="Try MD-1032"
      />
      <Button
        title="Find original bill"
        secondary
        icon="receipt"
        onPress={() => setFound(bill.trim().toUpperCase() === 'MD-1032')}
      />
      {!found && (
        <Notice text="Demo lookup: use MD-1032 for Ananya Sharma’s Dolo 650 purchase." />
      )}
      {found && (
        <>
          <Section title="Original purchase" />
          <Card>
            <Label bold>Ananya Sharma · MD-1032</Label>
            <Label muted>05 Sep 2026 · Paid ₹33 by UPI</Label>
            <Row
              medicine={{ name: 'Dolo 650' }}
              title="Dolo 650 · DL0926"
              subtitle="Sold: 1 strip (15 tablets) · Previously returned: 0"
            />
            <Field
              label="Return quantity (strips, max 1)"
              value={qty}
              onChangeText={setQty}
              numeric
            />
            <Tabs
              items={['Wrong item', 'Damaged pack', 'Customer request']}
              value={reason}
              onChange={setReason}
            />
            <Label bold size={12}>
              Returned stock condition
            </Label>
            <Tabs
              items={['Sealed & intact', 'Opened', 'Damaged']}
              value={condition}
              onChange={setCondition}
            />
            <Notice
              warning
              text={
                condition === 'Sealed & intact'
                  ? 'Awaiting pharmacist condition review before restocking.'
                  : 'Quarantine only. Opened or damaged returns cannot be restocked.'
              }
            />
            <Label bold size={12}>
              Refund method
            </Label>
            <Tabs
              items={['UPI', 'Cash', 'Card']}
              value={refund}
              onChange={setRefund}
            />
            <Row title="Refund amount" value={money((Number(qty) || 0) * 33)} />
            <Button
              title={
                saved
                  ? 'Return recorded · Refund pending'
                  : 'Record demo return'
              }
              disabled={
                saved ||
                Number(qty) !== 1 ||
                data.returns.some(r => r.bill === 'MD-1032')
              }
              onPress={() => {
                update({
                  returns: [
                    {
                      id: `RT-${42 + data.returns.length}`,
                      bill: 'MD-1032',
                      qty,
                      reason,
                      condition,
                      refund,
                      amount: 33,
                      status: 'Refund pending',
                    },
                    ...data.returns,
                  ],
                });
                setSaved(true);
              }}
            />
          </Card>
        </>
      )}
      <Section title="Return tracking" />
      {data.returns.map(r => (
        <Card key={r.id}>
          <Badge tone="orange">{r.status}</Badge>
          <Section title={`${r.id} · ${r.bill}`} />
          <Label>
            {r.reason} · {r.condition}
          </Label>
          <Row title={`Refund via ${r.refund}`} value={money(r.amount)} />
          <Label muted size={12}>
            Stock:{' '}
            {r.condition === 'Sealed & intact'
              ? 'Awaiting pharmacist inspection'
              : 'Quarantined'}
          </Label>
        </Card>
      ))}
      {!data.returns.length && (
        <Empty
          title="No new returns"
          subtitle="Recorded returns and refund statuses appear here."
        />
      )}
    </Screen>
  );
}
export function Payments({ navigation }) {
  const { customers } = usePharmacy();
  const [tab, setTab] = useState('Customers');
  return (
    <Screen
      title="Pending payments"
      subtitle="Receivables and supplier dues"
      navigation={navigation}
    >
      <Tabs items={['Customers', 'Suppliers']} value={tab} onChange={setTab} />
      {tab === 'Customers' ? (
        customers
          .filter(c => c.due)
          .map(c => (
            <Card key={c.id}>
              <Row
                title={c.name}
                subtitle="Outstanding customer balance"
                value={money(c.due)}
                tone="orange"
                onPress={() =>
                  navigation.navigate('CustomerDetail', { id: c.id })
                }
              />
            </Card>
          ))
      ) : (
        <>
          <Card>
            <Row
              title="Shree Pharma Distributors"
              subtitle="Due 12 Sep 2026"
              value="₹18,450"
              tone="orange"
              onPress={() =>
                navigation.navigate('SupplierDetail', { id: 's1' })
              }
            />
          </Card>
          <Card>
            <Row
              title="Himalaya Medical Agencies"
              subtitle="Due 15 Sep 2026"
              value="₹6,200"
              tone="orange"
              onPress={() =>
                navigation.navigate('SupplierDetail', { id: 's2' })
              }
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
