import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const BYTES_PER_PIXEL = 4;
const MAX_PNG_BYTES = 64 * 1024 * 1024;
const MAX_INFLATED_BYTES = 256 * 1024 * 1024;

const CRC32_TABLE = new Uint32Array(256);

for (let index = 0; index < CRC32_TABLE.length; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  CRC32_TABLE[index] = value >>> 0;
}

function invalidPng(message) {
  return new Error(`Invalid PNG: ${message}`);
}

function calculateCrc32(buffer, start, end) {
  let crc = 0xffffffff;

  for (let offset = start; offset < end; offset += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[offset]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function isAsciiLetter(value) {
  return (
    (value >= 0x41 && value <= 0x5a) ||
    (value >= 0x61 && value <= 0x7a)
  );
}

function checkedProduct(left, right, description) {
  if (left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left)) {
    throw invalidPng(`${description} exceeds JavaScript's safe integer range.`);
  }

  return left * right;
}

function parseIhdr(data, rgbaOnly) {
  if (data.length !== 13) {
    throw invalidPng(`IHDR must contain exactly 13 bytes; received ${data.length}.`);
  }

  const width = data.readUInt32BE(0);
  const height = data.readUInt32BE(4);
  const bitDepth = data[8];
  const colorType = data[9];
  const compressionMethod = data[10];
  const filterMethod = data[11];
  const interlaceMethod = data[12];

  if (width === 0 || height === 0) {
    throw invalidPng('IHDR width and height must both be greater than zero.');
  }

  if (width > 0x7fffffff || height > 0x7fffffff) {
    throw invalidPng('IHDR width and height must not exceed 2^31 - 1.');
  }

  const channelCounts = new Map([
    [0, 1],
    [2, 3],
    [3, 1],
    [4, 2],
    [6, 4],
  ]);
  const validBitDepths = new Map([
    [0, new Set([1, 2, 4, 8, 16])],
    [2, new Set([8, 16])],
    [3, new Set([1, 2, 4, 8])],
    [4, new Set([8, 16])],
    [6, new Set([8, 16])],
  ]);
  if (rgbaOnly && (bitDepth !== 8 || colorType !== 6)) {
    throw invalidPng(
      `only 8-bit RGBA images are supported; received bit depth ${bitDepth} and color type ${colorType}.`,
    );
  }
  if (!validBitDepths.get(colorType)?.has(bitDepth)) {
    throw invalidPng(`unsupported bit depth ${bitDepth} for color type ${colorType}.`);
  }

  if (compressionMethod !== 0) {
    throw invalidPng(`unsupported IHDR compression method ${compressionMethod}.`);
  }

  if (filterMethod !== 0) {
    throw invalidPng(`unsupported IHDR filter method ${filterMethod}.`);
  }

  if (interlaceMethod !== 0) {
    throw invalidPng('interlaced images are not supported.');
  }

  const bitsPerPixel = channelCounts.get(colorType) * bitDepth;
  const rowBits = checkedProduct(width, bitsPerPixel, 'scanline bit size');
  const rowBytes = Math.ceil(rowBits / 8);
  const bytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8));
  const pixelBytes = checkedProduct(rowBytes, height, 'decoded image size');
  const scanlineBytes = rowBytes + 1;
  const inflatedBytes = checkedProduct(scanlineBytes, height, 'inflated image size');

  if (inflatedBytes > MAX_INFLATED_BYTES) {
    throw invalidPng(
      `inflated image data would require ${inflatedBytes} bytes, above the ${MAX_INFLATED_BYTES}-byte safety limit.`,
    );
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    rowBytes,
    bytesPerPixel,
    pixelBytes,
    inflatedBytes,
  };
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  if (aboveDistance <= upperLeftDistance) {
    return above;
  }

  return upperLeft;
}

