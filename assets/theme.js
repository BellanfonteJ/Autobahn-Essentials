document.documentElement.classList.remove('no-js');

const searchToggle = document.querySelector('[data-search-toggle]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const garageToggle = document.querySelector('[data-garage-toggle]');
const garageDrawer = document.querySelector('[data-garage-drawer]');
const garageForm = document.querySelector('[data-garage-form]');
const garageStorageKey = 'autobahn:garage';
const garageFitOnlyStorageKey = 'autobahn:garageFitOnly';

const closeMobileMenu = () => {
  if (!menuToggle || !mobileNav) return;
  mobileNav.classList.remove('is-open');
  document.body.classList.remove('is-menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
};

const closeSearchDrawer = () => {
  if (!searchToggle || !searchDrawer) return;
  searchDrawer.classList.remove('is-open');
  searchToggle.setAttribute('aria-expanded', 'false');
};

const cleanGarage = (garage = {}) => {
  const source = garage || {};
  return {
    year: String(source.year || '').trim(),
    make: String(source.make || '').trim(),
    model: String(source.model || '').trim(),
    trim: String(source.trim || '').trim(),
    chassis: String(source.chassis || '').trim(),
  };
};

const hasGarage = (garage) => Object.values(cleanGarage(garage)).some(Boolean);

const readGarage = () => {
  try {
    return cleanGarage(JSON.parse(window.localStorage.getItem(garageStorageKey)) || {});
  } catch (error) {
    return cleanGarage();
  }
};

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const productDescriptionTrustTerms = [
  'guarantee',
  'money back',
  'warranty',
  'in stock',
  'same day',
  'shipping',
  'norton',
  'secured',
  'secure',
  'motorsports',
];

const getProductDescriptionSignal = (element) => {
  const imageSignals = Array.from(element.querySelectorAll('img'))
    .map((image) => [image.alt, image.title, image.src].filter(Boolean).join(' '))
    .join(' ');

  return normalizeText(`${element.textContent || ''} ${imageSignals}`);
};

const getProductDescriptionBlockSignature = (element) => {
  if (!(element instanceof HTMLElement)) return '';

  const imageSources = Array.from(element.querySelectorAll('img'))
    .map((image) => image.src)
    .filter(Boolean)
    .join('|');
  const signal = getProductDescriptionSignal(element);

  if (!signal && !imageSources) return '';
  return `${element.tagName.toLowerCase()}|${signal}|${imageSources}`;
};

const removeDuplicateProductDescriptionBlocks = (description) => {
  const seen = new Set();

  Array.from(description.children).forEach((child) => {
    if (isEmptyProductDescriptionElement(child)) return;

    const signature = getProductDescriptionBlockSignature(child);
    if (!signature || signature.length < 12) return;

    if (seen.has(signature)) {
      child.remove();
    } else {
      seen.add(signature);
    }
  });
};

const isEmptyProductDescriptionElement = (element) => (
  element instanceof HTMLElement
  && !element.querySelector('img')
  && !getProductDescriptionSignal(element)
);

const isTrustProductDescriptionElement = (element) => {
  if (!(element instanceof HTMLElement)) return false;
  const signal = getProductDescriptionSignal(element);
  return productDescriptionTrustTerms.some((term) => sourceHasTerm(signal, term));
};

const moveProductDescriptionTrustCluster = () => {
  document.querySelectorAll('[data-product-description]').forEach((description) => {
    removeDuplicateProductDescriptionBlocks(description);

    const children = Array.from(description.children);
    if (children.length < 2) return;

    const firstContentIndex = children.findIndex((child) => !isEmptyProductDescriptionElement(child));
    if (firstContentIndex < 0 || !isTrustProductDescriptionElement(children[firstContentIndex])) return;

    const cluster = [];
    for (let i = firstContentIndex; i < children.length; i += 1) {
      const child = children[i];
      const isTrustContent = isTrustProductDescriptionElement(child);
      const isFollowUpTrustImage = cluster.length > 0 && child.querySelector('img');

      if (isEmptyProductDescriptionElement(child) || isTrustContent || isFollowUpTrustImage) {
        cluster.push(child);
      } else {
        break;
      }
    }

    const hasRemainingDescription = children
      .slice(firstContentIndex + cluster.length)
      .some((child) => !isEmptyProductDescriptionElement(child));

    if (!cluster.length || !hasRemainingDescription) return;

    const trustGroup = document.createElement('div');
    trustGroup.className = 'product-description__trust';
    cluster.forEach((child) => trustGroup.appendChild(child));
    description.appendChild(trustGroup);
  });
};

const makeAliases = {
  bmw: ['bmw'],
  audi: ['audi'],
  volkswagen: ['volkswagen', 'vw'],
};

const yearRange = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => String(start + index));

const garageVehicleCatalog = [
  { make: 'BMW', model: '1 Series', chassis: 'E82', years: yearRange(2008, 2013), trims: ['135i', '1M', 'N54', 'N55'] },
  { make: 'BMW', model: '2 Series', chassis: 'F22', years: yearRange(2014, 2021), trims: ['M235i', 'M240i', 'N55', 'B58'] },
  { make: 'BMW', model: '2 Series', chassis: 'F23', years: yearRange(2014, 2021), trims: ['M235i', 'M240i', 'N55', 'B58'] },
  { make: 'BMW', model: 'M2', chassis: 'F87', years: yearRange(2016, 2021), trims: ['N55', 'S55', 'Competition'] },
  { make: 'BMW', model: 'M2', chassis: 'G87', years: yearRange(2023, 2026), trims: ['S58'] },
  { make: 'BMW', model: '3 Series', chassis: 'E90', years: yearRange(2006, 2013), trims: ['328i', '335i', 'N54', 'N55'] },
  { make: 'BMW', model: '3 Series', chassis: 'E92', years: yearRange(2007, 2013), trims: ['328i', '335i', 'N54', 'N55'] },
  { make: 'BMW', model: '3 Series', chassis: 'E93', years: yearRange(2007, 2013), trims: ['328i', '335i', 'N54', 'N55'] },
  { make: 'BMW', model: '3 Series', chassis: 'F30', years: yearRange(2012, 2019), trims: ['320i', '328i', '335i', '340i', 'N20', 'N55', 'B58'] },
  { make: 'BMW', model: '3 Series', chassis: 'G20', years: yearRange(2019, 2026), trims: ['330i', 'M340i', 'B58'] },
  { make: 'BMW', model: 'M3', chassis: 'F80', years: yearRange(2015, 2018), trims: ['S55', 'Competition', 'CS'] },
  { make: 'BMW', model: 'M3', chassis: 'G80', years: yearRange(2021, 2026), trims: ['S58', 'Competition'] },
  { make: 'BMW', model: '4 Series', chassis: 'F32', years: yearRange(2014, 2020), trims: ['435i', '440i', 'N55', 'B58'] },
  { make: 'BMW', model: '4 Series', chassis: 'F36', years: yearRange(2015, 2020), trims: ['435i', '440i', 'N55', 'B58'] },
  { make: 'BMW', model: '4 Series', chassis: 'G22', years: yearRange(2021, 2026), trims: ['M440i', 'B58'] },
  { make: 'BMW', model: 'M4', chassis: 'F82', years: yearRange(2015, 2020), trims: ['S55', 'Competition'] },
  { make: 'BMW', model: 'M4', chassis: 'F83', years: yearRange(2015, 2020), trims: ['S55', 'Competition'] },
  { make: 'BMW', model: 'M4', chassis: 'G82', years: yearRange(2021, 2026), trims: ['S58', 'Competition'] },
  { make: 'BMW', model: 'M4', chassis: 'G83', years: yearRange(2021, 2026), trims: ['S58', 'Competition'] },
  { make: 'BMW', model: '5 Series', chassis: 'E60', years: yearRange(2004, 2010), trims: ['535i', 'N54'] },
  { make: 'BMW', model: '5 Series', chassis: 'F10', years: yearRange(2011, 2016), trims: ['535i', '550i', 'N55', 'N63'] },
  { make: 'BMW', model: '5 Series', chassis: 'G30', years: yearRange(2017, 2023), trims: ['M550i', 'N63R', 'N63TU3'] },
  { make: 'BMW', model: 'M5', chassis: 'F90', years: yearRange(2018, 2023), trims: ['S63'] },
  { make: 'BMW', model: '6 Series', chassis: 'F06', years: yearRange(2012, 2019), trims: ['650i', 'M6', 'N63', 'S63'] },
  { make: 'BMW', model: '6 Series', chassis: 'F12', years: yearRange(2012, 2018), trims: ['650i', 'N63'] },
  { make: 'BMW', model: '6 Series', chassis: 'F13', years: yearRange(2012, 2018), trims: ['650i', 'N63'] },
  { make: 'BMW', model: '7 Series', chassis: 'F01', years: yearRange(2009, 2015), trims: ['750i', 'N63'] },
  { make: 'BMW', model: '7 Series', chassis: 'F02', years: yearRange(2009, 2015), trims: ['750i', 'N63'] },
  { make: 'BMW', model: '7 Series', chassis: 'G11', years: yearRange(2016, 2022), trims: ['750i', 'N63R'] },
  { make: 'BMW', model: '7 Series', chassis: 'G12', years: yearRange(2016, 2022), trims: ['750i', 'N63R'] },
  { make: 'BMW', model: '8 Series', chassis: 'G14', years: yearRange(2019, 2026), trims: ['M850i', 'N63'] },
  { make: 'BMW', model: '8 Series', chassis: 'G15', years: yearRange(2019, 2026), trims: ['M850i', 'N63'] },
  { make: 'BMW', model: '8 Series', chassis: 'G16', years: yearRange(2019, 2026), trims: ['M850i', 'N63'] },
  { make: 'BMW', model: 'X3', chassis: 'F25', years: yearRange(2011, 2017), trims: ['28i', '35i', 'N20', 'N55'] },
  { make: 'BMW', model: 'X4', chassis: 'F26', years: yearRange(2015, 2018), trims: ['28i', '35i', 'N20', 'N55'] },
  { make: 'BMW', model: 'X5', chassis: 'G05', years: yearRange(2019, 2026), trims: ['M50i', 'N63'] },
  { make: 'BMW', model: 'X6', chassis: 'G06', years: yearRange(2020, 2026), trims: ['M50i', 'N63'] },
  { make: 'BMW', model: 'X7', chassis: 'G07', years: yearRange(2019, 2026), trims: ['M50i', 'N63'] },
  { make: 'Audi', model: 'A3', chassis: '8P', years: yearRange(2006, 2013), trims: ['2.0T'] },
  { make: 'Audi', model: 'A3', chassis: '8V', years: yearRange(2015, 2020), trims: ['1.8T', '2.0T'] },
  { make: 'Audi', model: 'S3', chassis: '8V', years: yearRange(2015, 2020), trims: ['2.0T'] },
  { make: 'Audi', model: 'A4', chassis: 'B8', years: yearRange(2009, 2016), trims: ['2.0T'] },
  { make: 'Audi', model: 'A4', chassis: 'B9', years: yearRange(2017, 2024), trims: ['2.0T', '45 TFSI'] },
  { make: 'Audi', model: 'A5', chassis: 'B9', years: yearRange(2018, 2024), trims: ['2.0T'] },
  { make: 'Audi', model: 'S4', chassis: 'B8', years: yearRange(2010, 2016), trims: ['3.0T'] },
  { make: 'Audi', model: 'S4', chassis: 'B9', years: yearRange(2018, 2024), trims: ['3.0T'] },
  { make: 'Audi', model: 'S5', chassis: 'B8', years: yearRange(2008, 2017), trims: ['3.0T'] },
  { make: 'Audi', model: 'S5', chassis: 'B9', years: yearRange(2018, 2024), trims: ['3.0T'] },
  { make: 'Audi', model: 'Q5', chassis: 'B8', years: yearRange(2009, 2017), trims: ['2.0T', '3.0T'] },
  { make: 'Audi', model: 'SQ5', chassis: 'B8', years: yearRange(2014, 2017), trims: ['3.0T'] },
  { make: 'Audi', model: 'S6', chassis: 'C7', years: yearRange(2013, 2018), trims: ['4.0T'] },
  { make: 'Audi', model: 'S7', chassis: 'C7', years: yearRange(2013, 2018), trims: ['4.0T'] },
  { make: 'Audi', model: 'RS7', chassis: 'C7', years: yearRange(2014, 2018), trims: ['4.0T'] },
  { make: 'Audi', model: 'RS6', chassis: 'C8', years: yearRange(2021, 2026), trims: ['4.0T'] },
  { make: 'Audi', model: 'RS7', chassis: 'C8', years: yearRange(2021, 2026), trims: ['4.0T'] },
  { make: 'Audi', model: 'A8', chassis: 'D4', years: yearRange(2011, 2018), trims: ['4.0T'] },
  { make: 'Audi', model: 'A8', chassis: 'D5', years: yearRange(2019, 2026), trims: ['4.0T'] },
  { make: 'Audi', model: 'S8', chassis: 'D4', years: yearRange(2013, 2018), trims: ['4.0T'] },
  { make: 'Audi', model: 'S8', chassis: 'D5', years: yearRange(2020, 2026), trims: ['4.0T'] },
  { make: 'Audi', model: 'TT', chassis: 'MK2', years: yearRange(2008, 2015), trims: ['2.0T', 'TTS', 'TTRS'] },
  { make: 'Volkswagen', model: 'GTI', chassis: 'MK5', years: yearRange(2006, 2009), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'GTI', chassis: 'MK6', years: yearRange(2010, 2014), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'GTI', chassis: 'MK7', years: yearRange(2015, 2021), trims: ['2.0T', 'Performance Pack'] },
  { make: 'Volkswagen', model: 'Golf R', chassis: 'MK6', years: yearRange(2012, 2013), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'Golf R', chassis: 'MK7', years: yearRange(2015, 2019), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'Golf', chassis: 'MK7', years: yearRange(2015, 2021), trims: ['1.8T', '2.0T'] },
  { make: 'Volkswagen', model: 'GLI', chassis: 'MK6', years: yearRange(2012, 2018), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'GLI', chassis: 'MK7', years: yearRange(2019, 2026), trims: ['2.0T'] },
  { make: 'Volkswagen', model: 'Jetta', chassis: 'MK7', years: yearRange(2019, 2026), trims: ['1.4T', '1.5T', 'GLI'] },
  { make: 'Volkswagen', model: 'CC', chassis: 'MK6', years: yearRange(2009, 2017), trims: ['2.0T'] },
];

const garageFieldNames = {
  year: 'vehicle_year',
  make: 'vehicle_make',
  model: 'vehicle_model',
  trim: 'vehicle_trim',
  chassis: 'vehicle_chassis',
};

const garageOptionLabels = {
  year: 'Year',
  make: 'Make',
  model: 'Model',
  trim: 'Trim / Engine',
  chassis: 'Chassis',
};

const garageCascadeClears = {
  make: ['model', 'chassis', 'trim'],
  year: ['chassis', 'trim'],
  model: ['chassis', 'trim'],
  chassis: ['trim'],
};

const fitmentTermAliases = {
  '1 series': ['1 series', '135i', '1m'],
  '2 series': ['2 series', '228i', '230i', '235i', '240i', 'm235i', 'm240i'],
  '3 series': ['3 series', '320i', '328i', '330i', '335i', '340i', 'm340i'],
  '4 series': ['4 series', '428i', '430i', '435i', '440i'],
  '5 series': ['5 series', '528i', '535i', '540i', '550i', 'm550i'],
  '6 series': ['6 series', '640i', '650i'],
  '7 series': ['7 series', '740i', '750i'],
  '8 series': ['8 series', '850i', 'm850i'],
  e82: ['e82', 'e88', '135i', '1m'],
  e90: ['e90', 'e9x'],
  e92: ['e92', 'e9x'],
  e93: ['e93', 'e9x'],
  e60: ['e60', '535i'],
  f01: ['f01', 'f02', '750i'],
  f02: ['f02', 'f01', '750i'],
  f06: ['f06', '650i', 'm6'],
  f10: ['f10', 'f11', 'f18', '550i'],
  f12: ['f12', '650i', 'm6'],
  f13: ['f13', '650i', 'm6'],
  f22: ['f22', 'f23', 'm235i', 'm240i', '235i', '240i'],
  f23: ['f23', 'f22', 'm235i', 'm240i', '235i', '240i'],
  f25: ['f25', 'x3'],
  f26: ['f26', 'x4'],
  f30: ['f30', 'f3x'],
  f32: ['f32', 'f3x'],
  f36: ['f36', 'f3x'],
  f80: ['f80', 'f8x'],
  f82: ['f82', 'f8x'],
  f83: ['f83', 'f8x'],
  f87: ['f87', 'm2', 'm2c', 'm2 competition'],
  f90: ['f90', 'm5'],
  g11: ['g11', 'g12', '750i'],
  g12: ['g12', 'g11', '750i'],
  g14: ['g14', '850i', 'm850i'],
  g15: ['g15', '850i', 'm850i'],
  g16: ['g16', '850i', 'm850i'],
  g20: ['g20', 'g2x', 'm340i'],
  g22: ['g22', 'g2x', 'm440i'],
  g30: ['g30', 'g31', 'm550i'],
  g05: ['g05', 'x5', 'x5m50i', 'm50i'],
  g06: ['g06', 'x6', 'x6m50i', 'm50i'],
  g07: ['g07', 'x7', 'x7m50i', 'm50i'],
  g80: ['g80', 'g8x'],
  g82: ['g82', 'g8x'],
  g83: ['g83', 'g8x'],
  g87: ['g87', 'm2'],
  '8p': ['8p', 'a3'],
  '8v': ['8v', 'a3', 's3'],
  b8: ['b8', 'b8 5'],
  b9: ['b9'],
  c7: ['c7', 's6', 's7', 'rs7'],
  c8: ['c8', 'rs6', 'rs7'],
  d4: ['d4', 'a8', 's8'],
  d5: ['d5', 'a8', 's8'],
  mk2: ['mk2', 'tt', 'tts', 'ttrs'],
  mk5: ['mk5', 'gti'],
  mk6: ['mk6', 'mk6 5', 'gti', 'gli'],
  mk7: ['mk7', 'mqb', 'gti', 'gli', 'golf r'],
  cc: ['cc'],
  n20: ['n20', 'n26'],
  n54: ['n54'],
  n55: ['n55'],
  n63: ['n63', 'n63tu', 'n63r', 'n63b', 'n63t3', 'n63tu2', 'n63tu3'],
  s55: ['s55'],
  s58: ['s58'],
  s63: ['s63'],
  '135i': ['135i', 'n54', 'n55'],
  '235i': ['235i', 'm235i', 'n55'],
  m235i: ['m235i', '235i', 'n55'],
  '240i': ['240i', 'm240i', 'b58'],
  m240i: ['m240i', '240i', 'b58'],
  '335i': ['335i', 'n54', 'n55'],
  '340i': ['340i', 'b58'],
  m340i: ['m340i', '340i', 'b58'],
  '435i': ['435i', 'n55'],
  '440i': ['440i', 'b58'],
  m440i: ['m440i', '440i', 'b58'],
  '535i': ['535i', 'n54', 'n55'],
  '550i': ['550i', 'n63', 'n63tu'],
  m550i: ['m550i', 'm550', 'n63', 'n63r', 'n63tu3'],
  '650i': ['650i', 'n63', 'n63tu'],
  '750i': ['750i', 'n63', 'n63tu', 'n63r', 'n63tu3'],
  '1 8t': ['1 8t', '1.8t'],
  '2 0t': ['2 0t', '2.0t', 'ea888'],
  '3 0t': ['3 0t', '3.0t'],
  '4 0t': ['4 0t', '4.0t'],
};

const formatGarageVehicle = (garage) => {
  const clean = cleanGarage(garage);
  if (clean.make && clean.chassis) return `${clean.make} ${clean.chassis}`;
  return [clean.year, clean.make, clean.model, clean.trim].filter(Boolean).join(' ') || clean.chassis;
};

function renderSavedVehicleChips(garage = readGarage()) {
  const clean = cleanGarage(garage);
  const label = hasGarage(clean) ? formatGarageVehicle(clean) : '';

  document.querySelectorAll('[data-vehicle-saved]').forEach((chip) => {
    const text = chip.querySelector('[data-vehicle-saved-text]');
    if (label && text) {
      text.textContent = label;
      chip.removeAttribute('hidden');
    } else {
      chip.setAttribute('hidden', '');
    }
  });
}

const replaceVehicleToken = (template, vehicle) => template.replace('[vehicle]', vehicle);

const sourceHasTerm = (source, term) => {
  const normalizedTerm = normalizeText(term);
  return normalizedTerm && ` ${source} `.includes(` ${normalizedTerm} `);
};

const sourceHasAnyTerm = (source, terms) => terms.some((term) => sourceHasTerm(source, term));

const getMakeTerms = (make) => makeAliases[normalizeText(make)] || [make];

const getFitmentTerms = (...terms) => {
  const output = [];

  terms.filter(Boolean).forEach((term) => {
    const normalized = normalizeText(term);
    output.push(term);
    (fitmentTermAliases[normalized] || []).forEach((alias) => output.push(alias));
  });

  return Array.from(new Set(output.filter(Boolean)));
};

const isUniversalFitment = (source) => [
  'universal',
  'all vehicles',
  'all makes',
  'universal fit',
  'universal fitment',
].some((term) => sourceHasTerm(source, term));

const getFitmentState = (source, garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const normalizedSource = normalizeText(source);

  if (!normalizedSource) return 'empty';

  const isUniversal = isUniversalFitment(normalizedSource);
  const chassisMatch = clean.chassis && sourceHasAnyTerm(normalizedSource, getFitmentTerms(clean.chassis));
  const modelMatch = clean.model && sourceHasTerm(normalizedSource, clean.model);
  const trimMatch = clean.trim && sourceHasAnyTerm(normalizedSource, getFitmentTerms(clean.trim));
  const makeMatch = clean.make && sourceHasAnyTerm(normalizedSource, getMakeTerms(clean.make));
  const yearMatch = clean.year && sourceHasTerm(normalizedSource, clean.year);
  const isFit = savedVehicle && (chassisMatch || (makeMatch && (modelMatch || yearMatch || trimMatch)));

  if (savedVehicle && isFit) return 'fit';
  if (savedVehicle && isUniversal) return 'universal';
  if (savedVehicle) return 'check';
  return 'empty';
};

const readGarageFitOnly = () => {
  try {
    return window.localStorage.getItem(garageFitOnlyStorageKey) === 'true';
  } catch (error) {
    return false;
  }
};

const writeGarageFitOnly = (value) => {
  try {
    window.localStorage.setItem(garageFitOnlyStorageKey, String(Boolean(value)));
  } catch (error) {
    /* leave the toggle as an in-page preference when storage is unavailable */
  }
};

const updateFitmentBadges = (garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const vehicle = formatGarageVehicle(clean);

  document.querySelectorAll('[data-fitment-badge]').forEach((badge) => {
    const labelTarget = badge.querySelector('[data-fitment-badge-text]') || badge;
    const state = getFitmentState(badge.dataset.fitmentText, clean);
    const defaultLabel = badge.dataset.fitmentDefault || 'Check fitment';

    let label = defaultLabel;

    if (savedVehicle && state === 'fit' && vehicle) {
      label = replaceVehicleToken(badge.dataset.fitmentMatchTemplate || 'Fits your [vehicle]', vehicle);
    } else if (savedVehicle && state === 'universal') {
      label = badge.dataset.fitmentUniversal || 'Universal fit';
    } else if (savedVehicle && vehicle) {
      label = replaceVehicleToken(badge.dataset.fitmentCheckTemplate || 'Check fitment for [vehicle]', vehicle);
    }

    labelTarget.textContent = label;
    badge.setAttribute('aria-label', label);
    badge.classList.toggle('is-fit', state === 'fit' || state === 'universal');
    badge.classList.toggle('is-check', state === 'check');
    badge.classList.toggle('is-empty', state === 'empty');
  });
};

const updateFitmentProductGrids = (garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const vehicle = formatGarageVehicle(clean);
  const fitOnly = savedVehicle && readGarageFitOnly();

  document.querySelectorAll('[data-product-card]').forEach((card) => {
    const state = getFitmentState(card.dataset.fitmentText, clean);
    const isMatch = state === 'fit' || state === 'universal';
    const inFitmentGrid = Boolean(card.closest('[data-fitment-grid]'));

    card.dataset.fitmentState = state;
    card.classList.toggle('is-garage-fit', savedVehicle && isMatch);
    card.classList.toggle('is-garage-check', savedVehicle && state === 'check');
    card.hidden = inFitmentGrid && fitOnly && !isMatch;

    if (savedVehicle && inFitmentGrid) {
      card.style.order = state === 'fit' ? '-20' : state === 'universal' ? '-10' : '10';
    } else {
      card.style.removeProperty('order');
      if (!inFitmentGrid) {
        card.hidden = false;
      }
    }
  });

  document.querySelectorAll('[data-fitment-grid]').forEach((grid) => {
    Array.from(grid.children).forEach((child) => {
      if (!child.matches('[data-product-card]')) {
        child.hidden = fitOnly;
      }
    });

    const cards = Array.from(grid.querySelectorAll('[data-product-card]'));
    const visibleCards = cards.filter((card) => !card.hidden);
    const emptyState = grid.nextElementSibling?.matches('[data-fitment-empty]')
      ? grid.nextElementSibling
      : null;

    if (emptyState) {
      emptyState.hidden = !fitOnly || visibleCards.length > 0;
    }
  });

  document.querySelectorAll('[data-fitment-filter-controls]').forEach((controls) => {
    const toggle = controls.querySelector('[data-fitment-filter-toggle]');
    const status = controls.querySelector('[data-fitment-filter-status]');
    const readyTemplate = controls.dataset.readyTemplate || 'Showing fits for [vehicle]. Matching products appear first.';
    const emptyGarageMessage = controls.dataset.emptyGarageMessage || 'Save a vehicle in My Garage to filter products.';

    controls.classList.toggle('has-garage', savedVehicle);

    if (toggle) {
      toggle.disabled = !savedVehicle;
      toggle.checked = fitOnly;
    }

    if (status) {
      status.textContent = savedVehicle && vehicle
        ? replaceVehicleToken(readyTemplate, vehicle)
        : emptyGarageMessage;
    }
  });
};

const getGarageField = (form, key) => form.querySelector(`[name="${garageFieldNames[key]}"]`);

const getCatalogMatches = (garage, omittedKey = '') => {
  const clean = cleanGarage(garage);

  return garageVehicleCatalog.filter((entry) => {
    if (omittedKey !== 'make' && clean.make && normalizeText(entry.make) !== normalizeText(clean.make)) {
      return false;
    }

    if (omittedKey !== 'model' && clean.model && normalizeText(entry.model) !== normalizeText(clean.model)) {
      return false;
    }

    if (omittedKey !== 'chassis' && clean.chassis && normalizeText(entry.chassis) !== normalizeText(clean.chassis)) {
      return false;
    }

    if (omittedKey !== 'year' && clean.year && !entry.years.includes(clean.year)) {
      return false;
    }

    if (
      omittedKey !== 'trim'
      && clean.trim
      && !entry.trims.some((trim) => normalizeText(trim) === normalizeText(clean.trim))
    ) {
      return false;
    }

    return true;
  });
};

const sortGarageOptions = (key, values) => {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (key === 'year') {
    return unique.sort((a, b) => Number(b) - Number(a));
  }
  return unique.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const setSelectOptions = (field, key, values, selectedValue = '') => {
  const currentValue = String(selectedValue || field.value || '').trim();
  const options = sortGarageOptions(key, values);

  if (currentValue && !options.some((option) => normalizeText(option) === normalizeText(currentValue))) {
    options.unshift(currentValue);
  }

  field.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = garageOptionLabels[key];
  field.appendChild(placeholder);

  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    field.appendChild(option);
  });

  field.value = currentValue;
};

