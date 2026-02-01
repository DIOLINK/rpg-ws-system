import { parse } from '@babel/parser';
import { readFileSync } from 'fs';

const files = readFileSync('/tmp/client_files.txt', 'utf-8')
  .split('\n')
  .filter(Boolean);

let passCount = 0;
let failCount = 0;
const failures = [];

console.log(`Validando ${files.length} archivos...\n`);

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf-8');
    parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'dynamicImport'],
    });
    console.log(`✓ ${file}`);
    passCount++;
  } catch (error) {
    console.log(`✗ ${file}: ${error.message}`);
    failCount++;
    failures.push({ file, error: error.message });
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`RESUMEN DE VALIDACIÓN`);
console.log(`${'='.repeat(60)}`);
console.log(`Total archivos: ${files.length}`);
console.log(`✓ Pasaron: ${passCount}`);
console.log(`✗ Fallaron: ${failCount}`);
console.log(`${'='.repeat(60)}`);

if (failures.length > 0) {
  console.log('\nERRORES ENCONTRADOS:');
  failures.forEach(({ file, error }) => {
    console.log(`  ${file}: ${error}`);
  });
  process.exit(1);
}

process.exit(0);
