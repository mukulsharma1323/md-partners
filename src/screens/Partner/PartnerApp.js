import React, { useState } from 'react';
import {
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
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

const partners = [
  { id: 'c1', name: 'Sharma Medicos', owner: 'Ritika Sharma', area: 'Rohini Sector 7', type: 'Retail', visit: '09:30 AM', status: 'Next stop', due: '₹18,500', order: '₹12,450' },
  { id: 'c2', name: 'LifeCare Pharma', owner: 'Naveen Batra', area: 'Pitampura', type: 'Wholesale', visit: '10:15 AM', status: 'Planned', due: '₹62,200', order: '₹31,800' },
  { id: 'c3', name: 'CarePlus Clinic Store', owner: 'Drishti Arora', area: 'Shalimar Bagh', type: 'Clinic', visit: '11:40 AM', status: 'Follow-up', due: '₹9,200', order: '₹7,980' },
  { id: 'c4', name: 'Metro Pharma Hub', owner: 'Aditya Khosla', area: 'Model Town', type: 'Distributor', visit: '01:00 PM', status: 'Planned', due: '₹1,18,000', order: '₹54,320' },
];

const products = [
  { name: 'Azmora 500', pack: '10 tablets', category: 'Anti-infective', price: '₹128', stock: '84 packs', offer: 'Buy 20, get 2' },
  { name: 'Respira Cough Syrup', pack: '100 ml', category: 'Respiratory', price: '₹92', stock: '21 bottles', offer: '5% trade scheme' },
  { name: 'Glucotab-M', pack: '15 tablets', category: 'Diabetes care', price: '₹214', stock: '55 packs', offer: 'Doctor sample support' },
  { name: 'Painoff Gel', pack: '30 gm', category: 'Pain management', price: '₹74', stock: '13 tubes', offer: 'Display cashback' },
];

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
  const tone = item.status === 'Next stop' ? 'green' : item.status === 'Follow-up' ? 'amber' : 'blue';
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.82} style={s.partnerRow}>
      <View style={s.partnerMark}><Label size={14} bold color={C.blue}>{item.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</Label></View>
      <View style={{ flex: 1 }}>
        <View style={s.rowTitle}><Label size={13} bold style={{ flex: 1 }}>{item.name}</Label><Badge tone={tone}>{item.status}</Badge></View>
        <Label size={11} color={C.muted} style={{ marginTop: 3 }}>{compact ? `${item.area} · ${item.visit}` : `${item.owner} · ${item.area}`}</Label>
      </View>
      <Icon name="chevron-right" size={20} color={C.muted} />
    </TouchableOpacity>
  );
}

function DashboardScreen({ navigation }) {
  return (
    <Page>
      <View style={s.topline}>
        <View style={s.brandMark}><Icon name="medical-bag" size={19} color={C.white} /></View>
        <View style={{ flex: 1 }}><Label size={12} bold>MD PARTNERS</Label><Label size={10} color={C.muted}>FIELD SALES</Label></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => navigation.navigate('Notifications')} style={s.iconButton}><Icon name="bell-outline" size={21} color={C.ink} /><View style={s.notificationDot} /></TouchableOpacity>
      </View>
      <View style={s.welcome}>
        <View><Label size={12} color={C.muted}>WEDNESDAY, 30 SEPTEMBER</Label><Label size={24} bold style={{ marginTop: 5 }}>Good morning, Aarav</Label><Label size={12} color={C.muted} style={{ marginTop: 4 }}>North Delhi Trade Belt · 18 planned visits</Label></View>
        <View style={s.avatar}><Label size={12} bold color={C.blue}>AM</Label></View>
      </View>
      <Card style={s.targetCard}>
        <View style={s.targetTop}><View style={{ flex: 1 }}><Label size={11} color="#B7C8E4" bold>MONTHLY PERFORMANCE</Label><Label size={29} color={C.white} bold style={{ marginTop: 4 }}>₹9.2L</Label><Label size={12} color="#D5E0F0">of ₹12.4L sales target</Label></View><View style={s.targetCircle}><Label size={19} bold color={C.white}>74%</Label><Label size={9} color="#C9D6E9">PACE</Label></View></View>
        <Progress value={74} color="#56D4C1" />
        <View style={s.targetFoot}><Label size={11} color="#D5E0F0">This week is tracking ahead</Label><TouchableOpacity onPress={() => navigation.navigate('Targets')}><Label size={11} bold color="#91B8FF">View target  ›</Label></TouchableOpacity></View>
      </Card>
      <View style={s.syncLine}><Icon name="cloud-check-outline" size={17} color={C.teal} /><Label size={11} color={C.muted} style={{ flex: 1, marginLeft: 7 }}>Offline safe · 4 updates queued</Label><Label size={10} bold color={C.teal}>SYNCED 7M AGO</Label></View>
      <View style={s.metricGrid}>
        <Metric value="26" label="Orders booked" note="9 rush orders" color={C.blue} />
        <Metric value="₹74K" label="Collections" note="6 pending" color={C.teal} />
        <Metric value="12 / 18" label="Visits done" note="67% of route" color={C.ink} />
        <Metric value="11" label="Follow-ups" note="3 overdue" color={C.red} />
      </View>
      <Section title="Quick actions" action="All tools" onAction={() => navigation.navigate('More')} />
      <View style={s.actionGrid}>
        <ActionTile icon="map-marker-path" label="Daily route" onPress={() => navigation.navigate('Route')} />
        <ActionTile icon="clipboard-plus-outline" label="Book an order" onPress={() => navigation.navigate('OrderBooking')} />
        <ActionTile icon="cash-check" label="Collect payment" onPress={() => navigation.navigate('Collection')} />
        <ActionTile icon="view-grid-outline" label="Catalog & offers" onPress={() => navigation.navigate('Catalog')} />
      </View>
      <Section title="Next on your route" action="Full route" onAction={() => navigation.navigate('Route')} />
      <Card style={{ paddingVertical: 2 }}><PartnerRow item={partners[0]} compact onPress={() => navigation.navigate('CustomerDetail', { customerId: partners[0].id })} /><PartnerRow item={partners[1]} compact onPress={() => navigation.navigate('CustomerDetail', { customerId: partners[1].id })} /></Card>
      <Card style={s.schemeCard}><View style={s.schemeIcon}><Icon name="tag-outline" size={18} color={C.amber} /></View><View style={{ flex: 1 }}><Label size={11} color={C.amber} bold>NEW TRADE SCHEME</Label><Label size={13} bold style={{ marginTop: 3 }}>Respira portfolio · 5% off</Label><Label size={11} color={C.muted}>Valid through 10 October</Label></View><Icon name="chevron-right" size={20} color={C.muted} /></Card>
    </Page>
  );
}

