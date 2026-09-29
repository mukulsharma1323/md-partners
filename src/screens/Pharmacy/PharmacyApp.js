import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './Home';
import NewSale from './NewSale';
import Cart, { Invoice } from './Cart';
import Orders, { OrderDetail } from './Orders';
import Stock, { BatchDetail, Expiry, Reorder } from './Stock';
import More from './More';
import PurchaseEntry, {
  Suppliers,
  SupplierDetail,
  Adjustments,
} from './Purchases';
import Customers, { CustomerDetail } from './Customers';
import Reports from './Reports';
import Sales from './Sales';
import { Screen, Card, Row, Notice, blue, usePalette } from './PharmacyUI';
import { usePharmacy, expired, nearExpiry } from './pharmacyData';
import { update } from './pharmacyData';
import { fetchRetailData } from '../../api/pharmacy';
import { useAuth } from '../../auth/AuthContext';
import { can } from '../../auth/permissions';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const tabIcons = {
  Dashboard: 'view-dashboard-outline',
  Billing: 'barcode-scan',
  Orders: 'receipt',
  Stock: 'package-variant-closed',
  More: 'dots-grid',
};
function MainTabs() {
  const p = usePalette();
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: blue,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: {
          backgroundColor: p.bg,
          borderTopColor: p.line,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Bold',
          fontSize: 11,
          paddingBottom: 3,
        },
        tabBarLabel: route.name === 'Orders' ? 'Sales' : route.name,
        tabBarIcon: ({ color, size }) => (
          <Icon name={tabIcons[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={Home} />
      {can(user, 'retail-sales', 'create') && <Tab.Screen name="Billing" component={NewSale} />}
      {can(user, 'retail-sales') && <Tab.Screen name="Orders" component={Orders} />}
      {can(user, 'inventory') && <Tab.Screen name="Stock" component={Stock} />}
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
}
function Alerts({ navigation }) {
  const data = usePharmacy();
  return (
    <Screen
      title="Attention needed"
      subtitle="Your pharmacy’s daily priorities"
      navigation={navigation}
    >
      <Notice text="Live priorities for your assigned store" />
      <Card>
        <Row
          icon="package-variant"
          title="Low-stock medicines"
          value={`${
            data.inventory.filter(m => !expired(m) && m.stock < m.min).length
          }`}
          onPress={() => navigation.navigate('Reorder')}
        />
        <Row
          icon="calendar-clock"
          title="Near-expiry batches"
          value={`${data.inventory.filter(nearExpiry).length}`}
          tone="orange"
          onPress={() => navigation.navigate('Expiry')}
        />
        <Row
          icon="alert-octagon-outline"
          title="Expired stock blocked"
          value={`${data.inventory.filter(expired).length}`}
          tone="red"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'Expired' })
          }
        />
      </Card>
    </Screen>
  );
}
export default function PharmacyApp() {
  useEffect(() => {
    let active = true;
    update({ loading: true, error: '' });
    fetchRetailData()
      .then(data => active && update({ ...data, loading: false, error: '' }))
      .catch(error => active && update({ loading: false, error: error.message }));
    return () => { active = false; };
  }, []);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PharmacyTabs" component={MainTabs} />
      <Stack.Screen name="POS" component={NewSale} />
      <Stack.Screen name="Checkout" component={Cart} />
      <Stack.Screen name="Invoice" component={Invoice} />
      <Stack.Screen name="OrderList" component={Orders} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
      <Stack.Screen name="Inventory" component={Stock} />
      <Stack.Screen name="BatchDetail" component={BatchDetail} />
      <Stack.Screen name="Expiry" component={Expiry} />
      <Stack.Screen name="Reorder" component={Reorder} />
      <Stack.Screen name="PurchaseEntry" component={PurchaseEntry} />
      <Stack.Screen name="Suppliers" component={Suppliers} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetail} />
      <Stack.Screen name="Adjustments" component={Adjustments} />
      <Stack.Screen name="Customers" component={Customers} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
      <Stack.Screen name="Reports" component={Reports} />
      <Stack.Screen name="Sales" component={Sales} />
      <Stack.Screen name="Alerts" component={Alerts} />
    </Stack.Navigator>
  );
}
