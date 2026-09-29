import React, { useState } from 'react';
import useProducts from '../../api/useProducts';
import CatalogStatus from './CatalogStatus';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Screen,
  MedicineHeading,
  MedicineImage,
  usePalette,
  Card,
  Label,
  Button,
  Badge,
  SearchField,
  Tabs,
  Row,
  Notice,
  Empty,
  money,
  s,
} from './PharmacyUI';
import { usePharmacy, expired, nearExpiry } from './pharmacyData';

function StockMedicineCard({ medicine: m, grid, width, navigation }) {
  const p = usePalette();
  if (m.catalogOnly) {
    return (
      <Card style={grid ? { width, padding: 14 } : undefined}>
        {grid ? (
          <>
            <MedicineImage medicine={m} large />
            <Label bold>{m.name}</Label>
          </>
        ) : (
          <MedicineHeading medicine={m} />
        )}
        <Label muted>{m.salt}</Label>
        <Label muted>
          {m.strength} · {m.form}
        </Label>
        <Label muted>{m.maker}</Label>
        <View style={[s.pair, { marginTop: 12 }]}>
          <Label bold>MRP {money(m.mrp)}</Label>
          <Badge tone={m.rx ? 'purple' : 'blue'}>
            {m.rx ? 'Rx required' : 'Medicine'}
          </Badge>
        </View>
      </Card>
    );
  }
  const isExpired = expired(m);
  const tone = !m.expiry
    ? 'red'
    : isExpired
    ? 'red'
    : nearExpiry(m) || m.stock < m.min
    ? 'orange'
    : 'green';
  const status = !m.expiry
    ? 'Expiry missing · blocked'
    : isExpired
    ? 'Expired · blocked'
    : nearExpiry(m)
    ? 'Expiring soon'
    : m.stock < m.min
    ? 'Low stock'
    : 'In stock';
  const quantity = (
    <View style={stockStyles.quantity}>
      <Label bold size={grid ? 24 : 28}>
        {m.stock}
      </Label>
      <Label muted size={11}>
        {m.form === 'Tablet' ? 'tablets' : 'units'}
      </Label>
    </View>
  );
  const details = (
    <View style={stockStyles.identity}>
      <Label bold size={16}>
        {m.name}
      </Label>
      <Label muted size={12}>
        {m.strength} · {m.form}
      </Label>
    </View>
  );
  const fact = (label, value, right) => (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: right ? 'flex-end' : 'flex-start',
      }}
    >
      <Label muted size={10}>
        {label}
      </Label>
      <Label bold size={12} style={right ? { textAlign: 'right' } : undefined}>
        {value}
      </Label>
    </View>
  );
  return (
    <Card
      style={[
        stockStyles.card,
        grid && { width, padding: 14, marginBottom: 0 },
      ]}
    >
      {grid ? (
        <>
          <MedicineImage medicine={m} large />
          <View style={{ marginTop: 12 }}>{details}</View>
        </>
      ) : (
        <View style={stockStyles.top}>
          <MedicineImage medicine={m} size={70} />
          {details}
          {quantity}
        </View>
      )}
      <View style={[stockStyles.status, grid && { alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Badge tone={tone}>{status}</Badge>
        </View>
        {grid ? (
          quantity
        ) : (
          <Label muted size={12} style={{ textAlign: 'right', flexShrink: 1 }}>
            Shelf{' '}
            <Label bold size={12}>
              {m.shelf}
            </Label>
          </Label>
        )}
      </View>
      <View style={[stockStyles.facts, { borderColor: p.line }]}>
        <View style={stockStyles.factRow}>
          {fact('Batch', m.batch)}
          {fact('Expiry', m.expiry.slice(0, 7), true)}
        </View>
        <View style={stockStyles.factRow}>
          {fact(
            grid ? 'Shelf' : 'Minimum stock',
            grid ? m.shelf : `${m.min} units`,
          )}
          {fact(
            grid ? 'Min. stock' : 'MRP / pack',
            grid ? `${m.min} units` : money(m.mrp),
            true,
          )}
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Button
          title="Batch details"
          small
          secondary
          onPress={() => navigation.navigate('BatchDetail', { id: m.id })}
        />
      </View>
    </Card>
  );
}
const stockStyles = StyleSheet.create({
  card: { padding: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1, minWidth: 0, gap: 4 },
  quantity: { alignItems: 'flex-end', flexShrink: 0 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
  },
  facts: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 10 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
});

export default function Stock({ navigation, route }) {
  const data = usePharmacy();
  const [mode, setMode] = useState('Live stock');
  const [filter, setFilter] = useState(route?.params?.filter || 'All stock');
  const { width } = useWindowDimensions();
  const [q, setQ] = useState('');
  const catalog = useProducts(q);
  const [layout, setLayout] = useState('List');
  const rows =
    mode === 'Live catalog'
      ? catalog.items
      : data.inventory.filter(
          m =>
            `${m.name} ${m.salt} ${m.batch} ${m.maker}`
              .toLowerCase()
              .includes(q.toLowerCase()) &&
            (filter !== 'Low stock' || (!expired(m) && m.stock < m.min)) &&
            (filter !== 'Near expiry' || nearExpiry(m)) &&
            (filter !== 'Expired' || expired(m)),
        );
  return (
    <Screen
      title="Medicines"
      subtitle={
        mode === 'Live catalog'
          ? 'Live product catalog'
          : 'Live batches at your store'
      }
      navigation={navigation}
      action="plus-circle-outline"
      onAction={() => navigation.navigate('PurchaseEntry')}
    >
      <Tabs
        items={['Live catalog', 'Live stock']}
        value={mode}
        onChange={setMode}
      />
      {mode === 'Live stock' && (
        <Tabs
          items={['All stock', 'Low stock', 'Near expiry', 'Expired']}
          value={filter}
          onChange={setFilter}
        />
      )}
      <SearchField value={q} onChangeText={setQ} />
      <Notice
        text={
          mode === 'Live catalog'
            ? 'Browse all medicines. Open live stock to view available batches.'
            : 'Batch quantities and expiry are loaded from your assigned store.'
        }
      />
      {mode === 'Live catalog' && (
        <Button
          title="Refresh medicines"
          secondary
          onPress={catalog.refresh}
          disabled={catalog.loading}
        />
      )}
      <View style={s.pair}>
        <Label muted size={12}>
          {rows.length} medicines
        </Label>
        <Tabs items={['List', 'Grid']} value={layout} onChange={setLayout} />
      </View>
      <View style={layout === 'Grid' ? s.grid : undefined}>
        {rows.map(m => (
          <StockMedicineCard
            key={m.id}
            medicine={m}
            grid={layout === 'Grid'}
            width={(width - 52) / 2}
            navigation={navigation}
          />
        ))}
      </View>
      {mode === 'Live catalog' ? (
        <CatalogStatus catalog={catalog} />
      ) : (
        !rows.length && <Empty />
      )}
    </Screen>
  );
}
export function BatchDetail({ navigation, route }) {
  const { inventory } = usePharmacy();
  const m = inventory.find(x => x.id === route.params.id);
  if (!m) {
    return <Screen title="Batch details" navigation={navigation}><Empty title="Batch unavailable" /></Screen>;
  }
  return (
    <Screen
      title={m.name}
      subtitle={`${m.salt} · ${m.strength} · ${m.form}`}
      navigation={navigation}
    >
      <Notice
        warning={expired(m)}
        text={
          expired(m)
            ? 'Expired batch · Sale blocked. Move to quarantine and arrange supplier return.'
            : 'Batch suggestion uses earliest expiry first among eligible stock.'
        }
      />
      <Card>
        <MedicineHeading medicine={m} />
        <Badge tone={expired(m) ? 'red' : 'blue'}>{m.batch}</Badge>
        <Row title="Manufacturer" subtitle={m.maker} />
        <Row title="Expiry date" value={m.expiry} />
        <Row title="Shelf location" value={m.shelf} />
        <Row title="Available quantity" value={`${m.stock} base units`} />
        <Row title="Pack size" value={`${m.pack} per pack`} />
        <Row title="Purchase price / pack" value={money(m.cost)} />
        <Row title="MRP / pack" value={money(m.mrp)} />
        <Row title="Minimum stock" value={`${m.min} base units`} />
      </Card>
      <Button
        title="Request stock adjustment"
        secondary
        onPress={() => navigation.navigate('Adjustments', { id: m.id })}
      />
    </Screen>
  );
}
export function Expiry({ navigation }) {
  const { inventory } = usePharmacy();
  const [filter, setFilter] = useState('Next 30 days');
  const list = inventory.filter(filter === 'Expired' ? expired : nearExpiry);
  return (
    <Screen
      title="Expiry control"
      subtitle="Review early. Reduce avoidable losses."
      navigation={navigation}
    >
      <Notice text="FEFO · Suggest the earliest eligible expiry first. Expired batches are blocked at billing." />
      <Tabs
        items={['Next 30 days', 'Expired']}
        value={filter}
        onChange={setFilter}
      />
      {list.map(m => (
        <Card key={m.id}>
          <Badge tone={expired(m) ? 'red' : 'orange'}>
            {expired(m) ? 'Quarantine · Sale blocked' : 'Expires in 23 days'}
          </Badge>
          <MedicineHeading medicine={m} />
          <Label muted>
            {m.batch} · {m.stock} tablets · Shelf {m.shelf}
          </Label>
          <Row title="Expiry" value={m.expiry} />
          <Row
            title="Purchase value at risk"
            value={money((m.stock * m.cost) / m.pack)}
          />
          <Button
            title={expired(m) ? 'Create supplier return' : 'Review batch'}
            secondary
            onPress={() => navigation.navigate('BatchDetail', { id: m.id })}
          />
        </Card>
      ))}
      {!list.length && <Empty title="No batches to review" />}
    </Screen>
  );
}
export function Reorder({ navigation }) {
  const data = usePharmacy();
  const list = data.inventory.filter(m => !expired(m) && m.stock < m.min);
  return (
    <Screen
      title="Low stock"
      subtitle="Batches below minimum stock"
      navigation={navigation}
      footer={
        <Button
          title="Receive a purchase"
          onPress={() => navigation.navigate('PurchaseEntry')}
        />
      }
    >
      <Notice text="Suggested quantities restore minimum stock, rounded up to full packs." />
      {list.map(m => (
        <Card key={m.id}>
          <View style={s.pair}>
            <MedicineHeading medicine={m} />
            <Badge tone="orange">Low stock</Badge>
          </View>
          <Label muted>
            Available {m.stock} · Minimum {m.min}
          </Label>
          <Row
            title="Suggested purchase"
            value={`${Math.ceil((m.min - m.stock) / m.pack)} packs`}
          />
        </Card>
      ))}
      {!list.length && <Empty title="Stock levels look good" />}
    </Screen>
  );
}