function ActionTile({ icon, label, onPress }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={s.actionTile}><View style={s.actionIcon}><Icon name={icon} size={21} color={C.blue} /></View><Label size={11} bold>{label}</Label></TouchableOpacity>;
}

function RouteScreen({ navigation }) {
  return (
    <Page navigation={navigation} title="Daily route" eyebrow="WEDNESDAY · NORTH DELHI" subtitle="12 of 18 partner visits completed">
      <Card style={s.routeCard}><View style={s.routeMap}><View style={s.mapRoadOne} /><View style={s.mapRoadTwo} /><View style={[s.mapPin, { left: '17%', top: '58%' }]}><Label size={9} bold color={C.white}>1</Label></View><View style={[s.mapPin, { left: '43%', top: '30%' }]}><Label size={9} bold color={C.white}>2</Label></View><View style={[s.mapPinMuted, { left: '67%', top: '53%' }]}><Label size={9} bold color={C.white}>3</Label></View><View style={[s.mapPinMuted, { left: '82%', top: '24%' }]}><Label size={9} bold color={C.white}>4</Label></View></View><View style={s.routeMeta}><View><Label size={17} bold>Next: Sharma Medicos</Label><Label size={11} color={C.muted}>Rohini Sector 7 · 1.2 km away</Label></View><Badge tone="green">09:30 AM</Badge></View><Button title="Check in to visit" icon="map-marker-check-outline" onPress={() => navigation.navigate('VisitCheckin', { customerId: 'c1' })} /></Card>
      <Section title="Stops on your route" action="Route options" onAction={() => navigation.navigate('RouteOptions')} />
      {partners.map((item, index) => <Card key={item.id} style={{ paddingVertical: 0, marginBottom: 9 }}><PartnerRow item={item} compact onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /><View style={s.stopFooter}><Label size={10} color={C.muted}>{String(index + 1).padStart(2, '0')} · {item.type.toUpperCase()}</Label><Label size={10} color={C.muted}>Last order {item.order}</Label></View></Card>)}
    </Page>
  );
}

function PartnersScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const shown = partners.filter(item => `${item.name} ${item.owner} ${item.area}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Page navigation={navigation} title="Your partners" eyebrow="ASSIGNED ACCOUNTS" subtitle="Retailers, clinics and distributors in your territory">
      <View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, owner or area" placeholderTextColor={C.muted} style={s.searchInput} /></View>
      <View style={s.filterRow}><Badge>All 24</Badge><Badge tone="green">Retail 16</Badge><Badge tone="amber">Wholesale 5</Badge><Badge>Clinic 3</Badge></View>
      <View style={s.listHeading}><Label size={11} color={C.muted} bold>PARTNER</Label><Label size={11} color={C.muted} bold>OUTSTANDING</Label></View>
      {shown.map(item => <Card key={item.id} style={{ marginBottom: 9, paddingVertical: 2 }}><PartnerRow item={item} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /><View style={s.partnerBalance}><Label size={10} color={C.muted}>{item.type} · Last order {item.order}</Label><Label size={11} bold color={C.ink}>{item.due}</Label></View></Card>)}
    </Page>
  );
}

function OrdersScreen({ navigation }) {
  const orders = [
    { id: 'ORD-2048', partner: partners[0], date: 'Today · 10:18 AM', amount: '₹12,450', status: 'Confirmed', tone: 'green' },
    { id: 'ORD-2047', partner: partners[1], date: 'Today · 09:42 AM', amount: '₹31,800', status: 'Processing', tone: 'blue' },
    { id: 'ORD-2041', partner: partners[2], date: 'Yesterday · 04:16 PM', amount: '₹7,980', status: 'Delivered', tone: 'green' },
    { id: 'ORD-2038', partner: partners[3], date: '28 Sep · 01:22 PM', amount: '₹54,320', status: 'Needs review', tone: 'amber' },
  ];
  return (
    <Page navigation={navigation} title="Orders" eyebrow="BOOKINGS & FULFILMENT" subtitle="Track submitted orders and partner demand">
      <Button title="Create partner order" icon="plus" onPress={() => navigation.navigate('OrderBooking')} />
      <View style={[s.filterRow, { marginTop: 16 }]}><Badge>All 26</Badge><Badge tone="amber">Review 2</Badge><Badge tone="blue">Processing 8</Badge><Badge tone="green">Delivered 16</Badge></View>
      <Section title="Recent orders" action="Export" onAction={() => navigation.navigate('OrderHistory')} />
      {orders.map(order => <Card key={order.id} style={{ marginBottom: 10 }}><View style={s.orderTop}><View><Label size={11} color={C.muted}>{order.id} · {order.date}</Label><Label size={14} bold style={{ marginTop: 5 }}>{order.partner.name}</Label></View><Badge tone={order.tone}>{order.status}</Badge></View><View style={s.orderBottom}><Label size={11} color={C.muted}>12 line items · {order.partner.type}</Label><Label size={15} bold>{order.amount}</Label></View></Card>)}
      <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')} style={s.centerLink}><Label size={12} bold color={C.blue}>View order history</Label><Icon name="arrow-right" size={16} color={C.blue} /></TouchableOpacity>
    </Page>
  );
}

function MoreScreen({ navigation }) {
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
      <Card style={s.profileBanner}><View style={[s.avatar, { width: 44, height: 44 }]}><Label size={13} bold color={C.blue}>AM</Label></View><View style={{ flex: 1, marginLeft: 11 }}><Label size={14} bold>Aarav Mehta</Label><Label size={11} color={C.muted}>Senior field executive · MR-2084</Label></View><Icon name="chevron-right" size={20} color={C.muted} /></Card>
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
  const customer = partners.find(item => item.id === route.params?.customerId) || partners[0];
  return (
    <Page navigation={navigation} title={customer.name} eyebrow={`${customer.type.toUpperCase()} PARTNER`} subtitle={`${customer.owner} · ${customer.area}`}>
      <Card style={s.detailHero}><View style={s.detailAvatar}><Label size={18} bold color={C.blue}>{customer.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</Label></View><View style={{ flex: 1, marginLeft: 12 }}><Label size={14} bold>{customer.owner}</Label><Label size={11} color={C.muted}>{customer.area} · {customer.type}</Label><View style={{ marginTop: 7, alignSelf: 'flex-start' }}><Badge tone="green">Active account</Badge></View></View><TouchableOpacity style={s.smallIcon}><Icon name="phone-outline" size={19} color={C.blue} /></TouchableOpacity></Card>
      <View style={[s.metricGrid, { marginTop: 12 }]}><Metric value={customer.due} label="Outstanding" note="As of today" color={C.amber} /><Metric value={customer.order} label="Last order" note="28 Sep 2026" color={C.blue} /></View>
      <Section title="Partner snapshot" />
      <Card><InfoRow label="Credit limit" value="₹1,50,000" /><InfoRow label="Payment terms" value="Net 14 days" /><InfoRow label="Last visit" value="Yesterday · 11:20 AM" /><InfoRow label="Primary contact" value={customer.owner} last /></Card>
      <Section title="Visit notes" action="Edit" onAction={() => navigation.navigate('VisitCheckin', { customerId: customer.id })} />
      <Card><Label size={12} color={C.muted}>Needs faster moving cough range and weekly scheme summary.</Label></Card>
      <Button title="Start partner visit" icon="map-marker-check-outline" onPress={() => navigation.navigate('VisitCheckin', { customerId: customer.id })} />
      <View style={{ height: 10 }} /><Button title="Book an order" icon="clipboard-plus-outline" subtle onPress={() => navigation.navigate('OrderBooking', { customerId: customer.id })} />
    </Page>
  );
}

function InfoRow({ label, value, last }) {
  return <View style={[s.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: C.line }]}><Label size={11} color={C.muted}>{label}</Label><Label size={12} bold>{value}</Label></View>;
}

function VisitCheckinScreen({ navigation, route }) {
  const customer = partners.find(item => item.id === route.params?.customerId) || partners[0];
  const [outcome, setOutcome] = useState('Order placed');
  const outcomes = ['Order placed', 'Payment collected', 'Follow-up needed', 'Store closed'];
  return (
    <Page navigation={navigation} title="Partner visit" eyebrow="CHECK-IN · 09:30 AM" subtitle="Capture the visit outcome for this account">
      <Card style={s.visitHeader}><View style={s.partnerMark}><Label size={14} bold color={C.blue}>SM</Label></View><View style={{ flex: 1 }}><Label size={14} bold>{customer.name}</Label><Label size={11} color={C.muted}>{customer.area} · {customer.owner}</Label></View><Badge tone="green">On site</Badge></Card>
      <Section title="Visit outcome" />
      <View style={{ gap: 8 }}>{outcomes.map((item, index) => <TouchableOpacity key={item} onPress={() => setOutcome(item)} style={[s.outcome, outcome === item && s.outcomeSelected]}><View style={[s.radio, outcome === item && s.radioSelected]}>{outcome === item ? <View style={s.radioDot} /> : null}</View><Label size={13} bold={outcome === item}>{item}</Label><Icon name={['clipboard-check-outline', 'cash-check', 'calendar-clock-outline', 'store-off-outline'][index]} size={19} color={outcome === item ? C.blue : C.muted} style={{ marginLeft: 'auto' }} /></TouchableOpacity>)}</View>
      <Section title="Visit note" />
      <View style={s.noteBox}><Label size={12} color={C.muted}>Discussed new respiratory scheme and monthly reorder...</Label></View>
      <Button title={outcome === 'Order placed' ? 'Continue to order' : 'Save visit outcome'} icon="arrow-right" onPress={() => outcome === 'Order placed' ? navigation.navigate('OrderBooking', { customerId: customer.id }) : navigation.navigate('CustomerDetail', { customerId: customer.id })} />
    </Page>
  );
}

function OrderBookingScreen({ navigation, route }) {
  const customer = partners.find(item => item.id === route.params?.customerId) || partners[0];
  const [quantities, setQuantities] = useState([2, 0, 1, 0]);
  const updateQuantity = (index, delta) => setQuantities(current => current.map((qty, itemIndex) => itemIndex === index ? Math.max(0, qty + delta) : qty));
  const count = quantities.reduce((sum, quantity) => sum + quantity, 0);
  return (
    <Page navigation={navigation} title="Book an order" eyebrow="PARTNER ORDER" subtitle="Select products and review trade offers">
      <Card style={s.orderCustomer}><View style={{ flex: 1 }}><Label size={10} color={C.muted} bold>ORDER FOR</Label><Label size={13} bold style={{ marginTop: 3 }}>{customer.name}</Label><Label size={10} color={C.muted}>{customer.area}</Label></View><TouchableOpacity onPress={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })}><Label size={11} bold color={C.blue}>Change</Label></TouchableOpacity></Card>
      <View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput placeholder="Search products or SKU" placeholderTextColor={C.muted} style={s.searchInput} /></View>
      <View style={s.filterRow}><Badge>All products</Badge><Badge tone="green">Offers 8</Badge><Badge tone="blue">In stock</Badge></View>
      {products.map((product, index) => <Card key={product.name} style={s.productCard}><View style={s.productTop}><View style={s.productGlyph}><Icon name="pill" size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{product.category} · {product.pack}</Label></View><Label size={13} bold>{product.price}</Label></View><View style={s.productBottom}><View><Label size={10} color={C.teal} bold>{product.offer}</Label><Label size={10} color={C.muted} style={{ marginTop: 2 }}>{product.stock} available</Label></View><View style={s.quantity}><TouchableOpacity accessibilityLabel={`Remove one ${product.name}`} onPress={() => updateQuantity(index, -1)} style={s.quantityButton}><Icon name="minus" size={15} color={C.blue} /></TouchableOpacity><Label size={12} bold>{quantities[index]}</Label><TouchableOpacity accessibilityLabel={`Add one ${product.name}`} onPress={() => updateQuantity(index, 1)} style={s.quantityButton}><Icon name="plus" size={15} color={C.blue} /></TouchableOpacity></View></View></Card>)}
      <Card style={s.cartSummary}><View style={{ flex: 1 }}><Label size={12} bold>{count} items selected</Label><Label size={10} color={C.muted}>Offers applied at review</Label></View><Button title="Review order" icon="arrow-right" onPress={() => navigation.navigate('OrderReview', { customerId: customer.id, count })} /></Card>
    </Page>
  );
}

function OrderReviewScreen({ navigation, route }) {
  const customer = partners.find(item => item.id === route.params?.customerId) || partners[0];
  return (
    <Page navigation={navigation} title="Review order" eyebrow="ORDER SUMMARY" subtitle={`For ${customer.name}`}>
      <Card><View style={s.orderTop}><Label size={12} bold>4 product lines</Label><Badge tone="green">Scheme applied</Badge></View>{products.slice(0, 3).map((product, index) => <InfoRow key={product.name} label={`${product.name} · ${[2, 0, 1][index]} packs`} value={['₹256', '₹0', '₹214'][index]} />)}<InfoRow label="Trade discount" value="− ₹23.50" /><InfoRow label="Estimated total" value="₹446.50" last /></Card>
      <Section title="Delivery & payment" /><Card><InfoRow label="Ship to" value="Shop address on file" /><InfoRow label="Payment terms" value="Net 14 days" /><InfoRow label="Delivery window" value="Tomorrow · 10 AM – 1 PM" last /></Card>
      <Card style={s.notice}><Icon name="information-outline" size={18} color={C.blue} /><Label size={11} color={C.muted} style={{ flex: 1, marginLeft: 9 }}>Final pricing and availability will be confirmed by the distribution team.</Label></Card>
      <Button title="Submit order for confirmation" icon="check" onPress={() => navigation.navigate('OrderComplete', { customerName: customer.name })} />
    </Page>
  );
}

function OrderCompleteScreen({ navigation, route }) {
  return <Page navigation={navigation} title="Order submitted" eyebrow="BOOKING COMPLETE" subtitle="Your order is ready for confirmation"><View style={s.completeMark}><Icon name="check" size={34} color={C.white} /></View><Card style={{ alignItems: 'center', padding: 22 }}><Label size={18} bold>Booking sent to sales ops</Label><Label size={12} color={C.muted} style={{ textAlign: 'center', marginTop: 7 }}>Order for {route.params?.customerName || partners[0].name} has been added to the confirmation queue.</Label><View style={{ marginTop: 14 }}><Badge tone="amber">Awaiting confirmation</Badge></View></Card><Button title="Back to orders" icon="receipt-text-outline" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Orders' })} /><View style={{ height: 10 }} /><Button title="Return to dashboard" icon="home-outline" subtle onPress={() => navigation.navigate('PartnerTabs', { screen: 'Home' })} /></Page>;
}

function CollectionScreen({ navigation }) {
  return (
    <Page navigation={navigation} title="Collections" eyebrow="PAYMENT FOLLOW-UPS" subtitle="₹74,000 collected today · 6 payments pending">
      <Card style={s.collectionHero}><Label size={11} color="#B7C8E4" bold>OPEN COLLECTIONS</Label><Label size={28} color={C.white} bold style={{ marginTop: 3 }}>₹90,500</Label><Label size={11} color="#D5E0F0">Across 3 partner accounts</Label><View style={{ marginTop: 15 }}><Button title="Record a collection" icon="cash-plus" onPress={() => navigation.navigate('CollectionDetail')} /></View></Card>
      <Section title="Payment follow-ups" action="View ledger" onAction={() => navigation.navigate('Ledger')} />
      {partners.slice(1, 4).map((item, index) => <Card key={item.id} style={{ marginBottom: 9 }}><View style={s.orderTop}><View><Label size={13} bold>{item.name}</Label><Label size={10} color={C.muted} style={{ marginTop: 3 }}>Due {['Today', 'Tomorrow', '2 days overdue'][index]} · {item.type}</Label></View><Badge tone={index === 2 ? 'red' : 'amber'}>{index === 2 ? 'Overdue' : 'Due soon'}</Badge></View><View style={s.orderBottom}><Label size={10} color={C.muted}>Last collected via UPI</Label><Label size={15} bold>{['₹28,000', '₹8,500', '₹54,000'][index]}</Label></View></Card>)}
    </Page>
  );
}

function CollectionDetailScreen({ navigation }) {
  const [method, setMethod] = useState('UPI');
  return <Page navigation={navigation} title="Record collection" eyebrow="PAYMENT ENTRY" subtitle="Collection details are shown for preview"><Card><InfoRow label="Partner" value="LifeCare Pharma" /><InfoRow label="Outstanding" value="₹62,200" /><InfoRow label="Amount received" value="₹28,000" /><InfoRow label="Reference" value="UPI · XXXX 4821" last /></Card><Section title="Payment method" /><View style={s.filterRow}>{['UPI', 'Cash', 'Bank transfer'].map(item => <TouchableOpacity key={item} onPress={() => setMethod(item)}><Badge tone={method === item ? 'green' : 'blue'}>{item}</Badge></TouchableOpacity>)}</View><Button title="Save collection preview" icon="check" onPress={() => navigation.goBack()} /></Page>;
}

function LedgerScreen({ navigation }) {
  const aging = [['0–7 days', '₹92K', 76, C.teal], ['8–15 days', '₹1.38L', 58, C.blue], ['16–30 days', '₹76K', 42, C.amber], ['30+ days', '₹44K', 24, C.red]];
  return <Page navigation={navigation} title="Outstanding ledger" eyebrow="CREDIT EXPOSURE" subtitle="₹3.5L across 24 partner accounts"><Card style={s.ledgerHero}><Label size={11} color="#B7C8E4" bold>TOTAL OUTSTANDING</Label><Label size={28} color={C.white} bold style={{ marginTop: 4 }}>₹3,50,000</Label><View style={s.ledgerStats}><Label size={10} color="#D5E0F0">Due this week  ₹92K</Label><Label size={10} color="#F9B3B9">Overdue  ₹44K</Label></View></Card><Section title="Ageing summary" />{aging.map(([label, value, progress, color]) => <Card key={label} style={{ marginBottom: 8 }}><View style={s.orderTop}><Label size={12} bold>{label}</Label><Label size={13} bold>{value}</Label></View><Progress value={progress} color={color} /></Card>)}<Section title="Largest balances" action="Collect payment" onAction={() => navigation.navigate('Collection')} />{partners.slice(1, 4).map(item => <Card key={item.id} style={{ marginBottom: 8, paddingVertical: 0 }}><PartnerRow item={item} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} /></Card>)}</Page>;
}

function CatalogScreen({ navigation }) {
  return <Page navigation={navigation} title="Catalog & offers" eyebrow="PRODUCT RANGE" subtitle="Trade pricing, pack details and active schemes"><View style={s.searchBox}><Icon name="magnify" size={20} color={C.muted} /><TextInput placeholder="Search product or category" placeholderTextColor={C.muted} style={s.searchInput} /></View><View style={s.filterRow}><Badge>All 128</Badge><Badge tone="green">Schemes 8</Badge><Badge tone="blue">New launches 3</Badge></View>{products.map(product => <Card key={product.name} style={s.productCard}><View style={s.productTop}><View style={s.productGlyph}><Icon name="pill" size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{product.category} · {product.pack}</Label></View><Label size={14} bold>{product.price}</Label></View><View style={s.productBottom}><View><Label size={10} color={C.teal} bold>{product.offer}</Label><Label size={10} color={C.muted} style={{ marginTop: 2 }}>{product.stock} available in territory</Label></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Add ${product.name} to order`} onPress={() => navigation.navigate('OrderBooking')} style={s.smallIcon}><Icon name="plus" size={18} color={C.blue} /></TouchableOpacity></View></Card>)}<Button title="Build partner order" icon="clipboard-plus-outline" onPress={() => navigation.navigate('OrderBooking')} /></Page>;
}

