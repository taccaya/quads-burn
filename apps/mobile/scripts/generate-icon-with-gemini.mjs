#!/usr/bin/env node

import { GoogleGenAI, Modality } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3-pro-image-preview';
const API_KEY = process.env.GEMINI_API_KEY?.trim();
const CWD = process.cwd();
const DEFAULT_PROMPT_PATH = path.resolve(CWD, 'assets/icon-prompt.txt');
const OUTPUT_PATH = path.resolve(
  CWD,
  process.env.ICON_OUTPUT_PATH?.trim() || 'assets/icon.generated.png'
);

function logError(message) {
  process.stderr.write(`${message}\n`);
}

async function resolvePrompt() {
  const fromArgs = process.argv.slice(2).join(' ').trim();
  if (fromArgs.length > 0) {
    return fromArgs;
  }

  try {
    const fromFile = await fs.readFile(DEFAULT_PROMPT_PATH, 'utf8');
    const value = fromFile.trim();
    if (value.length > 0) {
      return value;
    }
  } catch {
    return '';
  }

  return '';
}

async function main() {
  if (!API_KEY) {
    logError('GEMINI_API_KEY is not set. Export it before running this script.');
    process.exit(1);
  }

  const prompt = await resolvePrompt();
  if (!prompt) {
    logError(
      `No prompt found. Pass a prompt argument or create ${DEFAULT_PROMPT_PATH} with prompt text.`
    );
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey: API_KEY });
  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE]
    }
  });

  const imagePart = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .find((part) => Boolean(part.inlineData?.data));

  if (!imagePart?.inlineData?.data) {
    const fallbackText = response.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text)
      .filter((text) => typeof text === 'string' && text.trim().length > 0)
      .join('\n');

    logError('Gemini response did not include image data.');
    if (fallbackText) {
      logError(`Model output:\n${fallbackText}`);
    }
    process.exit(1);
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, Buffer.from(imagePart.inlineData.data, 'base64'));

  process.stdout.write(`Icon generated: ${OUTPUT_PATH}\n`);
  process.stdout.write(`Model: ${MODEL}\n`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(`Failed to generate icon: ${message}`);
  process.exit(1);
});
