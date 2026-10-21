import React, { useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../auth/AuthContext';
import {
  PartnerDataProvider,
  usePartnerData,
} from './PartnerDataContext';
import MedicineImage from '../Pharmacy/MedicineImage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PRODUCT_PAGE_SIZE = 30;
const C = {
  bg: '#F3F6FA',
  white: '#FFFFFF',
  ink: '#17253B',
  muted: '#718096',
  line: '#E4EAF1',
  blue: '#286BF2',
  blueSoft: '#E9F0FF',
  teal: '#129B91',
  tealSoft: '#E0F5F1',
  amber: '#B96A11',
  amberSoft: '#FFF1DE',
  red: '#C74E57',
  redSoft: '#FCE9E9',
  navy: '#152744',
};

const formatCurrency = value =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
const formatDate = value => {
  if (!value) {
    return 'No order date';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'No order date'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const formatOrderStatus = value => {
  const status = String(value || 'placed');
  return status
    .split(/[-_ ]/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
};

async function callSupport() {
  try {
    await Linking.openURL('tel:+918755810744');
  } catch (error) {
    Alert.alert(
      'Unable to open phone',
      error.message || 'Please call +91 87558 10744 manually.',
    );
  }
}

function WorkspaceNotice({ loading, error, onRetry, empty, emptyText }) {
  if (loading) {
    return (
      <View style={s.workspaceNotice}>
        <ActivityIndicator color={C.blue} />
        <Label size={12} color={C.muted} style={{ marginTop: 8 }}>
          Loading live workspace data…
        </Label>
      </View>
    );
  }
  if (error) {
    return (
      <View style={s.workspaceNotice}>
        <Icon name="cloud-alert-outline" size={24} color={C.red} />
        <Label size={12} color={C.red} style={{ marginVertical: 8, textAlign: 'center' }}>
          {error}
        </Label>
        {onRetry ? (
          <TouchableOpacity accessibilityRole="button" onPress={onRetry}>
            <Label size={12} color={C.blue} bold>Retry</Label>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={s.workspaceNotice}>
        <Label size={12} color={C.muted} style={{ textAlign: 'center' }}>
          {emptyText}
        </Label>
      </View>
    );
  }
  return null;
}

function Label({ children, size = 14, color = C.ink, bold = false, style }) {
  return <Text style={[{ color, fontFamily: bold ? 'DMSans-Bold' : 'DMSans-Regular', fontSize: size, lineHeight: size * 1.42 }, style]}>{children}</Text>;
}

function Page({ children, navigation, title, eyebrow, subtitle, scroll = true }) {
  const body = scroll ? (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      {title ? <PageHeading title={title} eyebrow={eyebrow} subtitle={subtitle} navigation={navigation} /> : null}
      {children}
    </ScrollView>
  ) : <View style={s.content}>{children}</View>;
  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>{body}</SafeAreaView>;
}

function PageHeading({ title, eyebrow, subtitle, navigation }) {
  return (
    <View style={s.pageHeading}>
      {navigation?.canGoBack() ? (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.backButton}>
          <Icon name="arrow-left" size={21} color={C.ink} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Label size={11} color={C.blue} bold style={s.eyebrow}>{eyebrow}</Label> : null}
        <Label size={25} bold style={s.pageTitle}>{title}</Label>
        {subtitle ? <Label size={13} color={C.muted} style={{ marginTop: 4 }}>{subtitle}</Label> : null}
      </View>
    </View>
  );
}

function Section({ title, action, onAction }) {
  return (
    <View style={s.sectionHead}>
      <Label size={16} bold>{title}</Label>
      {action ? <TouchableOpacity onPress={onAction}><Label size={12} color={C.blue} bold>{action}</Label></TouchableOpacity> : null}
    </View>
  );
}

function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function Badge({ children, tone = 'blue' }) {
  const palette = tone === 'green' ? [C.tealSoft, C.teal] : tone === 'amber' ? [C.amberSoft, C.amber] : tone === 'red' ? [C.redSoft, C.red] : [C.blueSoft, C.blue];
  return <View style={[s.badge, { backgroundColor: palette[0] }]}><Label size={10} bold color={palette[1]}>{children}</Label></View>;
}

function Button({ title, icon = 'arrow-right', subtle = false, onPress }) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.86} style={[s.button, subtle && s.buttonSubtle]}>
      <Label size={14} bold color={subtle ? C.blue : C.white}>{title}</Label>
      {icon ? <Icon name={icon} size={18} color={subtle ? C.blue : C.white} /> : null}
    </TouchableOpacity>
  );
}

function Progress({ value, color = C.teal }) {
  return <View style={s.progressTrack}><View style={[s.progressFill, { width: `${value}%`, backgroundColor: color }]} /></View>;
}

function Metric({ value, label, note, color }) {
  return (
    <View style={s.metric}>
      <Label size={22} bold color={color || C.ink}>{value}</Label>
      <Label size={11} bold style={{ marginTop: 3 }}>{label}</Label>
      <Label size={10} color={C.muted} style={{ marginTop: 2 }}>{note}</Label>
    </View>
  );
}

function PartnerRow({ item, onPress, compact = false }) {
  const tone = item.status === 'Active' ? 'green' : 'blue';
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.82} style={s.partnerRow}>
      <View style={s.partnerMark}><Label size={14} bold color={C.blue}>{item.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</Label></View>
      <View style={{ flex: 1 }}>
        <View style={s.rowTitle}><Label size={13} bold style={{ flex: 1 }}>{item.name}</Label><Badge tone={tone}>{item.status}</Badge></View>
        <Label size={11} color={C.muted} style={{ marginTop: 3 }}>{compact ? `${item.area} · ${formatDate(item.lastOrderAt)}` : `${item.owner} · ${item.area}`}</Label>
      </View>
      <Icon name="chevron-right" size={20} color={C.muted} />
    </TouchableOpacity>
  );
}

function DashboardScreen({ navigation }) {
  const { partners, orders, products, loading, error, refresh } = usePartnerData();
  const { user } = useAuth();
  const totalWholesaleValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const displayName =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Team member';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const firstName = displayName.split(/\s+/)[0];
  return (
    <Page>
      <View style={s.topline}>
        <View style={s.brandMark}><Icon name="medical-bag" size={19} color={C.white} /></View>
        <View style={{ flex: 1 }}><Label size={12} bold>MD PARTNERS</Label><Label size={10} color={C.muted}>FIELD SALES</Label></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => navigation.navigate('Notifications')} style={s.iconButton}><Icon name="bell-outline" size={21} color={C.ink} /><View style={s.notificationDot} /></TouchableOpacity>
      </View>
      <View style={s.welcome}>
        <View><Label size={12} color={C.muted}>{today.toUpperCase()}</Label><Label size={24} bold style={{ marginTop: 5 }}>Welcome, {firstName}</Label><Label size={12} color={C.muted} style={{ marginTop: 4 }}>{partners.length} wholesale partner accounts</Label></View>
        <View style={s.avatar}><Label size={12} bold color={C.blue}>{firstName.slice(0, 2).toUpperCase()}</Label></View>
      </View>
      <Card style={s.targetCard}>
        <View style={s.targetTop}><View style={{ flex: 1 }}><Label size={11} color="#B7C8E4" bold>WHOLESALE ORDER VALUE</Label><Label size={29} color={C.white} bold style={{ marginTop: 4 }}>{formatCurrency(totalWholesaleValue)}</Label><Label size={12} color="#D5E0F0">Across {orders.length} tracked orders</Label></View><View style={s.targetCircle}><Label size={19} bold color={C.white}>{partners.length}</Label><Label size={9} color="#C9D6E9">PARTNERS</Label></View></View>
        <View style={s.targetFoot}><Label size={11} color="#D5E0F0">Live data from MD Tracker wholesale</Label><TouchableOpacity onPress={() => navigation.navigate('Orders')}><Label size={11} bold color="#91B8FF">View orders  ›</Label></TouchableOpacity></View>
      </Card>
      <View style={s.syncLine}><Icon name={error ? 'cloud-alert-outline' : 'cloud-check-outline'} size={17} color={error ? C.red : C.teal} /><Label size={11} color={C.muted} style={{ flex: 1, marginLeft: 7 }}>{error ? 'Workspace sync needs attention' : loading ? 'Syncing workspace' : 'Connected to MD Tracker'}</Label><TouchableOpacity onPress={refresh}><Label size={10} bold color={C.blue}>REFRESH</Label></TouchableOpacity></View>
      <View style={s.metricGrid}>
        <Metric value={String(orders.length)} label="Wholesale orders" note="From MD Tracker" color={C.blue} />
        <Metric value={String(partners.length)} label="Partners" note="Customers with orders" color={C.teal} />
        <Metric value={String(products.length)} label="Products" note="Live catalog" color={C.ink} />
        <Metric value={formatCurrency(totalWholesaleValue)} label="Order value" note="All tracked orders" color={C.red} />
      </View>
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} />
      <Section title="Quick actions" action="All tools" onAction={() => navigation.navigate('More')} />
      <View style={s.actionGrid}>
        <ActionTile icon="map-marker-path" label="Daily route" onPress={() => navigation.navigate('Route')} />
        <ActionTile icon="clipboard-plus-outline" label="Book an order" onPress={() => navigation.navigate('OrderBooking')} />
        <ActionTile icon="cash-check" label="Collect payment" onPress={() => navigation.navigate('Collection')} />
        <ActionTile icon="view-grid-outline" label="Catalog & offers" onPress={() => navigation.navigate('Catalog')} />
      </View>
      <Section title="Recent wholesale partners" action="View all" onAction={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })} />
      {partners.slice(0, 3).map(item => <Card key={item.id} style={{ paddingVertical: 2 }}><PartnerRow item={item} compact onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /></Card>)}
      {!loading && !error && partners.length === 0 ? <WorkspaceNotice empty emptyText="Wholesale partners will appear here when an order is placed for them in MD Tracker." /> : null}
    </Page>
  );
}