function TargetsScreen({ navigation }) {
  const channels = [['Retail chemists', '₹6.8L', 74, C.blue], ['Wholesale channel', '₹4.1L', 58, C.teal], ['Franchise partners', '₹2.6L', 81, C.amber]];
  return <Page navigation={navigation} title="Sales targets" eyebrow="SEPTEMBER 2026" subtitle="Your monthly progress across channels"><Card style={s.targetCard}><View style={s.targetTop}><View style={{ flex: 1 }}><Label size={11} color="#B7C8E4" bold>MONTHLY ACHIEVEMENT</Label><Label size={28} color={C.white} bold style={{ marginTop: 4 }}>₹9.2L</Label><Label size={11} color="#D5E0F0">of ₹12.4L target</Label></View><View style={s.targetCircle}><Label size={19} bold color={C.white}>74%</Label><Label size={9} color="#C9D6E9">PACE</Label></View></View><Progress value={74} color="#56D4C1" /><Label size={10} color="#D5E0F0" style={{ marginTop: 9 }}>₹3.2L remaining · 1 day ahead of plan</Label></Card><Section title="Channel breakdown" />{channels.map(([label, value, progress, color]) => <Card key={label} style={{ marginBottom: 9 }}><View style={s.orderTop}><Label size={12} bold>{label}</Label><Label size={13} bold>{value}</Label></View><Progress value={progress} color={color} /><Label size={10} color={C.muted} style={{ marginTop: 7 }}>{progress}% achieved · target mix</Label></Card>)}<Section title="Field productivity" /><Card><InfoRow label="Partner visits" value="12 / 18 today" /><InfoRow label="Booking conversion" value="71%" /><InfoRow label="Average order time" value="28 sec" last /></Card><View style={{ height: 14 }} /><Button title="Open daily route" icon="map-marker-path" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Route' })} /></Page>;
}

