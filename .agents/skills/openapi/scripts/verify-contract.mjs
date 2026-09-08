#!/usr/bin/env node

import { constants as fsConstants } from 'node:fs';
import {
  lstat,
  open,
  readdir,
  realpath,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HTTP_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
  'query',
]);
const COVERAGE_HEADER = ['Requirement', 'Source', 'Target', 'Status', 'Reason'];
const VERIFICATION_HEADER = ['Gate', 'Command', 'Exit status', 'Result', 'Evidence'];
const REQUIRED_VERIFICATION_GATES = [
  'Redocly config',
  'Redocly lint',
  'JSON bundle',
];
const COVERAGE_STATUSES = new Set([
  'represented',
  'documented-only',
  'not-representable',
  'conflict',
  'unknown',
]);
const SCHEMA_CHILD_KEYS = [
  'additionalProperties',
  'contains',
  'contentSchema',
  'else',
  'if',
  'items',
  'not',
  'propertyNames',
  'then',
  'unevaluatedItems',
  'unevaluatedProperties',
];
const SCHEMA_ARRAY_KEYS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const SCHEMA_MAP_KEYS = [
  '$defs',
  'definitions',
  'dependentSchemas',
  'patternProperties',
  'properties',
];
const MAX_ROOT_BYTES = 2 * 1024 * 1024;
const MAX_REPORT_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024;
const MAX_JSON_DEPTH = 256;
const MAX_JSON_CONTAINERS = 1_000_000;
const POST_INPUT_CHECK_IDS = [
  'oas.version',
  'oas.forbidden-30',
  'refs.internal',
  'operations.operation-id',
  'operations.responses',
  'paths.parameters',
  'parameters.querystring',
  'layout.new',
  'deliverables.root',
  'deliverables.redocly',
  'deliverables.coverage',
  'deliverables.verification',
  'coverage.schema',
  'coverage.blockers',
];
const READ_FLAGS = fsConstants.O_RDONLY
  | (fsConstants.O_NOFOLLOW ?? 0)
  | (fsConstants.O_NONBLOCK ?? 0);

