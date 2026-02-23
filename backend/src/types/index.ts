export interface Geography {
  id: number;
  code: string;
  label: string; // locale-resolved
}

export interface AgeGroup {
  id: number;
  code: string;
  label: string;
}

export interface HousingType {
  id: number;
  code: string;
  label: string;
}

export interface NeedType {
  id: number;
  code: string;
  label: string;
}

export interface HelpType {
  id: number;
  code: string;
  label: string;
  category: string;
}

export interface Administrator {
  id: number;
  code: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_primary: boolean;
}

export interface IncomeThreshold {
  household_size: number;
  monthly_limit: number | null;
  annual_limit: number | null;
}

export interface SeasonalWindow {
  open_date: string;
  close_date: string;
  notes: string | null;
}

export interface ProgramResponse {
  id: number;
  slug: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  how_to_apply: string | null;
  income_benchmark: { code: string; label: string } | null;
  income_note: string | null;
  notes: string | null;
  requires_legal_status: boolean | null;
  geographies: Geography[];
  age_groups: AgeGroup[];
  housing_types: HousingType[];
  need_types: NeedType[];
  help_types: HelpType[];
  administrators: Administrator[];
  income_thresholds: IncomeThreshold[];
  seasonal_windows: SeasonalWindow[];
  is_active: boolean;
}

export interface DecisionTreeOption {
  id: number;
  code: string;
  i18n_key: string;
  sort_order: number;
  lookup_id: number | null;
}

export interface DecisionTreeQuestion {
  id: number;
  code: string;
  question_type: 'single_choice' | 'multi_choice' | 'income_input' | 'numeric_input';
  is_skippable: boolean;
  sort_order: number;
  i18n_key: string;
  filter_field: string | null;
  options: DecisionTreeOption[];
}

export interface EligibilityCheckRequest {
  geography?: string;
  household_size?: number;
  monthly_income?: number;
  annual_income?: number;
  age_group?: string;
  legal_status?: string | null;
  ownership_type?: string;
  home_type?: string;
  need_types?: string[];
}
