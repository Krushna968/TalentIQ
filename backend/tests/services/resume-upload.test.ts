import { describe, expect, it } from 'vitest';
import { extractResumeText } from '../../src/services/resume-upload.service.js';

describe('extractResumeText', () => {
  it('extracts a text resume without retaining the uploaded file', async () => {
    const result = await extractResumeText({
      originalname: 'Krushna-Rasal-Resume.txt',
      buffer: Buffer.from('Experience\nBuilt a React application that improved delivery time by 42%.'),
    } as Express.Multer.File);

    expect(result.format).toBe('txt');
    expect(result.name).toBe('Krushna-Rasal-Resume.txt');
    expect(result.text).toContain('improved delivery time by 42%');
  });

  it('rejects unsupported resume types', async () => {
    await expect(extractResumeText({ originalname: 'resume.png', buffer: Buffer.from('image') } as Express.Multer.File)).rejects.toThrow('PDF, DOCX, or TXT');
  });
});