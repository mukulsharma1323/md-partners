import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import themeContext from '../../theme/themeContext';
import { Colors } from '../../theme/color';
import MedicineImage from './MedicineImage';
export { default as MedicineImage } from './MedicineImage';

export const blue = Colors.primary;
export const money = value =>
  `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
export function usePalette() {
  const theme = useContext(themeContext);
  return {
    bg: theme?.bg || '#FFFFFF',
    text: theme?.txt || '#162238',
    muted: '#69778C',
    line: '#E8EDF4',
    soft: '#F4F8FE',
    card: '#FFFFFF',
    selectedCard: '#EFF6FF',
    selectedBorder: '#91BFFF',
    selectedText: '#1557A0',
  };
}
export function Label({ children, muted, size = 14, bold, color, style }) {
  const p = usePalette();
  return (
    <Text
      style={[
        {
          fontFamily: bold ? 'DMSans-Bold' : 'DMSans-Regular',
          fontSize: size,
          color: color || (muted ? p.muted : p.text),
          lineHeight: size * 1.45,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({ title, onPress, secondary, icon, disabled, small }) {
  const p = usePalette();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        {
          backgroundColor: secondary ? p.soft : blue,
          opacity: disabled ? 0.45 : 1,
          paddingVertical: small ? 10 : 14,
        },
      ]}
    >
      {icon && (
        <Icon name={icon} size={20} color={secondary ? blue : '#FFFFFF'} />
      )}
      <Label
        bold
        color={secondary ? blue : '#FFFFFF'}
        style={{ textAlign: 'center', flexShrink: 1 }}
      >
        {title}
      </Label>
    </TouchableOpacity>
  );
}
export function Badge({ children, tone = 'blue' }) {
  const colors = {
    blue: ['#EAF3FF', '#0066D6'],
    green: ['#E6F6EE', '#147A50'],
    orange: ['#FFF1E4', '#A65610'],
    red: ['#FFECEC', '#BC3535'],
    purple: ['#F0EDFF', '#6750B3'],
  };
  const c = colors[tone] || colors.blue;
  return (
    <View style={[s.badge, { backgroundColor: c[0] }]}>
      <Label size={11} bold color={c[1]}>
        {children}
      </Label>
    </View>
  );
}
export function Card({ children, tint, style }) {
  const p = usePalette();
  return (
    <View
      style={[
        s.card,
        { backgroundColor: tint || p.card, borderColor: p.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Row({ title, subtitle, value, icon, onPress, tone, medicine }) {
  const p = usePalette();
  return (
    <TouchableOpacity
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[s.row, { borderBottomColor: p.line }]}
    >
      {medicine && <MedicineImage medicine={medicine} size={48} />}
      {icon && (
        <View style={[s.icon, { backgroundColor: p.soft }]}>
          <Icon name={icon} size={23} color={blue} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Label bold>{title}</Label>
        {subtitle && (
          <Label muted size={12} style={{ marginTop: 3 }}>
            {subtitle}
          </Label>
        )}
      </View>
      {value && <Badge tone={tone}>{value}</Badge>}
      {onPress && <Icon name="chevron-right" size={22} color={p.muted} />}
    </TouchableOpacity>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  numeric,
  multiline,
  keyboardType,
  maxLength,
  editable = true,
}) {
  const p = usePalette();
  return (
    <View style={{ marginBottom: 14 }}>
      <Label size={12} bold style={{ marginBottom: 7 }}>
        {label}
      </Label>
      <TextInput
        accessibilityLabel={label}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={p.muted}
        keyboardType={keyboardType || (numeric ? 'decimal-pad' : 'default')}
        maxLength={maxLength}
        multiline={multiline}
        style={[
          s.input,
          {
            backgroundColor: p.soft,
            borderColor: p.line,
            color: p.text,
            minHeight: multiline ? 90 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search medicines, composition, batch…',
}) {
  const p = usePalette();
  return (
    <View style={[s.search, { backgroundColor: p.soft, borderColor: p.line }]}>
      <Icon name="magnify" size={23} color={p.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={p.muted}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: p.text,
          fontFamily: 'DMSans-Regular',
          paddingVertical: 13,
        }}
      />
      {value ? (
        <TouchableOpacity
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
        >
          <Icon name="close-circle" size={21} color={p.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
export function Tabs({ items, value, onChange }) {
  const p = usePalette();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
    >
      {items.map(item => (
        <TouchableOpacity
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item }}
          onPress={() => onChange(item)}
          style={[s.pill, { backgroundColor: value === item ? blue : p.soft }]}
        >
          <Label size={12} bold color={value === item ? '#FFFFFF' : p.muted}>
            {item}
          </Label>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
export function Section({ title, action, onPress }) {
  return (
    <View style={s.section}>
      <Label size={18} bold>
        {title}
      </Label>
      {action && (
        <TouchableOpacity accessibilityRole="button" onPress={onPress}>
          <Label color={blue} size={12} bold>
            {action}
          </Label>
        </TouchableOpacity>
      )}
    </View>
  );
}
export function Notice({ text, warning }) {
  return (
    <View
      style={[s.notice, { backgroundColor: warning ? '#FFF1E4' : '#EAF3FF' }]}
    >
      <Icon
        name={warning ? 'alert-circle-outline' : 'information-outline'}
        size={18}
        color={warning ? '#A65610' : '#0066D6'}
      />
      <Label
        size={12}
        color={warning ? '#A65610' : '#0066D6'}
        style={{ flex: 1 }}
      >
        {text}
      </Label>
    </View>
  );
}
export function Empty({
  title = 'No results found',
  subtitle = 'Try another search or change the filters.',
}) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 35 }}>
      <Icon name="clipboard-text-search-outline" size={38} color={blue} />
      <Label bold size={17} style={{ marginTop: 12 }}>
        {title}
      </Label>
      <Label muted style={{ textAlign: 'center', marginTop: 7 }}>
        {subtitle}
      </Label>
    </Card>
  );
}
export function Screen({
  title,
  subtitle,
  navigation,
  children,
  footer,
  action,
  onAction,
  back = true,
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: p.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          {back && navigation?.canGoBack() && (
            <TouchableOpacity
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Icon name="arrow-left" size={24} color={p.text} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Label bold size={26}>
              {title}
            </Label>
            {subtitle && (
              <Label muted size={12}>
                {subtitle}
              </Label>
            )}
          </View>
          {action && (
            <TouchableOpacity
              accessibilityLabel={action}
              onPress={onAction}
              style={{ padding: 10 }}
            >
              <Icon name={action} color={blue} size={25} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(28, insets.bottom),
          }}
        >
          {children}
        </ScrollView>
        {footer && (
          <View
            style={[
              s.footer,
              {
                backgroundColor: p.bg,
                borderColor: p.line,
                paddingBottom: Math.max(16, insets.bottom),
              },
            ]}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  card: { padding: 18, borderWidth: 1, borderRadius: 22, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  input: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
  },
  search: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  pill: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 22 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  notice: {
    padding: 13,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    marginBottom: 14,
  },
  footer: { padding: 16, borderTopWidth: 1, gap: 8 },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

export function MedicineHeading({ medicine, title, stacked = false }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        gap: 12,
        marginVertical: 8,
      }}
    >
      <MedicineImage medicine={medicine} large={stacked} />
      <View style={{ flexShrink: 1 }}>
        <Label bold size={16}>
          {title || medicine.name}
        </Label>
      </View>
    </View>
  );
}
