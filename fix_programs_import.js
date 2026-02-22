const fs = require('fs');

const filePath = '/Users/benaiken/CascadeProjects/ffx_home_repair/programs_import.json';
let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Helper to find program by slug (or partial slug match)
function findBySlug(slug) {
  return data.find(p => p.slug === slug);
}

// -----------------------------------------------------------------------
// 1. FIX DUPLICATE / TYPO SLUGS
// -----------------------------------------------------------------------

// Fix typo: colmbia → columbia
const heatshare = findBySlug('colmbia-gas-heatshare');
if (heatshare) {
  console.log('Fixing slug: colmbia-gas-heatshare → columbia-gas-heatshare');
  heatshare.slug = 'columbia-gas-heatshare';
}

// Columbia Gas age/income split
const cgAge = data.find(p => p.slug === 'columbia-gas-of-virginia-age-and-income-qualifying-program-age-qualifying-category-for-60');
if (cgAge) {
  console.log('Fixing slug: columbia gas age → columbia-gas-of-virginia-age-qualifying');
  cgAge.slug = 'columbia-gas-of-virginia-age-qualifying';
}

const cgIncome = data.find(p => p.slug === 'columbia-gas-of-virginia-age-and-income-qualifying-program-income-qualifying-category');
if (cgIncome) {
  console.log('Fixing slug: columbia gas income → columbia-gas-of-virginia-income-qualifying');
  cgIncome.slug = 'columbia-gas-of-virginia-income-qualifying';
}

// Dominion bundle age/income split
const domAge = data.find(p => p.slug === 'dominion-income-age-qualifying-residential-bundle-program-age-qualifying-category');
if (domAge) {
  console.log('Fixing slug: dominion bundle age → dominion-income-age-qualifying-bundle-age');
  domAge.slug = 'dominion-income-age-qualifying-bundle-age';
}

const domIncome = data.find(p => p.slug === 'dominion-income-age-qualifying-residential-bundle-program-income-qualifying-category');
if (domIncome) {
  console.log('Fixing slug: dominion bundle income → dominion-income-age-qualifying-bundle-income');
  domIncome.slug = 'dominion-income-age-qualifying-bundle-income';
}

// Washington Gas IQEEP age/income split
const wgAge = data.find(p => p.slug === 'washington-gas-income-qualifying-energy-efficiency-program-iqeep-age-qualifying-category-for-60');
if (wgAge) {
  console.log('Fixing slug: washington gas iqeep age → washington-gas-income-qualifying-energy-effic-age');
  wgAge.slug = 'washington-gas-income-qualifying-energy-effic-age';
}

const wgIncome = data.find(p => p.slug === 'washington-gas-income-qualifying-energy-efficiency-program-iqeep-income-qualifying-category');
if (wgIncome) {
  console.log('Fixing slug: washington gas iqeep income → washington-gas-income-qualifying-energy-effic-income');
  wgIncome.slug = 'washington-gas-income-qualifying-energy-effic-income';
}

// -----------------------------------------------------------------------
// 2. FIX NEED_TYPE_CODES FOR PROGRAMS WITH EMPTY ARRAYS
// -----------------------------------------------------------------------

const needTypeFixes = {
  'fairfax-fish': ['ac_cooling', 'heating', 'home_repair_efficiency'],
  'northern-virginia-family-services-utilities-assistance': ['ac_cooling', 'heating'],
  'novec-payment-arrangements': ['ac_cooling', 'heating'],
  'salvation-army-emast-emergency-assistance': ['ac_cooling', 'heating'],
  'virginia-income-annual-retail-sales-use-tax-holiday-expires-7-1-2030': ['ac_cooling', 'heating', 'home_repair_efficiency'],
};

for (const [slug, codes] of Object.entries(needTypeFixes)) {
  const prog = findBySlug(slug);
  if (prog) {
    console.log(`Fixing need_type_codes for ${slug}: ${JSON.stringify(codes)}`);
    prog.need_type_codes = codes;
  } else {
    console.warn(`WARNING: Could not find program with slug: ${slug}`);
  }
}

// -----------------------------------------------------------------------
// 3. SET INCOME BENCHMARK CODES
// -----------------------------------------------------------------------

