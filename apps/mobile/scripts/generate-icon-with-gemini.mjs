#!/usr/bin/env node

import { GoogleGenAI, Modality } from '@google/genai';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3-pro-image-preview';
const API_KEY = process.env.GEMINI_API_KEY?.trim();
const CWD = process.cwd();
const DEFAULT_PROMPT_PATH = path.resolve(CWD, 'assets/icon-prompt.txt');
const IOS_ICON_PATH = path.resolve(CWD, 'assets/icon.png');
const ANDROID_ICON_PATH = path.resolve(CWD, 'assets/adaptive-icon.png');
const SPLASH_ICON_PATH = path.resolve(CWD, 'assets/splash-icon.png');
const FAVICON_PATH = path.resolve(CWD, 'assets/favicon.png');
const OUTPUT_PATH = path.resolve(
  CWD,
  process.env.ICON_OUTPUT_PATH?.trim() || IOS_ICON_PATH
);
const SHOULD_SYNC_ICON_ASSETS = process.env.ICON_SYNC_ASSETS?.trim() !== 'false';
const execFileAsync = promisify(execFile);

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

async function copyFileIfDifferent(fromPath, toPath) {
  if (path.resolve(fromPath) === path.resolve(toPath)) {
    return;
  }
  await fs.copyFile(fromPath, toPath);
}

async function syncIconAssets(sourcePath) {
  await copyFileIfDifferent(sourcePath, IOS_ICON_PATH);
  await copyFileIfDifferent(sourcePath, ANDROID_ICON_PATH);
  await copyFileIfDifferent(sourcePath, SPLASH_ICON_PATH);

  try {
    await execFileAsync('sips', ['-z', '48', '48', sourcePath, '--out', FAVICON_PATH]);
  } catch {
    await copyFileIfDifferent(sourcePath, FAVICON_PATH);
  }
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

  if (SHOULD_SYNC_ICON_ASSETS) {
    await syncIconAssets(OUTPUT_PATH);
  }

  process.stdout.write(`Icon generated: ${OUTPUT_PATH}\n`);
  if (SHOULD_SYNC_ICON_ASSETS) {
    process.stdout.write(`Synced icon assets: ${IOS_ICON_PATH}, ${ANDROID_ICON_PATH}, ${SPLASH_ICON_PATH}, ${FAVICON_PATH}\n`);
  }
  process.stdout.write(`Model: ${MODEL}\n`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(`Failed to generate icon: ${message}`);
  process.exit(1);
});