function InventoryScreen({ navigation }) {
  return <Page navigation={navigation} title="Inventory availability" eyebrow="TERRITORY STOCK SIGNALS" subtitle="See what partners can reorder now"><Card style={s.inventoryBanner}><Icon name="package-variant-closed-check" size={22} color={C.teal} /><View style={{ flex: 1, marginLeft: 10 }}><Label size={12} bold>Stock snapshot updated</Label><Label size={10} color={C.muted}>Distribution view · 7 minutes ago</Label></View><Badge tone="green">Live view</Badge></Card><View style={s.filterRow}><Badge>All items</Badge><Badge tone="amber">Low stock 6</Badge><Badge tone="red">Near expiry 3</Badge></View>{products.map((product, index) => <Card key={product.name} style={s.productCard}><View style={s.productTop}><View style={s.productGlyph}><Icon name="pill" size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Label size={13} bold>{product.name}</Label><Label size={10} color={C.muted}>{product.category} · {product.pack}</Label></View><Badge tone={index === 3 ? 'amber' : 'green'}>{index === 3 ? 'Low stock' : 'Available'}</Badge></View><View style={s.productBottom}><Label size={10} color={C.muted}>Warehouse availability</Label><Label size={11} bold>{product.stock}</Label></View></Card>)}<Button title="Open product catalog" icon="view-grid-outline" subtle onPress={() => navigation.navigate('Catalog')} /></Page>;
}

