// ES Module loader implementation for Mocha tests
export async function resolve(specifier, context, next) {
  return next(specifier, context);
}

export async function load(url, context, next) {
  const result = await next(url, context);
  
  if (result.format === 'module') {
    return result;
  }
  
  // Read the file content if source is not provided
  if (!result.source) {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL(url), 'utf8');
    return {
      format: 'module',
      shortCircuit: true,
      source: source,
    };
  }
  
  return {
    format: 'module',
    shortCircuit: true,
    source: result.source,
  };
}
