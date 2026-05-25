import { prisma } from '../lib/prisma';

/** Simple bag-of-words embedding for semantic search (production: swap for OpenAI/Pinecone) */
export const textToVector = (text: string, dims = 128): number[] => {
  const vector = new Array(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dims;
    vector[idx] += 1;
  }

  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return Math.max(0, Math.min(1, dot));
};

export const storeResumeEmbedding = async (
  resumeId: string,
  text: string
): Promise<void> => {
  const vector = textToVector(text);
  await prisma.resumeEmbedding.upsert({
    where: { resumeId },
    create: { resumeId, vector },
    update: { vector },
  });
};

export const semanticMatchScore = async (
  resumeText: string,
  jobDescription: string
): Promise<number> => {
  const resumeVec = textToVector(resumeText);
  const jobVec = textToVector(jobDescription);
  return Math.round(cosineSimilarity(resumeVec, jobVec) * 100);
};
