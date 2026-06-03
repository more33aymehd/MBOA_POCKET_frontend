const ORANGE_PREFIXES = ['655','656','657','658','659','690','691','692','693','694','695','696','697','698','699'];
const MTN_PREFIXES    = ['650','651','652','653','654','670','671','672','673','674','675','676','677','678','679','680','681','682','683','684','685','686','687','688','689'];

// Normalise : retire +237, 237, espaces, tirets → 9 chiffres
export function normalizeCMPhone(raw) {
  let n = raw.replace(/[\s\-().+]/g, '');
  if (n.startsWith('237')) n = n.slice(3);
  return n;
}

// Retourne 'ORANGE_MONEY' | 'MTN_MOMO' | null
export function detectOperator(raw) {
  const n = normalizeCMPhone(raw);
  if (n.length < 3) return null;
  const prefix = n.slice(0, 3);
  if (ORANGE_PREFIXES.includes(prefix)) return 'ORANGE_MONEY';
  if (MTN_PREFIXES.includes(prefix))    return 'MTN_MOMO';
  return null;
}

// true si numéro camerounais valide (9 chiffres, commence par 6)
export function isValidCMPhone(raw) {
  const n = normalizeCMPhone(raw);
  return /^6\d{8}$/.test(n);
}

export function formatFCFA(amount) {
  if (amount === null || amount === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

export function nomMois(mois) {
  const noms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return noms[mois] || '';
}