function restoreScanlines(inflated, metadata) {
  const { height, rowBytes, bytesPerPixel, pixelBytes } = metadata;
  const rgba = Buffer.allocUnsafe(pixelBytes);
  let sourceOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;

    if (filterType > 4) {
      throw invalidPng(`scanline ${row} uses unsupported filter type ${filterType}.`);
    }

    const rowOffset = row * rowBytes;

    for (let column = 0; column < rowBytes; column += 1) {
      const encoded = inflated[sourceOffset];
      sourceOffset += 1;

      const left = column >= bytesPerPixel ? rgba[rowOffset + column - bytesPerPixel] : 0;
      const above = row > 0 ? rgba[rowOffset + column - rowBytes] : 0;
      const upperLeft =
        row > 0 && column >= bytesPerPixel
          ? rgba[rowOffset + column - rowBytes - bytesPerPixel]
          : 0;

      let predictor = 0;

      if (filterType === 1) {
        predictor = left;
      } else if (filterType === 2) {
        predictor = above;
      } else if (filterType === 3) {
        predictor = Math.floor((left + above) / 2);
      } else if (filterType === 4) {
        predictor = paethPredictor(left, above, upperLeft);
      }

      rgba[rowOffset + column] = (encoded + predictor) & 0xff;
    }
  }

  return rgba;
}

function decodePng(buffer, { rgbaOnly }) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('PNG decoder expects a Node.js Buffer.');
  }

  if (buffer.length > MAX_PNG_BYTES) {
    throw invalidPng(
      `file size ${buffer.length} bytes exceeds the ${MAX_PNG_BYTES}-byte safety limit.`,
    );
  }

  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw invalidPng('the 8-byte PNG signature is missing or corrupt.');
  }

  let offset = PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let metadata;
  let seenIhdr = false;
  let seenPlte = false;
  let seenIdat = false;
  let idatClosed = false;
  let seenIend = false;
  let totalIdatBytes = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const remaining = buffer.length - offset;

    if (remaining < 12) {
      throw invalidPng(`truncated chunk header at byte offset ${offset}.`);
    }

    const length = buffer.readUInt32BE(offset);

    if (length > remaining - 12) {
      throw invalidPng(
        `chunk at byte offset ${offset} declares ${length} data bytes, but only ${remaining - 12} are available.`,
      );
    }

    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + length;
    const chunkEnd = dataEnd + 4;
    const typeBytes = buffer.subarray(typeOffset, dataOffset);

    if (![...typeBytes].every(isAsciiLetter)) {
      throw invalidPng(`chunk at byte offset ${offset} has a non-alphabetic type code.`);
    }

    if ((typeBytes[2] & 0x20) !== 0) {
      throw invalidPng(`chunk at byte offset ${offset} has an invalid reserved type bit.`);
    }

    const type = typeBytes.toString('ascii');
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = calculateCrc32(buffer, typeOffset, dataEnd);

    if (actualCrc !== expectedCrc) {
      throw invalidPng(
        `${type} CRC mismatch at byte offset ${offset}: expected 0x${expectedCrc
          .toString(16)
          .padStart(8, '0')}, calculated 0x${actualCrc.toString(16).padStart(8, '0')}.`,
      );
    }

    if (chunkIndex === 0 && type !== 'IHDR') {
      throw invalidPng(`IHDR must be the first chunk; found ${type}.`);
    }

    if (seenIdat && type !== 'IDAT') {
      idatClosed = true;
    }

    const data = buffer.subarray(dataOffset, dataEnd);

    if (type === 'IHDR') {
      if (seenIhdr) {
        throw invalidPng('IHDR may appear only once.');
      }

      if (chunkIndex !== 0) {
        throw invalidPng('IHDR must be the first chunk.');
      }

      metadata = parseIhdr(data, rgbaOnly);
      seenIhdr = true;
    } else if (type === 'PLTE') {
      if (seenPlte) {
        throw invalidPng('PLTE may appear at most once.');
      }

      if (seenIdat) {
        throw invalidPng('PLTE must appear before the first IDAT chunk.');
      }

      if (length === 0 || length > 768 || length % 3 !== 0) {
        throw invalidPng('PLTE length must describe between 1 and 256 RGB entries.');
      }
      if (metadata.colorType === 0 || metadata.colorType === 4) {
        throw invalidPng(`PLTE is not allowed for color type ${metadata.colorType}.`);
      }
      if (metadata.colorType === 3 && length / 3 > 2 ** metadata.bitDepth) {
        throw invalidPng('PLTE contains more entries than the indexed bit depth allows.');
      }

      seenPlte = true;
    } else if (type === 'IDAT') {
      if (!seenIhdr) {
        throw invalidPng('IDAT appeared before IHDR.');
      }

      if (idatClosed) {
        throw invalidPng('IDAT chunks must be consecutive.');
      }

      if (length > MAX_PNG_BYTES - totalIdatBytes) {
        throw invalidPng(`combined IDAT data exceeds the ${MAX_PNG_BYTES}-byte safety limit.`);
      }

      totalIdatBytes += length;
      idatChunks.push(data);
      seenIdat = true;
    } else if (type === 'IEND') {
      if (length !== 0) {
        throw invalidPng(`IEND must be empty; received ${length} data bytes.`);
      }

      if (!seenIdat) {
        throw invalidPng('IEND appeared before any IDAT chunk.');
      }

      seenIend = true;
      offset = chunkEnd;
      break;
    } else if ((typeBytes[0] & 0x20) === 0) {
      throw invalidPng(`unsupported critical chunk ${type}.`);
    }

    offset = chunkEnd;
    chunkIndex += 1;
  }

  if (!seenIend) {
    throw invalidPng('IEND chunk is missing.');
  }

  if (metadata.colorType === 3 && !seenPlte) {
    throw invalidPng('indexed-color images require a PLTE chunk.');
  }

  if (offset !== buffer.length) {
    throw invalidPng(`${buffer.length - offset} trailing byte(s) follow IEND.`);
  }

  const compressed = Buffer.concat(idatChunks, totalIdatBytes);
  let inflated;

  try {
    inflated = inflateSync(compressed, { maxOutputLength: metadata.inflatedBytes });
  } catch (error) {
    throw new Error('Invalid PNG: IDAT data could not be inflated as a zlib stream.', {
      cause: error,
    });
  }

  if (inflated.length !== metadata.inflatedBytes) {
    throw invalidPng(
      `inflated IDAT data has ${inflated.length} bytes; expected ${metadata.inflatedBytes}.`,
    );
  }

  return {
    width: metadata.width,
    height: metadata.height,
    bitDepth: metadata.bitDepth,
    colorType: metadata.colorType,
    data: restoreScanlines(inflated, metadata),
  };
}

