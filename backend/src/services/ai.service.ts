import OpenAI from 'openai';
import { env, hasAiKey } from '../config/env';
import { prisma } from '../lib/prisma';

const getClient = (): OpenAI | null => {
  if (env.geminiApiKey && env.geminiApiKey.length > 10) {
    return new OpenAI({
      apiKey: env.geminiApiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }
  if (env.openaiApiKey?.startsWith('sk-')) {
    return new OpenAI({ apiKey: env.openaiApiKey });
  }
  return null;
};

const getModel = (): string =>
  env.geminiApiKey ? 'gemini-2.0-flash' : 'gpt-4o-mini';

export const trackTokens = async (
  userId: string | undefined,
  endpoint: string,
  tokens: number
): Promise<void> => {
  try {
    await prisma.tokenUsage.create({
      data: { userId, endpoint, tokens, model: getModel() },
    });
  } catch {
    /* non-blocking */
  }
};

export const chatCompletion = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { json?: boolean; userId?: string; endpoint?: string }
): Promise<string> => {
  const client = getClient();
  if (!client || !hasAiKey()) {
    return '';
  }

  const isGemini = !!env.geminiApiKey;
  // Try gemini-2.5-flash, gemini-2.0-flash, and fallback to gemini-1.5-flash
  const models = isGemini 
    ? ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] 
    : ['gpt-4o-mini', 'gpt-4o'];

  const retries = 3;
  const delayMs = 1500;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[AI Service] Calling chat completion (model: ${model}, attempt: ${attempt}/${retries})...`);
        const completion = await client.chat.completions.create({
          model,
          messages,
          ...(options?.json ? { response_format: { type: 'json_object' as const } } : {}),
        });

        console.log(`[AI Service] Chat completion succeeded using model: ${model}`);
        const content = completion.choices[0]?.message?.content || '';
        const tokens = completion.usage?.total_tokens || 0;
        if (options?.endpoint) {
          await trackTokens(options.userId, options.endpoint, tokens);
        }
        return content;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI Service] Chat completion failed with model ${model} (attempt ${attempt}/${retries}). Error:`, error.message || error);

        // If it's a 400 Bad Request, skip to the next model/fallback immediately
        if (error.status === 400) {
          console.error("[AI Service] 400 Bad Request. Skipping model.");
          break;
        }

        // Wait before retry
        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(2, attempt - 1);
          console.log(`[AI Service] Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  console.error("[AI Service] All models and retries failed.");
  throw lastError || new Error("AI Completion failed after all retries and fallback models");
};

export const parseResumeWithAI = async (
  resumeText: string,
  targetRole?: string,
  userId?: string
): Promise<Record<string, unknown>> => {
  const role = targetRole || 'Software Engineer';
  const prompt = `You are an expert ATS recruiter and auditor. Extract structured data from this resume and score ATS compatibility against the target role: "${role}".
Evaluate keyword match, formatting, structure, and experience impact specifically for "${role}". Produce an objective, dynamic ATS score (0-100) reflecting how well this resume matches "${role}" (do not give generic high scores; be critical and 99% accurate).

Return JSON only:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [{"title":"","company":"","duration":"","bullets":["string"]}],
  "education": [{"degree":"","institution":"","year":""}],
  "projects": [{"name":"","description":""}],
  "certifications": ["string"],
  "summary": "string",
  "atsScore": 0-100,
  "targetRoleEvaluated": "${role}",
  "matchedSkillsForRole": ["string"],
  "missingSkillsForRole": ["string"],
  "highlightedProblems": [
    {
      "area": "string",
      "severity": "High" | "Medium" | "Low",
      "description": "string",
      "fix": "string"
    }
  ],
  "atsDetails": {
    "keywordDensity": 0-100,
    "formatting": 0-100,
    "readability": 0-100,
    "sectionStructure": 0-100,
    "skillsMatch": 0-100
  },
  "recommendations": ["string"],
  "interviewProbability": 0-100,
  "industryMatch": 0-100
}

Resume:
${resumeText.slice(0, 8000)}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, userId, endpoint: 'parse-resume' }
  );

  if (!content) {
    return getMockParseResult(resumeText, role);
  }
  try {
    return JSON.parse(content);
  } catch {
    return getMockParseResult(resumeText, role);
  }
};

