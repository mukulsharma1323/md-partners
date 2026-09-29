import React, { useState } from 'react';
import useProducts from '../../api/useProducts';
import CatalogStatus from './CatalogStatus';
import PrescriptionSearch from './PrescriptionSearch';
import { View } from 'react-native';
import {
  Screen,
  usePalette,
  MedicineHeading,
  Label,
  Card,
  Button,
  Badge,
  SearchField,
  Tabs,
  Notice,
  money,
  s,
} from './PharmacyUI';
import {
  usePharmacy,
  addToCart,
  expired,
  changeQty,
  subtotal,
  billingMedicine,
  saleUnits,
  unitPrice,
} from './pharmacyData';

export default function NewSale({ navigation }) {
  const data = usePharmacy();
  const palette = usePalette();
  const [query, setQuery] = useState('');
  const catalog = useProducts(query);
  const [units, setUnits] = useState({});
  const [batchSelections, setBatchSelections] = useState({});
  const [message, setMessage] = useState('');
  const confirmed = data.prescriptionReview
    .filter(row => row.reviewStatus === 'confirmed')
    .map(row => row.product);
  const items = [
    ...new Map(
      [
        ...confirmed.filter(m =>
          `${m.name} ${m.salt} ${m.maker}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
        ...catalog.items,
      ].map(m => [m.id, m]),
    ).values(),
  ].map(product => {
    const batches = data.inventory.filter(m => String(m.productId) === String(product.id) && !!m.expiry && !expired(m) && m.stock > 0);
    return batches.find(m => m.id === batchSelections[product.id]) || billingMedicine(product);
  });
  return (
    <Screen
      title="New sale"
      subtitle="Step 1 of 2 · Select medicines & quantity"
      navigation={navigation}
      footer={
        <Button
          title={`Cart & checkout · ${data.cart.length} medicines · ${money(
            subtotal(data.cart),
          )}`}
          disabled={!data.cart.length}
          icon="cart-outline"
          onPress={() => navigation.navigate('Checkout')}
        />
      }
    >
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Brand, salt, strength, manufacturer…"
      />
      <Button
        title="Refresh medicines"
        secondary
        onPress={catalog.refresh}
        disabled={catalog.loading}
      />
      <PrescriptionSearch />
      {data.loading && <Notice text="Loading live stock…" />}
      {!!data.error && <Notice warning text={data.error} />}
      {!!message && <Notice warning text={message} />}
      {items.map(m => {
        const batchChoices = data.inventory.filter(batch => String(batch.productId) === String(m.productId || m.id) && !!batch.expiry && !expired(batch) && batch.stock > 0);
        const unit = units[m.id] || saleUnits(m)[0];
        const index = data.cart.findIndex(
          x => x.id === m.id && x.unit === unit,
        );
        const selected = data.cart[index];
        const inCart = data.cart.some(x => x.id === m.id && x.qty > 0);
        const increment = () => {
          const error = addToCart(m, unit);
          if (error) {
            setMessage(error);
          } else {
            setMessage('');
          }
        };
        return (
          <Card
            key={m.id}
            tint={inCart ? palette.selectedCard : undefined}
            style={inCart ? { borderColor: palette.selectedBorder } : undefined}
          >
            {inCart && (
              <Label bold size={12} color={palette.selectedText}>
                ✓ Added to cart
              </Label>
            )}
            <View style={s.pair}>
              <MedicineHeading medicine={m} />
              <Badge tone={expired(m) ? 'red' : m.rx ? 'purple' : 'green'}>
                {expired(m)
                  ? 'Sale blocked'
                  : m.rx
                  ? 'Rx required'
                  : 'Available'}
              </Badge>
            </View>
            <Label muted size={12}>
              {m.salt} · {m.strength} · {m.form}
            </Label>
            <Label muted size={12}>
              {m.maker}
            </Label>
            <View style={[s.pair, { marginTop: 14 }]}>
              <Label size={12}>
                Shelf {m.shelf || '—'} · {m.stock}{' '}
                {m.form === 'Tablet' ? 'tablets' : 'units'}
              </Label>
              <Label bold>
                {money(unitPrice(m, unit))}
                <Label muted size={11}>
                  {' '}
                  / {unit.toLowerCase()}
                </Label>
              </Label>
            </View>
            <Label muted size={11}>
              Batch {m.batch || 'No stock batch'} · Exp {m.expiry || '—'} · {m.pack} per pack
            </Label>
            {batchChoices.length > 1 && <Tabs
              items={batchChoices.map(batch => `${batch.batch} · ${batch.expiry} · ${batch.stock} units`)}
              value={`${m.batch} · ${m.expiry} · ${m.stock} units`}
              onChange={label => {
                const chosen = batchChoices.find(batch => `${batch.batch} · ${batch.expiry} · ${batch.stock} units` === label);
                if (chosen) setBatchSelections(previous => ({ ...previous, [chosen.productId]: chosen.id }));
              }}
            />}
            <Label muted size={11}>
              Packing: {m.packLabel || `${m.pack} per pack`} ·{' '}
              {m.packingType || m.form}
            </Label>
            <Label muted size={11}>
              MRP {money(m.mrp)} / pack · Retail {money(m.salePrice ?? m.mrp)} /
              pack
            </Label>
            <Label muted size={11}>
              GST {m.gst ?? 0}%
              {m.hsn ? ` · HSN ${m.hsn}` : ''}
              {m.schedule ? ` · Schedule ${m.schedule}` : ''}
            </Label>
            {saleUnits(m).length > 1 && (
              <>
                <Label muted size={11}>
                  {m.unitsPerStrip || m.pack} per strip ·{' '}
                  {money(unitPrice(m, saleUnits(m)[1]))} per{' '}
                  {saleUnits(m)[1].toLowerCase()}
                </Label>
                <Tabs
                  items={saleUnits(m)}
                  value={unit}
                  onChange={v => setUnits({ ...units, [m.id]: v })}
                />
              </>
            )}
            <View style={[s.pair, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                {selected ? (
                  <View style={s.pair}>
                    <Button
                      title="−"
                      secondary
                      small
                      onPress={() => changeQty(index, -1)}
                    />
                    <Label bold>{selected.qty}</Label>
                    <Button title="+" secondary small onPress={increment} />
                  </View>
                ) : (
                  <Button
                    title={!m.batchId ? 'Out of stock' : expired(m) ? 'Expired' : 'Add to cart'}
                    icon="plus"
                    small
                    disabled={expired(m) || !m.stock || !m.batchId}
                    onPress={increment}
                  />
                )}
              </View>
            </View>
          </Card>
        );
      })}
      <CatalogStatus catalog={catalog} />
    </Screen>
  );
}