const incomeBenchmarkFixes = {
  'dominion-energyshare': '175_pct_fpl',
  'energy-assistance-cooling-assistance-dept-of-family-services': '80_pct_smi',
  'energy-assistance-crisis-assistance': '175_pct_fpl',
  'energy-assistance-fuel-assistance': '80_pct_smi',
  'senior-cool-care': '80_pct_smi',
  'weatherization-assistance-program-wap': '80_pct_smi',
  'dominion-income-age-qualifying-bundle-income': '120_pct_smi',
  'dominion-income-age-qualifying-bundle-age': '120_pct_smi',
  'columbia-gas-of-virginia-income-qualifying': '175_pct_fpl',
  'columbia-gas-of-virginia-age-qualifying': '175_pct_fpl',
  'washington-gas-light-low-income-energy-audit-and-weatherization-program-lieawp': '80_pct_smi',
  'washington-gas-income-qualifying-energy-effic-income': '120_pct_smi',
  'washington-gas-income-qualifying-energy-effic-age': '120_pct_smi',
  'home-repair-and-accessibility-modifications-hram-note-ac-rescue-itself-is-a-portion-of-this-contract': '80_pct_ami',
  'home-repair-manufactured': '80_pct_ami',
  'home-repair-for-the-elderly-program-hrep': '60_pct_smi',
  'fairfax-fish': '175_pct_fpl',
  'salvation-army-emast-emergency-assistance': '175_pct_fpl',
};

for (const [slug, benchmark] of Object.entries(incomeBenchmarkFixes)) {
  const prog = findBySlug(slug);
  if (prog) {
    console.log(`Setting income_benchmark_code for ${slug}: ${benchmark}`);
    prog.income_benchmark_code = benchmark;
  } else {
    console.warn(`WARNING: Could not find program with slug: ${slug}`);
  }
}

// -----------------------------------------------------------------------
// 4. FIX REQUIRES_LEGAL_STATUS
// -----------------------------------------------------------------------

// Dominion programs: null (available to all)
const dominionSlugs = [
  'dominion-energyshare',
  'dominion-income-age-qualifying-bundle-age',
  'dominion-income-age-qualifying-bundle-income',
  'dominion-percentage-of-income-payment-program-pipp',
];
for (const slug of dominionSlugs) {
  const prog = findBySlug(slug);
  if (prog) {
    console.log(`Setting requires_legal_status=null for ${slug}`);
    prog.requires_legal_status = null;
  } else {
    console.warn(`WARNING: Could not find program with slug: ${slug}`);
  }
}

// DFS Energy Assistance programs: null
const dfsSlugs = [
  'energy-assistance-cooling-assistance-dept-of-family-services',
  'energy-assistance-crisis-assistance',
  'energy-assistance-fuel-assistance',
];
for (const slug of dfsSlugs) {
  const prog = findBySlug(slug);
  if (prog) {
    console.log(`Setting requires_legal_status=null for ${slug}`);
    prog.requires_legal_status = null;
  } else {
    console.warn(`WARNING: Could not find program with slug: ${slug}`);
  }
}

// Virginia Tax Holiday: null
const taxHoliday = findBySlug('virginia-income-annual-retail-sales-use-tax-holiday-expires-7-1-2030');
if (taxHoliday) {
  console.log('Setting requires_legal_status=null for virginia tax holiday');
  taxHoliday.requires_legal_status = null;
}

// -----------------------------------------------------------------------
// WRITE OUTPUT
// -----------------------------------------------------------------------

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('\nDone! programs_import.json updated successfully.');

// -----------------------------------------------------------------------
// VERIFICATION
// -----------------------------------------------------------------------
console.log('\n--- VERIFICATION ---');
console.log('All slugs after fix:');
data.forEach((p, i) => {
  console.log(`  ${i}: ${p.slug} | need_type_codes: ${JSON.stringify(p.need_type_codes)} | income_benchmark: ${p.income_benchmark_code || 'none'} | legal_status: ${p.requires_legal_status}`);
});

// Check for duplicate slugs
const slugs = data.map(p => p.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length > 0) {
  console.warn('\nWARNING - DUPLICATE SLUGS FOUND:', dupes);
} else {
  console.log('\nNo duplicate slugs found - all good!');
}
