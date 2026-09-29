import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Label,
  Card,
  Notice,
  Badge,
  Field,
  SearchField,
  Tabs,
  MedicineHeading,
  money,
  usePalette,
  s,
} from './PharmacyUI';
import {
  usePharmacy,
  update,
  editPrescriptionRow,
  confirmPrescriptionRow,
  saleUnits,
  unitPrice,
} from './pharmacyData';
import { choosePrescription } from '../../services/prescriptionPicker';
import { scanPrescription } from '../../api/prescriptions';
import useProducts from '../../api/useProducts';
import CatalogStatus from './CatalogStatus';

function ProductChoice({ row, onClose }) {
  const [query, setQuery] = useState(row.name);
  const catalog = useProducts(query);
  const p = usePalette();
  const products = [
    ...new Map(
      [...(query === row.name ? row.candidates : []), ...catalog.items].map(
        m => [m.id, m],
      ),
    ).values(),
  ];
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 12 }}
        >
          <Label bold size={22}>
            Choose product
          </Label>
          <Label muted>
            Prescription: {row.name} {row.strength} · {row.form}
          </Label>
          <Notice text="Check name, strength and form before choosing a replacement. Search results are not verified medical substitutes." />
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search medicine or alternative…"
          />
          {products.map(m => (
            <Card key={m.id}>
              <MedicineHeading medicine={m} />
              <Label muted>
                {m.salt} · {m.strength} · {m.form}
              </Label>
              <Label>
                {m.maker} · {money(unitPrice(m, saleUnits(m)[0]))} /{' '}
                {saleUnits(m)[0]}
              </Label>
              <Button
                title="Select this product"
                secondary
                onPress={() => {
                  editPrescriptionRow(row.id, {
                    product: m,
                    unit: '',
                    status: 'selected',
                  });
                  onClose();
                }}
              />
            </Card>
          ))}
          <CatalogStatus catalog={catalog} />
          <Button title="Cancel selection" secondary onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function PrescriptionSearch() {
  const data = usePharmacy();
  const p = usePalette();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [choiceId, setChoiceId] = useState(null);
  const [file, setFile] = useState(null);
  const active = useRef(null);
  const generation = useRef(0);
  const working = useRef(false);
  useEffect(
    () => () => {
      ++generation.current;
      active.current?.abort();
    },
    [],
  );
  const close = () => {
    ++generation.current;
    active.current?.abort();
    working.current = false;
    setBusy(false);
    setOpen(false);
  };
  const upload = async source => {
    if (working.current) {
      return;
    }
    working.current = true;
    const current = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const selected =
        source === 'retry' ? file : await choosePrescription(source);
      if (current !== generation.current || !selected) {
        return;
      }
      setFile(selected);
      const controller = new AbortController();
      active.current = controller;
      const rows = await scanPrescription(selected, controller.signal);
      if (current !== generation.current) {
        return;
      }
      // No AI output is added to the cart until the pharmacist checks a row.
      update({
        prescriptionReview: rows,
        prescriptionSource: {
          name: selected.name,
          uri: selected.uri,
          type: selected.type,
        },
        checkoutPrescription: {
          file: selected.name,
          uri: selected.uri,
          type: selected.type,
          source: 'Prescription scan',
          verified: false,
        },
      });
      setOpen(false);
    } catch (err) {
      if (current === generation.current) {
        setError(err.message || 'Unable to upload this prescription.');
      }
    } finally {
      if (current === generation.current) {
        working.current = false;
        setBusy(false);
      }
    }
  };
  const choice = data.prescriptionReview.find(row => row.id === choiceId);
  return (
    <>
      <View style={{ marginTop: 12, marginBottom: 16 }}>
        <Button
          title="Search prescription"
          icon="file-search-outline"
          secondary
          onPress={() => {
            setError('');
            setOpen(true);
          }}
        />
      </View>
      {data.prescriptionSource && (
        <>
          <Label bold size={17}>
            Prescription medicines
          </Label>
          <Label muted size={12}>
            {data.prescriptionSource.name}
          </Label>
          <Notice text="Review each medicine and dispensing quantity, then ✓ to add it or × to reject it. Catalog matches do not confirm stock availability." />
          {!data.prescriptionReview.length && (
            <Notice text="No readable medicine names found. Upload a clearer prescription or search manually." />
          )}
          {data.prescriptionReview.map(row => {
            const pending = row.reviewStatus === 'pending';
            return (
              <Card
                key={row.id}
                tint={
                  row.reviewStatus === 'confirmed' ? p.selectedCard : undefined
                }
              >
                <View style={s.pair}>
                  <Label bold>{row.name}</Label>
                  <Badge
                    tone={
                      row.reviewStatus === 'confirmed'
                        ? 'green'
                        : row.reviewStatus === 'rejected' || !row.product
                        ? 'red'
                        : 'orange'
                    }
                  >
                    {row.reviewStatus === 'confirmed'
                      ? '✓ Added'
                      : row.reviewStatus === 'rejected'
                      ? '× Rejected'
                      : row.product
                      ? 'Review match'
                      : row.status === 'not_available'
                      ? 'Not available'
                      : 'Choose product'}
                  </Badge>
                </View>
                <Label muted>
                  {row.strength} · {row.form}
                </Label>
                {(row.uncertain || row.note) && (
                  <Notice
                    warning
                    text={
                      row.note ||
                      'Unclear handwriting — verify the original prescription.'
                    }
                  />
                )}
                {row.product && (
                  <>
                    <MedicineHeading medicine={row.product} />
                    <Label muted>
                      {row.product.salt} · {row.product.strength} ·{' '}
                      {row.product.form}
                    </Label>
                    <Label muted>
                      {row.product.packLabel} · MRP {money(row.product.mrp)}
                    </Label>
                  </>
                )}
                {pending ? (
                  <>
                    <Field
                      label="Dispensing quantity"
                      numeric
                      value={row.quantity}
                      placeholder="Enter quantity if not written"
                      onChangeText={quantity =>
                        editPrescriptionRow(row.id, { quantity })
                      }
                    />
                    {row.product ? (
                      <>
                        <Label muted>Confirm unit</Label>
                        <Tabs
                          items={saleUnits(row.product)}
                          value={row.unit}
                          onChange={unit =>
                            editPrescriptionRow(row.id, { unit })
                          }
                        />
                        {saleUnits(row.product).includes(row.unit) && (
                          <Label bold>
                            {money(unitPrice(row.product, row.unit))} /{' '}
                            {row.unit}
                          </Label>
                        )}
                      </>
                    ) : (
                      <Label muted>
                        No product selected. Choose an alternative or reject.
                      </Label>
                    )}
                    <Button
                      title={
                        row.product
                          ? 'Change / choose alternative'
                          : 'Select alternative product'
                      }
                      secondary
                      icon="magnify"
                      onPress={() => setChoiceId(row.id)}
                    />
                    <View style={[s.pair, { marginTop: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Reject"
                          icon="close"
                          secondary
                          onPress={() =>
                            editPrescriptionRow(row.id, {
                              reviewStatus: 'rejected',
                            })
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Confirm"
                          icon="check"
                          disabled={
                            !row.product ||
                            !saleUnits(row.product).includes(row.unit) ||
                            !Number.isInteger(Number(row.quantity)) ||
                            Number(row.quantity) <= 0 ||
                            Number(row.quantity) > 1000
                          }
                          onPress={() => {
                            const message = confirmPrescriptionRow(row.id);
                            setError(message || '');
                          }}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <Label muted>
                    {row.quantity || '—'}{' '}
                    {row.unit === 'Unknown' ? '' : row.unit} ·{' '}
                    {row.reviewStatus === 'confirmed'
                      ? 'Added to cart'
                      : 'Skipped'}
                  </Label>
                )}
              </Card>
            );
          })}
        </>
      )}
      {!!error && !open && <Notice warning text={error} />}
      {choice && (
        <ProductChoice row={choice} onClose={() => setChoiceId(null)} />
      )}
      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Label bold size={24}>
              Search prescription
            </Label>
            <Label muted>
              Take a photo or upload a prescription PDF/image. Uploading sends
              this document to OpenAI to read medicine names and quantities.
            </Label>
            <Label muted size={12}>
              PDF, JPEG, PNG or WebP · Maximum 3 MB
            </Label>
            {!!data.prescriptionReview.length && (
              <Notice text="A new upload replaces this review list. Medicines already confirmed remain in your cart." />
            )}
            <Button
              title="Take photo"
              icon="camera-outline"
              disabled={busy}
              onPress={() => upload('camera')}
            />
            <Button
              title="Choose photo"
              icon="image-outline"
              secondary
              disabled={busy}
              onPress={() => upload('photo')}
            />
            <Button
              title="Upload PDF / image"
              icon="file-upload-outline"
              secondary
              disabled={busy}
              onPress={() => upload('document')}
            />
            {busy && (
              <>
                <ActivityIndicator accessibilityLabel="Reading prescription" />
                <Label>Reading prescription and searching products…</Label>
              </>
            )}
            {!!error && (
              <>
                <Notice warning text={error} />
                {file && (
                  <Button
                    title="Retry scan"
                    disabled={busy}
                    onPress={() => upload('retry')}
                  />
                )}
              </>
            )}
            <Button
              title={busy ? 'Cancel scan' : 'Close'}
              secondary
              onPress={close}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
