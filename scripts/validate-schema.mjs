import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(await readFile(new URL('../prototype/spacekit/trajectory-schema.json', import.meta.url)));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
export const validateTrajectory = ajv.compile(schema);

// With no arguments, validate the checked-in example. Explicit paths are relative to cwd.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = process.argv.slice(2);
  const inputs = paths.length ? paths : [new URL('../prototype/spacekit/schema-example.json', import.meta.url)];
  for (const input of inputs) {
    try {
      const value = JSON.parse(await readFile(input, 'utf8'));
      if (!validateTrajectory(value)) {
        console.error(`${input}: ${ajv.errorsText(validateTrajectory.errors, { separator: '\n' })}`);
        process.exitCode = 1;
      } else {
        console.log(`${input}: valid`);
      }
    } catch (error) {
      console.error(`${input}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