const getGarageDraftFromForm = (form, fallbackGarage = {}) => {
  const fallback = cleanGarage(fallbackGarage);
  const draft = {};

  Object.keys(garageFieldNames).forEach((key) => {
    const field = getGarageField(form, key);
    draft[key] = field?.value || fallback[key];
  });

  return cleanGarage(draft);
};

const populateGarageFormOptions = (form, fallbackGarage = {}) => {
  const draft = getGarageDraftFromForm(form, fallbackGarage);

  Object.keys(garageFieldNames).forEach((key) => {
    const field = getGarageField(form, key);
    if (!(field instanceof HTMLSelectElement)) return;

    const matches = getCatalogMatches(draft, key);
    let values = [];

    matches.forEach((entry) => {
      if (key === 'year') values.push(...entry.years);
      if (key === 'make') values.push(entry.make);
      if (key === 'model') values.push(entry.model);
      if (key === 'chassis') values.push(entry.chassis);
      if (key === 'trim') values.push(...entry.trims);
    });

    if (!values.length && key === 'make') {
      values = garageVehicleCatalog.map((entry) => entry.make);
    }

    setSelectOptions(field, key, values, draft[key]);
  });
};

const clearGarageDependentFields = (form, key) => {
  (garageCascadeClears[key] || []).forEach((fieldKey) => {
    const field = getGarageField(form, fieldKey);
    if (field) field.value = '';
  });
};

