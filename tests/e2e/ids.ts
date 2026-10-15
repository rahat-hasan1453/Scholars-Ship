// Every id the e2e specs use. All rows come from tests/e2e/seed/e2e-data.ts, so never hand-write an id in a spec.
export const E2E_IDS = {
  scholarship: 'e2e_sch_daad_hci',
  scholarshipMasters: 'e2e_sch_nl_masters',
  opportunity: 'e2e_opp_hci_berlin',
  opportunityMasters: 'e2e_opp_masters_zurich',
  opportunityNoDeadline: 'e2e_opp_no_deadline',
  opportunityNoCountry: 'e2e_opp_no_country',
  /** Needs a CGPA above the e2e student's, so "Eligible Now" drops it */
  opportunityDemanding: 'e2e_opp_demanding_ml',
  professorDemanding: 'e2e_prof_closed',
  professor: 'e2e_prof_hci',
  /** Same field as `professor`, so it shows under "Similar faculty" */
  professorSimilar: 'e2e_prof_hci_2',
  paper: 'e2e_paper_genai',
  university: 'e2e_uni_berlin',
} as const;

/** Display names the specs check for */
export const E2E_NAMES = {
  professor: 'Dr. Ada Testwell',
  lab: 'E2E Test Lab',
  paperTitle: 'Generative AI as a Design Partner: An E2E Test Study',
} as const;
