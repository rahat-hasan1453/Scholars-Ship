import React from 'react';
import { DropdownOption } from '@/components/ui/CustomDropdown';

export interface SubjectItem {
  id: string;
  label: string;
  value: string;
  category: string;
  keywords: string[];
}

export const ACADEMIC_SUBJECTS: SubjectItem[] = [
  // 1. Design, Media & Human-Centric Tech
  {
    id: 'sub_ux_design',
    label: '🎨 UX & Product Design',
    value: 'UX Design',
    category: 'Design & Human-Centric Tech',
    keywords: ['ux', 'ui', 'user experience', 'interaction design', 'product design', 'design', 'user research'],
  },
  {
    id: 'sub_hci',
    label: '💻 Human-Computer Interaction (HCI)',
    value: 'Human-Computer Interaction (HCI)',
    category: 'Design & Human-Centric Tech',
    keywords: ['hci', 'human-computer', 'interactive', 'interaction', 'uclic', 'accessibility'],
  },
  {
    id: 'sub_digital_media',
    label: '🎬 Digital Media & Game Design',
    value: 'Digital Media',
    category: 'Design & Human-Centric Tech',
    keywords: ['digital media', 'media design', 'game design', 'animation', 'vr', 'ar', 'creative tech'],
  },
  {
    id: 'sub_industrial_design',
    label: '📐 Industrial & Hardware Design',
    value: 'Industrial Design',
    category: 'Design & Human-Centric Tech',
    keywords: ['industrial design', 'hardware design', 'physical computing', 'product design'],
  },
  {
    id: 'sub_architecture',
    label: '🏛️ Architecture & Urban Design',
    value: 'Architecture',
    category: 'Design & Human-Centric Tech',
    keywords: ['architecture', 'urban design', 'spatial', 'built environment'],
  },
  {
    id: 'sub_service_design',
    label: '💡 Service Design & Innovation',
    value: 'Service Design',
    category: 'Design & Human-Centric Tech',
    keywords: ['service design', 'design innovation', 'd.school', 'design thinking'],
  },

  // 2. Computer Science & Artificial Intelligence
  {
    id: 'sub_cs_general',
    label: '💻 Computer Science (General)',
    value: 'Computer Science',
    category: 'Computer Science & AI',
    keywords: ['computer science', 'computing', 'cs', 'software', 'algorithms', 'systems'],
  },
  {
    id: 'sub_ai_ml',
    label: '🤖 Artificial Intelligence & ML',
    value: 'Artificial Intelligence',
    category: 'Computer Science & AI',
    keywords: ['artificial intelligence', 'machine learning', 'ai', 'ml', 'deep learning', 'nlp', 'computer vision', 'vector institute'],
  },
  {
    id: 'sub_data_science',
    label: '📊 Data Science & Analytics',
    value: 'Data Science',
    category: 'Computer Science & AI',
    keywords: ['data science', 'big data', 'analytics', 'data mining', 'predictive modeling'],
  },
  {
    id: 'sub_cybersecurity',
    label: '🛡️ Cybersecurity & Privacy',
    value: 'Cybersecurity',
    category: 'Computer Science & AI',
    keywords: ['cybersecurity', 'cyber', 'security', 'infosec', 'cryptography', 'network security'],
  },
  {
    id: 'sub_software_eng',
    label: '⚙️ Software & Cloud Engineering',
    value: 'Software Engineering',
    category: 'Computer Science & AI',
    keywords: ['software engineering', 'distributed systems', 'cloud', 'devops', 'backend'],
  },
  {
    id: 'sub_quantum_computing',
    label: '⚛️ Quantum Computing & Info',
    value: 'Quantum Computing',
    category: 'Computer Science & AI',
    keywords: ['quantum', 'quantum computing', 'quantum information', 'qubit'],
  },

  // 3. Engineering & Robotics
  {
    id: 'sub_robotics',
    label: '🦾 Robotics & Mechatronics',
    value: 'Robotics',
    category: 'Engineering & Robotics',
    keywords: ['robotics', 'robot', 'mechatronics', 'autonomous', 'control systems', 'mirmi'],
  },
  {
    id: 'sub_mech_eng',
    label: '⚡ Mechanical Engineering',
    value: 'Mechanical Engineering',
    category: 'Engineering & Robotics',
    keywords: ['mechanical', 'thermodynamics', 'fluid dynamics', 'solid mechanics', 'cad'],
  },
  {
    id: 'sub_elec_eng',
    label: '🔌 Electrical & Electronics Eng',
    value: 'Electrical Engineering',
    category: 'Engineering & Robotics',
    keywords: ['electrical', 'electronics', 'vlsi', 'circuits', 'signal processing', 'telecommunications'],
  },
  {
    id: 'sub_bio_eng',
    label: '🧬 Biomedical & Bioengineering',
    value: 'Biomedical Engineering',
    category: 'Engineering & Robotics',
    keywords: ['biomedical', 'bioengineering', 'biomechanics', 'medical devices', 'prosthetics'],
  },
  {
    id: 'sub_civil_eng',
    label: '🏗️ Civil & Structural Eng',
    value: 'Civil Engineering',
    category: 'Engineering & Robotics',
    keywords: ['civil', 'structural', 'infrastructure', 'transportation', 'geotechnical'],
  },
  {
    id: 'sub_chem_materials',
    label: '🧪 Chemical & Materials Science',
    value: 'Chemical Engineering',
    category: 'Engineering & Robotics',
    keywords: ['chemical', 'materials science', 'nanomaterials', 'polymers', 'metallurgy'],
  },
  {
    id: 'sub_aerospace',
    label: '🚀 Aerospace & Astronautics',
    value: 'Aerospace Engineering',
    category: 'Engineering & Robotics',
    keywords: ['aerospace', 'aeronautical', 'propulsion', 'aviation', 'spacecraft'],
  },
  {
    id: 'sub_enviro_eng',
    label: '🌱 Environmental & Clean Energy',
    value: 'Environmental Engineering',
    category: 'Engineering & Robotics',
    keywords: ['environmental', 'clean energy', 'renewable', 'sustainability', 'climate engineering'],
  },

  // 4. Life Sciences, Medicine & Healthcare
  {
    id: 'sub_biotech',
    label: '🧬 Biotechnology & Genomics',
    value: 'Biotechnology',
    category: 'Life Sciences & Medicine',
    keywords: ['biotechnology', 'genomics', 'genetics', 'crispr', 'bio', 'wyss institute'],
  },
  {
    id: 'sub_mol_bio',
    label: '🔬 Molecular & Cellular Biology',
    value: 'Molecular Biology',
    category: 'Life Sciences & Medicine',
    keywords: ['molecular', 'cell biology', 'biochemistry', 'immunology', 'microbiology'],
  },
  {
    id: 'sub_public_health',
    label: '🏥 Public Health & Epidemiology',
    value: 'Public Health',
    category: 'Life Sciences & Medicine',
    keywords: ['public health', 'epidemiology', 'global health', 'healthcare policy', 'biostatistics'],
  },
  {
    id: 'sub_neuroscience',
    label: '🧠 Neuroscience & Cognitive Sci',
    value: 'Neuroscience',
    category: 'Life Sciences & Medicine',
    keywords: ['neuroscience', 'cognitive science', 'neurobiology', 'brain research'],
  },
  {
    id: 'sub_pharmacy',
    label: '💊 Pharmacy & Pharmacology',
    value: 'Pharmacology',
    category: 'Life Sciences & Medicine',
    keywords: ['pharmacy', 'pharmacology', 'drug discovery', 'pharmaceutical', 'toxicology'],
  },

  // 5. Business, Economics & Management
  {
    id: 'sub_economics',
    label: '📈 Economics & Econometrics',
    value: 'Economics',
    category: 'Business & Economics',
    keywords: ['economics', 'econometrics', 'macroeconomics', 'microeconomics', 'development economics'],
  },
  {
    id: 'sub_finance',
    label: '💳 Finance & FinTech',
    value: 'Finance',
    category: 'Business & Economics',
    keywords: ['finance', 'fintech', 'banking', 'investment', 'quantitative finance'],
  },
  {
    id: 'sub_mgmt_analytics',
    label: '💼 Business Analytics & MBA',
    value: 'Business Analytics',
    category: 'Business & Economics',
    keywords: ['business analytics', 'management', 'mba', 'business administration', 'operations'],
  },
  {
    id: 'sub_marketing',
    label: '🎯 Marketing & Consumer Behavior',
    value: 'Marketing',
    category: 'Business & Economics',
    keywords: ['marketing', 'consumer behavior', 'digital marketing', 'market research'],
  },
  {
    id: 'sub_supply_chain',
    label: '📦 Supply Chain & Operations',
    value: 'Supply Chain',
    category: 'Business & Economics',
    keywords: ['supply chain', 'logistics', 'operations management', 'procurement'],
  },

  // 6. Social Sciences, Policy & Law
  {
    id: 'sub_public_policy',
    label: '🏛️ Public Policy & Governance',
    value: 'Public Policy',
    category: 'Social Sciences & Law',
    keywords: ['public policy', 'policy', 'governance', 'public administration', 'social policy'],
  },
  {
    id: 'sub_law',
    label: '⚖️ Law & Legal Studies',
    value: 'Law',
    category: 'Social Sciences & Law',
    keywords: ['law', 'legal studies', 'international law', 'human rights', 'llm', 'jurisprudence'],
  },
  {
    id: 'sub_intl_relations',
    label: '🌐 International Relations',
    value: 'International Relations',
    category: 'Social Sciences & Law',
    keywords: ['international relations', 'diplomacy', 'foreign affairs', 'global affairs'],
  },
  {
    id: 'sub_psychology',
    label: '🧩 Psychology & Behavioral Sci',
    value: 'Psychology',
    category: 'Social Sciences & Law',
    keywords: ['psychology', 'behavioral science', 'clinical psychology', 'cognitive psychology'],
  },
  {
    id: 'sub_media_comm',
    label: '📰 Media, Journalism & Comms',
    value: 'Media Studies',
    category: 'Social Sciences & Law',
    keywords: ['journalism', 'communication', 'media studies', 'mass media'],
  },
  {
    id: 'sub_sociology',
    label: '👥 Sociology & Cultural Studies',
    value: 'Sociology',
    category: 'Social Sciences & Law',
    keywords: ['sociology', 'anthropology', 'cultural studies', 'social development'],
  },

  // 7. Physical & Natural Sciences
  {
    id: 'sub_physics',
    label: '🔭 Physics & Astrophysics',
    value: 'Physics',
    category: 'Physical & Natural Sciences',
    keywords: ['physics', 'astronomy', 'astrophysics', 'cavendish', 'quantum physics', 'condensed matter'],
  },
  {
    id: 'sub_math_stats',
    label: '📐 Mathematics & Statistics',
    value: 'Mathematics',
    category: 'Physical & Natural Sciences',
    keywords: ['mathematics', 'statistics', 'applied math', 'data analysis', 'algebra'],
  },
  {
    id: 'sub_chemistry',
    label: '⚗️ Chemistry & Biochemistry',
    value: 'Chemistry',
    category: 'Physical & Natural Sciences',
    keywords: ['chemistry', 'organic chemistry', 'biochemistry', 'analytical chemistry'],
  },
  {
    id: 'sub_earth_climate',
    label: '🌍 Earth & Climate Sciences',
    value: 'Earth Sciences',
    category: 'Physical & Natural Sciences',
    keywords: ['earth science', 'geology', 'climate', 'oceanography', 'meteorology', 'environmental science'],
  },
];