const setGarageFormValues = (form, garage, force = false) => {
  const clean = cleanGarage(garage);

  Object.entries(garageFieldNames).forEach(([key, name]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field && (force || !field.value)) {
      field.value = clean[key];
    }
  });
};

const getGarageFromForm = (form) => cleanGarage({
  year: form.querySelector('[name="vehicle_year"]')?.value,
  make: form.querySelector('[name="vehicle_make"]')?.value,
  model: form.querySelector('[name="vehicle_model"]')?.value,
  trim: form.querySelector('[name="vehicle_trim"]')?.value,
  chassis: form.querySelector('[name="vehicle_chassis"]')?.value,
});

const getVehicleSearchValues = (payload) => {
  const garage = cleanGarage({
    year: payload.vehicle_year,
    make: payload.vehicle_make,
    model: payload.vehicle_model,
    trim: payload.vehicle_trim,
    chassis: payload.vehicle_chassis,
  });
  const visibleTerms = [
    garage.year,
    garage.make,
    garage.model,
    garage.chassis,
    garage.trim,
    payload.part_type,
  ];
  const expandedTerms = getFitmentTerms(garage.model, garage.chassis, garage.trim);

  return Array.from(new Set([...visibleTerms, ...expandedTerms].filter(Boolean)));
};

const updateGarageUI = (garage) => {
  const clean = cleanGarage(garage);
  const savedVehicle = hasGarage(clean);
  const vehicle = formatGarageVehicle(clean);
  const garageTitle = garageDrawer?.querySelector('[data-garage-title]');
  const garageSummary = garageDrawer?.querySelector('[data-garage-summary]');
  const garageIndicator = garageToggle?.querySelector('[data-garage-indicator]');

  if (garageForm) {
    populateGarageFormOptions(garageForm, clean);
    setGarageFormValues(garageForm, clean, true);
    populateGarageFormOptions(garageForm, clean);
  }

  document.querySelectorAll('[data-garage-save]').forEach((form) => {
    populateGarageFormOptions(form, clean);
    setGarageFormValues(form, clean, !savedVehicle);
    populateGarageFormOptions(form, clean);
  });

  if (garageTitle) {
    garageTitle.textContent = savedVehicle && vehicle
      ? replaceVehicleToken(garageDrawer.dataset.garageSavedTitleTemplate || 'Your [vehicle]', vehicle)
      : garageDrawer.dataset.garageEmptyTitle || 'No vehicle saved';
  }

  if (garageSummary) {
    garageSummary.textContent = savedVehicle
      ? garageDrawer.dataset.garageSavedSummary || 'Fitment badges are using this saved vehicle.'
      : garageDrawer.dataset.garageEmptySummary || 'Save your vehicle to check product fitment across the shop.';
  }

  garageToggle?.classList.toggle('has-garage', savedVehicle);
  if (garageIndicator) {
    garageIndicator.hidden = !savedVehicle;
  }

  updateFitmentBadges(clean);
  updateFitmentProductGrids(clean);
  renderSavedVehicleChips(clean);
};