function ActionTile({ icon, label, onPress }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={s.actionTile}><View style={s.actionIcon}><Icon name={icon} size={21} color={C.blue} /></View><Label size={11} bold>{label}</Label></TouchableOpacity>;
}

function RouteScreen({ navigation }) {
  const { partners, loading, error, refresh } = usePartnerData();
  return (
    <Page navigation={navigation} title="Wholesale partners" eyebrow="MD TRACKER ACCOUNTS" subtitle={`${partners.length} customers linked to wholesale orders`}>
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!partners.length} emptyText="Partners appear here when MD Tracker has a wholesale order for them." />
      {partners.map((item, index) => <Card key={item.id} style={{ paddingVertical: 0, marginBottom: 9 }}><PartnerRow item={item} compact onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /><View style={s.stopFooter}><Label size={10} color={C.muted}>{String(index + 1).padStart(2, '0')} · WHOLESALE</Label><Label size={10} color={C.muted}>Last order {formatDate(item.lastOrderAt)}</Label></View></Card>)}
    </Page>
  );
}

function PartnersScreen({ navigation }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const [query, setQuery] = useState('');
  const shown = partners.filter(item => `${item.name} ${item.owner} ${item.area}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Page navigation={navigation} title="Your partners" eyebrow="WHOLESALE ACCOUNTS" subtitle="Customers with wholesale orders in MD Tracker">
      <View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, owner or area" placeholderTextColor={C.muted} style={s.searchInput} /></View>
      <View style={s.filterRow}><Badge>All {partners.length}</Badge><Badge tone="green">Wholesale {partners.length}</Badge></View>
      <View style={s.listHeading}><Label size={11} color={C.muted} bold>PARTNER</Label><Label size={11} color={C.muted} bold>OUTSTANDING</Label></View>
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!shown.length} emptyText={query ? 'No wholesale partners match this search.' : 'Partners appear here when an MD Tracker wholesale order is linked to their customer account.'} />
      {shown.map(item => <Card key={item.id} style={{ marginBottom: 9, paddingVertical: 2 }}><PartnerRow item={item} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /><View style={s.partnerBalance}><Label size={10} color={C.muted}>{item.type} · Last order {formatCurrency(item.order)}</Label><Label size={11} bold color={C.ink}>{formatCurrency(item.due)}</Label></View></Card>)}
    </Page>
  );
}

function OrdersScreen({ navigation }) {
  const { orders, loading, error, refresh } = usePartnerData();
  return (
    <Page navigation={navigation} title="Wholesale orders" eyebrow="MD TRACKER FULFILMENT" subtitle="Orders and lifecycle updates from the wholesale section">
      <Button title="Create partner order" icon="plus" onPress={() => navigation.navigate('OrderBooking')} />
      <View style={[s.filterRow, { marginTop: 16 }]}><Badge>All {orders.length}</Badge><Badge tone="amber">{orders.filter(order => order.currentStatus === 'placed').length} placed</Badge><Badge tone="blue">{orders.filter(order => !['delivered', 'invoice-updated'].includes(order.currentStatus)).length} in progress</Badge><Badge tone="green">{orders.filter(order => ['delivered', 'invoice-updated'].includes(order.currentStatus)).length} fulfilled</Badge></View>
      <Section title="Recent wholesale orders" action="History" onAction={() => navigation.navigate('OrderHistory')} />
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!orders.length} emptyText="Wholesale orders placed in MD Tracker will appear here." />
      {orders.map(order => <Card key={order.id} style={{ marginBottom: 10 }}><View style={s.orderTop}><View><Label size={11} color={C.muted}>WHO-{order.id} · {formatDate(order.createdAt)}</Label><Label size={14} bold style={{ marginTop: 5 }}>{order.customer?.name || 'Wholesale customer'}</Label></View><Badge tone={['delivered', 'invoice-updated'].includes(order.currentStatus) ? 'green' : order.currentStatus === 'placed' ? 'amber' : 'blue'}>{formatOrderStatus(order.currentStatus)}</Badge></View><View style={s.orderBottom}><Label size={11} color={C.muted}>{order.itemCount} line items · {order.billingType || 'wholesale'}</Label><Label size={15} bold>{formatCurrency(order.totalAmount)}</Label></View></Card>)}
      <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')} style={s.centerLink}><Label size={12} bold color={C.blue}>View order history</Label><Icon name="arrow-right" size={16} color={C.blue} /></TouchableOpacity>
    </Page>
  );
}

function MoreScreen({ navigation }) {
  const { user } = useAuth();
  const name =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Team member';
  const tools = [
    ['trophy-outline', 'Sales targets', 'Monthly pace and channel split', 'Targets'],
    ['wallet-outline', 'Collections', 'Payments due from your partners', 'Collection'],
    ['chart-bar', 'Outstanding ledger', 'Ageing and credit exposure', 'Ledger'],
    ['view-grid-outline', 'Product catalog', 'Availability, schemes and packs', 'Catalog'],
    ['package-variant-closed', 'Inventory availability', 'Stock signals for your territory', 'Inventory'],
    ['bell-outline', 'Notifications', 'Schemes, updates and follow-ups', 'Notifications'],
    ['headset', 'Help & support', 'Get help from the sales operations desk', 'Support'],
    ['account-cog-outline', 'Profile & settings', 'Your team, territory and preferences', 'Profile'],
  ];
  return (
    <Page navigation={navigation} title="More" eyebrow="SALES TOOLKIT" subtitle="Everything you need between partner visits">
      <Card style={s.profileBanner}><View style={[s.avatar, { width: 44, height: 44 }]}><Label size={13} bold color={C.blue}>{name.slice(0, 2).toUpperCase()}</Label></View><View style={{ flex: 1, marginLeft: 11 }}><Label size={14} bold>{name}</Label><Label size={11} color={C.muted}>{user?.role || user?.email || 'MD Tracker account'}</Label></View><Icon name="chevron-right" size={20} color={C.muted} /></Card>
      <Section title="Tools & insights" />
      <Card style={{ paddingVertical: 2 }}>{tools.map(([icon, title, detail, route]) => <ToolRow key={route} icon={icon} title={title} detail={detail} onPress={() => navigation.navigate(route)} />)}</Card>
      <Card style={s.syncCard}><View style={s.syncBadge}><Icon name="cloud-check-outline" size={19} color={C.teal} /></View><View style={{ flex: 1 }}><Label size={12} bold>Offline sync is ready</Label><Label size={10} color={C.muted}>4 updates will upload when online</Label></View><Icon name="chevron-right" size={18} color={C.muted} /></Card>
    </Page>
  );
}

function ToolRow({ icon, title, detail, onPress }) {
  return <TouchableOpacity onPress={onPress} style={s.toolRow}><View style={s.toolIcon}><Icon name={icon} size={19} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{title}</Label><Label size={10} color={C.muted} style={{ marginTop: 2 }}>{detail}</Label></View><Icon name="chevron-right" size={18} color={C.muted} /></TouchableOpacity>;
}

function CustomerDetailScreen({ navigation, route }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const customer = partners.find(item => item.id === String(route.params?.customerId));
  if (!customer) {
    return <Page navigation={navigation} title="Partner details"><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!loading && !error} emptyText="This wholesale customer is not linked to an order in the current workspace." /></Page>;
  }
  return (
    <Page navigation={navigation} title={customer.name} eyebrow={`${customer.type.toUpperCase()} PARTNER`} subtitle={`${customer.owner} · ${customer.area}`}>
      <Card style={s.detailHero}><View style={s.detailAvatar}><Label size={18} bold color={C.blue}>{customer.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</Label></View><View style={{ flex: 1, marginLeft: 12 }}><Label size={14} bold>{customer.owner}</Label><Label size={11} color={C.muted}>{customer.area} · {customer.type}</Label><View style={{ marginTop: 7, alignSelf: 'flex-start' }}><Badge tone="green">Active account</Badge></View></View><TouchableOpacity style={s.smallIcon}><Icon name="phone-outline" size={19} color={C.blue} /></TouchableOpacity></Card>
      <View style={[s.metricGrid, { marginTop: 12 }]}><Metric value={formatCurrency(customer.due)} label="Outstanding" note="From customer record" color={C.amber} /><Metric value={formatCurrency(customer.order)} label="Last order" note={formatDate(customer.lastOrderAt)} color={C.blue} /></View>
      <Section title="Partner snapshot" />
      <Card><InfoRow label="Wholesale orders" value={String(customer.orderCount)} /><InfoRow label="Phone" value={customer.phone || 'Not provided'} /><InfoRow label="Email" value={customer.email || 'Not provided'} /><InfoRow label="Customer code" value={customer.customerCode || 'Not provided'} last /></Card>
      <Button title="Book a wholesale order" icon="clipboard-plus-outline" onPress={() => navigation.navigate('OrderBooking', { customerId: customer.id })} />
    </Page>
  );
}

function InfoRow({ label, value, last }) {
  return <View style={[s.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: C.line }]}><Label size={11} color={C.muted}>{label}</Label><Label size={12} bold>{value}</Label></View>;
}

function VisitCheckinScreen({ navigation, route }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const customer = partners.find(item => item.id === String(route.params?.customerId));
  const [outcome, setOutcome] = useState('Order placed');
  const outcomes = ['Order placed', 'Payment collected', 'Follow-up needed', 'Store closed'];
  if (!customer) {
    return <Page navigation={navigation} title="Partner visit"><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!loading && !error} emptyText="Select a wholesale partner from your accounts." /></Page>;
  }
  return (
    <Page navigation={navigation} title="Partner visit" eyebrow="WHOLESALE ACCOUNT" subtitle="Choose an action for this wholesale customer">
      <Card style={s.visitHeader}><View style={s.partnerMark}><Label size={14} bold color={C.blue}>{customer.name.slice(0, 2).toUpperCase()}</Label></View><View style={{ flex: 1 }}><Label size={14} bold>{customer.name}</Label><Label size={11} color={C.muted}>{customer.area} · {customer.owner}</Label></View><Badge tone="green">{customer.status}</Badge></Card>
      <Section title="Visit outcome" />
      <View style={{ gap: 8 }}>{outcomes.map((item, index) => <TouchableOpacity key={item} onPress={() => setOutcome(item)} style={[s.outcome, outcome === item && s.outcomeSelected]}><View style={[s.radio, outcome === item && s.radioSelected]}>{outcome === item ? <View style={s.radioDot} /> : null}</View><Label size={13} bold={outcome === item}>{item}</Label><Icon name={['clipboard-check-outline', 'cash-check', 'calendar-clock-outline', 'store-off-outline'][index]} size={19} color={outcome === item ? C.blue : C.muted} style={{ marginLeft: 'auto' }} /></TouchableOpacity>)}</View>
      <WorkspaceNotice empty emptyText="Visit outcomes are not saved yet. The backend currently has no customer visit/check-in endpoint." />
      <Button title={outcome === 'Order placed' ? 'Continue to order' : 'Confirm outcome'} icon="arrow-right" onPress={() => outcome === 'Order placed' ? navigation.navigate('OrderBooking', { customerId: customer.id }) : Alert.alert('Visit not recorded', 'This outcome is only a selection. No visit or payment record has been saved.')} />
    </Page>
  );
}

function OrderBookingScreen({ navigation, route }) {
  const { partners, products, loading, error, refresh } = usePartnerData();
  const customer = partners.find(item => item.id === String(route.params?.customerId));
  const [quantities, setQuantities] = useState({});
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE);
  const shownProducts = useMemo(
    () => products.filter(product =>
      `${product.name} ${product.maker} ${product.salt} ${product.strength}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ),
    [products, query],
  );
  const displayedProducts = shownProducts.slice(0, visibleCount);
  const rows = products
    .filter(product => Number(quantities[product.id]) > 0)
    .map(product => ({
      productId: product.id,
      quantity: Number(quantities[product.id]),
      price: product.wholesalePrice,
      batchNumber: product.batchNumber,
      mfd: product.mfd,
      expiry: product.expiry,
    }));
  const count = rows.reduce((sum, row) => sum + row.quantity, 0);
  const updateQuantity = (productId, delta) =>
    setQuantities(current => ({
      ...current,
      [productId]: Math.max(0, Number(current[productId] || 0) + delta),
    }));
  if (!customer) {
    return <Page navigation={navigation} title="Book a wholesale order"><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!loading && !error} emptyText="Choose a partner account before creating an order." /><Button title="Choose partner" icon="account-multiple-outline" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })} /></Page>;
  }
  return (
    <Page navigation={navigation} title="Book an order" eyebrow="WHOLESALE ORDER" subtitle="Select products from the live MD Tracker catalog">
      <Card style={s.orderCustomer}><View style={{ flex: 1 }}><Label size={10} color={C.muted} bold>ORDER FOR</Label><Label size={13} bold style={{ marginTop: 3 }}>{customer.name}</Label><Label size={10} color={C.muted}>{customer.area}</Label></View><TouchableOpacity onPress={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })}><Label size={11} bold color={C.blue}>Change</Label></TouchableOpacity></Card>
      <View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search products or brand" placeholderTextColor={C.muted} style={s.searchInput} /></View>
      <View style={s.filterRow}><Badge>Products {products.length}</Badge><Badge tone="blue">Wholesale prices</Badge></View>
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!shownProducts.length} emptyText={query ? 'No products match this search.' : 'No products are available in the live catalog.'} />
      {displayedProducts.map(product => <Card key={product.id} style={s.productCard}><View style={s.productTop}><MedicineImage medicine={product} size={48} /><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{[product.maker, product.strength, product.form].filter(Boolean).join(' · ') || product.salt || 'Catalog item'}</Label></View><Label size={13} bold>{formatCurrency(product.wholesalePrice)}</Label></View><View style={s.productBottom}><View><Label size={10} color={C.muted}>Wholesale price · MRP {formatCurrency(product.mrp)}</Label><Label size={10} color={C.muted} style={{ marginTop: 2 }}>{product.stock == null ? 'Stock availability not loaded' : `${product.stock} packs in inventory`}</Label></View><View style={s.quantity}><TouchableOpacity accessibilityLabel={`Remove one ${product.name}`} onPress={() => updateQuantity(product.id, -1)} style={s.quantityButton}><Icon name="minus" size={15} color={C.blue} /></TouchableOpacity><Label size={12} bold>{quantities[product.id] || 0}</Label><TouchableOpacity accessibilityLabel={`Add one ${product.name}`} onPress={() => updateQuantity(product.id, 1)} style={s.quantityButton}><Icon name="plus" size={15} color={C.blue} /></TouchableOpacity></View></View></Card>)}
      {shownProducts.length > displayedProducts.length ? <Button title={`Load ${Math.min(PRODUCT_PAGE_SIZE, shownProducts.length - displayedProducts.length)} more products`} icon="chevron-down" subtle onPress={() => setVisibleCount(count => count + PRODUCT_PAGE_SIZE)} /> : null}
      <Card style={s.cartSummary}><View style={{ flex: 1 }}><Label size={12} bold>{count} units · {rows.length} product lines</Label><Label size={10} color={C.muted}>Review the wholesale order total</Label></View><Button title="Review order" icon="arrow-right" onPress={() => count > 0 && navigation.navigate('OrderReview', { customerId: customer.id, rows })} /></Card>
    </Page>
  );
}

