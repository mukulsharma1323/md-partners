import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Screen,
  Card,
  Label,
  Button,
  Badge,
  Tabs,
  Section,
  Row,
  Field,
  Notice,
  money,
  s,
} from './PharmacyUI';
import { usePharmacy, update, expired } from './pharmacyData';

export default function Reports({ navigation }) {
  const data = usePharmacy();
  const [period, setPeriod] = useState('Today');
  const [tab, setTab] = useState('Overview');
  const now = new Date();
  const start = period === 'Today'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : period === '7 days'
    ? new Date(now.getTime() - 7 * 86400000)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const invoices = data.orders.filter(o => new Date(o.createdAt) >= start);
  const sales = invoices.reduce((sum, o) => sum + o.amount, 0);
  const payments = mode => invoices.filter(o => o.invoice?.payment?.toLowerCase() === mode.toLowerCase()).reduce((sum, o) => sum + o.amount, 0);
  const movement = Object.values(invoices.flatMap(o => o.invoice?.lines || []).reduce((map, line) => {
    const key = line.name;
    map[key] = map[key] || { name: key, qty: 0 };
    map[key].qty += line.qty;
    return map;
  }, {})).sort((a, b) => b.qty - a.qty);
  return (
    <Screen
      title="Reports"
      subtitle="Understand your counter’s performance"
      navigation={navigation}
    >
      <Tabs
        items={['Today', '7 days', 'This month']}
        value={period}
        onChange={setPeriod}
      />
      <Tabs
        items={['Overview', 'Medicine movement', 'Inventory']}
        value={tab}
        onChange={setTab}
      />
      <Notice text="Figures are calculated from saved retail invoices." />
      {tab === 'Overview' && (
        <>
          <View style={s.grid}>
            {[
              ['Sales', money(sales)],
              ['Bills', invoices.length],
              ['Average bill', money(invoices.length ? sales / invoices.length : 0)],
              ['Discounts', money(invoices.reduce((sum, o) => sum + o.invoice.off, 0))],
            ].map(([label, value]) => (
              <Card key={label} style={{ width: '47%', flexGrow: 1 }}>
                <Label muted size={12}>
                  {label}
                </Label>
                <Label bold size={23}>
                  {value}
                </Label>
              </Card>
            ))}
          </View>
          <Section title="Payment mix" />
          <Card>
            <Row title="Cash" value={money(payments('Cash'))} />
            <Row title="UPI" value={money(payments('UPI'))} />
            <Row title="Card" value={money(payments('Card'))} />
            <Row title="Bank transfer" value={money(payments('Bank Transfer'))} />
          </Card>
        </>
      )}
      {tab === 'Medicine movement' && (
        <>
          <Section title="Fast-moving medicines" />
          {movement.map(({ name, qty }, i) => (
            <Card key={name}>
              <Row
                medicine={{ name }}
                title={`${i + 1}. ${name}`}
                subtitle="Billed quantity · Selected period"
                value={`${qty}`}
                tone="green"
              />
            </Card>
          ))}
          {!movement.length && <Notice text="No sales in this period." />}
        </>
      )}
      {tab === 'Inventory' && (
        <>
          <Card>
            <Label muted>Inventory purchase value · Eligible stock</Label>
            <Label size={30} bold>
              {money(
                data.inventory
                  .filter(m => !expired(m))
                  .reduce((n, m) => n + (m.stock * m.cost) / m.pack, 0),
              )}
            </Label>
            <Row title="Batches tracked" value={`${data.inventory.length}`} />
            <Row
              title="Expired stock loss"
              value={money(
                data.inventory
                  .filter(expired)
                  .reduce((n, m) => n + (m.stock * m.cost) / m.pack, 0),
              )}
              tone="red"
            />
          </Card>
          <Button
            title="Review expiry losses"
            secondary
            onPress={() => navigation.navigate('Expiry')}
          />
        </>
      )}
    </Screen>
  );
}
export function ShiftClosing({ navigation }) {
  const data = usePharmacy();
  const [opening, setOpening] = useState('2000');
  const [expenses, setExpenses] = useState('250');
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [closed, setClosed] = useState(false);
  const demoSales = type =>
    data.orders
      .filter(o => o.invoice && o.invoice.payment === type)
      .reduce((sum, o) => sum + o.amount, 0);
  const cash = 4280 + demoSales('Cash');
  const expected = (Number(opening) || 0) + cash - (Number(expenses) || 0);
  const difference = (Number(counted) || 0) - expected;
  return (
    <Screen
      title="Shift closing"
      subtitle="Priya · Counter 01 · 9:00 AM – 6:00 PM"
      navigation={navigation}
      footer={
        <Button
          title={
            closed ? 'Shift closed in demo' : 'Reconcile & close demo shift'
          }
          disabled={
            closed ||
            !counted.trim() ||
            Number(counted) < 0 ||
            Number(opening) < 0 ||
            Number(expenses) < 0 ||
            (difference !== 0 && !note.trim())
          }
          onPress={() => setClosed(true)}
        />
      }
    >
      <Badge tone={closed ? 'green' : 'blue'}>
        {closed ? 'Closed · Reconciled' : 'Active shift'}
      </Badge>
      <Section title="Collections" />
      <Card>
        <Row title="Cash sales" icon="cash" value={money(cash)} />
        <Row
          title="UPI sales"
          icon="qrcode"
          value={money(6800 + demoSales('UPI'))}
        />
        <Row
          title="Card sales"
          icon="credit-card-outline"
          value={money(1400 + demoSales('Card'))}
        />
      </Card>
      <Section title="Cash reconciliation" />
      <Card>
        <Field
          label="Opening cash (₹)"
          numeric
          value={opening}
          onChangeText={setOpening}
        />
        <Field
          label="Cash expenses (₹)"
          numeric
          value={expenses}
          onChangeText={setExpenses}
        />
        <Row title="Expected cash in drawer" value={money(expected)} />
        <Field
          label="Counted cash (₹)"
          numeric
          value={counted}
          onChangeText={setCounted}
        />
        {counted !== '' && (
          <Row
            title={
              difference === 0
                ? 'Cash matched'
                : difference < 0
                ? 'Cash shortage'
                : 'Cash excess'
            }
            value={money(Math.abs(difference))}
            tone={difference === 0 ? 'green' : 'red'}
          />
        )}
        <Field
          label="Expense details / mismatch explanation"
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Required if counted cash differs from expected cash"
        />
      </Card>
      <Notice
        warning={difference !== 0 && counted !== ''}
        text={
          closed
            ? 'Shift summary saved in this screen. No real ledger entries were created.'
            : 'Record any mismatch explanation before closing. Payment figures include this session’s demo sales.'
        }
      />
    </Screen>
  );
}
export function CounterStatus({ navigation }) {
  const data = usePharmacy();
  return (
    <Screen
      title="Counter & sync"
      subtitle="Clear status, even during connection issues"
      navigation={navigation}
    >
      <Card>
        <Badge tone={data.offline ? 'orange' : 'green'}>
          {data.offline ? 'Offline demo' : 'Connected demo'}
        </Badge>
        <Section
          title={
            data.offline
              ? 'Working with sample local data'
              : 'Your counter is ready'
          }
        />
        <Label muted>
          Drafts remain available while navigating this app session. App restart
          persistence and real sync are not connected.
        </Label>
        <Row
          title="Current draft"
          value={
            data.draft ? `${data.cart.length} medicine lines` : 'No open draft'
          }
        />
        <Row
          title="Pending sync"
          value={`${data.sync} invoices`}
          tone={data.sync ? 'orange' : 'green'}
        />
        <Button
          title={
            data.offline
              ? 'Switch to connected demo'
              : 'Simulate internet issue'
          }
          secondary
          onPress={() => update({ offline: !data.offline })}
        />
      </Card>
      {data.sync > 0 && (
        <Button
          title="Retry demo sync"
          disabled={data.offline}
          onPress={() => update({ sync: 0 })}
        />
      )}
      <Section title="Counter preferences" />
      <Card>
        <Row
          title="Barcode scanner"
          subtitle="Sample barcode lookup enabled"
          value="Demo"
        />
        <Row
          title="Receipt printer"
          subtitle="Invoice preview available"
          value="Demo"
        />
        <Row
          title="Auto-save"
          subtitle="In-memory session draft"
          value="Enabled"
          tone="green"
        />
        <Row
          title="Signed in"
          subtitle="Priya Sharma · Pharmacist · Counter 01"
        />
      </Card>
    </Screen>
  );
}
