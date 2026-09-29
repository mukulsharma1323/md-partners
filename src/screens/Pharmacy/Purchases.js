import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  Screen,
  MedicineHeading,
  Card,
  Label,
  Button,
  Badge,
  Field,
  SearchField,
  Tabs,
  Section,
  Row,
  Notice,
  Empty,
  money,
} from './PharmacyUI';
import { usePharmacy, update } from './pharmacyData';
import { useAuth } from '../../auth/AuthContext';
import { createPurchase, createStockAdjustment, fetchRetailData, reviewStockAdjustment } from '../../api/pharmacy';
const currentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function PurchaseEntry({ navigation }) {
  const data = usePharmacy();
  const [supplier, setSupplier] = useState('');
  const [medicine, setMedicine] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [form, setForm] = useState({
    invoice: '',
    batch: '',
    expiry: '',
    qty: '',
    cost: '',
    mrp: '',
  });
  const [saved, setSaved] = useState(false);
  const set = (key, value) => {
    setForm({ ...form, [key]: value });
    setSaved(false);
  };
  const supplierRecord = data.suppliers.find(s => s.name === supplier);
  const selected = data.products.find(m => m.id === medicine);
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(form.expiry) &&
    !Number.isNaN(Date.parse(form.expiry)) &&
    new Date(form.expiry).toISOString().slice(0, 10) === form.expiry;
  const valid =
    form.invoice.trim() &&
    form.batch.trim() &&
    validDate &&
    form.expiry >= currentDate() &&
    !!supplierRecord && !!selected &&
    Number(form.qty) > 0 &&
    Number.isInteger(Number(form.qty)) &&
    Number(form.cost) > 0 &&
    Number(form.mrp) >= Number(form.cost);
  const save = async () => {
    const existing = data.inventory.find(batch => batch.productId === selected.id && batch.batch === form.batch.trim());
    if (existing && (existing.expiry !== form.expiry || existing.salePrice !== Number(form.mrp))) {
      setSaved('Existing batch has a different expiry or retail price. Verify the supplier invoice before receiving stock.');
      return;
    }
    setSaved('Saving receipt…');
    try {
      await createPurchase({
        supplierId: supplierRecord.id,
        invoiceNumber: form.invoice.trim(),
        invoiceDate: currentDate(),
        rows: [{
          productId: Number(selected.id),
          batchNumber: form.batch.trim(),
          expiry: form.expiry,
          quantity: Number(form.qty),
          purchasePrice: Number(form.cost),
          retailPrice: Number(form.mrp),
          wholesalePrice: Number(selected.wholesalePrice || form.mrp),
        }],
      });
      setSaved(true);
      fetchRetailData().then(fresh => update(fresh)).catch(error => update({ error: error.message }));
    } catch (error) {
      setSaved(error.message);
    }
  };
  return (
    <Screen
      title="Purchase entry"
      subtitle="Receive stock against a supplier invoice"
      navigation={navigation}
      footer={
        <Button
          title={saved === true ? 'Stock received' : 'Save purchase'}
          disabled={!valid || saved === true || saved === 'Saving receipt…'}
          onPress={save}
        />
      }
    >
      <Notice
        text={
          saved === true
            ? 'Receipt and batch stock saved to the backend.'
            : typeof saved === 'string'
            ? saved
            : 'Enter the supplier invoice and received batch.'
        }
      />
      <Section title="Supplier & invoice" />
      <Tabs
        items={data.suppliers.map(x => x.name)}
        value={supplier}
        onChange={setSupplier}
      />
      <Field
        label="Supplier invoice number"
        value={form.invoice}
        onChangeText={v => set('invoice', v)}
        placeholder="e.g. SP-2026-882"
      />
      <Section title="Medicine & batch" />
      <SearchField value={medicineSearch} onChangeText={setMedicineSearch} placeholder="Search medicine…" />
      <Tabs
        items={data.products.filter(m => `${m.name} ${m.salt}`.toLowerCase().includes(medicineSearch.toLowerCase())).slice(0, 30).map(m => `${m.name} · #${m.id}`)}
        value={selected ? `${selected.name} · #${selected.id}` : ''}
        onChange={label => {
          setMedicine(label.split(' · #').pop());
          setSaved(false);
        }}
      />
      <Card>
        {selected && <MedicineHeading medicine={selected} />}
        {[
          ['batch', 'Batch number'],
          ['expiry', 'Expiry date (YYYY-MM-DD)'],
          ['qty', 'Paid quantity (packs)'],
          ['cost', 'Purchase price per pack (₹)'],
          ['mrp', 'Retail price per pack (₹)'],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={form[key]}
            onChangeText={v => set(key, v)}
            numeric={['qty', 'free', 'cost', 'mrp'].includes(key)}
          />
        ))}
        <Row
          title="Base units to receive"
          value={`${
            (Number(form.qty) || 0) * (selected?.pack || 1)
          }`}
        />
        <Row
          title="Purchase total"
          value={money((Number(form.qty) || 0) * (Number(form.cost) || 0))}
        />
      </Card>
      <Label muted size={12}>
        Enter a valid future expiry, whole packs and retail price at least equal to
        purchase price.
      </Label>
      <Section title="Recent receipts" />
      {data.purchases.map(p => (
        <Card key={p.id}>
          <MedicineHeading medicine={{ name: p.invoiceNumber }} title={`Purchase ${p.id}`} />
          <Label muted>
            {p.invoiceNumber} · {data.suppliers.find(s => s.id === p.supplierId)?.name || ''}
          </Label>
          <Row
            title="Invoice total"
            value={money(p.totalAmount)}
          />
        </Card>
      ))}
    </Screen>
  );
}
export function Suppliers({ navigation }) {
  const { suppliers: liveSuppliers } = usePharmacy();
  return (
    <Screen
      title="Suppliers"
      subtitle="Contacts and purchase history"
      navigation={navigation}
    >
      {liveSuppliers.map(v => (
        <Card key={v.id}>
          <Badge tone="green">Active supplier</Badge>
          <Section title={v.name} />
          <Label muted>{v.contactPerson || v.contact || ''} · {v.phone || ''}</Label>
          <Button
            title="View supplier"
            secondary
            onPress={() => navigation.navigate('SupplierDetail', { id: v.id })}
          />
        </Card>
      ))}
    </Screen>
  );
}
export function SupplierDetail({ navigation, route }) {
  const data = usePharmacy();
  const v = data.suppliers.find(x => x.id === route.params.id);
  if (!v) return <Screen title="Supplier" navigation={navigation}><Empty title="Supplier unavailable" /></Screen>;
  return (
    <Screen title="Supplier details" subtitle={v.name} navigation={navigation}>
      <Card>
        <Label bold size={20}>
          {v.name}
        </Label>
        <Row
          title={v.contactPerson || v.contact || ''}
          subtitle={`${v.phone}\n${v.email}`}
          icon="account-outline"
        />
      </Card>
      <Section title="Purchase history" />
      <Card>
        {data.purchases
          .filter(p => p.supplierId === v.id)
          .map(p => (
            <Row
              key={p.id}
              title={p.invoiceNumber || `Purchase ${p.id}`}
              subtitle={String(p.createdAt || '').slice(0, 10)}
              value={money(p.totalAmount)}
            />
          ))}
      </Card>
    </Screen>
  );
}
export function PurchaseReturns({ navigation }) {
  const [reason, setReason] = useState('Expired');
  const [qty, setQty] = useState('3');
  const [invoice, setInvoice] = useState('SP-2025-481');
  const [saved, setSaved] = useState(false);
  return (
    <Screen
      title="Purchase returns"
      subtitle="Return stock to supplier & track credit"
      navigation={navigation}
    >
      <Notice
        warning
        text="Expired stock stays quarantined and is unavailable for sale. This form creates a sample return request."
      />
      <Card>
        <Label bold size={18}>
          Shree Pharma Distributors
        </Label>
        <Field
          label="Original purchase invoice"
          value={invoice}
          onChangeText={setInvoice}
        />
        <Row
          medicine={{ name: 'Cetzine 10' }}
          title="Cetzine 10 · CZ0824"
          subtitle="Expiry: 31 Aug 2026 · Quarantine"
        />
        <Field
          label="Return quantity (strips, max 3)"
          numeric
          value={qty}
          onChangeText={setQty}
        />
        <Tabs
          items={['Expired', 'Damaged', 'Wrong supply']}
          value={reason}
          onChange={setReason}
        />
        <Row title="Estimated credit" value={money((Number(qty) || 0) * 17)} />
      </Card>
      <Button
        title={saved ? 'Return request created' : 'Create demo supplier return'}
        disabled={
          saved ||
          !invoice.trim() ||
          !Number.isInteger(Number(qty)) ||
          Number(qty) < 1 ||
          Number(qty) > 3
        }
        onPress={() => setSaved(true)}
      />
      {saved && (
        <Card style={{ marginTop: 18 }}>
          <Badge tone="orange">Awaiting collection</Badge>
          <Section title="PR-092" />
          <Label>
            {qty} strips · {reason} · {invoice}
          </Label>
          <Row title="Refund / credit status" value="Credit note pending" />
        </Card>
      )}
    </Screen>
  );
}
export function Adjustments({ navigation, route }) {
  const data = usePharmacy();
  const { user } = useAuth();
  const canApprove = user?.role === 'super-admin' || !!user?.permissions?.inventory?.approve;
  const [id, setId] = useState(route?.params?.id || '');
  const [reason, setReason] = useState('Damaged');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [requested, setRequested] = useState(false);
  const m = data.inventory.find(x => x.id === id) || data.inventory[0];
  return (
    <Screen
      title="Stock adjustments"
      subtitle="Traceable changes with manager approval"
      navigation={navigation}
    >
      <Notice
        warning
        text="Sensitive stock changes require manager approval. Requests do not deduct stock until approved."
      />
      {!!m && <Tabs
        items={data.inventory.map(x => `${x.name} · ${x.batch}`)}
        value={`${m.name} · ${m.batch}`}
        onChange={name => {
          setId(data.inventory.find(x => `${x.name} · ${x.batch}` === name).id);
          setRequested(false);
        }}
      />}
      {!!m && <Card>
        <MedicineHeading medicine={m} />
        <Row title="Available base units" value={`${m.stock}`} />
        <Tabs
          items={['Damaged', 'Missing', 'Expired']}
          value={reason}
          onChange={setReason}
        />
        <Field
          label="Quantity to deduct (base units)"
          numeric
          value={qty}
          onChangeText={setQty}
        />
        <Field
          label="Reason / audit note"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Describe why the stock needs adjusting"
        />
        <Button
          title={
            requested
              ? 'Submitted for manager approval'
              : 'Request manager approval'
          }
          disabled={
            requested ||
            !note.trim() ||
            !Number.isInteger(Number(qty)) ||
            Number(qty) <= 0 ||
            Number(qty) > m.stock
          }
          onPress={async () => {
            try {
              await createStockAdjustment({
                batchId: m.batchId,
                adjustmentType: 'decrease',
                quantity: Number(qty),
                unitLabel: m.allowLooseSale ? m.baseUnit : 'pack',
                reason,
                referenceNote: note.trim(),
              });
              setRequested(true);
              fetchRetailData().then(fresh => update(fresh)).catch(error => update({ error: error.message }));
            } catch (error) {
              Alert.alert('Adjustment not saved', error.message);
            }
          }}
        />
      </Card>}
      <Section title="Approval queue & audit trail" />
      {data.adjustments.map(a => (
        <Card key={a.id}>
          <Badge tone="orange">{a.status}</Badge>
          <Section title={a.id} />
          <MedicineHeading medicine={{ name: a.product?.name || 'Medicine' }} title={`${a.product?.name || 'Medicine'} · ${a.batch?.batchNumber || ''} · −${a.quantity} units`} />
          <Label muted>
            {a.reason} · {a.referenceNote}
          </Label>
          <Label muted size={11}>{String(a.createdAt || '').slice(0, 10)}</Label>
          {a.status === 'pending' && canApprove && <>
            <Button title="Approve" small onPress={async () => {
              try { await reviewStockAdjustment(a.id, 'approve'); update({ adjustments: data.adjustments.map(item => item.id === a.id ? { ...item, status: 'approved' } : item) }); fetchRetailData().then(fresh => update(fresh)).catch(error => update({ error: error.message })); }
              catch (error) { Alert.alert('Approval failed', error.message); }
            }} />
            <Button title="Reject" secondary small onPress={async () => {
              try { await reviewStockAdjustment(a.id, 'reject', 'Rejected from mobile review'); update({ adjustments: data.adjustments.map(item => item.id === a.id ? { ...item, status: 'rejected' } : item) }); fetchRetailData().then(fresh => update(fresh)).catch(error => update({ error: error.message })); }
              catch (error) { Alert.alert('Rejection failed', error.message); }
            }} />
          </>}
        </Card>
      ))}
      {!data.adjustments.length && (
        <Empty
          title="No pending adjustments"
          subtitle="Every request appears here with its reason and approval status."
        />
      )}
    </Screen>
  );
}
