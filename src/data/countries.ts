export interface CountryOption {
  label: string;
  value: string;
  code: string;
  flag: string;
  region: 'North America' | 'Europe' | 'Asia & Middle East' | 'Oceania' | 'Latin America & Africa';
  popularForScholarships?: boolean;
}

export const WORLD_COUNTRIES: CountryOption[] = [
  // North America
  { label: 'United States', value: 'USA', code: 'US', flag: '🇺🇸', region: 'North America', popularForScholarships: true },
  { label: 'Canada', value: 'Canada', code: 'CA', flag: '🇨🇦', region: 'North America', popularForScholarships: true },
  { label: 'Mexico', value: 'Mexico', code: 'MX', flag: '🇲🇽', region: 'North America' },

  // Europe (Top Destinations & Tuition Free / Low Fee)
  { label: 'Germany', value: 'Germany', code: 'DE', flag: '🇩🇪', region: 'Europe', popularForScholarships: true },
  { label: 'United Kingdom', value: 'United Kingdom', code: 'GB', flag: '🇬🇧', region: 'Europe', popularForScholarships: true },
  { label: 'Italy', value: 'Italy', code: 'IT', flag: '🇮🇹', region: 'Europe', popularForScholarships: true },
  { label: 'France', value: 'France', code: 'FR', flag: '🇫🇷', region: 'Europe', popularForScholarships: true },
  { label: 'Netherlands', value: 'Netherlands', code: 'NL', flag: '🇳🇱', region: 'Europe', popularForScholarships: true },
  { label: 'Switzerland', value: 'Switzerland', code: 'CH', flag: '🇨🇭', region: 'Europe', popularForScholarships: true },
  { label: 'Sweden', value: 'Sweden', code: 'SE', flag: '🇸🇪', region: 'Europe', popularForScholarships: true },
  { label: 'Finland', value: 'Finland', code: 'FI', flag: '🇫🇮', region: 'Europe', popularForScholarships: true },
  { label: 'Norway', value: 'Norway', code: 'NO', flag: '🇳🇴', region: 'Europe', popularForScholarships: true },
  { label: 'Denmark', value: 'Denmark', code: 'DK', flag: '🇩🇰', region: 'Europe', popularForScholarships: true },
  { label: 'Ireland', value: 'Ireland', code: 'IE', flag: '🇮🇪', region: 'Europe', popularForScholarships: true },
  { label: 'Austria', value: 'Austria', code: 'AT', flag: '🇦🇹', region: 'Europe', popularForScholarships: true },
  { label: 'Belgium', value: 'Belgium', code: 'BE', flag: '🇧🇪', region: 'Europe' },
  { label: 'Spain', value: 'Spain', code: 'ES', flag: '🇪🇸', region: 'Europe' },
  { label: 'Portugal', value: 'Portugal', code: 'PT', flag: '🇵🇹', region: 'Europe' },
  { label: 'Poland', value: 'Poland', code: 'PL', flag: '🇵🇱', region: 'Europe', popularForScholarships: true },
  { label: 'Hungary', value: 'Hungary', code: 'HU', flag: '🇭🇺', region: 'Europe', popularForScholarships: true },
  { label: 'Czech Republic', value: 'Czech Republic', code: 'CZ', flag: '🇨🇿', region: 'Europe' },
  { label: 'Estonia', value: 'Estonia', code: 'EE', flag: '🇪🇪', region: 'Europe' },
  { label: 'Lithuania', value: 'Lithuania', code: 'LT', flag: '🇱🇹', region: 'Europe' },
  { label: 'Latvia', value: 'Latvia', code: 'LV', flag: '🇱🇻', region: 'Europe' },
  { label: 'Cyprus', value: 'Cyprus', code: 'CY', flag: '🇨🇾', region: 'Europe' },
  { label: 'Greece', value: 'Greece', code: 'GR', flag: '🇬🇷', region: 'Europe' },
  { label: 'Luxembourg', value: 'Luxembourg', code: 'LU', flag: '🇱🇺', region: 'Europe' },
  { label: 'Turkey', value: 'Turkey', code: 'TR', flag: '🇹🇷', region: 'Europe', popularForScholarships: true },

  // Asia & Middle East
  { label: 'Japan', value: 'Japan', code: 'JP', flag: '🇯🇵', region: 'Asia & Middle East', popularForScholarships: true },
  { label: 'South Korea', value: 'South Korea', code: 'KR', flag: '🇰🇷', region: 'Asia & Middle East', popularForScholarships: true },
  { label: 'Singapore', value: 'Singapore', code: 'SG', flag: '🇸🇬', region: 'Asia & Middle East', popularForScholarships: true },
  { label: 'Malaysia', value: 'Malaysia', code: 'MY', flag: '🇲🇾', region: 'Asia & Middle East' },
  { label: 'Taiwan', value: 'Taiwan', code: 'TW', flag: '🇹🇼', region: 'Asia & Middle East' },
  { label: 'Hong Kong', value: 'Hong Kong', code: 'HK', flag: '🇭🇰', region: 'Asia & Middle East' },
  { label: 'China', value: 'China', code: 'CN', flag: '🇨🇳', region: 'Asia & Middle East', popularForScholarships: true },
  { label: 'Saudi Arabia', value: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', region: 'Asia & Middle East', popularForScholarships: true },
  { label: 'United Arab Emirates', value: 'UAE', code: 'AE', flag: '🇦🇪', region: 'Asia & Middle East' },
  { label: 'Qatar', value: 'Qatar', code: 'QA', flag: '🇶🇦', region: 'Asia & Middle East' },
  { label: 'Thailand', value: 'Thailand', code: 'TH', flag: '🇹🇭', region: 'Asia & Middle East' },
  { label: 'Vietnam', value: 'Vietnam', code: 'VN', flag: '🇻🇳', region: 'Asia & Middle East' },
  { label: 'India', value: 'India', code: 'IN', flag: '🇮🇳', region: 'Asia & Middle East' },
  { label: 'Bangladesh', value: 'Bangladesh', code: 'BD', flag: '🇧🇩', region: 'Asia & Middle East' },

  // Oceania
  { label: 'Australia', value: 'Australia', code: 'AU', flag: '🇦🇺', region: 'Oceania', popularForScholarships: true },
  { label: 'New Zealand', value: 'New Zealand', code: 'NZ', flag: '🇳🇿', region: 'Oceania', popularForScholarships: true },

  // Latin America & Africa
  { label: 'Brazil', value: 'Brazil', code: 'BR', flag: '🇧🇷', region: 'Latin America & Africa' },
  { label: 'Argentina', value: 'Argentina', code: 'AR', flag: '🇦🇷', region: 'Latin America & Africa' },
  { label: 'Chile', value: 'Chile', code: 'CL', flag: '🇨🇱', region: 'Latin America & Africa' },
  { label: 'South Africa', value: 'South Africa', code: 'ZA', flag: '🇿🇦', region: 'Latin America & Africa' },
  { label: 'Egypt', value: 'Egypt', code: 'EG', flag: '🇪🇬', region: 'Latin America & Africa' },
];

export const getCountryOptions = () => {
  return [
    { label: '🌐 All Countries', value: 'ALL' },
    ...WORLD_COUNTRIES.map((c) => ({
      label: `${c.flag} ${c.label}`,
      value: c.value,
    })),
  ];
};