class CliError extends Error {
  constructor(message, kind = 'usage') {
    super(message);
    this.name = 'CliError';
    this.kind = kind;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSpecificationExtension(key) {
  return typeof key === 'string' && /^x-/iu.test(key);
}

function pointerJoin(pointer, token) {
  const encoded = String(token).replaceAll('~', '~0').replaceAll('/', '~1');
  return `${pointer}/${encoded}`;
}

function location(pointer) {
  return pointer === '' ? '#' : `#${pointer}`;
}

function operationEntries(pathItem, pointer) {
  const entries = [];
  for (const [method, operation] of Object.entries(pathItem)) {
    if (HTTP_METHODS.has(method) && isObject(operation)) {
      entries.push({
        method,
        operation,
        pointer: pointerJoin(pointer, method),
      });
    }
  }
  if (isObject(pathItem.additionalOperations)) {
    for (const [method, operation] of Object.entries(pathItem.additionalOperations)) {
      if (!isObject(operation)) continue;
      entries.push({
        method,
        operation,
        pointer: pointerJoin(pointerJoin(pointer, 'additionalOperations'), method),
      });
    }
  }
  return entries;
}

function makeCheck(id, failures, successMessage) {
  if (failures.length === 0) {
    return { id, status: 'passed', message: successMessage };
  }
  return {
    id,
    status: 'failed',
    message: failures.map((failure) => failure.message).join('; '),
    locations: [...new Set(failures.map((failure) => failure.location).filter(Boolean))],
  };
}

function buildResult(mode, checks) {
  const failed = checks.filter((check) => check.status === 'failed').length;
  return {
    ok: failed === 0,
    mode,
    summary: { total: checks.length, passed: checks.length - failed, failed },
    checks,
  };
}

function failure(message, pointerOrPath) {
  return { message, location: pointerOrPath };
}

async function readRegularText(file, label, maxBytes) {
  let handle;
  try {
    const before = await lstat(file);
    if (before.isSymbolicLink() || !before.isFile()) {
      throw new Error('is not a regular file');
    }
    if (before.size > maxBytes) throw new Error(`exceeds ${maxBytes} bytes`);
    handle = await open(file, READ_FLAGS);
    const after = await handle.stat();
    if (!after.isFile() || after.dev !== before.dev || after.ino !== before.ino) {
      throw new Error('changed while opening');
    }
    if (after.size > maxBytes) throw new Error(`exceeds ${maxBytes} bytes`);
    return await handle.readFile('utf8');
  } catch (error) {
    throw new CliError(`Cannot read ${label} ${file}: ${error.message}`, 'input');
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function regularFileExists(file) {
  try {
    const stats = await lstat(file);
    return stats.isFile() && !stats.isSymbolicLink();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function directoryEntries(directory) {
  try {
    const stats = await lstat(directory);
    if (stats.isSymbolicLink() || !stats.isDirectory()) return null;
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function parseRootOpenApi(source) {
  const normalizedSource = String(source).replace(/^\uFEFF/u, '');
  if (normalizedSource.trimStart().startsWith('{')) {
    try {
      const document = JSON.parse(normalizedSource);
      if (isObject(document) && typeof document.openapi === 'string') {
        return { value: document.openapi, line: 1 };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
  const matches = [];
  for (const [index, line] of normalizedSource.split(/\r?\n/u).entries()) {
    const match = /^openapi:\s*['"]?([^\s#'"]+)['"]?\s*(?:#.*)?$/u.exec(line);
    if (match) matches.push({ value: match[1], line: index + 1 });
  }
  return matches.length === 1 ? matches[0] : undefined;
}

function parseJsonBundle(source) {
  try {
    const value = JSON.parse(source);
    if (!isObject(value)) throw new Error('root must be an object');
    return value;
  } catch (error) {
    throw new CliError(`Bundle is not valid JSON: ${error.message}`, 'input');
  }
}

function collectJsonComplexityFailures(document, file) {
  const stack = [{ value: document, depth: 0 }];
  let containers = 0;
  while (stack.length > 0) {
    const { value, depth } = stack.pop();
    if (value === null || typeof value !== 'object') continue;
    containers += 1;
    if (depth > MAX_JSON_DEPTH) {
      return [failure(`Bundle nesting exceeds ${MAX_JSON_DEPTH}`, file)];
    }
    if (containers > MAX_JSON_CONTAINERS) {
      return [failure(`Bundle contains more than ${MAX_JSON_CONTAINERS} containers`, file)];
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      if (child !== null && typeof child === 'object') stack.push({ value: child, depth: depth + 1 });
    }
  }
  return [];
}

function decodePointerToken(token) {
  let decoded;
  try {
    decoded = decodeURIComponent(token);
  } catch {
    throw new Error('invalid percent encoding');
  }
  if (/~(?:[^01]|$)/u.test(decoded)) throw new Error('invalid JSON Pointer escape');
  return decoded.replaceAll('~1', '/').replaceAll('~0', '~');
}

export function resolveInternalRef(document, reference) {
  if (reference === '#') return document;
  if (typeof reference !== 'string' || !reference.startsWith('#/')) {
    throw new Error('not an internal JSON Pointer reference');
  }
  const tokens = reference.slice(2).split('/').map(decodePointerToken);
  let current = document;
  for (const token of tokens) {
    if (!isObject(current) && !Array.isArray(current)) throw new Error('pointer traverses a scalar');
    if (!Object.hasOwn(current, token)) throw new Error(`missing token ${JSON.stringify(token)}`);
    current = current[token];
  }
  return current;
}

function resolveObject(document, value) {
  if (!isObject(value) || typeof value.$ref !== 'string' || !value.$ref.startsWith('#')) return value;
  const seen = new Set();
  const layers = [];
  let current = value;
  while (isObject(current) && typeof current.$ref === 'string' && current.$ref.startsWith('#')) {
    if (seen.has(current.$ref)) break;
    seen.add(current.$ref);
    let resolved;
    try {
      resolved = resolveInternalRef(document, current.$ref);
    } catch {
      break;
    }
    if (!isObject(resolved)) break;
    layers.push(current);
    current = resolved;
  }
  let result = isObject(current) ? { ...current } : value;
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    result = { ...result, ...layers[index] };
    delete result.$ref;
  }
  return result;
}

function withoutReference(value) {
  const local = { ...value };
  delete local.$ref;
  return local;
}

function collectInternalRefChain(document, value) {
  const references = [];
  const seen = new Set();
  let current = value;
  while (isObject(current) && typeof current.$ref === 'string' && current.$ref.startsWith('#')) {
    if (seen.has(current.$ref)) break;
    seen.add(current.$ref);
    references.push(current.$ref);
    try {
      current = resolveInternalRef(document, current.$ref);
    } catch {
      break;
    }
  }
  return references;
}

function visitSchema(schema, pointer, visitor, seen = new WeakSet(), resourceScoped = false) {
  if (!isObject(schema) || seen.has(schema)) return;
  seen.add(schema);
  const nestedResource = resourceScoped || typeof schema.$id === 'string';
  visitor(schema, pointer, { resourceScoped: nestedResource });
  for (const key of SCHEMA_CHILD_KEYS) {
    if (isObject(schema[key])) visitSchema(schema[key], pointerJoin(pointer, key), visitor, seen, nestedResource);
  }
  for (const key of SCHEMA_ARRAY_KEYS) {
    if (!Array.isArray(schema[key])) continue;
    schema[key].forEach((child, index) => visitSchema(
      child,
      pointerJoin(pointerJoin(pointer, key), index),
      visitor,
      seen,
      nestedResource,
    ));
  }
  for (const key of SCHEMA_MAP_KEYS) {
    if (!isObject(schema[key])) continue;
    for (const [name, child] of Object.entries(schema[key])) {
      visitSchema(child, pointerJoin(pointerJoin(pointer, key), name), visitor, seen, nestedResource);
    }
  }
}

function recordReference(value, pointer, contexts) {
  if (isObject(value) && typeof value.$ref === 'string') {
    contexts.references.push({ reference: value.$ref, pointer: pointerJoin(pointer, '$ref') });
  }
}

function inspectMediaType(rawMedia, pointer, contexts) {
  recordReference(rawMedia, pointer, contexts);
  const media = resolveObject(contexts.document, rawMedia);
  if (!isObject(media)) return;
  contexts.mediaTypes.push({ value: media, pointer });
  if (isObject(media.schema)) contexts.schemas.push({ value: media.schema, pointer: pointerJoin(pointer, 'schema') });
  if (isObject(media.itemSchema)) {
    contexts.schemas.push({
      value: media.itemSchema,
      pointer: pointerJoin(pointer, 'itemSchema'),
    });
  }
  if (isObject(media.examples)) {
    for (const [name, example] of Object.entries(media.examples)) {
      const examplePointer = pointerJoin(pointerJoin(pointer, 'examples'), name);
      recordReference(example, examplePointer, contexts);
      contexts.examples.push({ value: example, pointer: examplePointer });
    }
  }
  if (isObject(media.encoding)) {
    for (const [name, encoding] of Object.entries(media.encoding)) {
      inspectEncoding(
        encoding,
        pointerJoin(pointerJoin(pointer, 'encoding'), name),
        contexts,
      );
    }
  }
  if (Array.isArray(media.prefixEncoding)) {
    media.prefixEncoding.forEach((encoding, index) => inspectEncoding(
      encoding,
      pointerJoin(pointerJoin(pointer, 'prefixEncoding'), index),
      contexts,
    ));
  }
  inspectEncoding(media.itemEncoding, pointerJoin(pointer, 'itemEncoding'), contexts);
}

function inspectEncoding(encoding, pointer, contexts) {
  if (!isObject(encoding)) return;
  contexts.encodings.push({ value: encoding, pointer });
  if (isObject(encoding.headers)) {
    for (const [headerName, header] of Object.entries(encoding.headers)) {
      inspectParameterLike(
        header,
        pointerJoin(pointerJoin(pointer, 'headers'), headerName),
        contexts,
      );
    }
  }
  if (isObject(encoding.encoding)) {
    for (const [name, nested] of Object.entries(encoding.encoding)) {
      inspectEncoding(
        nested,
        pointerJoin(pointerJoin(pointer, 'encoding'), name),
        contexts,
      );
    }
  }
  if (Array.isArray(encoding.prefixEncoding)) {
    encoding.prefixEncoding.forEach((nested, index) => inspectEncoding(
      nested,
      pointerJoin(pointerJoin(pointer, 'prefixEncoding'), index),
      contexts,
    ));
  }
  inspectEncoding(
    encoding.itemEncoding,
    pointerJoin(pointer, 'itemEncoding'),
    contexts,
  );
}

function inspectContent(content, pointer, contexts) {
  if (!isObject(content)) return;
  for (const [mediaName, media] of Object.entries(content)) {
    inspectMediaType(media, pointerJoin(pointer, mediaName), contexts);
  }
}

function inspectParameterLike(rawParameter, pointer, contexts) {
  recordReference(rawParameter, pointer, contexts);
  const parameter = resolveObject(contexts.document, rawParameter);
  if (!isObject(parameter)) return;
  contexts.parameters.push({ value: parameter, pointer });
  if (isObject(parameter.schema)) contexts.schemas.push({ value: parameter.schema, pointer: pointerJoin(pointer, 'schema') });
  inspectContent(parameter.content, pointerJoin(pointer, 'content'), contexts);
  if (isObject(parameter.examples)) {
    for (const [name, example] of Object.entries(parameter.examples)) {
      const examplePointer = pointerJoin(pointerJoin(pointer, 'examples'), name);
      recordReference(example, examplePointer, contexts);
      contexts.examples.push({ value: example, pointer: examplePointer });
    }
  }
}

function inspectResponse(rawResponse, pointer, contexts) {
  recordReference(rawResponse, pointer, contexts);
  const response = resolveObject(contexts.document, rawResponse);
  if (!isObject(response)) return;
  contexts.responses.push({ value: response, pointer });
  inspectContent(response.content, pointerJoin(pointer, 'content'), contexts);
  if (isObject(response.headers)) {
    for (const [name, header] of Object.entries(response.headers)) {
      inspectParameterLike(header, pointerJoin(pointerJoin(pointer, 'headers'), name), contexts);
    }
  }
  if (isObject(response.links)) {
    for (const [name, link] of Object.entries(response.links)) {
      inspectLink(link, pointerJoin(pointerJoin(pointer, 'links'), name), contexts);
    }
  }
}

function inspectRequestBody(rawBody, pointer, contexts) {
  recordReference(rawBody, pointer, contexts);
  const body = resolveObject(contexts.document, rawBody);
  if (!isObject(body)) return;
  inspectContent(body.content, pointerJoin(pointer, 'content'), contexts);
}

function inspectLink(rawLink, pointer, contexts) {
  recordReference(rawLink, pointer, contexts);
  const link = resolveObject(contexts.document, rawLink);
  if (isObject(link?.server)) contexts.servers.push({ value: link.server, pointer: pointerJoin(pointer, 'server') });
}

function inspectServers(servers, pointer, contexts) {
  if (!Array.isArray(servers)) return;
  servers.forEach((server, index) => contexts.servers.push({ value: server, pointer: pointerJoin(pointer, index) }));
}

function collectContexts(document) {
  const contexts = {
    document,
    encodings: [],
    examples: [],
    mediaTypes: [],
    parameters: [],
    pathItems: [],
    references: [],
    responses: [],
    schemas: [],
    servers: [],
  };
  inspectServers(document.servers, '/servers', contexts);

  const activePathItems = new WeakSet();
  const activePathRefs = new Set();
  const inspectPathItem = (rawPathItem, pointer) => {
    recordReference(rawPathItem, pointer, contexts);
    if (!isObject(rawPathItem) || activePathItems.has(rawPathItem)) return;
    const references = collectInternalRefChain(document, rawPathItem);
    if (references.some((reference) => activePathRefs.has(reference))) {
      activePathItems.add(rawPathItem);
      const localPathItem = withoutReference(rawPathItem);
      if (Object.keys(localPathItem).length > 0) inspectPathItem(localPathItem, pointer);
      activePathItems.delete(rawPathItem);
      return;
    }
    activePathItems.add(rawPathItem);
    references.forEach((reference) => activePathRefs.add(reference));
    const pathItem = resolveObject(document, rawPathItem);
    if (!isObject(pathItem)) {
      activePathItems.delete(rawPathItem);
      references.forEach((reference) => activePathRefs.delete(reference));
      return;
    }
    contexts.pathItems.push({ value: pathItem, pointer });
    inspectServers(pathItem.servers, pointerJoin(pointer, 'servers'), contexts);
    if (Array.isArray(pathItem.parameters)) {
      pathItem.parameters.forEach((parameter, index) => inspectParameterLike(
        parameter,
        pointerJoin(pointerJoin(pointer, 'parameters'), index),
        contexts,
      ));
    }
    for (const {
      operation: rawOperation,
      pointer: operationPointer,
    } of operationEntries(pathItem, pointer)) {
      inspectServers(rawOperation.servers, pointerJoin(operationPointer, 'servers'), contexts);
      if (Array.isArray(rawOperation.parameters)) {
        rawOperation.parameters.forEach((parameter, index) => inspectParameterLike(
          parameter,
          pointerJoin(pointerJoin(operationPointer, 'parameters'), index),
          contexts,
        ));
      }
      inspectRequestBody(rawOperation.requestBody, pointerJoin(operationPointer, 'requestBody'), contexts);
      if (isObject(rawOperation.responses)) {
        for (const [status, rawResponse] of Object.entries(rawOperation.responses)) {
          inspectResponse(rawResponse, pointerJoin(pointerJoin(operationPointer, 'responses'), status), contexts);
        }
      }
      if (isObject(rawOperation.callbacks)) {
        for (const [callbackName, rawCallback] of Object.entries(rawOperation.callbacks)) {
          recordReference(rawCallback, pointerJoin(pointerJoin(operationPointer, 'callbacks'), callbackName), contexts);
          const callback = resolveObject(document, rawCallback);
          if (!isObject(callback)) continue;
          for (const [expression, callbackPathItem] of Object.entries(callback)) {
            if (isSpecificationExtension(expression)) continue;
            inspectPathItem(callbackPathItem, pointerJoin(pointerJoin(pointerJoin(operationPointer, 'callbacks'), callbackName), expression));
          }
        }
      }
    }
    activePathItems.delete(rawPathItem);
    references.forEach((reference) => activePathRefs.delete(reference));
  };

  for (const [pathName, pathItem] of Object.entries(isObject(document.paths) ? document.paths : {})) {
    if (!pathName.startsWith('/')) continue;
    inspectPathItem(pathItem, pointerJoin('/paths', pathName));
  }
  for (const [name, pathItem] of Object.entries(isObject(document.webhooks) ? document.webhooks : {})) {
    if (isSpecificationExtension(name)) continue;
    inspectPathItem(pathItem, pointerJoin('/webhooks', name));
  }

  const components = isObject(document.components) ? document.components : {};
  for (const [name, pathItem] of Object.entries(isObject(components.pathItems) ? components.pathItems : {})) {
    inspectPathItem(pathItem, pointerJoin('/components/pathItems', name));
  }
  for (const [name, rawCallback] of Object.entries(isObject(components.callbacks) ? components.callbacks : {})) {
    recordReference(rawCallback, pointerJoin('/components/callbacks', name), contexts);
    const callback = resolveObject(document, rawCallback);
    if (!isObject(callback)) continue;
    for (const [expression, pathItem] of Object.entries(callback)) {
      if (isSpecificationExtension(expression)) continue;
      inspectPathItem(pathItem, pointerJoin(pointerJoin('/components/callbacks', name), expression));
    }
  }
  for (const [name, schema] of Object.entries(isObject(components.schemas) ? components.schemas : {})) {
    contexts.schemas.push({ value: schema, pointer: pointerJoin('/components/schemas', name) });
  }
  for (const [name, parameter] of Object.entries(isObject(components.parameters) ? components.parameters : {})) {
    inspectParameterLike(parameter, pointerJoin('/components/parameters', name), contexts);
  }
  for (const [name, header] of Object.entries(isObject(components.headers) ? components.headers : {})) {
    inspectParameterLike(header, pointerJoin('/components/headers', name), contexts);
  }
  for (const [name, response] of Object.entries(isObject(components.responses) ? components.responses : {})) {
    inspectResponse(response, pointerJoin('/components/responses', name), contexts);
  }
  for (const [name, body] of Object.entries(isObject(components.requestBodies) ? components.requestBodies : {})) {
    inspectRequestBody(body, pointerJoin('/components/requestBodies', name), contexts);
  }
  for (const [name, example] of Object.entries(isObject(components.examples) ? components.examples : {})) {
    recordReference(example, pointerJoin('/components/examples', name), contexts);
    contexts.examples.push({ value: example, pointer: pointerJoin('/components/examples', name) });
  }
  for (const [name, scheme] of Object.entries(isObject(components.securitySchemes) ? components.securitySchemes : {})) {
    recordReference(scheme, pointerJoin('/components/securitySchemes', name), contexts);
  }
  for (const [name, link] of Object.entries(isObject(components.links) ? components.links : {})) {
    inspectLink(link, pointerJoin('/components/links', name), contexts);
  }
  for (const [name, media] of Object.entries(isObject(components.mediaTypes) ? components.mediaTypes : {})) {
    inspectMediaType(media, pointerJoin('/components/mediaTypes', name), contexts);
  }
  return contexts;
}

function collectRefFailures(document, contexts) {
  const failures = [];
  const references = [...contexts.references];
  const seenSchemas = new WeakSet();
  for (const root of contexts.schemas) {
    visitSchema(root.value, root.pointer, (schema, pointer, state) => {
      if (seenSchemas.has(schema)) return;
      seenSchemas.add(schema);
      if (!state.resourceScoped && typeof schema.$ref === 'string') {
        references.push({ reference: schema.$ref, pointer: pointerJoin(pointer, '$ref') });
      }
    });
  }
  const seen = new Set();
  for (const entry of references) {
    const key = `${entry.pointer}\u0000${entry.reference}`;
    if (seen.has(key) || (entry.reference !== '#' && !entry.reference.startsWith('#/'))) continue;
    seen.add(key);
    try {
      resolveInternalRef(document, entry.reference);
    } catch (error) {
      failures.push(failure(
        `Unresolved internal JSON Pointer $ref ${entry.reference}: ${error.message}`,
        location(entry.pointer),
      ));
    }
  }
  return failures;
}

function collectForbiddenChecks(document) {
  const contexts = collectContexts(document);
  const forbidden30 = [];
  const seenSchemas = new WeakSet();
  for (const root of contexts.schemas) {
    visitSchema(root.value, root.pointer, (schema, pointer) => {
      if (seenSchemas.has(schema)) return;
      seenSchemas.add(schema);
      if (Object.hasOwn(schema, 'nullable')) {
        forbidden30.push(failure('Schema Object uses OpenAPI 3.0 nullable', location(pointerJoin(pointer, 'nullable'))));
      }
      for (const key of ['exclusiveMinimum', 'exclusiveMaximum']) {
        if (typeof schema[key] === 'boolean') {
          forbidden30.push(failure(`Schema Object uses boolean ${key}`, location(pointerJoin(pointer, key))));
        }
      }
    });
  }
  return { forbidden30, contexts };
}

function collectOperationChecks(document) {
  const operationIdFailures = [];
  const responsesFailures = [];
  const ids = new Map();
  const operations = [];
  const activePathItems = new WeakSet();
  const activePathRefs = new Set();

  const visitPathItem = (rawPathItem, pointer, pathName, rootPath = false) => {
    if (!isObject(rawPathItem) || activePathItems.has(rawPathItem)) return;
    const references = collectInternalRefChain(document, rawPathItem);
    if (references.some((reference) => activePathRefs.has(reference))) {
      activePathItems.add(rawPathItem);
      const localPathItem = withoutReference(rawPathItem);
      if (Object.keys(localPathItem).length > 0) {
        visitPathItem(localPathItem, pointer, pathName, rootPath);
      }
      activePathItems.delete(rawPathItem);
      return;
    }
    activePathItems.add(rawPathItem);
    references.forEach((reference) => activePathRefs.add(reference));
    const pathItem = resolveObject(document, rawPathItem);
    if (!isObject(pathItem)) {
      activePathItems.delete(rawPathItem);
      references.forEach((reference) => activePathRefs.delete(reference));
      return;
    }
    for (const {
      operation,
      pointer: operationPointer,
    } of operationEntries(pathItem, pointer)) {
      operations.push({
        operation,
        operationPointer,
        pathItem,
        pathItemPointer: pointer,
        pathName,
        rootPath,
      });
      if (typeof operation.operationId !== 'string' || operation.operationId.trim() === '') {
        operationIdFailures.push(failure('Operation requires a non-empty operationId', location(pointerJoin(operationPointer, 'operationId'))));
      } else if (ids.has(operation.operationId)) {
        operationIdFailures.push(failure(`Duplicate operationId ${operation.operationId}`, location(pointerJoin(operationPointer, 'operationId'))));
        operationIdFailures.push(failure(`Duplicate operationId ${operation.operationId}`, ids.get(operation.operationId)));
      } else {
        ids.set(operation.operationId, location(pointerJoin(operationPointer, 'operationId')));
      }
      if (!isObject(operation.responses) || Object.keys(operation.responses).length === 0) {
        responsesFailures.push(failure('Operation requires non-empty responses', location(pointerJoin(operationPointer, 'responses'))));
      }
      if (isObject(operation.callbacks)) {
        for (const [callbackName, rawCallback] of Object.entries(operation.callbacks)) {
          const callback = resolveObject(document, rawCallback);
          if (!isObject(callback)) continue;
          for (const [expression, callbackPathItem] of Object.entries(callback)) {
            if (isSpecificationExtension(expression)) continue;
            visitPathItem(callbackPathItem, pointerJoin(pointerJoin(pointerJoin(operationPointer, 'callbacks'), callbackName), expression), expression, false);
          }
        }
      }
    }
    activePathItems.delete(rawPathItem);
    references.forEach((reference) => activePathRefs.delete(reference));
  };

  for (const [pathName, pathItem] of Object.entries(isObject(document.paths) ? document.paths : {})) {
    if (!pathName.startsWith('/')) continue;
    visitPathItem(pathItem, pointerJoin('/paths', pathName), pathName, true);
  }
  for (const [name, pathItem] of Object.entries(isObject(document.webhooks) ? document.webhooks : {})) {
    if (isSpecificationExtension(name)) continue;
    visitPathItem(pathItem, pointerJoin('/webhooks', name), name, false);
  }
  return { operationIdFailures, operations, responsesFailures };
}

function effectiveParameters(
  document,
  pathParameters,
  operationParameters,
  pathItemPointer,
  operationPointer,
  failures,
) {
  const map = new Map();
  const addScope = (parameters, scopePointer, override) => {
    const localKeys = new Set();
    if (!Array.isArray(parameters)) return;
    parameters.forEach((rawParameter, index) => {
      const parameter = resolveObject(document, rawParameter);
      if (!isObject(parameter) || typeof parameter.in !== 'string') return;
      if (
        parameter.in === 'querystring'
        && (typeof parameter.name !== 'string' || parameter.name.trim() === '')
      ) {
        failures.push(failure(
          'Parameter in:querystring requires a non-empty name',
          location(pointerJoin(scopePointer, index)),
        ));
        return;
      }
      const identityName = parameter.name;
      if (typeof identityName !== 'string') return;
      const key = `${parameter.in}\u0000${identityName}`;
      const parameterPointer = pointerJoin(scopePointer, index);
      if (localKeys.has(key)) {
        failures.push(failure(
          parameter.in === 'querystring'
            ? `Duplicate in:querystring parameter ${parameter.name}`
            : `Duplicate effective parameter ${parameter.in}:${parameter.name}`,
          location(parameterPointer),
        ));
      }
      localKeys.add(key);
      if (override || !map.has(key)) map.set(key, { parameter, pointer: parameterPointer });
    });
  };
  addScope(pathParameters, pointerJoin(pathItemPointer, 'parameters'), false);
  addScope(operationParameters, pointerJoin(operationPointer, 'parameters'), true);
  return map;
}

function collectPathParameterFailures(document, operations) {
  const failures = [];
  for (const entry of operations.filter((operation) => operation.rootPath)) {
    const names = [...entry.pathName.matchAll(/\{([^{}]+)\}/gu)].map((match) => match[1]);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      failures.push(failure(`Path template repeats a variable in ${entry.pathName}`, location(entry.operationPointer)));
    }
    const parameters = effectiveParameters(
      document,
      entry.pathItem.parameters,
      entry.operation.parameters,
      entry.pathItemPointer,
      entry.operationPointer,
      failures,
    );
    for (const name of uniqueNames) {
      const found = parameters.get(`path\u0000${name}`);
      if (!found) {
        failures.push(failure(`Path variable {${name}} has no effective in:path parameter`, location(entry.operationPointer)));
      } else if (found.parameter.required !== true) {
        failures.push(failure(`Path parameter ${name} must set required: true`, location(found.pointer)));
      }
    }
    for (const { parameter, pointer } of parameters.values()) {
      if (parameter.in === 'path' && !uniqueNames.has(parameter.name)) {
        failures.push(failure(`Unused path parameter ${parameter.name}`, location(pointer)));
      }
    }
  }
  return failures;
}

function collectQuerystringParameterFailures(document, operations) {
  const failures = [];
  for (const entry of operations) {
    const duplicateFailures = [];
    const parameters = effectiveParameters(
      document,
      entry.pathItem.parameters,
      entry.operation.parameters,
      entry.pathItemPointer,
      entry.operationPointer,
      duplicateFailures,
    );
    failures.push(...duplicateFailures.filter((entryFailure) => (
      entryFailure.message.includes('in:querystring')
    )));
    const effective = [...parameters.values()];
    const queryParameters = effective.filter(({ parameter }) => parameter.in === 'query');
    const querystringParameters = effective.filter(({ parameter }) => parameter.in === 'querystring');
    if (querystringParameters.length > 1) {
      failures.push(failure(
        'Operation allows at most one in:querystring parameter after inheritance',
        location(entry.operationPointer),
      ));
    }
    if (queryParameters.length > 0 && querystringParameters.length > 0) {
      failures.push(failure(
        'Operation must not mix in:query and in:querystring parameters',
        location(entry.operationPointer),
      ));
    }
    for (const { parameter, pointer } of querystringParameters) {
      const contentEntries = isObject(parameter.content)
        ? Object.keys(parameter.content)
        : [];
      if (contentEntries.length === 0) {
        failures.push(failure(
          'Parameter in:querystring requires non-empty content',
          location(pointerJoin(pointer, 'content')),
        ));
      } else if (contentEntries.length !== 1) {
        failures.push(failure(
          'Parameter in:querystring content must contain exactly one media type',
          location(pointerJoin(pointer, 'content')),
        ));
      }
      if (Object.hasOwn(parameter, 'schema')) {
        failures.push(failure(
          'Parameter in:querystring must not use schema',
          location(pointerJoin(pointer, 'schema')),
        ));
      }
    }
  }
  return [...new Map(failures.map((entryFailure) => [
    `${entryFailure.message}\u0000${entryFailure.location ?? ''}`,
    entryFailure,
  ])).values()];
}

function splitMarkdownRow(line) {
  let value = line.trim();
  if (!value.includes('|')) return null;
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  const cells = [];
  let cell = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && value[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (value[index] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += value[index];
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isSeparatorRow(cells, width) {
  return Array.isArray(cells)
    && cells.length === width
    && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function visibleMarkdownLines(source) {
  const lines = String(source).split(/\r?\n/u);
  let inComment = false;
  let fenceCharacter;
  let fenceLength = 0;
  return lines.map((line) => {
    if (fenceCharacter) {
      const closingFence = /^ {0,3}(`+|~+)\s*$/u.exec(line);
      if (closingFence && closingFence[1][0] === fenceCharacter && closingFence[1].length >= fenceLength) {
        fenceCharacter = undefined;
        fenceLength = 0;
      }
      return '';
    }

    let visible = '';
    let cursor = 0;
    while (cursor < line.length) {
      if (inComment) {
        const end = line.indexOf('-->', cursor);
        if (end === -1) return '';
        inComment = false;
        cursor = end + 3;
        continue;
      }
      const start = line.indexOf('<!--', cursor);
      if (start === -1) {
        visible += line.slice(cursor);
        break;
      }
      visible += line.slice(cursor, start);
      inComment = true;
      cursor = start + 4;
    }

    const openingFence = /^ {0,3}(`{3,}|~{3,})/u.exec(visible);
    if (openingFence) {
      fenceCharacter = openingFence[1][0];
      fenceLength = openingFence[1].length;
      return '';
    }
    if (/^(?: {4}|\t)/u.test(visible)) return '';
    return visible;
  });
}

export function parseCanonicalTable(source, expectedHeader) {
  const lines = visibleMarkdownLines(source);
  const headers = [];
  lines.forEach((line, index) => {
    const cells = splitMarkdownRow(line);
    if (cells && cells.length === expectedHeader.length && cells.every((cell, cellIndex) => cell === expectedHeader[cellIndex])) {
      headers.push(index);
    }
  });
  if (headers.length !== 1) throw new Error(`expected exactly one ${expectedHeader.join(' | ')} table`);
  const headerIndex = headers[0];
  const separator = splitMarkdownRow(lines[headerIndex + 1] ?? '');
  if (!isSeparatorRow(separator, expectedHeader.length)) throw new Error('table separator is missing or malformed');
  const rows = [];
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    if (lines[index].trim() === '') break;
    const cells = splitMarkdownRow(lines[index]);
    if (!cells) break;
    if (cells.length !== expectedHeader.length) throw new Error(`row ${index + 1} must contain ${expectedHeader.length} cells`);
    rows.push({ cells, line: index + 1 });
  }
  if (rows.length === 0) throw new Error('table must contain at least one data row');
  return rows;
}

function blankCell(value) {
  return value.trim() === '' || /^(?:—|-|n\/a)$/iu.test(value.trim());
}

function unwrapInlineCode(value) {
  const trimmed = String(value).trim();
  const match = /^(`+)(.*)\1$/u.exec(trimmed);
  return match ? match[2].trim() : trimmed;
}

function inspectCoverage(source, file, document) {
  const schemaFailures = [];
  const blockerFailures = [];
  let rows = [];
  try {
    rows = parseCanonicalTable(source, COVERAGE_HEADER);
  } catch (error) {
    schemaFailures.push(failure(error.message, file));
    return { blockerFailures, schemaFailures };
  }
  const ids = new Set();
  for (const row of rows) {
    const [requirement, sourceCell, target, status, reason] = row.cells;
    const rowLocation = `${file}:${row.line}`;
    if (blankCell(requirement)) schemaFailures.push(failure('Requirement must be non-empty', rowLocation));
    if (ids.has(requirement)) schemaFailures.push(failure(`Duplicate requirement ${requirement}`, rowLocation));
    ids.add(requirement);
    if (blankCell(sourceCell)) schemaFailures.push(failure(`Requirement ${requirement} needs Source`, rowLocation));
    if (!COVERAGE_STATUSES.has(status)) schemaFailures.push(failure(`Requirement ${requirement} has invalid Status ${status}`, rowLocation));
    if (status === 'represented' && blankCell(target)) {
      schemaFailures.push(failure(`Represented requirement ${requirement} needs Target`, rowLocation));
    } else if (status === 'represented') {
      const normalizedTarget = unwrapInlineCode(target);
      try {
        resolveInternalRef(document, normalizedTarget);
      } catch (error) {
        schemaFailures.push(failure(
          `Represented requirement ${requirement} Target ${normalizedTarget} does not resolve: ${error.message}`,
          rowLocation,
        ));
      }
    }
    if (status !== 'represented' && COVERAGE_STATUSES.has(status) && blankCell(reason)) {
      schemaFailures.push(failure(`Requirement ${requirement} with ${status} needs Reason`, rowLocation));
    }
    if (status === 'unknown' || status === 'conflict') {
      blockerFailures.push(failure(`Requirement ${requirement} remains ${status}`, rowLocation));
    }
  }
  return { blockerFailures, schemaFailures };
}

function inspectVerification(source, file, mode) {
  const failures = [];
  let rows;
  try {
    rows = parseCanonicalTable(source, VERIFICATION_HEADER);
  } catch (error) {
    return [failure(error.message, file)];
  }
  const gates = new Map();
  for (const row of rows) {
    const [gate, command, exitStatus, result, evidence] = row.cells;
    const rowLocation = `${file}:${row.line}`;
    if ([gate, command, result, evidence].some(blankCell)) failures.push(failure('Verification row requires Gate, Command, Result and Evidence', rowLocation));
    const numericExit = /^\d+$/u.test(exitStatus);
    if (!numericExit) {
      failures.push(failure('Verification Exit status must be a non-negative integer', rowLocation));
    } else if (Number(exitStatus) !== 0) {
      failures.push(failure(`Verification gate ${gate} exited with ${exitStatus}`, rowLocation));
    }
    if (result !== 'passed') failures.push(failure(`Verification gate ${gate} Result must be passed`, rowLocation));
    if (gates.has(gate)) failures.push(failure(`Duplicate verification Gate ${gate}`, rowLocation));
    else gates.set(gate, { index: gates.size, location: rowLocation });
  }

  const required = [
    ...REQUIRED_VERIFICATION_GATES,
    ...(mode === 'update' ? ['Semantic comparison'] : []),
  ];
  for (const gate of required) {
    if (!gates.has(gate)) {
      failures.push(failure(`Missing required verification Gate ${gate}`, file));
    }
  }
  for (let index = 1; index < required.length; index += 1) {
    const previous = gates.get(required[index - 1]);
    const current = gates.get(required[index]);
    if (previous && current && previous.index > current.index) {
      failures.push(failure(
        `Verification Gate ${required[index]} must appear after ${required[index - 1]}`,
        current.location,
      ));
    }
  }
  return failures;
}

function normalizeRefValue(value) {
  const withoutComment = String(value).trim().replace(/\s+#.*$/u, '').trim();
  return (withoutComment.startsWith('"') && withoutComment.endsWith('"'))
    || (withoutComment.startsWith("'") && withoutComment.endsWith("'"))
    ? withoutComment.slice(1, -1)
    : withoutComment;
}

function unquoteYamlKey(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseRootPathRefs(source) {
  const lines = String(source).split(/\r?\n/u);
  const entries = [];
  let inPaths = false;
  let current;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^paths:\s*(?:#.*)?$/u.test(line)) {
      inPaths = true;
      current = undefined;
      continue;
    }
    if (!inPaths) continue;
    if (/^(?:"[^"]+"|'[^']+'|[^\s][^:]*):\s*/u.test(line) && !/^\s/u.test(line)) break;
    const pathMatch = /^ {2}((?:"[^"]+"|'[^']+'|\/.+)):\s*(?:#.*)?$/u.exec(line);
    if (pathMatch) {
      const pathName = unquoteYamlKey(pathMatch[1]);
      if (!pathName.startsWith('/')) {
        current = undefined;
        continue;
      }
      current = {
        pathName,
        ref: undefined,
        siblingKeys: [],
        line: index + 1,
      };
      entries.push(current);
      continue;
    }
    const refMatch = /^ {4}\$ref:\s*(.+)$/u.exec(line);
    if (current && refMatch) {
      current.ref = normalizeRefValue(refMatch[1]);
      continue;
    }
    const siblingMatch = /^ {4}((?:"[^"]+"|'[^']+'|[^\s:#][^:]*)):\s*/u.exec(line);
    if (current && siblingMatch) current.siblingKeys.push(unquoteYamlKey(siblingMatch[1]));
  }
  return entries;
}

function expectedPathFilename(pathName) {
  const body = pathName.replace(/^\/+|\/+$/gu, '').replaceAll('/', '_');
  return `${body || 'root'}.yaml`;
}

async function collectLayoutFailures({ projectRoot, rootPath, rootSource, document }) {
  const failures = [];
  const relativeRoot = path.relative(projectRoot, rootPath).split(path.sep).join('/');
  if (relativeRoot !== 'openapi/openapi.yaml') {
    failures.push(failure('New contracts require root openapi/openapi.yaml', rootPath));
  }
  const redocly = path.join(projectRoot, 'redocly.yaml');
  if (!(await regularFileExists(redocly))) failures.push(failure('New contracts require redocly.yaml', redocly));

  const refs = parseRootPathRefs(rootSource);
  const bundlePathNames = Object.keys(isObject(document.paths) ? document.paths : {})
    .filter((pathName) => pathName.startsWith('/'));
  if (refs.length !== bundlePathNames.length) {
    failures.push(failure('Each root Path Item must be an external file reference', rootPath));
  }
  const rootPathNames = new Set();
  for (const entry of refs) {
    if (rootPathNames.has(entry.pathName)) {
      failures.push(failure(`Root repeats path ${entry.pathName}`, `${rootPath}:${entry.line}`));
    }
    rootPathNames.add(entry.pathName);
  }
  const byName = new Map(refs.map((entry) => [entry.pathName, entry]));
  const referencedFiles = new Map();
  for (const pathName of bundlePathNames) {
    const entry = byName.get(pathName);
    if (!entry || typeof entry.ref !== 'string' || entry.ref === '') {
      failures.push(failure(`Path ${pathName} needs a local $ref`, rootPath));
      continue;
    }
    if (entry.siblingKeys.length > 0) {
      failures.push(failure(
        `Path ${pathName} must be reference-only; move ${entry.siblingKeys.join(', ')} into its Path Item file`,
        `${rootPath}:${entry.line}`,
      ));
    }
    if (entry.ref.startsWith('#') || /^[a-z][a-z\d+.-]*:/iu.test(entry.ref)) {
      failures.push(failure(`Path ${pathName} must use a local file $ref`, `${rootPath}:${entry.line}`));
      continue;
    }
    const filePart = entry.ref.split('#', 1)[0];
    const resolved = path.resolve(path.dirname(rootPath), filePart);
    const relative = path.relative(path.join(projectRoot, 'openapi', 'paths'), resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.includes(path.sep)) {
      failures.push(failure(`Path ${pathName} ref must stay directly under openapi/paths`, `${rootPath}:${entry.line}`));
    }
    if (path.basename(resolved) !== expectedPathFilename(pathName)) {
      failures.push(failure(`Path ${pathName} ref filename must be ${expectedPathFilename(pathName)}`, `${rootPath}:${entry.line}`));
    }
    const previousPath = referencedFiles.get(resolved);
    if (previousPath && previousPath !== pathName) {
      failures.push(failure(`Paths ${previousPath} and ${pathName} must not share one Path Item file`, `${rootPath}:${entry.line}`));
    }
    referencedFiles.set(resolved, pathName);
    if (!(await regularFileExists(resolved))) failures.push(failure(`Path Item file is missing for ${pathName}`, resolved));
  }

  const componentsRoot = path.join(projectRoot, 'openapi', 'components');
  const componentCategories = await directoryEntries(componentsRoot);
  if (componentCategories && componentCategories.length === 0) {
    failures.push(failure('Do not pre-create an empty openapi/components directory', componentsRoot));
  }
  for (const category of componentCategories ?? []) {
    if (!category.isDirectory() || category.isSymbolicLink()) continue;
    const categoryPath = path.join(componentsRoot, category.name);
    const entries = await directoryEntries(categoryPath);
    if (entries && entries.length === 0) failures.push(failure(`Do not pre-create empty component category ${category.name}`, categoryPath));
  }
  return failures;
}

function normalizeOptions(options) {
  if (!isObject(options)) throw new CliError('options must be an object');
  if (!['new', 'update'].includes(options.mode)) {
    throw new CliError('mode must be new or update');
  }
  if (options.layout !== undefined) {
    throw new CliError('layout is not supported; mode selects the structural profile');
  }
  if (options.format !== undefined && options.format !== 'text' && options.format !== 'json') {
    throw new CliError('format must be text or json');
  }
  for (const key of ['projectRoot', 'root', 'bundle', 'coverage', 'verification']) {
    if (typeof options[key] !== 'string' || options[key].trim() === '') throw new CliError(`${key} is required`);
  }
  return {
    mode: options.mode,
    format: options.format ?? 'text',
    projectRoot: path.resolve(options.projectRoot),
    inputPaths: {
      rootPath: options.root,
      bundlePath: options.bundle,
      coveragePath: options.coverage,
      verificationPath: options.verification,
    },
  };
}

export async function verifyContract(options) {
  const normalized = normalizeOptions(options);
  let projectStats;
  try {
    const canonicalProject = await realpath(normalized.projectRoot);
    projectStats = await lstat(canonicalProject);
    if (!projectStats.isDirectory() || projectStats.isSymbolicLink()) throw new Error('not a directory');
    normalized.projectRoot = canonicalProject;
  } catch (error) {
    throw new CliError(`Cannot use project root ${normalized.projectRoot}: ${error.message}`, 'input');
  }
  const resolveFromProject = (value) => (
    path.isAbsolute(value) ? path.normalize(value) : path.resolve(normalized.projectRoot, value)
  );
  for (const [key, value] of Object.entries(normalized.inputPaths)) {
    normalized[key] = resolveFromProject(value);
  }
  delete normalized.inputPaths;
  const rootSource = await readRegularText(normalized.rootPath, 'OpenAPI root', MAX_ROOT_BYTES);
  const bundleSource = await readRegularText(normalized.bundlePath, 'JSON bundle', MAX_BUNDLE_BYTES);
  const coverageSource = await readRegularText(normalized.coveragePath, 'coverage report', MAX_REPORT_BYTES);
  const verificationSource = await readRegularText(normalized.verificationPath, 'verification report', MAX_REPORT_BYTES);
  const document = parseJsonBundle(bundleSource);
  const complexityFailures = collectJsonComplexityFailures(document, normalized.bundlePath);
  const checks = [
    makeCheck('inputs.root', [], 'OpenAPI root is readable'),
    makeCheck('inputs.bundle', complexityFailures, 'JSON bundle is readable, parseable and within complexity limits'),
    makeCheck('inputs.coverage', [], 'Coverage report is readable'),
    makeCheck('inputs.verification', [], 'Verification report is readable'),
  ];
  if (complexityFailures.length > 0) {
    const deferredFailures = [failure(
      'Not evaluated because the JSON bundle exceeds deterministic complexity limits',
      normalized.bundlePath,
    )];
    POST_INPUT_CHECK_IDS.forEach((id) => checks.push(makeCheck(id, deferredFailures, '')));
    return buildResult(normalized.mode, checks);
  }

  const rootVersion = parseRootOpenApi(rootSource);
  const versionFailures = [];
  if (!rootVersion) versionFailures.push(failure('Root must contain exactly one top-level openapi scalar', normalized.rootPath));
  if (typeof document.openapi !== 'string') versionFailures.push(failure('Bundle requires string openapi version', '#/openapi'));
  const versions = [rootVersion?.value, document.openapi].filter(Boolean);
  for (const version of versions) {
    if (!/^3\.2\.\d+$/u.test(version)) versionFailures.push(failure(`Unsupported OpenAPI version ${version}; expected 3.2.x`, '#/openapi'));
    if (normalized.mode === 'new' && version !== '3.2.0') versionFailures.push(failure(`New contract must use OpenAPI 3.2.0, found ${version}`, '#/openapi'));
  }
  if (rootVersion && typeof document.openapi === 'string' && rootVersion.value !== document.openapi) {
    versionFailures.push(failure(`Root version ${rootVersion.value} differs from bundle ${document.openapi}`, '#/openapi'));
  }
  checks.push(makeCheck('oas.version', versionFailures, 'OpenAPI version is supported and consistent'));

  const { forbidden30, contexts } = collectForbiddenChecks(document);
  checks.push(makeCheck('oas.forbidden-30', forbidden30, 'No OpenAPI 3.0-only schema constructs found'));
  checks.push(makeCheck(
    'refs.internal',
    collectRefFailures(document, contexts),
    'Root-based positional JSON Pointer refs resolve; Schema resource and URI-anchor semantics are delegated to Redocly',
  ));

  const operationChecks = collectOperationChecks(document);
  checks.push(makeCheck('operations.operation-id', operationChecks.operationIdFailures, 'All reachable operations have unique operationId values'));
  checks.push(makeCheck('operations.responses', operationChecks.responsesFailures, 'All reachable operations have responses'));
  checks.push(makeCheck('paths.parameters', collectPathParameterFailures(document, operationChecks.operations), 'Root path parameters match templates and are required'));
  checks.push(makeCheck(
    'parameters.querystring',
    collectQuerystringParameterFailures(document, operationChecks.operations),
    'Effective query and querystring parameters satisfy OpenAPI 3.2 invariants',
  ));

  const layoutFailures = normalized.mode === 'new'
    ? await collectLayoutFailures({ ...normalized, rootSource, document })
    : [];
  checks.push(makeCheck(
    'layout.new',
    layoutFailures,
    normalized.mode === 'new'
      ? 'Starter source layout is valid'
      : 'Starter layout is not imposed in update mode',
  ));

  checks.push(makeCheck('deliverables.root', [], 'Source root exists'));
  const redoclyPath = path.join(normalized.projectRoot, 'redocly.yaml');
  checks.push(makeCheck(
    'deliverables.redocly',
    (await regularFileExists(redoclyPath)) ? [] : [failure('redocly.yaml is missing', redoclyPath)],
    'redocly.yaml exists',
  ));
  checks.push(makeCheck('deliverables.coverage', [], 'Coverage report exists'));
  checks.push(makeCheck(
    'deliverables.verification',
    inspectVerification(verificationSource, normalized.verificationPath, normalized.mode),
    'Verification report contains the required canonical OpenAPI gates',
  ));
  const coverage = inspectCoverage(coverageSource, normalized.coveragePath, document);
  checks.push(makeCheck('coverage.schema', coverage.schemaFailures, 'Coverage report uses the canonical schema and represented targets resolve'));
  checks.push(makeCheck('coverage.blockers', coverage.blockerFailures, 'Coverage has no unknown or conflict blockers'));

  return buildResult(normalized.mode, checks);
}

export function formatResultText(result) {
  const lines = result.checks.map((check) => {
    const prefix = check.status === 'passed' ? 'PASS' : 'FAIL';
    const locations = check.locations?.length ? ` (${check.locations.join(', ')})` : '';
    return `[${prefix}] ${check.id}: ${check.message}${locations}`;
  });
  lines.push(`Summary: ${result.summary.passed}/${result.summary.total} passed, ${result.summary.failed} failed`);
  return `${lines.join('\n')}\n`;
}

export function parseCliArgs(args) {
  if (!Array.isArray(args)) throw new CliError('arguments must be an array');
  if (args.includes('--help') || args.includes('-h')) return { help: true };
  const names = new Map([
    ['--mode', 'mode'],
    ['--project-root', 'projectRoot'],
    ['--root', 'root'],
    ['--bundle', 'bundle'],
    ['--coverage', 'coverage'],
    ['--verification', 'verification'],
    ['--format', 'format'],
  ]);
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const key = names.get(argument);
    if (!key) throw new CliError(`Unknown argument ${argument}`);
    if (Object.hasOwn(options, key)) throw new CliError(`Duplicate argument ${argument}`);
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) throw new CliError(`${argument} requires a value`);
    options[key] = value;
    index += 1;
  }
  return options;
}

export function helpText() {
  return `Usage:
  verify-contract.mjs --mode new|update \\
    --project-root DIR --root FILE \\
    --bundle FILE --coverage FILE --verification FILE [--format text|json]

All relative paths resolve against --project-root. Absolute paths are allowed
for explicit temporary artifacts and must be trusted. The bundle must be JSON
with at most ${MAX_JSON_DEPTH} nested container levels and ${MAX_JSON_CONTAINERS}
container values.

Exit status:
  0  all deterministic invariants passed
  1  one or more deterministic invariants failed
  2  invalid arguments or unreadable/malformed inputs

Limits:
  This validator cannot prove business correctness, breaking-change safety, or
  preservation of update semantics. For updates, retain a pre-change JSON
  bundle and compare unaffected normalized nodes separately. URI-anchor,
  $dynamicRef, and Schema resources with their own $id/base URI are delegated
  to Redocly; this script resolves root-based positional JSON Pointer refs. It
  complements, but does not replace, Redocly lint, bundle, and any
  project-documented OpenAPI 3.2-compatible documentation checks.
`;
}

export async function runCli(args = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  try {
    const parsed = parseCliArgs(args);
    if (parsed.help) {
      stdout.write(helpText());
      return 0;
    }
    const result = await verifyContract(parsed);
    stdout.write(parsed.format === 'json' ? `${JSON.stringify(result, null, 2)}\n` : formatResultText(result));
    return result.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`verify-contract: ${message}\n`);
    return 2;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  process.exitCode = await runCli();
}
