import React, { useMemo, useState } from 'react';
import useProducts from '../../api/useProducts';
import CatalogStatus from './CatalogStatus';
import { View } from 'react-native';
import {
  Screen,
  MedicineHeading,
  Card,
  Label,
  Button,
  Badge,
  Field,
  Section,
  Notice,
  Empty,
  Tabs,
  money,
} from './PharmacyUI';
import {
  usePharmacy,
  update,
  addToCart,
  billingMedicine,
  saleUnits,
  unitPrice,
} from './pharmacyData';

export function PrescriptionReview({ navigation, route }) {
  const data = usePharmacy();
  const p = data.prescriptions.find(x => x.id === route.params.id);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState(p?.note || '');
  if (!p) return <Screen title="Prescription" navigation={navigation}><Notice text="No saved prescription for this customer." /></Screen>;
  const change = status =>
    update({
      prescriptions: data.prescriptions.map(x =>
        x.id === p.id ? { ...x, status, note } : x,
      ),
    });
  return (
    <Screen title={p.id} subtitle={p.customer} navigation={navigation}>
      <Badge tone={p.status === 'Verified' ? 'green' : 'orange'}>
        {p.status}
      </Badge>
      <Section title="Document preview" />
      <Card tint="#F5F8FD">
        <Label color="#0077FF" bold>
          SAMPLE PRESCRIPTION
        </Label>
        <Label color="#162238" size={20} bold style={{ marginVertical: 15 }}>
          Dr. A. Mehta
        </Label>
        <Label color="#69778C" size={12}>
          07 September 2026 · Patient: {p.customer}
        </Label>
        <Label color="#162238" style={{ marginVertical: 20 }}>
          Rx{'\n\n'}Medicine / strength: [sample entry]{'\n'}Directions:
          [requires manual review]{'\n'}Duration: [requires manual review]
        </Label>
        <Label color="#69778C" size={11}>
          Illustrative document · No clinical instructions
        </Label>
      </Card>
      <Field
        label="Review note / clarification needed"
        placeholder="e.g. Medicine strength is unclear"
        value={note}
        onChangeText={setNote}
        multiline
      />
      <Button
        title={
          checked
            ? '✓ Identity, medicine and directions checked'
            : 'Confirm pharmacist review checklist'
        }
        secondary
        onPress={() => setChecked(!checked)}
      />
      <View style={{ height: 12 }} />
      <Button
        title="Mark verified · Demo"
        disabled={!checked}
        onPress={() => change('Verified')}
      />
      <View style={{ height: 12 }} />
      <Button
        title="Request clarification · Demo"
        secondary
        disabled={!note.trim()}
        onPress={() => {
          change('Clarification requested');
          setChecked(false);
        }}
      />
      <Notice text="Clarification stays in this demo queue. No customer or prescriber is contacted." />
    </Screen>
  );
}
export function Alternatives(props) {
  return props.route.params.medicine?.catalogOnly ? (
    <LiveAlternatives {...props} />
  ) : (
    <DemoAlternatives {...props} />
  );
}
function LiveAlternatives({ navigation, route }) {
  usePharmacy();
  const original = route.params.medicine;
  const catalog = useProducts('');
  const [selection, setSelection] = useState(null);
  const [units, setUnits] = useState({});
  const [feedback, setFeedback] = useState('');
  const [shuffle, setShuffle] = useState(0);
  const candidates = useMemo(() => {
    const list = catalog.items.filter(p => p.id !== original.id);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 5);
    // Shuffle changes only when requested or a new catalog page arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.items, original.id, shuffle]);
  return (
    <Screen
      title="Medicine alternatives"
      subtitle={`For ${original.name}`}
      navigation={navigation}
    >
      <Notice text="Random live products · Demo suggestions only, not composition-matched medical substitutes." />
      {!!feedback && <Notice warning text={feedback} />}
      <Card>
        <MedicineHeading medicine={original} />
        <Label muted>
          {original.salt} · {original.strength} · {original.form}
        </Label>
        <Label bold>
          {money(unitPrice(original, saleUnits(original)[0]))} /{' '}
          {saleUnits(original)[0].toLowerCase()}
        </Label>
      </Card>
      <Button
        title="Show other products"
        secondary
        disabled={!candidates.length}
        onPress={() => {
          setShuffle(v => v + 1);
          setSelection(null);
        }}
      />
      {candidates.map(product => {
        const m = billingMedicine(product);
        const unit = units[m.id] || saleUnits(m)[0];
        return (
          <Card key={m.id}>
            <Badge>Random demo suggestion</Badge>
            <MedicineHeading medicine={m} />
            <Label muted>
              {m.salt} · {m.strength} · {m.form}
            </Label>
            <Label muted>
              {m.maker} · {m.packLabel}
            </Label>
            <Label muted>
              MRP {money(m.mrp)} / pack · GST {m.gst ?? 0}%
            </Label>
            <Label bold>
              {money(unitPrice(m, unit))} / {unit.toLowerCase()}
            </Label>
            {saleUnits(m).length > 1 && (
              <Tabs
                items={saleUnits(m)}
                value={unit}
                onChange={v =>
                  setUnits(previous => ({ ...previous, [m.id]: v }))
                }
              />
            )}
            <Button
              title={selection === m.id ? '✓ Selected' : 'Select product'}
              secondary
              onPress={() => setSelection(m.id)}
            />
          </Card>
        );
      })}
      <Button
        title="Add selected product"
        disabled={!candidates.some(m => m.id === selection)}
        onPress={() => {
          const selected = candidates.find(m => m.id === selection);
          if (!selected) {
            return;
          }
          const medicine = billingMedicine(selected);
          const error = addToCart(
            medicine,
            units[medicine.id] || saleUnits(medicine)[0],
          );
          if (error) {
            setFeedback(error);
          } else {
            navigation.navigate('Checkout');
          }
        }}
      />
      <CatalogStatus catalog={catalog} />
    </Screen>
  );
}
function DemoAlternatives({ navigation, route }) {
  const data = usePharmacy();
  const m = data.inventory.find(x => x.id === route.params.id);
  const [reviewed, setReviewed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const alternatives = data.inventory.filter(
    x =>
      x.id !== m.id &&
      x.salt === m.salt &&
      x.strength === m.strength &&
      x.form === m.form &&
      x.name !== m.name &&
      x.expiry >= '2026-09-07',
  );
  return (
    <Screen
      title="Medicine alternatives"
      subtitle={`For ${m.name}`}
      navigation={navigation}
    >
      {feedback ? <Notice warning text={feedback} /> : null}
      <Notice
        warning
        text="Composition, strength and dosage form must match. Pharmacist review is required for every substitution."
      />
      <Card>
        <MedicineHeading medicine={m} />
        <Label bold>
          {m.salt} · {m.strength}
        </Label>
        <Label muted>
          {m.form} · Original: {moneySafe(m.mrp)} per pack
        </Label>
      </Card>
      {alternatives.map(a => (
        <Card key={a.id}>
          <Badge tone="green">Composition match</Badge>
          <MedicineHeading medicine={a} />
          <Label muted>
            {a.maker} · {a.stock} tablets · Shelf {a.shelf}
          </Label>
          <Label>
            {a.salt} · {a.strength} · {a.form}
          </Label>
          <Button
            title={
              selected === a.id ? '✓ Selected for review' : 'Select alternative'
            }
            secondary
            onPress={() => {
              setSelected(a.id);
              setReviewed(false);
            }}
          />
        </Card>
      ))}
      {!alternatives.length ? (
        <Empty
          title="No matching alternative"
          subtitle="No eligible batch with the same composition, strength and dosage form in demo stock."
        />
      ) : (
        <>
          <Button
            title={
              reviewed
                ? '✓ Pharmacist substitution reviewed'
                : 'Confirm pharmacist substitution review'
            }
            secondary
            disabled={!selected}
            onPress={() => setReviewed(!reviewed)}
          />
          <View style={{ height: 12 }} />
          <Button
            title="Use reviewed alternative"
            disabled={!reviewed || !selected}
            onPress={() => {
              const error = addToCart(
                data.inventory.find(x => x.id === selected),
              );
              if (error) {
                setFeedback(error);
              } else {
                navigation.navigate('Checkout');
              }
            }}
          />
          <Label muted size={12} style={{ marginTop: 10 }}>
            Adds one pack of the reviewed alternative to the cart. Prescription
            verification still applies at checkout.
          </Label>
        </>
      )}
    </Screen>
  );
}
const moneySafe = n => `₹${n.toFixed(2)}`;