function OrderReviewScreen({ navigation, route }) {
  const { partners, products, submitOrder } = usePartnerData();
  const customer = partners.find(item => item.id === String(route.params?.customerId));
  const rows = Array.isArray(route.params?.rows) ? route.params.rows : [];
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const productsById = new Map(products.map(product => [product.id, product]));
  const total = rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
  const placeOrder = async () => {
    if (submitting || !customer || !rows.length) {
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const createdOrder = await submitOrder({
        customerId: customer.id,
        rows,
        billingType: 'wholesale',
        source: 'md-partners',
        allowPartialFulfillment: true,
      });
      navigation.replace('OrderComplete', {
        customerName: customer.name,
        orderId: createdOrder.id,
      });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (!customer) {
    return <Page navigation={navigation} title="Review order"><WorkspaceNotice empty emptyText="This wholesale customer is no longer available." /></Page>;
  }
  return (
    <Page navigation={navigation} title="Review order" eyebrow="ORDER SUMMARY" subtitle={`For ${customer.name}`}>
      <Card><View style={s.orderTop}><Label size={12} bold>{rows.length} product lines</Label><Badge tone="blue">Wholesale</Badge></View>{rows.map(row => <InfoRow key={row.productId} label={`${productsById.get(row.productId)?.name || `Product ${row.productId}`} · ${row.quantity} units`} value={formatCurrency(row.price * row.quantity)} />)}<InfoRow label="Estimated total" value={formatCurrency(total)} last /></Card>
      <Section title="Delivery & payment" /><Card><InfoRow label="Ship to" value={[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'Customer address on file'} /><InfoRow label="Payment terms" value={`${customer.creditDays || 0} credit days`} last /></Card>
      <Card style={s.notice}><Icon name="information-outline" size={18} color={C.blue} /><Label size={11} color={C.muted} style={{ flex: 1, marginLeft: 9 }}>Final pricing and availability will be confirmed by the distribution team.</Label></Card>
      <WorkspaceNotice error={submitError} />
      <Button title={submitting ? 'Submitting order…' : 'Submit wholesale order'} icon="check" onPress={placeOrder} />
    </Page>
  );
}

function OrderCompleteScreen({ navigation, route }) {
  return <Page navigation={navigation} title="Order submitted" eyebrow="WHOLESALE ORDER" subtitle="Your order is now in MD Tracker"><View style={s.completeMark}><Icon name="check" size={34} color={C.white} /></View><Card style={{ alignItems: 'center', padding: 22 }}><Label size={18} bold>Wholesale order created</Label><Label size={12} color={C.muted} style={{ textAlign: 'center', marginTop: 7 }}>Order WHO-{route.params?.orderId} for {route.params?.customerName || 'your partner'} has been added to the wholesale workflow.</Label><View style={{ marginTop: 14 }}><Badge tone="amber">Placed</Badge></View></Card><Button title="Back to orders" icon="receipt-text-outline" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Orders' })} /><View style={{ height: 10 }} /><Button title="Return to dashboard" icon="home-outline" subtle onPress={() => navigation.navigate('PartnerTabs', { screen: 'Home' })} /></Page>;
}

function CollectionScreen({ navigation }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const outstanding = partners.reduce((sum, partner) => sum + partner.due, 0);
  return (
    <Page navigation={navigation} title="Collections" eyebrow="PAYMENT FOLLOW-UPS" subtitle="Outstanding balances from wholesale customer records">
      <Card style={s.collectionHero}><Label size={11} color="#B7C8E4" bold>RECORDED CUSTOMER BALANCE</Label><Label size={28} color={C.white} bold style={{ marginTop: 3 }}>{formatCurrency(outstanding)}</Label><Label size={11} color="#D5E0F0">Customer-record values · {partners.length} wholesale partners</Label></Card>
      <WorkspaceNotice empty emptyText="The backend does not reconcile wholesale orders with customer receipts. These are customer-record balances only." />
      <Section title="Payment follow-ups" action="View ledger" onAction={() => navigation.navigate('Ledger')} />
      <WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!partners.length} emptyText="Wholesale partner balances will appear here." />
      {partners.map(item => <Card key={item.id} style={{ marginBottom: 9 }}><View style={s.orderTop}><View><Label size={13} bold>{item.name}</Label><Label size={10} color={C.muted} style={{ marginTop: 3 }}>{item.type} · {item.orderCount} wholesale orders</Label></View><Badge tone={item.due > 0 ? 'amber' : 'green'}>{item.due > 0 ? 'Recorded balance' : 'No balance recorded'}</Badge></View><View style={s.orderBottom}><Label size={10} color={C.muted}>Customer record balance</Label><Label size={15} bold>{formatCurrency(item.due)}</Label></View><TouchableOpacity onPress={() => navigation.navigate('CollectionDetail', { customerId: item.id })} style={s.centerLink}><Label size={11} bold color={C.blue}>Receipt endpoint status</Label><Icon name="arrow-right" size={15} color={C.blue} /></TouchableOpacity></Card>)}
    </Page>
  );
}

function CollectionDetailScreen({ navigation, route }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const partner = partners.find(item => item.id === String(route.params?.customerId));
  if (!partner) {
    return <Page navigation={navigation} title="Payment recording"><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!loading && !error} emptyText="This wholesale customer is not available in the current workspace." /></Page>;
  }
  return <Page navigation={navigation} title="Receipt status" eyebrow="CUSTOMER RECEIPTS" subtitle={partner.name}><Card><InfoRow label="Customer record balance" value={formatCurrency(partner.due)} /><InfoRow label="Wholesale orders" value={String(partner.orderCount)} /><InfoRow label="Latest order" value={formatCurrency(partner.order)} last /></Card><WorkspaceNotice error="The backend has no customer receipt endpoint. This screen is read-only; no payment has been recorded. Supplier expense payments are separate and must not be used as customer receipts." /><Button title="Back to collections" icon="arrow-left" subtle onPress={() => navigation.goBack()} /></Page>;
}

function LedgerScreen({ navigation }) {
  const { partners, loading, error, refresh } = usePartnerData();
  const outstanding = partners.reduce((sum, partner) => sum + partner.due, 0);
  return <Page navigation={navigation} title="Outstanding ledger" eyebrow="CREDIT EXPOSURE" subtitle={`${formatCurrency(outstanding)} across ${partners.length} wholesale partners`}><Card style={s.ledgerHero}><Label size={11} color="#B7C8E4" bold>TOTAL OUTSTANDING</Label><Label size={28} color={C.white} bold style={{ marginTop: 4 }}>{formatCurrency(outstanding)}</Label><View style={s.ledgerStats}><Label size={10} color="#D5E0F0">Customers  {partners.length}</Label><Label size={10} color="#F9B3B9">Wholesale orders  {partners.reduce((sum, partner) => sum + partner.orderCount, 0)}</Label></View></Card><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!partners.length} emptyText="Outstanding balances will appear when wholesale customers are linked to orders." /><Section title="Partner balances" action="Collections" onAction={() => navigation.navigate('Collection')} />{partners.map(item => <Card key={item.id} style={{ marginBottom: 8, paddingVertical: 0 }}><PartnerRow item={item} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /><View style={s.partnerBalance}><Label size={10} color={C.muted}>{item.orderCount} orders · Last {formatDate(item.lastOrderAt)}</Label><Label size={11} bold color={C.ink}>{formatCurrency(item.due)}</Label></View></Card>)}</Page>;
}

