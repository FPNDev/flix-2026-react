/**
 * Lists every component or hook React Compiler bails out on, with the reason.
 * A bailout leaves the whole function uncompiled (no memoization) without any
 * build warning.
 *
 * Usage: node scripts/check-react-compiler.js [glob ...]
 * Default glob: src/**\/*.{ts,tsx}
 * Exits with 1 when any function failed to compile.
 */
import { transformFileAsync } from '@babel/core';
import { globSync } from 'node:fs';
import { relative, join } from 'node:path';

const patterns = process.argv.slice(2);
const files = globSync(
  patterns.length
    ? patterns.map((pattern) => join(import.meta.dirname, '..', pattern))
    : [join(import.meta.dirname, '..', 'src/**/*.{ts,tsx}')],
).filter(
  (file) =>
    (!file.endsWith('.d.ts') && file.endsWith('.ts')) || file.endsWith('.tsx'),
);

const failures = [];
let compiled = 0;

for (const file of files) {
  const events = [];

  await transformFileAsync(file, {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript', 'jsx'] },
    plugins: [
      [
        'babel-plugin-react-compiler',
        { logger: { logEvent: (_, event) => events.push(event) } },
      ],
    ],
  });

  for (const event of events) {
    if (event.kind === 'CompileSuccess') {
      compiled++;
      continue;
    }
    if (
      !['CompileError', 'CompileSkip', 'PipelineError'].includes(event.kind)
    ) {
      continue;
    }

    const line = event.fnLoc?.start.line ?? event.loc?.start.line ?? '?';
    const reason =
      event.detail?.reason ?? event.reason ?? event.data ?? 'unknown reason';
    failures.push(
      `${relative(process.cwd(), file)}:${line} ${event.kind}\n  ${reason}`,
    );
  }
}

for (const failure of failures) {
  console.log(failure);
}
console.log(
  `\n${compiled} compiled, ${failures.length} not compiled, ${files.length} files`,
);

if (failures.length) {
  process.exitCode = 1;
}