const writeGarage = (garage) => {
  const clean = cleanGarage(garage);

  try {
    if (hasGarage(clean)) {
      window.localStorage.setItem(garageStorageKey, JSON.stringify(clean));
    } else {
      window.localStorage.removeItem(garageStorageKey);
    }
  } catch (error) {
    // Browsers can disable localStorage; the page still updates for this visit.
  }

  updateGarageUI(clean);
};

const closeGarageDrawer = () => {
  if (!garageToggle || !garageDrawer) return;
  garageDrawer.classList.remove('is-open');
  garageToggle.setAttribute('aria-expanded', 'false');
};

const openGarageDrawer = () => {
  if (!garageToggle || !garageDrawer) return;
  garageDrawer.classList.add('is-open');
  garageToggle.setAttribute('aria-expanded', 'true');
  closeMobileMenu();
  closeSearchDrawer();
  garageDrawer.querySelector('[data-garage-input]')?.focus();
};

if (garageToggle && garageDrawer) {
  garageToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = garageDrawer.classList.toggle('is-open');
    garageToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      closeMobileMenu();
      closeSearchDrawer();
      garageDrawer.querySelector('[data-garage-input]')?.focus();
    }
  });

  garageDrawer.querySelector('[data-garage-close]')?.addEventListener('click', closeGarageDrawer);

  garageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    writeGarage(getGarageFromForm(garageForm));
    closeGarageDrawer();
  });

  garageDrawer.querySelector('[data-garage-clear]')?.addEventListener('click', () => {
    writeGarage(cleanGarage());
  });

  document.querySelectorAll('[data-garage-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openGarageDrawer();
    });
  });

  document.addEventListener('click', (event) => {
    if (!garageDrawer.classList.contains('is-open')) return;
    if (garageDrawer.contains(event.target) || garageToggle.contains(event.target)) return;
    closeGarageDrawer();
  });
}