function CatalogScreen({ navigation }) {
  const { products, loading, error, refresh } = usePartnerData();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE);
  const shownProducts = products.filter(product =>
    `${product.name} ${product.maker} ${product.salt} ${product.strength}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const displayedProducts = shownProducts.slice(0, visibleCount);
  return <Page navigation={navigation} title="Catalog & offers" eyebrow="LIVE PRODUCT RANGE" subtitle={`${products.length} products from the MD Tracker catalog`}><View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search product, brand or salt" placeholderTextColor={C.muted} style={s.searchInput} /></View><View style={s.filterRow}><Badge>Products {products.length}</Badge><Badge tone="blue">Wholesale prices</Badge></View><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!shownProducts.length} emptyText={query ? 'No products match this search.' : 'No products are available in the live catalog.'} />{displayedProducts.map(product => <Card key={product.id} style={s.productCard}><View style={s.productTop}><View style={s.productGlyph}><Icon name="pill" size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{[product.maker, product.strength, product.form].filter(Boolean).join(' · ') || product.salt || 'Catalog item'}</Label></View><Label size={14} bold>{formatCurrency(product.wholesalePrice)}</Label></View><View style={s.productBottom}><View><Label size={10} color={C.teal} bold>Wholesale price</Label><Label size={10} color={C.muted} style={{ marginTop: 2 }}>{product.stock == null ? 'Inventory not loaded' : `${product.stock} packs in inventory`}</Label></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Add ${product.name} to order`} onPress={() => navigation.navigate('OrderBooking')} style={s.smallIcon}><Icon name="plus" size={18} color={C.blue} /></TouchableOpacity></View></Card>)}{shownProducts.length > displayedProducts.length ? <Button title={`Load ${Math.min(PRODUCT_PAGE_SIZE, shownProducts.length - displayedProducts.length)} more products`} icon="chevron-down" subtle onPress={() => setVisibleCount(count => count + PRODUCT_PAGE_SIZE)} /> : null}<Button title="Build wholesale order" icon="clipboard-plus-outline" onPress={() => navigation.navigate('OrderBooking')} /></Page>;
}

