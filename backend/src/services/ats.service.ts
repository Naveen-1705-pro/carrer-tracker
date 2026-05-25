const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'designed', 'developed',
  'drove', 'engineered', 'implemented', 'improved', 'increased', 'launched',
  'led', 'managed', 'optimized', 'reduced', 'scaled', 'streamlined',
];

const SECTION_KEYWORDS = [
  'experience', 'education', 'skills', 'projects', 'certifications',
  'summary', 'objective', 'work history',
];

export interface AtsBreakdown {
  overall: number;
  keywordDensity: number;
  formatting: number;
  readability: number;
  sectionStructure: number;
  actionVerbs: number;
  suggestions: string[];
}

export const computeAtsScore = (text: string): AtsBreakdown => {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Keyword density (tech/business terms frequency)
  const techTerms = [
    'javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker',
    'agile', 'api', 'data', 'cloud', 'leadership', 'management',
  ];
  const termHits = techTerms.filter((t) => lower.includes(t)).length;
  const keywordDensity = Math.min(100, Math.round((termHits / 8) * 100));

  // Formatting (no excessive special chars, reasonable length)
  const specialRatio =
    (text.match(/[^\w\s@.,\-|/]/g)?.length || 0) / Math.max(text.length, 1);
  const formatting =
    specialRatio < 0.05 ? 90 : specialRatio < 0.1 ? 75 : 55;

  // Readability (sentence length, word count)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const avgSentenceLen =
    sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) /
    Math.max(sentences.length, 1);
  const readability =
    avgSentenceLen >= 8 && avgSentenceLen <= 25
      ? 85
      : avgSentenceLen < 8
        ? 70
        : 60;

  // Section structure
  const sectionsFound = SECTION_KEYWORDS.filter((s) => lower.includes(s)).length;
  const sectionStructure = Math.min(100, Math.round((sectionsFound / 5) * 100));

  // Action verbs
  const verbHits = ACTION_VERBS.filter((v) => lower.includes(v)).length;
  const actionVerbs = Math.min(100, Math.round((verbHits / 6) * 100));

  const scores = [keywordDensity, formatting, readability, sectionStructure, actionVerbs];
  const overall = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const suggestions: string[] = [];
  if (actionVerbs < 60) suggestions.push('Add more action verbs (developed, led, improved)');
  if (keywordDensity < 50) suggestions.push('Increase keyword relevance for your target role');
  if (sectionStructure < 60) suggestions.push('Add clear sections: Experience, Skills, Education');
  if (wordCount < 200) suggestions.push('Resume appears too short — expand with achievements');
  if (formatting < 70) suggestions.push('Simplify formatting for ATS parsers');
  if (readability < 70) suggestions.push('Use concise bullet points with metrics');

  return {
    overall,
    keywordDensity,
    formatting,
    readability,
    sectionStructure,
    actionVerbs,
    suggestions,
  };
};

export const mergeAtsScores = (
  ruleBased: AtsBreakdown,
  aiScore?: number
): { score: number; details: AtsBreakdown } => {
  const score = aiScore
    ? Math.round(ruleBased.overall * 0.4 + aiScore * 0.6)
    : ruleBased.overall;
  return { score, details: ruleBased };
};
