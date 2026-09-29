import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { can } from '../../auth/permissions';
import {
  Screen,
  Button,
  Card,
  Label,
  Badge,
  Row,
  SearchField,
  Section,
  Empty,
} from './PharmacyUI';
export const menu = [
  {
    group: 'DISPENSING',
    title: 'Customers',
    subtitle: 'Retail purchase history and bills',
    icon: 'account-group-outline',
    route: 'Customers',
  },
  {
    group: 'INVENTORY & PURCHASES',
    title: 'Purchase entry',
    subtitle: 'Supplier invoice and free quantities',
    icon: 'truck-delivery-outline',
    route: 'PurchaseEntry',
  },
  {
    group: 'INVENTORY & PURCHASES',
    title: 'Low stock',
    subtitle: 'Review batches below minimum stock',
    icon: 'cart-arrow-down',
    route: 'Reorder',
  },
  {
    group: 'INVENTORY & PURCHASES',
    title: 'Expiry control',
    subtitle: 'FEFO, near expiry and quarantine',
    icon: 'calendar-clock',
    route: 'Expiry',
  },
  {
    group: 'INVENTORY & PURCHASES',
    title: 'Stock adjustments',
    subtitle: 'Damage, shortage and manager approval',
    icon: 'package-variant-closed',
    route: 'Adjustments',
  },
  {
    group: 'INVENTORY & PURCHASES',
    title: 'Suppliers',
    subtitle: 'Contacts and purchase history',
    icon: 'truck-outline',
    route: 'Suppliers',
  },
  {
    group: 'ACCOUNTS & COUNTER',
    title: 'Sales history',
    subtitle: 'Browse bills and payment methods',
    icon: 'receipt',
    route: 'Sales',
  },
  {
    group: 'ACCOUNTS & COUNTER',
    title: 'Reports',
    subtitle: 'Sales, margin and stock movement',
    icon: 'chart-box-outline',
    route: 'Reports',
  },
];
const menuPermission = {
  Customers: ['customers', 'view'],
  PurchaseEntry: ['purchases', 'create'],
  Reorder: ['inventory', 'view'],
  Expiry: ['inventory', 'view'],
  Adjustments: ['inventory', 'view'],
  Suppliers: ['suppliers', 'view'],
  Sales: ['retail-sales', 'view'],
  Reports: ['reports', 'view'],
};
export default function More({ navigation }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [q, setQ] = useState('');
  const rows = menu.filter(m => {
    const [resource, action] = menuPermission[m.route] || [];
    return can(user, resource, action) && `${m.title} ${m.subtitle}`.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <Screen
      title="Pharmacy workspace"
      subtitle="Everything you need beyond the counter"
      back={false}
    >
      <Card>
        <Badge tone="green">On duty</Badge>
        <Label bold size={21} style={{ marginTop: 12 }}>
          {[user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
            user?.email}
        </Label>
        <Label muted>{user?.email}</Label>
        <Button
          title={loggingOut ? 'Logging out…' : 'Logout'}
          secondary
          disabled={loggingOut}
          onPress={async () => {
            setLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert(
                'Signed out on this device',
                'The server could not confirm logout.',
              );
            }
          }}
        />
      </Card>
      <SearchField
        value={q}
        onChangeText={setQ}
        placeholder="Search pharmacy tools…"
      />
      {['DISPENSING', 'INVENTORY & PURCHASES', 'ACCOUNTS & COUNTER'].map(
        group =>
          rows.some(m => m.group === group) && (
            <React.Fragment key={group}>
              <Section title={group} />
              <Card>
                {rows
                  .filter(m => m.group === group)
                  .map(m => (
                    <Row
                      key={m.route}
                      {...m}
                      onPress={() => navigation.navigate(m.route)}
                    />
                  ))}
              </Card>
            </React.Fragment>
          ),
      )}
      {!rows.length && <Empty />}
    </Screen>
  );
}