function TargetsScreen({ navigation }) {
  const { orders, partners, loading, error, refresh } = usePartnerData();
  const orderValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const deliveredOrders = orders.filter(order =>
    ['delivered', 'invoice-updated'].includes(order.currentStatus),
  ).length;
  const fulfillmentRate = orders.length
    ? Math.round((deliveredOrders / orders.length) * 100)
    : 0;
  return <Page navigation={navigation} title="Sales performance" eyebrow="ALL-TIME WHOLESALE METRICS" subtitle="Order totals from the MD Tracker wholesale workflow (not sales targets)"><Card style={s.targetCard}><View style={s.targetTop}><View style={{ flex: 1 }}><Label size={11} color="#B7C8E4" bold>ALL-TIME ORDER VALUE</Label><Label size={28} color={C.white} bold style={{ marginTop: 4 }}>{formatCurrency(orderValue)}</Label><Label size={11} color="#D5E0F0">{orders.length} orders across {partners.length} partners</Label></View><View style={s.targetCircle}><Label size={19} bold color={C.white}>{fulfillmentRate}%</Label><Label size={9} color="#C9D6E9">DELIVERED</Label></View></View><Progress value={fulfillmentRate} color="#56D4C1" /><Label size={10} color="#D5E0F0" style={{ marginTop: 9 }}>{deliveredOrders} of {orders.length} wholesale orders delivered or invoiced</Label></Card><WorkspaceNotice loading={loading} error={error} onRetry={refresh} /><Section title="All-time wholesale summary" /><Card><InfoRow label="Orders placed" value={String(orders.length)} /><InfoRow label="Delivered or invoiced" value={String(deliveredOrders)} /><InfoRow label="Wholesale partners" value={String(partners.length)} last /></Card><View style={{ height: 14 }} /><Button title="Open wholesale orders" icon="receipt-text-outline" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Orders' })} /></Page>;
}