function NotificationsScreen({ navigation }) {
  const notices = [
    ['tag-outline', 'Respira portfolio has a 5% trade scheme.', 'Scheme · 12 mins ago', 'amber'],
    ['trophy-outline', 'North Delhi target is behind by ₹18,000 this week.', 'Target alert · 33 mins ago', 'blue'],
    ['package-variant', 'Painoff Gel batch PNG-02A is nearing expiry.', 'Stock alert · 1 hr ago', 'red'],
    ['calendar-clock', 'Management huddle moved to 6:15 PM.', 'Team update · 2 hrs ago', 'green'],
  ];
  return <Page navigation={navigation} title="Notifications" eyebrow="YOUR UPDATES" subtitle="Schemes, targets and field activity"><Section title="Today" />{notices.map(([icon, title, meta, tone]) => <Card key={title} style={s.noticeRow}><View style={[s.toolIcon, { backgroundColor: tone === 'amber' ? C.amberSoft : tone === 'red' ? C.redSoft : tone === 'green' ? C.tealSoft : C.blueSoft }]}><Icon name={icon} size={18} color={tone === 'amber' ? C.amber : tone === 'red' ? C.red : tone === 'green' ? C.teal : C.blue} /></View><View style={{ flex: 1 }}><Label size={12} bold>{title}</Label><Label size={10} color={C.muted} style={{ marginTop: 4 }}>{meta}</Label></View><View style={s.unreadDot} /></Card>)}</Page>;
}