document.querySelectorAll('[data-garage-form], [data-garage-save]').forEach((form) => {
  populateGarageFormOptions(form, readGarage());

  Object.entries(garageFieldNames).forEach(([key, name]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!(field instanceof HTMLSelectElement)) return;

    field.addEventListener('change', () => {
      clearGarageDependentFields(form, key);
      populateGarageFormOptions(form);
    });
  });
});

updateGarageUI(readGarage());
moveProductDescriptionTrustCluster();

document.querySelectorAll('[data-fitment-filter-toggle]').forEach((toggle) => {
  toggle.addEventListener('change', () => {
    writeGarageFitOnly(toggle.checked);
    updateFitmentProductGrids(readGarage());
  });
});

if (searchToggle && searchDrawer) {
  searchToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = searchDrawer.classList.toggle('is-open');
    searchToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) closeMobileMenu();
    if (isOpen) closeGarageDrawer();
    if (isOpen) {
      searchDrawer.querySelector('input[type="search"]')?.focus();
    }
  });

  document.addEventListener('click', (evt) => {
    if (!searchDrawer.classList.contains('is-open')) return;
    if (searchDrawer.contains(evt.target) || searchToggle.contains(evt.target)) return;
    closeSearchDrawer();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && searchDrawer.classList.contains('is-open')) {
      closeSearchDrawer();
      searchToggle.focus();
    }
  });
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = mobileNav.classList.toggle('is-open');
    document.body.classList.toggle('is-menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) closeSearchDrawer();
    if (isOpen) closeGarageDrawer();
  });

  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMobileMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!mobileNav.classList.contains('is-open')) return;
    if (mobileNav.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMobileMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeSearchDrawer();
      closeGarageDrawer();
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 991px)').matches) {
      closeMobileMenu();
    }
  });
}

