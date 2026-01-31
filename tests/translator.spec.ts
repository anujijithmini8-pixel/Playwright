import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load test data
const dataPath = path.join(__dirname, '../data/singlish_sentences.json');
interface TestData {
  id: number;
  input: string;
  type: string;
}
const testData: TestData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

test.describe('Singlish to Sinhala Translation Accuracy Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Open the website before each test
    await page.goto('/');
    // Ensure the page is loaded by checking for the Singlish input area
    await expect(page.getByPlaceholder('Input Your Singlish Text Here.')).toBeVisible();
  });

  for (const item of testData) {
    test(`Test Case ${item.id} [${item.type.toUpperCase()}]: Translate "${item.input.substring(0, 30)}${item.input.length > 30 ? '...' : ''}"`, async ({ page }) => {
      const inputLocator = page.getByPlaceholder('Input Your Singlish Text Here.');
      // Locate the output div. It's in the card with title "Sinhala".
      // We look for the card containing "Sinhala", then find the content div within it.
      // Based on HTML: <div class="panel-title mb-2">Sinhala</div><div class="w-full h-80 ..."></div>
      const outputLocator = page.locator('.card').filter({ hasText: 'Sinhala' }).locator('.whitespace-pre-wrap');

      // Enter the Singlish sentence
      await inputLocator.fill(item.input);

      // Wait for the translation to appear. 
      // Since it's likely real-time, we wait for the output to be non-empty and stable.
      // We'll give it a reasonable timeout.
      // Note: If the translation is empty (e.g. input is "?"), we might need to handle that, 
      // but usually there's some output or we wait for network idle if needed.
      // However, for "accuracy" testing, we assume there should be output.
      
      // Wait for some text to be present in the output
      await expect(outputLocator).not.toBeEmpty({ timeout: 10000 });
      
      // Wait a bit for the translation to settle (debounce)
      await page.waitForTimeout(1000); 

      const outputText = await outputLocator.innerText();

      // Log the output clearly
      console.log(`--------------------------------------------------`);
      console.log(`Test Case: ${item.id}`);
      console.log(`Type: ${item.type}`);
      console.log(`Input (Singlish): ${item.input}`);
      console.log(`Output (Sinhala): ${outputText}`);
      console.log(`--------------------------------------------------`);

      // Add the result to the test report annotations
      test.info().annotations.push({
        type: 'Translation Result',
        description: `Type: ${item.type} | Input: ${item.input} | Output: ${outputText}`,
      });

      // Assert that output is not empty (basic validation)
      if (item.input.trim().length > 0) {
        expect(outputText.trim()).toBeTruthy();
      }
    });
  }
});
