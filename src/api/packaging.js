const positive = value => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};
export function packaging(product) {
  const label = String(product.strength_pack_size || product.pack_size || '');
  const description = `${product.name || ''} ${product.dosage || ''} ${
    product.packing_type || ''
  } ${label}`.toLowerCase();
  const baseUnit =
    (product.base_unit && product.base_unit !== 'unit'
      ? product.base_unit
      : null) ||
    (/capsule|\bcaps?\b/i.test(description)
      ? 'capsule'
      : /tablet|\btabs?\b|blister|strip|alu-alu/i.test(description) ||
        positive(product.units_per_strip)
      ? 'tablet'
      : 'unit');
  const solid = ['tablet', 'capsule'].includes(baseUnit.toLowerCase());
  // Parse counts only: a strength like 500 mg or a 100 ml bottle is not 500/100 tablets.
  const multiplier = label.match(
    /\b(\d+)\s*[x×]\s*(\d+)(?:\s*[x×]\s*(\d+))?\b/i,
  );
  const count =
    label.match(/(?:strip|pack|bottle)\s+of\s+(\d+)\b/i) ||
    label.match(/\b(\d+)\s*(?:tablets?|tabs?|capsules?|caps?)\b/i) ||
    label.match(/^\s*(\d+)\s*['’]?s?\s*$/i);
  const parts = multiplier
    ? multiplier.slice(1).filter(Boolean).map(Number)
    : [];
  const inferredTotal = solid
    ? parts.length
      ? parts.reduce((a, b) => a * b, 1)
      : positive(count?.[1])
    : null;
  const strip = solid
    ? positive(product.units_per_strip) ||
      parts[parts.length - 1] ||
      positive(count?.[1]) ||
      positive(product.units_per_pack)
    : null;
  const total = solid
    ? positive(product.units_per_pack) || inferredTotal || strip
    : 1;
  const loose = product.allow_loose_sale;
  return {
    pack: total || 1,
    unitsPerStrip: strip || (solid ? total : null) || 1,
    packLabel: label || `${total || 1} ${solid ? baseUnit : 'unit'} per pack`,
    baseUnit,
    packingKnown: !!total,
    allowLooseSale: solid && !!total && loose !== false && loose !== 'false',
    solid,
  };
}