function InventoryScreen({ navigation }) {
  const { products, loading, error, refresh } = usePartnerData();
  const availableProducts = products.filter(product => product.stock > 0);
  return <Page navigation={navigation} title="Inventory availability" eyebrow="MD TRACKER STOCK" subtitle="Product stock from the assigned store inventory"><Card style={s.inventoryBanner}><Icon name="package-variant-closed-check" size={22} color={C.teal} /><View style={{ flex: 1, marginLeft: 10 }}><Label size={12} bold>Inventory snapshot</Label><Label size={10} color={C.muted}>Loaded from MD Tracker</Label></View><Badge tone="green">Live view</Badge></Card><View style={s.filterRow}><Badge>Products {products.length}</Badge><Badge tone="green">In stock {availableProducts.length}</Badge></View><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!products.length} emptyText="No inventory is available in the current store." />{products.map(product => <Card key={product.id} style={s.productCard}><View style={s.productTop}><View style={s.productGlyph}><Icon name="pill" size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{[product.maker, product.strength, product.form].filter(Boolean).join(' · ') || product.salt || 'Catalog item'}</Label></View><Badge tone={product.stock > 0 ? 'green' : 'amber'}>{product.stock == null ? 'Stock unknown' : product.stock > 0 ? 'Available' : 'Out of stock'}</Badge></View><View style={s.productBottom}><Label size={10} color={C.muted}>Wholesale price {formatCurrency(product.wholesalePrice)}</Label><Label size={11} bold>{product.stock == null ? '—' : `${product.stock} packs`}</Label></View></Card>)}<Button title="Open product catalog" icon="view-grid-outline" subtle onPress={() => navigation.navigate('Catalog')} /></Page>;
}