export const matchJobWithAI = async (
  resumeText: string,
  jobDescription: string,
  userId?: string
): Promise<Record<string, unknown>> => {
  const prompt = `Compare resume vs job description. Return JSON:
{
  "matchPercentage": 0-100,
  "missingSkills": ["string"],
  "matchingKeywords": ["string"],
  "recommendations": ["string"],
  "semanticScore": 0-100
}

Resume: ${resumeText.slice(0, 4000)}
Job: ${jobDescription.slice(0, 4000)}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, userId, endpoint: 'job-match' }
  );
  if (!content) return getMockMatchResult();
  try {
    return JSON.parse(content);
  } catch {
    return getMockMatchResult();
  }
};

export const generateCoverLetterAI = async (
  params: {
    resumeText: string;
    jobDescription: string;
    companyName?: string;
    jobTitle?: string;
    tone?: string;
  },
  userId?: string
): Promise<string> => {
  const { resumeText, jobDescription, companyName, jobTitle, tone } = params;
  const prompt = `Write a ${tone || 'professional'} cover letter for ${jobTitle || 'the role'} at ${companyName || 'the company'}.
Use the resume and job description. Output plain text only, no markdown.

Resume: ${resumeText.slice(0, 2500)}
Job: ${jobDescription.slice(0, 2500)}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { userId, endpoint: 'cover-letter' }
  );
  return (
    content ||
    'Dear Hiring Manager,\n\nI am excited to apply for this position. My experience aligns well with your requirements.\n\nSincerely,\nCandidate'
  );
};

export const improveBulletAI = async (
  bullet: string,
  context?: string,
  userId?: string
): Promise<string> => {
  const prompt = `Rewrite this resume bullet with quantified achievements and strong action verbs. Return JSON: {"improved": "string"}
Original: ${bullet}
Context: ${context || 'general'}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, userId, endpoint: 'improve-bullet' }
  );
  if (!content) {
    return `Delivered measurable outcomes by ${bullet.toLowerCase()}, improving team efficiency by 25%.`;
  }
  try {
    const parsed = JSON.parse(content);
    return parsed.improved || bullet;
  } catch {
    return bullet;
  }
};

export const careerChatAI = async (
  messages: { role: string; content: string }[],
  resumeContext?: string,
  userId?: string
): Promise<string> => {
  const systemContent = `You are AI ResumeIQ, an expert career coach. Be concise, actionable, and encouraging.${
    resumeContext ? `\nUser resume context:\n${resumeContext.slice(0, 2000)}` : ''
  }`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    { userId, endpoint: 'chat' }
  );

  return (
    content ||
    'Add your GEMINI_API_KEY or OPENAI_API_KEY to enable the AI career assistant.'
  );
};

export const improveResumeAI = async (
  resumeText: string,
  targetRole?: string,
  userId?: string
): Promise<Record<string, any>> => {
  const role = targetRole || 'Software Engineer';
  const prompt = `You are a professional ATS resume optimizer and senior recruiter. Your goal is to take a candidate's resume and improve it to match a target role: "${role}".
Identify key sections, especially "Experience", "Projects", "Summary", and "Skills". 
Rewrite weak bullets into quantified achievements, add relevant keywords for "${role}", improve formatting/clarity, and format the results.

Return strictly a JSON object:
{
  "improvedText": "Full text of the improved resume. Keep the structure clean and professional, formatted nicely.",
  "changes": [
    {
      "section": "Summary" | "Experience" | "Projects" | "Skills" | "Other",
      "original": "The original line or bullet point from the resume that needs improvement",
      "improved": "The newly rewritten line or bullet point, making it quantified, using active verbs, and targeting the role",
      "reason": "Explanation of why the change was made and how it helps the ATS score"
    }
  ]
}

Resume text:
${resumeText.slice(0, 6000)}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, userId, endpoint: 'improve-resume' }
  );

  if (!content) return getMockImproveResult(resumeText, role);
  try {
    return JSON.parse(content);
  } catch {
    return getMockImproveResult(resumeText, role);
  }
};

function getMockImproveResult(text: string, targetRole: string): Record<string, any> {
  return {
    improvedText: `SUMMARY\nResults-driven ${targetRole} with experience designing and implementing high-performance applications. Proven track record of optimizing systems and collaborating with cross-functional teams.\n\nEXPERIENCE\nLead Developer | Tech Innovations\n- Engineered and launched a microservices dashboard utilizing React and Node.js, reducing server load by 35%.\n- Streamlined deployment workflows by implementing automated CI/CD pipelines, accelerating delivery speed by 20%.\n\nSKILLS\nJavaScript, React, Node.js, TypeScript, SQL, Docker, AWS, Git.`,
    changes: [
      {
        section: "Summary",
        original: "A summary of my experience in software developer role.",
        improved: `Results-driven ${targetRole} with experience designing and implementing high-performance applications. Proven track record of optimizing systems and collaborating with cross-functional teams.`,
        reason: "Strengthened professional summary to use executive language and target the role."
      },
      {
        section: "Experience",
        original: "Worked on frontend and backend using React and Node.",
        improved: "Engineered and launched a microservices dashboard utilizing React and Node.js, reducing server load by 35%.",
        reason: "Quantified impact with metrics, used active verbs, and specified the project scope."
      },
      {
        section: "Experience",
        original: "Helped with deployments.",
        improved: "Streamlined deployment workflows by implementing automated CI/CD pipelines, accelerating delivery speed by 20%.",
        reason: "Transformed passive description into a strong, technical achievement with a metric."
      }
    ]
  };
}

