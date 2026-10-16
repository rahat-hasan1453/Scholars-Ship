// For every subject: `core` words say "this IS the subject" and rank first; `related` words say "close to it" and rank after.
// A `*` at the end of a word means "any ending" (robot* matches robot, robots, robotics).
// Words are matched as whole words, not inside other words, so AI never matches "maintain".
// Words used by many fields (cognitive, visualization) are kept in `related` only, never `core`.
export type SubjectKeywords = { core: string[]; related: string[] };

export const SUBJECT_KEYWORDS: Record<string, SubjectKeywords> = {
  'Computer Science': {
    core: ['algorithms', 'computational complexity', 'programming languages', 'operating systems', 'databases', 'computer architecture', 'theory of computation'],
    related: ['software', 'computing', 'informatics', 'data structures', 'networks', 'compilers', 'distributed'],
  },
  'Software Engineering & Distributed Systems': {
    core: ['software engineering', 'distributed systems', 'cloud computing', 'microservices', 'software testing', 'DevOps'],
    related: ['operating systems', 'networking', 'databases', 'architecture', 'programming languages', 'reliability', 'scalability'],
  },
  'Artificial Intelligence': {
    core: ['artificial intelligence', 'AI', 'LLM', 'LLMs', 'large language model*', 'reasoning', 'knowledge representation'],
    related: ['machine learning', 'neural network*', 'NLP', 'agent*', 'planning', 'robot*', 'computer vision', 'generative'],
  },
  'Machine Learning': {
    core: ['machine learning', 'deep learning', 'reinforcement learning', 'representation learning'],
    related: ['neural network*', 'AI', 'data mining', 'optimization', 'computer vision', 'NLP', 'statistics'],
  },
  'Data Science & Analytics': {
    core: ['data science', 'analytics', 'data mining', 'big data', 'statistics'],
    related: ['machine learning', 'visuali*', 'databases', 'econometrics', 'forecasting', 'data engineering'],
  },
  'Human-Computer Interaction (HCI)': {
    core: ['HCI', 'human-computer interaction', 'CSCW', 'interactive system*'],
    related: [
      'UX', 'UI', 'user interface*', 'interaction design', 'usability', 'human-AI', 'accessib*', 'visuali*', 'virtual reality', 'augmented reality',
      'mixed reality', 'extended reality', 'XR', 'VR', 'haptic*', 'social computing', 'conversational agent*', 'cognitive load',
    ],
  },
  'UX & Product Design': {
    core: ['UX', 'user experience', 'product design', 'usability', 'interaction design', 'service design', 'user research'],
    related: [
      'UI', 'user interface*', 'HCI', 'human-computer interaction', 'interaction', 'design research', 'participatory design', 'co-design',
      'prototyp*', 'information architecture', 'cognitive',
    ],
  },
  'Human Factors': {
    core: ['human factors', 'ergonomics', 'human performance'],
    related: ['cognitive', 'usability', 'accessib*', 'assistive', 'haptic*', 'perception', 'safety', 'behavior change', 'behaviour change', 'UX', 'HCI'],
  },
  'Information Systems': {
    core: ['information systems', 'enterprise systems', 'information science'],
    related: ['social computing', 'digital transformation', 'knowledge management', 'databases', 'e-government', 'IT management'],
  },
  Cybersecurity: {
    core: ['cybersecurity', 'cyber*', 'cryptograph*', 'privacy', 'security'],
    related: ['usable security', 'malware', 'network security', 'authentication', 'blockchain', 'trust', 'adversarial'],
  },
  'Robotics & Autonomous Systems': {
    core: ['robot*', 'autonomous systems', 'mechatronics', 'autonomous vehicles'],
    related: ['human-robot interaction', 'control systems', 'SLAM', 'sensors', 'embodied', 'computer vision', 'manipulation', 'drones'],
  },
  'Electrical & Computer Engineering': {
    core: ['electrical*', 'electronic*', 'computer engineering', 'VLSI', 'signal processing', 'embedded systems', 'power systems', 'circuit*'],
    related: ['IoT', 'internet of things', 'wireless', 'communications', 'control', 'semiconductors', 'quantum computing'],
  },
  'Mechanical & Aerospace Engineering': {
    core: ['mechanical engineering', 'mechanical', 'aerospace', 'aeronautic*', 'fluid dynamics'],
    related: ['thermodynamic*', 'materials', 'manufacturing', 'structures', 'propulsion', 'CFD', 'control', 'energy'],
  },
  'Materials Science & Nanotechnology': {
    core: ['materials science', 'nanotech*', 'nanomaterial*'],
    related: ['materials', 'polymers', 'semiconductors', 'thin films', 'batteries', 'composites', 'chemistry', 'energy materials'],
  },
  'Biomedical Engineering': {
    core: ['biomedical engineering', 'medical devices', 'biomechanic*', 'medical imaging'],
    related: ['prosthetic*', 'tissue engineering', 'biosensor*', 'rehabilitation', 'wearable*', 'signal processing'],
  },
  'Biomedical Informatics': {
    core: ['bioinformatics', 'health informatics', 'biomedical informatics', 'clinical informatics', 'computational biology'],
    related: ['electronic health records', 'genomics', 'medical AI', 'digital health', 'data integration'],
  },
  'Biotechnology & Genomics': {
    core: ['biotech*', 'genomic*', 'genetic*', 'molecular biology'],
    related: ['CRISPR', 'proteomics', 'synthetic biology', 'bioinformatics', 'cell biology', 'microbiology'],
  },
  'Neuroscience & Neurotechnology': {
    core: ['neuro*', 'brain-computer interface*'],
    related: ['EEG', 'fMRI', 'cognition', 'cognitive', 'neural', 'brain', 'neuroimaging', 'psychology'],
  },
  'Public Health & Epidemiology': {
    core: ['public health', 'epidemiolog*', 'global health'],
    related: ['health policy', 'infectious disease*', 'nutrition', 'mental health', 'health systems', 'biostatistics'],
  },
  'Economics & Quantitative Finance': {
    core: ['econom*', 'quantitative finance', 'econometrics'],
    related: ['finance', 'financial', 'markets', 'game theory', 'behavioural economics', 'risk', 'statistics', 'development economics'],
  },
  'Public Policy & Governance': {
    core: ['public policy', 'governance', 'public administration'],
    related: ['political science', 'regulation', 'law', 'development policy', 'social science*', 'ethics', 'institutions'],
  },
};