/**
 * Returns formatted options for CustomDropdown with category metadata
 */
export const getSubjectOptions = (): DropdownOption[] => {
  return [
    {
      label: '🌐 All Fields & Disciplines',
      value: 'ALL',
      category: 'General',
    },
    ...ACADEMIC_SUBJECTS.map((sub) => ({
      label: sub.label,
      value: sub.value,
      category: sub.category,
    })),
  ];
};

/**
 * Match a target text and tags with selected subjects
 */
export const matchesSelectedSubjects = (
  text: string,
  tags: string[],
  selectedSubjects: string[]
): boolean => {
  if (selectedSubjects.length === 0 || selectedSubjects.includes('ALL')) {
    return true;
  }

  const normalizedText = (text + ' ' + tags.join(' ')).toLowerCase();

  return selectedSubjects.some((subjVal) => {
    const targetVal = subjVal.toLowerCase();
    
    // Check if the exact value matches in text or tags
    if (tags.some((t) => t.toLowerCase() === targetVal || t.toLowerCase().includes(targetVal))) {
      return true;
    }

    // Look up the subject configuration to check specialized keywords
    const subjectItem = ACADEMIC_SUBJECTS.find((s) => s.value.toLowerCase() === targetVal);
    if (subjectItem) {
      return subjectItem.keywords.some((kw) => normalizedText.includes(kw.toLowerCase()));
    }

    // Generic fallback keyword match
    return normalizedText.includes(targetVal);
  });
};