function getMockParseResult(text: string, targetRole?: string): Record<string, unknown> {
  const words = text.split(/\s+/).filter(Boolean);
  const score = Math.min(95, Math.max(45, 50 + Math.floor(words.length / 20)));
  const role = targetRole || 'Software Engineer';
  return {
    name: 'Candidate',
    email: 'candidate@email.com',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL'],
    experience: [{ title: role, company: 'Tech Co', duration: '2 yrs' }],
    education: [{ degree: 'BS Computer Science', institution: 'University' }],
    projects: [],
    certifications: [],
    atsScore: score,
    targetRoleEvaluated: role,
    matchedSkillsForRole: ['React', 'JavaScript'],
    missingSkillsForRole: ['Docker', 'AWS'],
    highlightedProblems: [
      {
        area: 'Experience',
        severity: 'High',
        description: 'No quantified metrics found in experience bullet points.',
        fix: 'Add numbers or percentages to show the scale and impact of your work.'
      }
    ],
    atsDetails: {
      keywordDensity: score - 5,
      formatting: score,
      readability: score + 2,
      sectionStructure: score - 3,
      skillsMatch: score - 8,
    },
    recommendations: [
      'Add more quantified achievements to experience bullets',
      'Increase keyword relevance for target roles',
      'Strengthen projects section with measurable impact',
    ],
    interviewProbability: score - 10,
    industryMatch: score - 5,
  };
}

function getMockMatchResult(): Record<string, unknown> {
  return {
    matchPercentage: 68,
    missingSkills: ['Docker', 'Kubernetes', 'GraphQL'],
    matchingKeywords: ['React', 'TypeScript', 'Node.js', 'API'],
    recommendations: ['Highlight cloud deployment experience', 'Add missing DevOps keywords if applicable'],
    semanticScore: 72,
  };
}

export const generateResumeLatexAI = async (
  resumeText: string,
  userId?: string
): Promise<string> => {
  const prompt = `You are a professional resume writer and expert LaTeX developer. Your task is to generate complete, compiles-successfully LaTeX code for a resume based on the provided resume text.
Use a clean, standard, modern single-column layout (similar to the popular Jake's Resume template on Overleaf).
Ensure:
1. The LaTeX code is complete and syntactically correct.
2. Special characters like &, %, $, _, #, etc. are properly escaped (e.g., \\&, \\%, \\$, \\_, \\#).
3. The output contains ONLY valid LaTeX code. Do NOT wrap it in markdown code blocks like \`\`\`latex or \`\`\`. Your output will be saved directly to a file, so it must start with \\documentclass and end with \\end{document}.

Resume Text:
${resumeText.slice(0, 8000)}`;

  const content = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { userId, endpoint: 'generate-latex' }
  );

  if (!content) {
    return getMockLatexResult();
  }

  let cleanContent = content.trim();
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  }
  return cleanContent;
};

function getMockLatexResult(): string {
  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[2]{\\resumeItem{\\textbf{#1}}{#2}\\vspace{-4pt}}

\\renewcommand{\\labelitemii}{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Candidate Name} \\\\ \\vspace{1pt}
    \\small 123-456-7890 $|$ \\href{mailto:candidate@email.com}{candidate@email.com} $|$ 
    \\href{https://linkedin.com/in/candidate}{linkedin.com/in/candidate} $|$
    \\href{https://github.com/candidate}{github.com/candidate}
\\end{center}

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University of Technology}{City, State}
      {Bachelor of Science in Computer Science; GPA: 3.8}{2020 -- 2024}
  \\resumeSubHeadingListEnd

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Tech Innovations Inc.}{San Francisco, CA}
      {Software Engineer Intern}{Summer 2023}
      \\resumeItemListStart
        \\resumeItem{Engineered and launched a microservices dashboard utilizing React and Node.js, reducing server load by 35\\%.}
        \\resumeItem{Streamlined deployment workflows by implementing automated CI/CD pipelines, accelerating delivery speed by 20\\%.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: JavaScript, TypeScript, Python, HTML/CSS, SQL} \\\\
     \\textbf{Frameworks}{: React, Node.js, Next.js, Express} \\\\
     \\textbf{Tools}{: Git, Docker, AWS, VS Code}
    }}
 \\end{itemize}

\\end{document}`;
}

export { hasAiKey };

