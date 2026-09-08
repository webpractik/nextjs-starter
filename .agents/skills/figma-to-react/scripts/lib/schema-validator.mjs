import { readFile } from 'node:fs/promises';

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isJsonEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => isJsonEqual(item, right[index]))
    );
  }

  if (!isObject(left) || !isObject(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => hasOwn(right, key) && isJsonEqual(left[key], right[key]))
  );
}

function canonicalJsonKey(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return `array:[${value.map(canonicalJsonKey).join(',')}]`;
  }
  if (isObject(value)) {
    return `object:{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJsonKey(value[key])}`)
      .join(',')}}`;
  }
  if (typeof value === 'number') {
    return `number:${Object.is(value, -0) ? '0' : String(value)}`;
  }
  return `${typeof value}:${JSON.stringify(value)}`;
}

function matchesType(value, type) {
  switch (type) {
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isObject(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

function addDiagnostic(diagnostics, keyword, path, message) {
  diagnostics.push({ id: `schema.${keyword}`, path, message });
}

function propertyPath(path, property) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property)
    ? `${path}.${property}`
    : `${path}[${JSON.stringify(property)}]`;
}

function resolveLocalRef(rootSchema, ref) {
  const match = /^#\/\$defs\/([^/]+)$/.exec(ref);
  if (!match || !isObject(rootSchema.$defs) || !hasOwn(rootSchema.$defs, match[1])) {
    return undefined;
  }

  return rootSchema.$defs[match[1]];
}

function visit(value, schema, rootSchema, path, diagnostics, activeRefs) {
  if (!isObject(schema)) {
    return;
  }

  if (hasOwn(schema, '$ref')) {
    const referencedSchema =
      typeof schema.$ref === 'string' ? resolveLocalRef(rootSchema, schema.$ref) : undefined;

    if (referencedSchema === undefined || activeRefs.has(schema.$ref)) {
      addDiagnostic(diagnostics, 'ref', path, `Unsupported or unresolved reference: ${schema.$ref}`);
      return;
    }

    const nextActiveRefs = new Set(activeRefs);
    nextActiveRefs.add(schema.$ref);
    visit(value, referencedSchema, rootSchema, path, diagnostics, nextActiveRefs);
  }

  if (hasOwn(schema, 'type')) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowedTypes.some((type) => matchesType(value, type))) {
      addDiagnostic(
        diagnostics,
        'type',
        path,
        `Expected ${allowedTypes.map((type) => JSON.stringify(type)).join(' or ')}.`,
      );
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => isJsonEqual(value, candidate))) {
    addDiagnostic(diagnostics, 'enum', path, 'Value is not one of the allowed enum values.');
  }

  if (hasOwn(schema, 'const') && !isJsonEqual(value, schema.const)) {
    addDiagnostic(diagnostics, 'const', path, 'Value does not match the required constant.');
  }

  if (typeof value === 'string') {
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      addDiagnostic(diagnostics, 'pattern', path, `String does not match pattern ${schema.pattern}.`);
    }

    const length = [...value].length;
    if (typeof schema.minLength === 'number' && length < schema.minLength) {
      addDiagnostic(diagnostics, 'minLength', path, `String must contain at least ${schema.minLength} characters.`);
    }
    if (typeof schema.maxLength === 'number' && length > schema.maxLength) {
      addDiagnostic(diagnostics, 'maxLength', path, `String must contain at most ${schema.maxLength} characters.`);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      addDiagnostic(diagnostics, 'minimum', path, `Number must be at least ${schema.minimum}.`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      addDiagnostic(diagnostics, 'maximum', path, `Number must be at most ${schema.maximum}.`);
    }
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
      addDiagnostic(
        diagnostics,
        'exclusiveMinimum',
        path,
        `Number must be greater than ${schema.exclusiveMinimum}.`,
      );
    }
    if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
      addDiagnostic(
        diagnostics,
        'exclusiveMaximum',
        path,
        `Number must be less than ${schema.exclusiveMaximum}.`,
      );
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      addDiagnostic(diagnostics, 'minItems', path, `Array must contain at least ${schema.minItems} items.`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      addDiagnostic(diagnostics, 'maxItems', path, `Array must contain at most ${schema.maxItems} items.`);
    }
    if (schema.uniqueItems === true) {
      const uniqueItems = new Set();
      let duplicateFound = false;
      for (const item of value) {
        const key = canonicalJsonKey(item);
        if (uniqueItems.has(key)) {
          duplicateFound = true;
          break;
        }
        uniqueItems.add(key);
      }
      if (duplicateFound) {
        addDiagnostic(diagnostics, 'uniqueItems', path, 'Array items must be unique.');
      }
    }

    if (isObject(schema.items)) {
      value.forEach((item, index) => {
        visit(item, schema.items, rootSchema, `${path}[${index}]`, diagnostics, new Set());
      });
    }
  }

  if (isObject(value)) {
    const properties = isObject(schema.properties) ? schema.properties : {};

    if (Array.isArray(schema.required)) {
      for (const property of schema.required) {
        if (typeof property === 'string' && !hasOwn(value, property)) {
          addDiagnostic(diagnostics, 'required', path, `Missing required property ${JSON.stringify(property)}.`);
        }
      }
    }

    for (const property of Object.keys(value)) {
      if (!hasOwn(properties, property) && schema.additionalProperties === false) {
        addDiagnostic(
          diagnostics,
          'additionalProperties',
          propertyPath(path, property),
          `Unexpected property ${JSON.stringify(property)}.`,
        );
      }
    }

    for (const property of Object.keys(properties)) {
      if (hasOwn(value, property)) {
        visit(value[property], properties[property], rootSchema, propertyPath(path, property), diagnostics, new Set());
      }
    }

    if (isObject(schema.additionalProperties)) {
      for (const property of Object.keys(value)) {
        if (!hasOwn(properties, property)) {
          visit(
            value[property],
            schema.additionalProperties,
            rootSchema,
            propertyPath(path, property),
            diagnostics,
            new Set(),
          );
        }
      }
    }
  }
}

export function validateSchema(value, schema, { path = '$' } = {}) {
  const diagnostics = [];
  visit(value, schema, schema, path, diagnostics, new Set());
  return diagnostics;
}

export async function loadJsonDocument(filePath) {
  const source = await readFile(filePath, 'utf8');
  return JSON.parse(source);
}
