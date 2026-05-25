import { Request, Response } from 'express';
import { extractResumeText } from '../services/parser.service';
import { parseResumeWithAI } from '../services/ai.service';
import { computeAtsScore, mergeAtsScores } from '../services/ats.service';

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const targetRole = req.body.targetRole || 'Software Engineer';
    console.log('Unauthenticated upload resume target role:', targetRole);

    const text = await extractResumeText(req.file.buffer, req.file.mimetype);
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: 'Could not extract text from file' });
      return;
    }

    const ruleAts = computeAtsScore(text);
    const aiParsed = await parseResumeWithAI(text, targetRole);
    const aiScore = typeof aiParsed.atsScore === 'number' ? aiParsed.atsScore : undefined;
    const { score, details } = mergeAtsScores(ruleAts, aiScore);

    const mergedData = {
      ...aiParsed,
      atsScore: score,
      atsDetails: { ...details, ...(aiParsed.atsDetails as object) },
      ruleBasedAts: details,
    };

    res.status(200).json({
      message: 'Resume parsed successfully',
      data: mergedData,
    });
  } catch (error: any) {
    console.error('Error parsing resume in uploadController:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
};