function NotificationsScreen({ navigation }) {
  const { orders, loading, error, refresh } = usePartnerData();
  const notices = orders.slice(0, 10).map(order => {
    const status = order.currentStatus;
    return {
      id: order.id,
      title: `Wholesale order WHO-${order.id} · ${formatOrderStatus(status)}`,
      meta: `${order.customer?.name || 'Wholesale customer'} · ${formatDate(order.createdAt)}`,
      tone: ['delivered', 'invoice-updated'].includes(status) ? 'green' : status === 'placed' ? 'amber' : 'blue',
    };
  });
  return <Page navigation={navigation} title="Notifications" eyebrow="WHOLESALE UPDATES" subtitle="Recent order activity from MD Tracker"><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!notices.length} emptyText="Wholesale order updates will appear here." /><Section title="Recent activity" />{notices.map(notice => <Card key={notice.id} style={s.noticeRow}><View style={[s.toolIcon, { backgroundColor: notice.tone === 'amber' ? C.amberSoft : notice.tone === 'green' ? C.tealSoft : C.blueSoft }]}><Icon name="receipt-text-outline" size={18} color={notice.tone === 'amber' ? C.amber : notice.tone === 'green' ? C.teal : C.blue} /></View><View style={{ flex: 1 }}><Label size={12} bold>{notice.title}</Label><Label size={10} color={C.muted} style={{ marginTop: 4 }}>{notice.meta}</Label></View></Card>)}</Page>;
}

function SupportScreen({ navigation }) {
  return <Page navigation={navigation} title="Help & support" eyebrow="SALES OPERATIONS DESK" subtitle="Support requests are not sent from this MVP"><Card style={s.supportHero}><View style={s.supportGlyph}><Icon name="headset" size={23} color={C.white} /></View><Label size={16} bold style={{ marginTop: 12 }}>Need help?</Label><Label size={11} color={C.muted} style={{ marginTop: 3 }}>Call our support team at +91 87558 10744</Label><View style={{ marginTop: 14 }}><Button title="Call support" icon="phone" onPress={callSupport} /></View></Card><Section title="For help with MD Partners" /><Card><Label size={12} color={C.muted}>Support tickets are not connected yet. Please call +91 87558 10744 for assistance.</Label></Card></Page>;
}

function SupportRequestScreen({ navigation }) {
  const { partners } = usePartnerData();
  return <Page navigation={navigation} title="New support request" eyebrow="SALES OPS" subtitle="Support request preview"><Card><InfoRow label="Request type" value="Order & fulfilment" /><InfoRow label="Wholesale partners" value={String(partners.length)} /><InfoRow label="Priority" value="Normal" last /></Card><View style={s.noteBox}><Label size={12} color={C.muted}>Describe what you need help with...</Label></View><Button title="Close preview" icon="arrow-left" onPress={() => navigation.goBack()} /></Page>;
}

function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const name =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Team member';
  const signOut = async () => {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message);
    }
  };
  return <Page navigation={navigation} title="Profile & settings" eyebrow="YOUR MD TRACKER PROFILE" subtitle="Account details and app preferences"><Card style={s.profileBanner}><View style={[s.avatar, { width: 48, height: 48 }]}><Label size={13} bold color={C.blue}>{name.slice(0, 2).toUpperCase()}</Label></View><View style={{ flex: 1, marginLeft: 11 }}><Label size={14} bold>{name}</Label><Label size={11} color={C.muted}>{user?.role || user?.email || 'MD Tracker account'}</Label></View><Badge tone="green">Signed in</Badge></Card><Section title="Account" /><Card><InfoRow label="Email" value={user?.email || 'Not provided'} /><InfoRow label="Phone" value={user?.phone || 'Not provided'} /><InfoRow label="Account ID" value={String(user?.id || '—')} last /></Card><Section title="Preferences" /><Card style={{ paddingVertical: 2 }}><ToolRow icon="cloud-sync-outline" title="Refresh workspace" detail="Reload products, partners and wholesale orders" onPress={() => navigation.navigate('SyncStatus')} /><ToolRow icon="bell-outline" title="Notification settings" detail="Manage app notifications" onPress={() => navigation.navigate('Notifications')} /><ToolRow icon="help-circle-outline" title="Help & support" detail="Get help using MD Partners" onPress={() => navigation.navigate('Support')} /></Card>{logoutError ? <WorkspaceNotice error={logoutError} /> : null}<View style={{ marginTop: 12 }}><Button title="Sign out" icon="logout" subtle onPress={signOut} /></View></Page>;
}

function SyncStatusScreen({ navigation }) {
  const { products, partners, orders, loading, error, refresh } = usePartnerData();
  return <Page navigation={navigation} title="Workspace sync" eyebrow="MD TRACKER CONNECTION" subtitle="Refresh shared catalog, partners and wholesale orders"><Card style={s.syncCard}><View style={s.syncBadge}><Icon name={error ? 'cloud-alert-outline' : 'cloud-check-outline'} size={20} color={error ? C.red : C.teal} /></View><View style={{ flex: 1 }}><Label size={13} bold>{error ? 'Sync needs attention' : loading ? 'Refreshing workspace' : 'Workspace connected'}</Label><Label size={10} color={C.muted}>Live data loaded from the MD Tracker backend</Label></View><Badge tone={error ? 'red' : loading ? 'amber' : 'green'}>{error ? 'Error' : loading ? 'Syncing' : 'Connected'}</Badge></Card><Section title="Loaded workspace" /><Card><InfoRow label="Catalog products" value={String(products.length)} /><InfoRow label="Wholesale partners" value={String(partners.length)} /><InfoRow label="Wholesale orders" value={String(orders.length)} last /></Card><WorkspaceNotice error={error} /><View style={{ height: 14 }} /><Button title={loading ? 'Refreshing…' : 'Refresh workspace'} icon="cloud-sync-outline" onPress={refresh} /></Page>;
}

function OrderHistoryScreen({ navigation }) {
  const { orders, loading, error, refresh } = usePartnerData();
  return <Page navigation={navigation} title="Order history" eyebrow="ALL WHOLESALE ORDERS" subtitle={`${orders.length} orders from the MD Tracker wholesale workflow`}><WorkspaceNotice loading={loading} error={error} onRetry={refresh} empty={!orders.length} emptyText="No wholesale orders have been recorded for this store." />{orders.map(order => <Card key={order.id} style={{ marginBottom: 9 }}><View style={s.orderTop}><View><Label size={10} color={C.muted}>WHO-{order.id} · {formatDate(order.createdAt)}</Label><Label size={13} bold style={{ marginTop: 4 }}>{order.customer?.name || 'Wholesale customer'}</Label></View><Badge tone={order.currentStatus === 'delivered' || order.currentStatus === 'invoice-updated' ? 'green' : order.currentStatus === 'placed' ? 'amber' : 'blue'}>{formatOrderStatus(order.currentStatus)}</Badge></View><View style={s.orderBottom}><Label size={10} color={C.muted}>{order.itemCount} product lines · {order.billingType || 'wholesale'}</Label><Label size={13} bold>{formatCurrency(order.totalAmount)}</Label></View></Card>)}</Page>;
}

