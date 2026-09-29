import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import {
  Screen,
  MedicineHeading,
  Card,
  Label,
  Button,
  Section,
  Field,
  Tabs,
  Row,
  Notice,
  Empty,
  money,
  s,
} from './PharmacyUI';
import {
  usePharmacy,
  update,
  changeQty,
  totals,
  unitPrice,
  lineTotal,
} from './pharmacyData';
import { createRetailInvoice, fetchRetailData } from '../../api/pharmacy';

import CheckoutCustomer from './CheckoutCustomer';

export default function Cart({ navigation }) {
  const data = usePharmacy();
  const [saving, setSaving] = useState(false);
  const total = totals(data.cart, data.discount);
  const prescription = data.checkoutPrescription?.verified;
  const invalidCustomer =
    !!data.customerMobile &&
    (data.customerMobile.length !== 10 || !data.customerName.trim());
  const needsRx = data.cart.some(x => x.rx);
  const finalize = async () => {
    if (saving || !data.cart.length || (needsRx && !prescription) || invalidCustomer) {
      return;
    }
    setSaving(true);
    try {
      const created = await createRetailInvoice({
        ...(data.customerId ? { customerId: data.customerId } : {}),
        customerName: data.customerName.trim() || 'Walk-in customer',
        phoneNumber: data.customerMobile,
        paymentMode: data.payment,
        discount: total.off,
        rows: data.cart.map(x => ({
          batchId: x.batchId,
          productId: Number(x.productId),
          quantity: x.qty,
          saleUnit: ['Tablet', 'Capsule', 'Unit'].includes(x.unit) ? 'unit' : x.unit.toLowerCase(),
          stockDeductionQuantity: x.qty * x.units,
          price: unitPrice(x, x.unit),
        })),
      });
      const fallbackInvoice = {
        id: `MD-${created.id}`,
        customer: data.customerName.trim() || 'Walk-in customer',
        customerMobile: data.customerMobile,
        channel: 'Counter',
        payment: data.payment,
        lines: data.cart.map(x => ({ ...x, price: unitPrice(x, x.unit), total: lineTotal(x) })),
        base: total.base,
        off: total.off,
        total: Number(created.totalAmount ?? total.total),
        createdAt: created.createdAt || new Date().toISOString(),
      };
      update({
        invoice: fallbackInvoice,
        cart: [],
        customerId: null,
        customerName: '',
        customerMobile: '',
        checkoutPrescription: null,
        discount: '0',
        draft: false,
      });
      navigation.navigate('Invoice');
      fetchRetailData().then(fresh => {
        const order = fresh.orders.find(o => o.serverId === created.id);
        update({ ...fresh, invoice: order?.invoice || fallbackInvoice });
      }).catch(error => update({ error: error.message }));
    } catch (error) {
      Alert.alert('Sale not completed', error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen
      title="Cart & checkout"
      subtitle="Step 2 of 2 · Customer details & payment"
      navigation={navigation}
      footer={
        data.cart.length > 0 && (
          <Button
            title={saving ? 'Saving sale…' : `Finalize sale · ${money(total.total)}`}
            disabled={saving || (needsRx && !prescription) || invalidCustomer}
            onPress={finalize}
            icon="check-circle-outline"
          />
        )
      }
    >
      <Notice text="Sale and stock will be saved to your assigned store." />
      {!data.cart.length ? (
        <>
          <Empty
            title="Your cart is empty"
            subtitle="Search a medicine and add a strip or individual tablets."
          />
          <Button
            title="Find medicines"
            onPress={() => navigation.navigate('POS')}
          />
        </>
      ) : (
        <>
          <Section
            title="Medicines"
            action="Add more"
            onPress={() => navigation.navigate('POS')}
          />
          {data.cart.map((x, i) => (
            <Card key={`${x.id}-${x.unit}`}>
              <View style={s.pair}>
                <MedicineHeading medicine={x} />
                <Label bold>{money(lineTotal(x))}</Label>
              </View>
              <Label muted size={12}>
                {x.batch} · {x.unit} · {money(unitPrice(x, x.unit))} each
              </Label>
              <Label muted size={12}>
                Stock deduction: {x.qty * x.units}{' '}
                {x.form === 'Tablet' ? 'tablets' : 'units'}
              </Label>
              <View style={[s.pair, { marginTop: 14 }]}>
                <Button
                  title="−"
                  secondary
                  small
                  onPress={() => changeQty(i, -1)}
                />
                <Label bold>
                  {x.qty} {x.unit}
                  {x.qty > 1 ? 's' : ''}
                </Label>
                <Button
                  title="+"
                  secondary
                  small
                  onPress={() => {
                    const error = changeQty(i, 1);
                    if (error) {
                      Alert.alert('Stock limit', error);
                    }
                  }}
                />
              </View>
            </Card>
          ))}
          <CheckoutCustomer navigation={navigation} needsRx={needsRx} />
          {invalidCustomer && (
            <Notice
              warning
              text="Enter a 10-digit mobile number and customer name, or leave mobile blank for a walk-in sale."
            />
          )}
          {needsRx && !prescription && (
            <Notice
              warning
              text="Select the prescription and confirm the pharmacist check above to finalize Rx items."
            />
          )}
          <Section title="Payment summary" />
          <Card>
            <Field
              label="Discount (₹)"
              numeric
              value={data.discount}
              onChangeText={v => update({ discount: v, draft: true })}
            />
            <View style={s.pair}>
              <Label muted>Subtotal · Inclusive of tax</Label>
              <Label>{money(total.base)}</Label>
            </View>
            <View style={s.pair}>
              <Label muted>Discount</Label>
              <Label>−{money(total.off)}</Label>
            </View>
            <View style={s.pair}>
              <Label bold size={18}>
                Total payable
              </Label>
              <Label bold size={22}>
                {money(total.total)}
              </Label>
            </View>
          </Card>
          <Tabs
            items={['Cash', 'UPI', 'Card', 'Bank Transfer']}
            value={data.payment}
            onChange={v => update({ payment: v })}
          />
          <Notice text="Select the payment mode used at the counter." />
        </>
      )}
    </Screen>
  );
}
export function Invoice({ navigation }) {
  const { invoice } = usePharmacy();
  if (!invoice) {
    return (
      <Screen title="Invoice" navigation={navigation}>
        <Empty title="No invoice yet" />
      </Screen>
    );
  }
  return (
    <Screen
      title="Sale finalized"
      subtitle={`${invoice.id} · ${String(invoice.createdAt || '').slice(0, 10)}`}
      navigation={navigation}
      footer={
        <Button
          title="Start next sale"
          onPress={() => navigation.navigate('POS')}
        />
      }
    >
      <Notice text="Invoice saved to the backend." />
      <Card>
        <Label bold size={22}>
          Meri Davai Medihub
        </Label>
        <Label muted>Retail invoice</Label>
        <Section title={invoice.id} />
        <Label>
          {invoice.customer} · {invoice.channel}
          {invoice.customerMobile ? ` · ${invoice.customerMobile}` : ''}
        </Label>
        {invoice.lines.map(x => (
          <Row
            key={`${x.id}-${x.unit}`}
            medicine={x}
            title={x.name}
            subtitle={`${x.qty} ${x.unit} · Batch ${x.batch} · Exp ${x.expiry}`}
            value={money(lineTotal(x))}
          />
        ))}
        <View style={s.pair}>
          <Label>Subtotal</Label>
          <Label>{money(invoice.base)}</Label>
        </View>
        <View style={s.pair}>
          <Label>Discount</Label>
          <Label>−{money(invoice.off)}</Label>
        </View>
        <View style={s.pair}>
          <Label bold>Total · {invoice.payment}</Label>
          <Label bold size={24}>
            {money(invoice.total)}
          </Label>
        </View>
        <Label muted size={11}>
          Prices include tax.
        </Label>
      </Card>
      <Button
        secondary
        title="Print invoice preview"
        icon="printer-outline"
        onPress={() =>
          Alert.alert(
            'Invoice preview',
            `${invoice.id}\nMeri Davai Medihub\n${
              invoice.customer
            }\nTotal ${money(invoice.total)}\nPaid by ${
              invoice.payment
            }\n\nPrinter integration is not connected.`,
          )
        }
      />
    </Screen>
  );
}