function SupportScreen({ navigation }) {
  return <Page navigation={navigation} title="Help & support" eyebrow="SALES OPERATIONS DESK" subtitle="Get help while you are in the field"><Card style={s.supportHero}><View style={s.supportGlyph}><Icon name="headset" size={23} color={C.white} /></View><Label size={16} bold style={{ marginTop: 12 }}>How can we help?</Label><Label size={11} color={C.muted} style={{ marginTop: 3 }}>Our sales operations team is online</Label><View style={{ marginTop: 14 }}><Button title="Start a support request" icon="arrow-top-right" onPress={() => navigation.navigate('SupportRequest')} /></View></Card><Section title="Open requests" action="All tickets" onAction={() => navigation.navigate('SupportRequest')} /><Card><InfoRow label="Order sync delayed in offline mode" value="In review" /><InfoRow label="Territory remap · Pitampura stores" value="Open" last /></Card><Section title="Quick help" /><Card style={{ paddingVertical: 2 }}><ToolRow icon="file-document-outline" title="Order and scheme guide" detail="Policies and trade terms" onPress={() => navigation.navigate('SupportRequest')} /><ToolRow icon="account-question-outline" title="Contact your manager" detail="Regional sales team" onPress={() => navigation.navigate('Profile')} /></Card></Page>;
}

function SupportRequestScreen({ navigation }) {
  return <Page navigation={navigation} title="New support request" eyebrow="SALES OPS" subtitle="A preview of the support workflow"><Card><InfoRow label="Request type" value="Order & fulfilment" /><InfoRow label="Partner" value="LifeCare Pharma" /><InfoRow label="Priority" value="Normal" last /></Card><View style={s.noteBox}><Label size={12} color={C.muted}>Describe what you need help with...</Label></View><Button title="Submit request preview" icon="send-outline" onPress={() => navigation.goBack()} /></Page>;
}

