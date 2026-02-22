/**
 * import_excel.ts
 * One-time script: parses All_Energy_Services.xlsx → programs_import.json
 *
 * Run: npm run seed --workspace=backend
 * (from repo root, or: cd backend && npx tsx ../db/seeds/import_excel.ts)
 *
 * Output: programs_import.json (in repo root — gitignored)
 * Review the output carefully before running the admin import.
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../../All_Energy_Services.xlsx');
const OUTPUT_PATH = path.resolve(__dirname, '../../programs_import.json');

// ============================================================
// Column mapping for the Summary sheet
// Based on analysis of All_Energy_Services.xlsx structure
// ============================================================

// Row 1 is the header. Programs start at row 2.
// Column letters → 0-based indexes:
function colIdx(letter: string): number {
  let idx = 0;
  for (let i = 0; i < letter.length; i++) {
    idx = idx * 26 + letter.charCodeAt(i) - 64;
  }
  return idx - 1;
}

// Administrator columns (B–R) — 0-based indexes 1–17
const ADMIN_COLS: Record<string, number> = {
  dcc:                colIdx('C'),
  dfs:                colIdx('D'),
  dhcd:               colIdx('E'),
  ncs:                colIdx('F'),
  oeec:               colIdx('G'),
  chp_energy:         colIdx('H'),
  columbia_gas:       colIdx('I'),
  dominion:           colIdx('J'),
  fairfax_fish:       colIdx('K'),
  good_shepherd:      colIdx('L'),
  novec:              colIdx('M'),
  rebuilding_together:colIdx('N'),
  salvation_army:     colIdx('O'),
  united_community:   colIdx('P'),
  washington_gas:     colIdx('Q'),
};

// Geography columns (BY–CC) → approximate column indices
// The spreadsheet uses columns BY=77, BZ=78, CA=79, CB=80, CC=81 (0-based)
const GEO_COLS: Record<string, number> = {
  fairfax_county:       colIdx('BY'),
  city_of_fairfax:      colIdx('BZ'),
  city_of_falls_church: colIdx('CA'),
  herndon:              colIdx('CB'),
  vienna:               colIdx('CC'),
};

// Age group columns (AU–AZ) → AU=46, AV=47, AW=48, AX=49, AY=50
const AGE_COLS: Record<string, number> = {
  age_0_5:           colIdx('AU'),
  age_6_59_nondis:   colIdx('AV'),
  age_60_plus:       colIdx('AW'),
  federally_disabled:colIdx('AX'),
  veteran:           colIdx('AY'),
};

// Legal status columns (BB–BC)
const LEGAL_COLS: Record<string, number> = {
  with_status:    colIdx('BB'),
  without_status: colIdx('BC'),
};

// Housing type columns (CI–CO approximately)
// CI=89, CJ=90, CK=91, CL=92, CM=93, CN=94, CO=95
const HOUSING_COLS: Record<string, number> = {
  renter:        colIdx('CI'),
  owner:         colIdx('CJ'),
  manufactured:  colIdx('CK'),
  single_family: colIdx('CL'),
  townhome:      colIdx('CM'),
  multi_family:  colIdx('CN'),
  condo:         colIdx('CO'),
};

// Need type columns (CS–CU)
const NEED_COLS: Record<string, number> = {
  ac_cooling:             colIdx('CS'),
  heating:                colIdx('CT'),
  home_repair_efficiency: colIdx('CU'),
};

// Help type columns — financial (CW–DA), HVAC (DC–DH), efficiency (DJ–DL)
const HELP_COLS: Record<string, number> = {
  // Financial
  direct_bill_help:  colIdx('CW'),
  payment_structure: colIdx('CX'),
  security_deposit:  colIdx('CY'),
  tax_incentive:     colIdx('CZ'),
  indirect_savings:  colIdx('DA'),
  // HVAC Equipment
  drop_off_ac:       colIdx('DC'),
  install_ac:        colIdx('DD'),
  minor_tuning:      colIdx('DE'),
  larger_repairs:    colIdx('DF'),
  full_replacement:  colIdx('DG'),
  electrical_repairs:colIdx('DH'),
  // Efficiency/Weatherization
  energy_audit:        colIdx('DJ'),
  efficiency_upgrades: colIdx('DK'),
  efficiency_advice:   colIdx('DL'),
};

// Income columns
// Monthly cap description: BD (column 56, 0-based 55)
// Monthly HH1–HH8: BF–BM (57–64)
// Annual cap description: BN (65)
// Annual HH1–HH8: BP–BW (67–74)
const INCOME_BENCHMARK_COL = colIdx('BD');
const MONTHLY_COLS = [
  colIdx('BF'), colIdx('BG'), colIdx('BH'), colIdx('BI'),
  colIdx('BJ'), colIdx('BK'), colIdx('BL'), colIdx('BM'),
];
const ANNUAL_COLS = [
  colIdx('BP'), colIdx('BQ'), colIdx('BR'), colIdx('BS'),
  colIdx('BT'), colIdx('BU'), colIdx('BV'), colIdx('BW'),
];

// Seasonal columns: S–AS (columns 18–44, biweekly periods Jan–Dec)
// We'll parse which columns are marked and convert to approximate date ranges
const SEASONAL_START_COL = colIdx('S');
const SEASONAL_END_COL = colIdx('AS');

// Approximate biweekly period dates (period index 0–25 → date ranges)
// The spreadsheet splits each month into 2 halves
const CURRENT_YEAR = new Date().getFullYear();
const Y = CURRENT_YEAR;
const BIWEEKLY_PERIODS: Array<{ open: string; close: string }> = [
  { open: `${Y}-01-01`, close: `${Y}-01-15` },
  { open: `${Y}-01-16`, close: `${Y}-01-31` },
  { open: `${Y}-02-01`, close: `${Y}-02-14` },
  { open: `${Y}-02-15`, close: `${Y}-02-28` },
  { open: `${Y}-03-01`, close: `${Y}-03-15` },
  { open: `${Y}-03-16`, close: `${Y}-03-31` },
  { open: `${Y}-04-01`, close: `${Y}-04-15` },
  { open: `${Y}-04-16`, close: `${Y}-04-30` },
  { open: `${Y}-05-01`, close: `${Y}-05-15` },
  { open: `${Y}-05-16`, close: `${Y}-05-31` },
  { open: `${Y}-06-01`, close: `${Y}-06-15` },
  { open: `${Y}-06-16`, close: `${Y}-06-30` },
  { open: `${Y}-07-01`, close: `${Y}-07-15` },
  { open: `${Y}-07-16`, close: `${Y}-07-31` },
  { open: `${Y}-08-01`, close: `${Y}-08-15` },
  { open: `${Y}-08-16`, close: `${Y}-08-31` },
  { open: `${Y}-09-01`, close: `${Y}-09-15` },
  { open: `${Y}-09-16`, close: `${Y}-09-30` },
  { open: `${Y}-10-01`, close: `${Y}-10-15` },
  { open: `${Y}-10-16`, close: `${Y}-10-31` },
  { open: `${Y}-11-01`, close: `${Y}-11-15` },
  { open: `${Y}-11-16`, close: `${Y}-11-30` },
  { open: `${Y}-12-01`, close: `${Y}-12-15` },
  { open: `${Y}-12-16`, close: `${Y}-12-31` },
];

function isMarked(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  const str = String(val).trim().toUpperCase();
  return str === 'Y' || str === 'X' || str === '1' || str === 'YES' || str === 'TRUE' || str === 'L';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function parseBenchmarkCode(val: unknown): string | undefined {
  if (!val) return undefined;
  const s = String(val).toLowerCase();
  if (s.includes('80') && s.includes('ami')) return '80_pct_ami';
  if (s.includes('60') && s.includes('smi')) return '60_pct_smi';
  if (s.includes('80') && s.includes('smi')) return '80_pct_smi';
  if (s.includes('120') && s.includes('smi')) return '120_pct_smi';
  if (s.includes('175') && s.includes('fp')) return '175_pct_fpl';
  if (s.includes('200') && s.includes('fp')) return '200_pct_fpl';
  if (s === 'a' || s === 'all' || s === 'none') return undefined; // no limit
  return undefined;
}

function mergeDateRanges(periods: typeof BIWEEKLY_PERIODS): Array<{ open: string; close: string }> {
  if (periods.length === 0) return [];
  const sorted = [...periods].sort((a, b) => a.open.localeCompare(b.open));
  const merged: Array<{ open: string; close: string }> = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    // If next period starts within 2 days of current close, merge
    const currentClose = new Date(current.close);
    const nextOpen = new Date(next.open);
    const diffDays = (nextOpen.getTime() - currentClose.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      current.close = next.close;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

interface ImportProgram {
  slug: string;
  name_en: string;
  name_es: string;
  short_description_en: string;
  short_description_es: string;
  full_description_en: string;
  full_description_es: string;
  how_to_apply_en: string;
  how_to_apply_es: string;
  income_benchmark_code?: string;
  income_note_en?: string;
  requires_legal_status: boolean | null;
  geography_codes: string[];
  age_group_codes: string[];
  housing_type_codes: string[];
  need_type_codes: string[];
  help_type_codes: string[];
  administrator_codes: Array<{ code: string; is_primary: boolean }>;
  seasonal_windows: Array<{
    year: number;
    open_date: string;
    close_date: string;
    notes_en?: string;
  }>;
}

function parseSheet(): ImportProgram[] {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`Excel file not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  console.log(`Reading ${XLSX_PATH}...`);
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // Convert to array of arrays (raw cells)
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as unknown[][];

  console.log(`Total rows in sheet: ${rows.length}`);

  const programs: ImportProgram[] = [];

  // Row 0 is header, programs start at row 1
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || !row[0]) continue;

    const name = String(row[0]).trim();
    if (!name || name.length < 3) continue;
    // Skip header/sub-header rows
    if (name.toLowerCase().includes('program name') || name.toLowerCase().includes('administered')) continue;

    console.log(`  Processing: ${name}`);

    // Administrators
    const adminCodes: Array<{ code: string; is_primary: boolean }> = [];
    let primarySet = false;
    for (const [code, colI] of Object.entries(ADMIN_COLS)) {
      if (isMarked(row[colI])) {
        adminCodes.push({ code, is_primary: !primarySet });
        primarySet = true;
      }
    }

    // Geographies
    const geoCodes: string[] = [];
    for (const [code, colI] of Object.entries(GEO_COLS)) {
      if (isMarked(row[colI])) geoCodes.push(code);
    }
    // Default: if no geo marked, assume fairfax_county
    if (geoCodes.length === 0) geoCodes.push('fairfax_county');

    // Age groups
    const ageCodes: string[] = [];
    for (const [code, colI] of Object.entries(AGE_COLS)) {
      if (isMarked(row[colI])) ageCodes.push(code);
    }
    // Default: if none marked, accept all
    if (ageCodes.length === 0) {
      ageCodes.push('age_0_5', 'age_6_59_nondis', 'age_60_plus', 'federally_disabled', 'veteran');
    }

    // Legal status
    const withStatus = isMarked(row[LEGAL_COLS.with_status]);
    const withoutStatus = isMarked(row[LEGAL_COLS.without_status]);
    let requiresLegalStatus: boolean | null = null;
    if (withStatus && !withoutStatus) requiresLegalStatus = true;
    else if (!withStatus && withoutStatus) requiresLegalStatus = false;
    else requiresLegalStatus = null; // both or neither → not restricted

    // Housing types
    const housingCodes: string[] = [];
    for (const [code, colI] of Object.entries(HOUSING_COLS)) {
      if (isMarked(row[colI])) housingCodes.push(code);
    }
    if (housingCodes.length === 0) {
      housingCodes.push('renter', 'owner', 'manufactured', 'single_family', 'townhome', 'multi_family', 'condo');
    }

    // Need types
    const needCodes: string[] = [];
    for (const [code, colI] of Object.entries(NEED_COLS)) {
      if (isMarked(row[colI])) needCodes.push(code);
    }

    // Help types
    const helpCodes: string[] = [];
    for (const [code, colI] of Object.entries(HELP_COLS)) {
      if (isMarked(row[colI])) helpCodes.push(code);
    }

    // Income benchmark
    const benchmarkRaw = row[INCOME_BENCHMARK_COL];
    const benchmarkCode = parseBenchmarkCode(benchmarkRaw);
    const incomeNoteEn = benchmarkRaw ? String(benchmarkRaw).trim() : undefined;

    // Seasonal windows
    const openPeriods: typeof BIWEEKLY_PERIODS = [];
    const numPeriods = Math.min(SEASONAL_END_COL - SEASONAL_START_COL + 1, BIWEEKLY_PERIODS.length);
    for (let p = 0; p < numPeriods; p++) {
      if (isMarked(row[SEASONAL_START_COL + p])) {
        openPeriods.push(BIWEEKLY_PERIODS[p]);
      }
    }

    const seasonalWindows = mergeDateRanges(openPeriods).map(w => ({
      year: CURRENT_YEAR,
      open_date: w.open,
      close_date: w.close,
    }));

    // Build slug
    const slug = slugify(name);

    // Build short description from available data
    const needLabels = needCodes.map(c => c.replace(/_/g, ' '));
    const shortDesc = `Provides ${needLabels.join(', ') || 'assistance'} for eligible Fairfax County residents.`;

    programs.push({
      slug,
      name_en: name,
      name_es: name, // Will need manual Spanish translation — placeholder
      short_description_en: shortDesc,
      short_description_es: shortDesc, // placeholder
      full_description_en: '',
      full_description_es: '',
      how_to_apply_en: '',
      how_to_apply_es: '',
      income_benchmark_code: benchmarkCode,
      income_note_en: incomeNoteEn,
      requires_legal_status: requiresLegalStatus,
      geography_codes: geoCodes,
      age_group_codes: ageCodes,
      housing_type_codes: housingCodes,
      need_type_codes: needCodes,
      help_type_codes: helpCodes,
      administrator_codes: adminCodes,
      seasonal_windows: seasonalWindows,
    });
  }

  return programs;
}

const programs = parseSheet();
console.log(`\nParsed ${programs.length} programs.`);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(programs, null, 2), 'utf-8');
console.log(`Output written to: ${OUTPUT_PATH}`);
console.log('\n⚠️  REVIEW the output file carefully before loading into the database!');
console.log('   Pay special attention to:');
console.log('   - Programs with empty need_type_codes (may have missed column mapping)');
console.log('   - Programs with empty administrator_codes');
console.log('   - Income benchmark assignments');
console.log('   - Seasonal windows (verify date ranges look reasonable)');
