import mammoth from 'mammoth';

// pdf-parse v2 API
const pdfParse = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => {
    getText: () => Promise<{ text: string }>;
  };
};

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  const parser = new pdfParse.PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  return pdfData.text?.trim() || '';
};

export const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || '';
};

export const extractResumeText = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  if (
    mimeType === 'application/pdf' ||
    mimeType === 'application/x-pdf'
  ) {
    return extractTextFromPdf(buffer);
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractTextFromDocx(buffer);
  }
  throw new Error('Unsupported file type. Use PDF or DOCX.');
};

export const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
