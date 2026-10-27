// Countries the faculty data covers, and how many institutions per country (ranked by recent CSRankings output).
// Shared by import-professors.ts (CSRankings) and import-openalex-researchers.ts (OpenAlex, per-country cap).
// Names match src/data/countries.ts and the ROR index.
export const COUNTRY_QUOTA: Record<string, [name: string, institutions: number]> = {
  us: ['USA', 25], gb: ['United Kingdom', 6], de: ['Germany', 6], ca: ['Canada', 5], au: ['Australia', 4],
  nl: ['Netherlands', 4], ch: ['Switzerland', 3], se: ['Sweden', 3], dk: ['Denmark', 2], no: ['Norway', 2],
  fi: ['Finland', 2], at: ['Austria', 2], ie: ['Ireland', 2], be: ['Belgium', 2], fr: ['France', 3],
  it: ['Italy', 2], es: ['Spain', 2], sg: ['Singapore', 2], kr: ['South Korea', 3], jp: ['Japan', 2],
  hk: ['Hong Kong', 2], tw: ['Taiwan', 1], cn: ['China', 3], in: ['India', 2], bd: ['Bangladesh', 3],
  nz: ['New Zealand', 1], pt: ['Portugal', 1], pl: ['Poland', 1], cz: ['Czech Republic', 1],
};
