import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface VLMVerdict {
    passed: boolean;
    reason: string;
}

export class VLMClient {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('[VLMClient] OPENAI_API_KEY is not set in environment variables. VLM tests will be skipped or fail.');
        }

        this.openai = new OpenAI({
            apiKey: apiKey || 'dummy-key-for-instantiation',
        });
    }

    /**
     * Sends a base64 encoded screenshot to the VLM to verify physical/visual behavior.
     * @param base64Image The base64 string of the image (without the data:image/png;base64, prefix)
     * @param prompt The specific visual instructions to verify
     */
    async verifyVisualState(base64Image: string, prompt: string): Promise<VLMVerdict> {
        if (!process.env.OPENAI_API_KEY) {
            return { passed: false, reason: "OPENAI_API_KEY missing" };
        }

        try {
            console.log('[VLMClient] Sending image to VLM for verification...');
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert QA automation engineer performing Visual E2E (End-to-End) testing.
Your job is to look at UI screenshots and determine if they meet the specific visual criteria requested in the prompt.
Pay close attention to physics, positioning, offsets, and overlaps.
You must respond with ONLY a valid JSON object matching this schema, with no markdown formatting or backticks:
{
  "passed": boolean, // true if the visual criteria are met, false if there are visual bugs
  "reason": "string" // A detailed explanation of why it passed or failed based exactly on what you see in the image
}`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`,
                                    detail: "high"
                                },
                            },
                        ],
                    }
                ],
                max_tokens: 300,
                temperature: 0.0,
            });

            const content = response.choices[0]?.message?.content || '{}';

            // Try to parse the raw JSON (strip markdown if the model hallucinates it)
            const cleanJson = content.replace(/```json\n|```/g, '').trim();
            const result = JSON.parse(cleanJson) as VLMVerdict;

            return result;
        } catch (error) {
            console.error('[VLMClient] API Error:', error);
            return {
                passed: false,
                reason: `VLM API request failed: ${(error as Error).message}`
            };
        }
    }
}