document.querySelectorAll('[data-gallery-thumb]').forEach((thumbButton) => {
  thumbButton.addEventListener('click', () => {
    const gallery = thumbButton.closest('.product-gallery');
    const target = gallery?.querySelector('[data-gallery-main]') || document.querySelector('[data-gallery-main]');
    if (!target) return;

    const nextSrc = thumbButton.dataset.galleryThumbSrc;
    if (!nextSrc) return;

    target.srcset = thumbButton.dataset.galleryThumbSrcset || '';
    target.src = nextSrc;
    target.alt = thumbButton.dataset.galleryThumbAlt || '';

    if (thumbButton.dataset.galleryThumbWidth) {
      target.width = Number(thumbButton.dataset.galleryThumbWidth);
    }
    if (thumbButton.dataset.galleryThumbHeight) {
      target.height = Number(thumbButton.dataset.galleryThumbHeight);
    }

    gallery?.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
      const isActive = button === thumbButton;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', String(isActive));
    });
  });
});

document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
  form.addEventListener('submit', () => {
    if (form.hasAttribute('data-garage-save')) {
      writeGarage(getGarageFromForm(form));
    }

    const query = form.querySelector('input[name="q"]');
    const payload = {};
    Array.from(form.querySelectorAll('input, select')).forEach((field) => {
      if (['q', 'type'].includes(field.name)) return;
      payload[field.name] = field.value.trim();
    });
    if (query) {
      query.value = getVehicleSearchValues(payload).join(' ');
    }
  });
});

