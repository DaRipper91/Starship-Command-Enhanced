// scripts/fetch-schema.mjs
import fs from 'fs/promises';
import path from 'path';

const SCHEMA_URL = 'https://starship.rs/config-schema.json';
const OUTPUT_DIR = 'src/generated';
const OUTPUT_FILE = 'module-definitions.json';

/**
 * Transforms the raw Starship JSON schema into a simplified format for the UI.
 * @param {any} schema The raw JSON schema.
 * @returns {Array<any>} A simplified array of module definitions.
 */
function transformSchema(schema) {
  const definitions = schema.$defs;
  const topLevelProps = schema.properties;
  const modules = [];

  for (const key in topLevelProps) {
    const prop = topLevelProps[key];
    const ref = prop.$ref;

    if (ref && ref.startsWith('#/$defs/')) {
      const defName = ref.substring('#/$defs/'.length);
      const definition = definitions[defName];

      if (definition && definition.properties) {
        const module = {
          name: key,
          title: definition.title || key,
          description: definition.description || '',
          properties: Object.entries(definition.properties).map(
            ([propKey, propValue]) => ({
              name: propKey,
              description: propValue.description || '',
              type: propValue.type,
              default: propValue.default,
            }),
          ),
        };
        modules.push(module);
      }
    }
  }

  // Also add top-level configuration properties that are not modules
  const topLevelNonModuleProps = {};
  for (const key in topLevelProps) {
    const prop = topLevelProps[key];
    if (!prop.$ref) {
      topLevelNonModuleProps[key] = {
        description: prop.description || '',
        type: prop.type,
        default: prop.default,
      };
    }
  }

  modules.push({
    name: 'config',
    title: 'Top-Level Config',
    description: 'Global configuration settings for Starship.',
    properties: Object.entries(topLevelNonModuleProps).map(
      ([propKey, propValue]) => ({
        name: propKey,
        description: propValue.description || '',
        type: propValue.type,
        default: propValue.default,
      }),
    ),
  });

  return modules.sort((a, b) => a.title.localeCompare(b.title));
}

async function main() {
  try {
    console.log(`Fetching schema from ${SCHEMA_URL}...`);
    const response = await fetch(SCHEMA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const schema = await response.json();
    console.log('Schema fetched successfully.');

    console.log('Transforming schema...');
    const transformedData = transformSchema(schema);

    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(transformedData, null, 2));
    console.log(`Transformed schema saved to ${outputPath}`);
  } catch (error) {
    console.error('Failed to fetch or process schema:', error);
    process.exit(1);
  }
}

main();
