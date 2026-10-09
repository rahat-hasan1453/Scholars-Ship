// One subject list for onboarding, profile and every feed's Subject filter.
export const SUBJECTS = [
  'Computer Science',
  'Software Engineering & Distributed Systems',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science & Analytics',
  'Human-Computer Interaction (HCI)',
  'UX & Product Design',
  'Human Factors',
  'Information Systems',
  'Cybersecurity',
  'Robotics & Autonomous Systems',
  'Electrical & Computer Engineering',
  'Mechanical & Aerospace Engineering',
  'Materials Science & Nanotechnology',
  'Biomedical Engineering',
  'Biomedical Informatics',
  'Biotechnology & Genomics',
  'Neuroscience & Neurotechnology',
  'Public Health & Epidemiology',
  'Economics & Quantitative Finance',
  'Public Policy & Governance',
] as const;

// Free-text tags (listing fields, research tags, paper topics) -> subjects
const SUBJECT_RULES: [string, RegExp][] = [
  ['Computer Science', /computer science|computing|informatics|\bcs\b/i],
  ['Software Engineering & Distributed Systems', /software|distributed systems?|cloud computing|operating systems?|networking/i],
  ['Artificial Intelligence', /artificial intelligence|\bai\b|\bllms?\b|large language model/i],
  ['Machine Learning', /machine learning|deep learning|computer vision|natural language/i],
  ['Data Science & Analytics', /data science|statistics|econometrics|analytics|data mining|big data/i],
  ['Human-Computer Interaction (HCI)', /\bhci\b|human[- ]computer|cscw|social computing|ubiquitous computing|pervasive computing|tangible (?:interaction|interface|computing)|wearable computing|human[- ]ai\b|human[- ]cent(?:er|re)d ai|human[- ]robot interaction|\bhri\b|conversational (?:agents?|interfaces?|user)|voice (?:user )?interfaces?|information visuali[sz]ation|data visuali[sz]ation|visual analytics|virtual reality|augmented reality|mixed reality|extended reality|\b(?:vr|ar|xr)\b|creativity support|creative computing|interactive systems?|usable security|usable privacy|privacy ux|digital health design|health ux|user stud(?:y|ies)/i],
  ['UX & Product Design', /\bux\b|\bui\b design|user experience|interaction design|\bixd\b|product design|service design|user research|usability|design research|human[- ]cent(?:er|re)d design|participatory design|co-?design|information architecture|user interfaces?|game design|games user research|inclusive design/i],
  ['Human Factors', /cognitive|ergonomics|human factors|haptics|accessib|assistive|behaviou?r change|persuasive technolog|learning sciences|edtech|educational technology/i],
  ['Information Systems', /information science|information systems|social computing|cscw/i],
  ['Cybersecurity', /cyber|security|privacy|cryptograph/i],
  ['Robotics & Autonomous Systems', /robot|mechatronics|autonomous/i],
  ['Electrical & Computer Engineering', /electrical|electronic|computer engineering|internet of things|quantum computing|vlsi|circuit|signal processing/i],
  ['Mechanical & Aerospace Engineering', /mechanical|aerospace|aeronautic|fluid dynamics|thermodynamic/i],
  ['Materials Science & Nanotechnology', /materials science|nanotech|nanomaterial|\bmaterials\b/i],
  ['Biomedical Engineering', /biomedical engineering|medical device|biomechanic|medical imaging/i],
  ['Biomedical Informatics', /bioinformatics|health informatics|biomedical informatics|clinical informatics|computational biology/i],
  ['Biotechnology & Genomics', /biotech|genomic|genetic|molecular biology/i],
  ['Neuroscience & Neurotechnology', /neuro|brain/i],
  ['Public Health & Epidemiology', /public health|epidemiolog|global health/i],
  ['Economics & Quantitative Finance', /econom|finance|financial/i],
  ['Public Policy & Governance', /public policy|governance|public administration|political science/i],
];

export function subjectTagsFor(texts: string[]): string[] {
  const text = texts.join(' | ');
  return SUBJECT_RULES.filter(([, re]) => re.test(text)).map(([subject]) => subject);
}

// Names used before the single list existed (old onboarding + old filter values)
const LEGACY_NAMES: Record<string, string[]> = {
  'Artificial Intelligence & Machine Learning': ['Artificial Intelligence', 'Machine Learning'],
  'Human-Computer Interaction (HCI) & UX': ['Human-Computer Interaction (HCI)', 'UX & Product Design'],
  HCI: ['Human-Computer Interaction (HCI)'],
  'Data Science': ['Data Science & Analytics'],
  Robotics: ['Robotics & Autonomous Systems'],
  'Electrical Engineering': ['Electrical & Computer Engineering'],
};

/** Old names -> current names; custom subjects the user typed are kept as they are */
export function normalizeSubjects(list: string[] | undefined): string[] {
  return [...new Set((list ?? []).flatMap((s) => LEGACY_NAMES[s] ?? [s]))];
}

/** A Subject filter selection matches an item described by these free-text tags */
export function matchesSubjects(selected: string[], tags: string[]): boolean {
  if (selected.length === 0) return true;
  const lower = tags.map((t) => t.toLowerCase().trim());
  if (lower.includes('all fields')) return true;
  if (subjectTagsFor(tags).some((s) => selected.includes(s))) return true;
  return selected.some((s) => lower.includes(s.toLowerCase()));
}