document.querySelectorAll('[data-vehicle-clear]').forEach((btn) => {
  btn.addEventListener('click', () => {
    writeGarage(cleanGarage());
    document.querySelectorAll('[data-vehicle-finder]').forEach((form) => {
      form.querySelectorAll('input, select').forEach((field) => {
        if (['q', 'type'].includes(field.name)) return;
        field.value = '';
      });
    });
    renderSavedVehicleChips();
  });
});

renderSavedVehicleChips();

document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const summary = dropdown.querySelector('summary');
  const desktopQuery = window.matchMedia('(min-width: 991px)');

  dropdown.addEventListener('mouseenter', () => {
    if (desktopQuery.matches) {
      dropdown.setAttribute('open', '');
    }
  });

  dropdown.addEventListener('focusin', () => {
    if (desktopQuery.matches) {
      dropdown.setAttribute('open', '');
    }
  });

  summary?.addEventListener('click', (event) => {
    if (desktopQuery.matches) {
      event.preventDefault();
      dropdown.setAttribute('open', '');
    }
  });

  dropdown.addEventListener('mouseleave', () => {
    if (desktopQuery.matches) {
      dropdown.removeAttribute('open');
    }
  });
});

const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartDrawerBody = document.querySelector('[data-cart-drawer-body]');
const cartCountEls = document.querySelectorAll('[data-cart-count]');

function openCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
}

function closeCartDrawer() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-cart-open');
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
}

function updateCartCount(count) {
  cartCountEls.forEach((el) => {
    el.textContent = String(count);
    if (count > 0) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
}

function formatMoney(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function renderCartDrawer(cart) {
  if (!cartDrawerBody) return;
  updateCartCount(cart.item_count);

  if (cart.item_count === 0) {
    cartDrawerBody.innerHTML = `
      <div class="empty-state cart-drawer__empty">
        <p>Your cart is ready for its first upgrade.</p>
        <a class="button" href="/collections/all" data-cart-drawer-close>Continue shopping</a>
      </div>`;
    const footer = cartDrawer.querySelector('.cart-drawer__footer');
    if (footer) footer.remove();
    return;
  }

  const itemsHtml = cart.items.map((item, i) => `
    <li class="cart-drawer__item" data-cart-line="${i + 1}" data-key="${item.key}">
      ${item.image ? `<a href="${item.url}" class="cart-drawer__thumb"><img src="${item.image}" loading="lazy" alt=""></a>` : ''}
      <div class="cart-drawer__details">
        <a class="cart-drawer__title" href="${item.url}">${item.product_title}</a>
        ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-drawer__variant">${item.variant_title}</p>` : ''}
        <div class="cart-drawer__line-row">
          <div class="cart-drawer__qty">
            <button type="button" data-cart-qty-decrement aria-label="Decrease quantity">&minus;</button>
            <input type="number" min="0" value="${item.quantity}" data-cart-qty-input aria-label="Quantity">
            <button type="button" data-cart-qty-increment aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-drawer__line-price">${formatMoney(item.final_line_price)}</span>
        </div>
        <button class="cart-drawer__remove eyebrow" type="button" data-cart-remove>Remove</button>
      </div>
    </li>`).join('');

  cartDrawerBody.innerHTML = `<ul class="cart-drawer__items">${itemsHtml}</ul>`;

  let footer = cartDrawer.querySelector('.cart-drawer__footer');
  const footerHtml = `
    <div class="cart-drawer__subtotal">
      <span class="eyebrow">Subtotal</span>
      <strong>${formatMoney(cart.total_price)}</strong>
    </div>
    <a class="button button--secondary" href="/cart">View cart</a>
    <a class="button" href="/cart/checkout">Checkout</a>`;
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'cart-drawer__footer';
    cartDrawer.querySelector('.cart-drawer__panel').appendChild(footer);
  }
  footer.innerHTML = footerHtml;
}

async function refreshCart() {
  try {
    const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const cart = await res.json();
    renderCartDrawer(cart);
  } catch (e) {
    /* network error - leave drawer state alone */
  }
}

async function changeCartLine(key, quantity) {
  try {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    });
    if (!res.ok) return;
    const cart = await res.json();
    renderCartDrawer(cart);
  } catch (e) {
    /* swallow */
  }
}

if (cartDrawer) {
  document.querySelectorAll('[data-cart-drawer-open]').forEach((el) => {
    el.addEventListener('click', (evt) => {
      evt.preventDefault();
      openCartDrawer();
      refreshCart();
    });
  });

  cartDrawer.addEventListener('click', (evt) => {
    const target = evt.target;
    if (target.closest('[data-cart-drawer-close]')) {
      evt.preventDefault();
      closeCartDrawer();
      return;
    }
    const line = target.closest('[data-cart-line]');
    if (!line) return;
    const key = line.dataset.key;
    const input = line.querySelector('[data-cart-qty-input]');
    if (target.closest('[data-cart-remove]')) {
      changeCartLine(key, 0);
    } else if (target.closest('[data-cart-qty-decrement]')) {
      changeCartLine(key, Math.max(0, parseInt(input.value, 10) - 1));
    } else if (target.closest('[data-cart-qty-increment]')) {
      changeCartLine(key, parseInt(input.value, 10) + 1);
    }
  });

  cartDrawer.addEventListener('change', (evt) => {
    const input = evt.target.closest('[data-cart-qty-input]');
    if (!input) return;
    const line = input.closest('[data-cart-line]');
    if (!line) return;
    changeCartLine(line.dataset.key, Math.max(0, parseInt(input.value, 10) || 0));
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeCartDrawer();
  });

  document.addEventListener('submit', async (evt) => {
    const form = evt.target.closest('form[action$="/cart/add"], form[action*="/cart/add"]');
    if (!form) return;
    evt.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.setAttribute('disabled', '');
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (res.ok) {
        await refreshCart();
        openCartDrawer();
      } else {
        form.submit();
      }
    } catch (e) {
      form.submit();
    } finally {
      if (submitBtn) submitBtn.removeAttribute('disabled');
    }
  });
}

const stickyHeader = document.querySelector('.site-header--sticky');
if (stickyHeader) {
  const toggleHeaderShrink = () => {
    stickyHeader.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  toggleHeaderShrink();
  window.addEventListener('scroll', toggleHeaderShrink, { passive: true });
}

const backToTop = document.querySelector('[data-back-to-top]');
if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 640);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
