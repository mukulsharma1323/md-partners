import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Screen,
  Label,
  Card,
  Button,
  Badge,
  Section,
  Row,
  Notice,
  money,
  s,
  blue,
  usePalette,
} from './PharmacyUI';
import { usePharmacy, expired, nearExpiry } from './pharmacyData';
import { update } from './pharmacyData';
import { fetchRetailData } from '../../api/pharmacy';
import { useAuth } from '../../auth/AuthContext';
import { can } from '../../auth/permissions';

export default function Home({ navigation }) {
  const data = usePharmacy();
  const { user } = useAuth();
  const p = usePalette();
  const low = data.inventory.filter(m => !expired(m) && m.stock < m.min).length;
  const near = data.inventory.filter(nearExpiry).length;
  const today = new Date().toDateString();
  const todayOrders = data.orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === today);
  const metrics = [
    {
      label: "Today's bills",
      value: todayOrders.length,
      note: 'Retail invoices',
      icon: 'clipboard-text-outline',
      route: 'OrderList',
      color: '#0077FF',
    },
    {
      label: 'Low stock',
      value: low,
      note: 'Prepare a purchase list',
      icon: 'package-variant',
      route: 'Reorder',
      color: '#A65610',
    },
    {
      label: 'Near expiry',
      value: near,
      note: 'Batches within 30 days',
      icon: 'calendar-clock',
      route: 'Expiry',
      color: '#BC3535',
    },
  ].filter(metric => metric.route === 'OrderList' ? can(user, 'retail-sales') : can(user, 'inventory'));
  return (
    <Screen
      title="Meri Davai"
      subtitle={user?.default_store_name || data.stores[0]?.name || 'Your pharmacy'}
      back={false}
      action={can(user, 'inventory') ? 'bell-outline' : undefined}
      onAction={() => navigation.navigate('Alerts')}
    >
      <View style={s.pair}>
        <Label muted size={12}>
          {new Date().toDateString().toUpperCase()}
        </Label>
        <Badge tone="green">Signed in</Badge>
      </View>
      {can(user, 'retail-sales') && <Card tint={p.soft} style={{ marginTop: 14, padding: 23 }}>
        <View style={s.pair}>
          <Label bold muted>
            Today’s sales
          </Label>
          <Icon name="chart-timeline-variant" size={26} color={blue} />
        </View>
        <Label size={36} bold>
          {money(todayOrders.reduce((sum, o) => sum + o.amount, 0))}
        </Label>
        <View style={s.pair}>
          <Badge tone="green">Retail invoices</Badge>
          <Label muted size={12}>
            {todayOrders.length} bills
          </Label>
        </View>
        {can(user, 'retail-sales', 'create') && <View style={{ marginTop: 20 }}>
          <Button
            title="New sale"
            icon="plus"
            onPress={() => navigation.navigate('POS')}
          />
        </View>}
      </Card>}
      {data.loading && <Notice text="Loading store data…" />}
      {!!data.error && <Notice warning text={data.error} />}
      <Button title="Refresh store data" secondary onPress={async () => {
        update({ loading: true, error: '' });
        try { update({ ...(await fetchRetailData()), loading: false }); }
        catch (error) { update({ loading: false, error: error.message }); }
      }} />
      <View style={s.grid}>
        {metrics.map(m => (
          <TouchableOpacity
            key={m.label}
            style={{ width: '48%', flexGrow: 1 }}
            onPress={() => navigation.navigate(m.route)}
            accessibilityRole="button"
          >
            <Card style={{ flex: 1, marginBottom: 0 }}>
              <Icon name={m.icon} size={25} color={m.color} />
              <Label bold size={26} style={{ marginTop: 14 }}>
                {m.value}
              </Label>
              <Label bold size={13}>
                {m.label}
              </Label>
              <Label muted size={11} style={{ marginTop: 5 }}>
                {m.note}
              </Label>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      {(can(user, 'purchases', 'create') || can(user, 'customers')) && <><Section title="Counter shortcuts" />
      <Card>
        {can(user, 'purchases', 'create') &&
        <Row
          icon="truck-delivery-outline"
          title="Receive a purchase"
          subtitle="Supplier invoice and batch receipt"
          onPress={() => navigation.navigate('PurchaseEntry')}
        />}
        {can(user, 'customers') &&
        <Row
          icon="account-group-outline"
          title="Customers"
          subtitle="Retail purchase history and bills"
          onPress={() => navigation.navigate('Customers')}
        />}
      </Card></>}
      {can(user, 'retail-sales') && <Section
        title="Recent sales"
        action="View all"
        onPress={() => navigation.navigate('OrderList')}
      />}
      {can(user, 'retail-sales') && data.orders.slice(0, 3).map(o => (
        <Card key={o.id}>
          <Row
            title={o.customer}
            subtitle={`${o.id} · ${o.channel} · ${money(o.amount)}`}
            value={o.status}
            onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
          />
        </Card>
      ))}
      {can(user, 'inventory') && <><Section title="Inventory at a glance" />
      <Card>
        <View style={s.pair}>
          <Label muted>Available stock value</Label>
          <Label bold>
            {money(
              data.inventory
                .filter(m => !expired(m))
                .reduce((sum, m) => sum + (m.stock * m.cost) / m.pack, 0),
            )}
          </Label>
        </View>
        {can(user, 'reports') && <Row
          title="Daily performance"
          subtitle="Sales and medicine movement"
          icon="chart-box-outline"
          onPress={() => navigation.navigate('Reports')}
        />}
      </Card></>}
    </Screen>
  );
}