export function inspectPng(buffer) {
  const { width, height, bitDepth, colorType } = decodePng(buffer, { rgbaOnly: false });
  return { width, height, bitDepth, colorType };
}

export function decodeRgbaPng(buffer) {
  const { width, height, data } = decodePng(buffer, { rgbaOnly: true });
  return { width, height, data };
}

function decodeComparisonSide(label, buffer) {
  try {
    return decodeRgbaPng(buffer);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot compare PNGs: ${label} image is invalid: ${detail}`, {
      cause: error,
    });
  }
}

export function compareRgbaPng(leftBuffer, rightBuffer) {
  const left = decodeComparisonSide('left', leftBuffer);
  const right = decodeComparisonSide('right', rightBuffer);

  if (left.width !== right.width || left.height !== right.height) {
    throw new Error(
      `Cannot compare PNGs with different dimensions: left is ${left.width}x${left.height}, right is ${right.width}x${right.height}.`,
    );
  }

  const totalPixels = left.width * left.height;
  let differentPixels = 0;

  for (let offset = 0; offset < left.data.length; offset += BYTES_PER_PIXEL) {
    if (
      left.data[offset] !== right.data[offset] ||
      left.data[offset + 1] !== right.data[offset + 1] ||
      left.data[offset + 2] !== right.data[offset + 2] ||
      left.data[offset + 3] !== right.data[offset + 3]
    ) {
      differentPixels += 1;
    }
  }

  return {
    width: left.width,
    height: left.height,
    totalPixels,
    differentPixels,
    differenceRatio: (differentPixels / totalPixels) * 100,
  };
}