function RouteOptionsScreen({ navigation }) {
  const { partners } = usePartnerData();
  return <Page navigation={navigation} title="Route options" eyebrow="WHOLESALE ACCOUNTS" subtitle="Account actions for the current store"><Card><InfoRow label="Available wholesale partners" value={String(partners.length)} /><InfoRow label="Route planning" value="Not provided by the backend" /><InfoRow label="Order-based accounts" value="MD Tracker wholesale customers" last /></Card><Section title="Partner tools" /><Card style={{ paddingVertical: 2 }}><ToolRow icon="calendar-plus-outline" title="Browse wholesale partners" detail="Open accounts linked to orders" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })} /></Card></Page>;
}

function MainTabs() {
  const icons = { Home: 'view-dashboard-outline', Route: 'map-marker-path', Partners: 'storefront-outline', Orders: 'receipt', More: 'dots-grid' };
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: C.blue,
      tabBarInactiveTintColor: '#8B96A8',
      tabBarStyle: s.tabBar,
      tabBarLabelStyle: s.tabLabel,
      tabBarIcon: ({ color, size }) => <Icon name={icons[route.name]} size={size + 1} color={color} />,
      sceneStyle: { backgroundColor: C.bg },
    })}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Route" component={RouteScreen} />
      <Tab.Screen name="Partners" component={PartnersScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function PartnerApp() {
  return (
    <PartnerDataProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="PartnerTabs" component={MainTabs} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
          <Stack.Screen name="VisitCheckin" component={VisitCheckinScreen} />
          <Stack.Screen name="OrderBooking" component={OrderBookingScreen} />
          <Stack.Screen name="OrderReview" component={OrderReviewScreen} />
          <Stack.Screen name="OrderComplete" component={OrderCompleteScreen} />
          <Stack.Screen name="Collection" component={CollectionScreen} />
          <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
          <Stack.Screen name="Ledger" component={LedgerScreen} />
          <Stack.Screen name="Catalog" component={CatalogScreen} />
          <Stack.Screen name="Targets" component={TargetsScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="SupportRequest" component={SupportRequestScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="RouteOptions" component={RouteOptionsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PartnerDataProvider>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 30 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 17 },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginRight: 11, borderWidth: 1, borderColor: C.line },
  eyebrow: { letterSpacing: 0.7, marginBottom: 3 },
  pageTitle: { lineHeight: 31 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 22 },
  brandMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  notificationDot: { position: 'absolute', right: 8, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  welcome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 12 },
  targetCard: { backgroundColor: C.navy, borderColor: C.navy, padding: 17, marginBottom: 12 },
  targetTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  targetCircle: { width: 61, height: 61, borderWidth: 1, borderColor: '#52627C', borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 4, backgroundColor: '#E9EDF2', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  targetFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  syncLine: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 12 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 9 },
  metric: { width: '48%', flexGrow: 1, backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12 },
  workspaceNotice: { alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 14, marginBottom: 10 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, marginBottom: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 7 },
  actionTile: { width: '48%', flexGrow: 1, minHeight: 82, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  actionIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  partnerMark: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, alignSelf: 'flex-start' },
  schemeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  schemeIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: C.amberSoft, alignItems: 'center', justifyContent: 'center' },
  routeCard: { padding: 12 },
  routeMap: { height: 138, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EAF0F5', position: 'relative', marginBottom: 13 },
  mapRoadOne: { position: 'absolute', width: '125%', height: 16, backgroundColor: '#FFFFFF', top: 57, left: -14, transform: [{ rotate: '-19deg' }] },
  mapRoadTwo: { position: 'absolute', width: '105%', height: 10, backgroundColor: '#FFFFFF', top: 53, left: 34, transform: [{ rotate: '42deg' }] },
  mapPin: { position: 'absolute', width: 23, height: 23, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
  mapPinMuted: { position: 'absolute', width: 23, height: 23, borderRadius: 12, backgroundColor: '#8B9AB0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
  routeMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  button: { minHeight: 45, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonSubtle: { backgroundColor: C.blueSoft },
  stopFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, height: 46, marginBottom: 10 },
  searchInput: { flex: 1, color: C.ink, fontFamily: 'DMSans-Regular', fontSize: 12, paddingVertical: 0, marginLeft: 7 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7, paddingHorizontal: 2 },
  partnerBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 7, paddingBottom: 10, borderTopWidth: 1, borderColor: C.line },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: C.line, marginTop: 11, paddingTop: 9 },
  centerLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  profileBanner: { flexDirection: 'row', alignItems: 'center' },
  toolRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  toolIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  syncCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  syncBadge: { width: 35, height: 35, borderRadius: 11, backgroundColor: C.tealSoft, alignItems: 'center', justifyContent: 'center' },
  detailHero: { flexDirection: 'row', alignItems: 'center' },
  detailAvatar: { width: 49, height: 49, borderRadius: 15, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  smallIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  infoRow: { minHeight: 43, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 9 },
  visitHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  outcome: { minHeight: 53, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  outcomeSelected: { backgroundColor: C.blueSoft, borderColor: '#AFC8FF' },
  radio: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 9, borderColor: '#AAB5C4', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: C.blue },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.blue },
  noteBox: { minHeight: 78, justifyContent: 'flex-start', padding: 12, borderRadius: 12, borderColor: C.line, borderWidth: 1, backgroundColor: C.white, marginBottom: 14 },
  orderCustomer: { flexDirection: 'row', alignItems: 'center' },
  productCard: { paddingVertical: 12, marginBottom: 8 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  productGlyph: { width: 35, height: 35, borderRadius: 11, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  productBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderColor: C.line },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityButton: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft, borderRadius: 8 },
  cartSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  notice: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  completeMark: { alignSelf: 'center', width: 66, height: 66, borderRadius: 33, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
  collectionHero: { backgroundColor: C.navy, borderColor: C.navy, padding: 17 },
  ledgerHero: { backgroundColor: C.navy, borderColor: C.navy, padding: 17 },
  ledgerStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#40516D', marginTop: 13, paddingTop: 10 },
  inventoryBanner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue },
  supportHero: { alignItems: 'center', padding: 18 },
  supportGlyph: { width: 47, height: 47, borderRadius: 15, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  tabBar: { height: 65, paddingTop: 6, paddingBottom: 4, backgroundColor: C.white, borderTopColor: C.line },
  tabLabel: { fontFamily: 'DMSans-Bold', fontSize: 10, marginTop: 1 },
});