function ProfileScreen({ navigation }) {
  return <Page navigation={navigation} title="Profile & settings" eyebrow="YOUR SALES PROFILE" subtitle="Team assignment and app preferences"><Card style={s.profileBanner}><View style={[s.avatar, { width: 48, height: 48 }]}><Label size={13} bold color={C.blue}>AM</Label></View><View style={{ flex: 1, marginLeft: 11 }}><Label size={14} bold>Aarav Mehta</Label><Label size={11} color={C.muted}>Senior field executive</Label></View><Badge tone="green">Active</Badge></Card><Section title="Assignment" /><Card><InfoRow label="Employee ID" value="MR-2084" /><InfoRow label="Territory" value="North Delhi Trade Belt" /><InfoRow label="Team" value="Retail Growth Squad" last /></Card><Section title="Preferences" /><Card style={{ paddingVertical: 2 }}><ToolRow icon="cloud-sync-outline" title="Offline sync" detail="Auto queue when network returns" onPress={() => navigation.navigate('SyncStatus')} /><ToolRow icon="bell-outline" title="Notification settings" detail="Schemes, stock and target alerts" onPress={() => navigation.navigate('Notifications')} /><ToolRow icon="help-circle-outline" title="App version" detail="MD Partners · preview build" onPress={() => navigation.navigate('Support')} /></Card></Page>;
}

function SyncStatusScreen({ navigation }) {
  return <Page navigation={navigation} title="Offline sync" eyebrow="FIELD CONNECTIVITY" subtitle="Your work stays available when the network drops"><Card style={s.syncCard}><View style={s.syncBadge}><Icon name="cloud-check-outline" size={20} color={C.teal} /></View><View style={{ flex: 1 }}><Label size={13} bold>Ready to sync</Label><Label size={10} color={C.muted}>Last successful sync · 7 minutes ago</Label></View><Badge tone="green">Online</Badge></Card><Section title="Queued for upload" /><Card><InfoRow label="Visit check-ins" value="2 updates" /><InfoRow label="Order drafts" value="1 draft" /><InfoRow label="Collection notes" value="1 update" last /></Card><View style={{ height: 14 }} /><Button title="Sync preview" icon="cloud-sync-outline" onPress={() => navigation.goBack()} /></Page>;
}

function OrderHistoryScreen({ navigation }) {
  return <Page navigation={navigation} title="Order history" eyebrow="ALL BOOKINGS" subtitle="Orders placed across your territory">{['ORD-2048', 'ORD-2047', 'ORD-2041', 'ORD-2038', 'ORD-2029'].map((id, index) => <Card key={id} style={{ marginBottom: 9 }}><View style={s.orderTop}><View><Label size={10} color={C.muted}>{id} · {['Today', 'Today', 'Yesterday', '28 Sep', '26 Sep'][index]}</Label><Label size={13} bold style={{ marginTop: 4 }}>{partners[index % partners.length].name}</Label></View><Badge tone={index === 3 ? 'amber' : 'green'}>{['Confirmed', 'Processing', 'Delivered', 'Review', 'Delivered'][index]}</Badge></View><View style={s.orderBottom}><Label size={10} color={C.muted}>Partner order · {partners[index % partners.length].type}</Label><Label size={13} bold>{['₹12,450', '₹31,800', '₹7,980', '₹54,320', '₹18,240'][index]}</Label></View></Card>)}</Page>;
}

function RouteOptionsScreen({ navigation }) {
  return <Page navigation={navigation} title="Route options" eyebrow="TODAY'S PLAN" subtitle="A preview of field route controls"><Card><InfoRow label="Route sequence" value="Optimised by travel time" /><InfoRow label="Territory" value="North Delhi Trade Belt" /><InfoRow label="Stops remaining" value="6 partners" last /></Card><Section title="Route tools" /><Card style={{ paddingVertical: 2 }}><ToolRow icon="sort-clock-ascending-outline" title="Reorder stops" detail="Prioritise urgent follow-ups" onPress={() => navigation.goBack()} /><ToolRow icon="map-outline" title="Open map preview" detail="4.8 km · approx. 36 min" onPress={() => navigation.goBack()} /><ToolRow icon="calendar-plus-outline" title="Add a partner visit" detail="Choose from assigned accounts" onPress={() => navigation.navigate('PartnerTabs', { screen: 'Partners' })} /></Card></Page>;
}

function MainTabs() {
  const icons = { Home: 'view-dashboard-outline', Route: 'map-marker-path', Partners: 'storefront-outline', Orders: 'receipt-text-outline', More: 'dots-grid' };
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