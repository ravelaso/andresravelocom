interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(v: number): Uint8Array {
  return new Uint8Array([v & 0xff, (v >>> 8) & 0xff]);
}

function u32(v: number): Uint8Array {
  return new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
}

function dosTime(): [number, number] {
  const d = new Date();
  const time = (d.getSeconds() >>> 1) | (d.getMinutes() << 5) | (d.getHours() << 11);
  const date = d.getDate() | ((d.getMonth() + 1) << 5) | ((d.getFullYear() - 1980) << 9);
  return [time, date];
}

export function buildZip(entries: ZipEntry[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;
  const [modTime, modDate] = dosTime();

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    local.set(u32(0x04034b50), 0);
    local.set(u16(20), 4);
    local.set(u16(0), 6);
    local.set(u16(0), 8);
    local.set(u16(modTime), 10);
    local.set(u16(modDate), 12);
    local.set(u32(crc), 14);
    local.set(u32(size), 18);
    local.set(u32(size), 22);
    local.set(u16(nameBytes.length), 26);
    local.set(u16(0), 28);
    local.set(nameBytes, 30);
    localHeaders.push(local, entry.data);

    const central = new Uint8Array(46 + nameBytes.length);
    central.set(u32(0x02014b50), 0);
    central.set(u16(20), 4);
    central.set(u16(20), 6);
    central.set(u16(0), 8);
    central.set(u16(0), 10);
    central.set(u16(modTime), 12);
    central.set(u16(modDate), 14);
    central.set(u32(crc), 16);
    central.set(u32(size), 20);
    central.set(u32(size), 24);
    central.set(u16(nameBytes.length), 28);
    central.set(u16(0), 30);
    central.set(u16(0), 32);
    central.set(u16(0), 34);
    central.set(u16(0), 36);
    central.set(u32(0), 38);
    central.set(u32(0), 42);
    central.set(u32(offset), 42);
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += 30 + nameBytes.length + size;
  }

  const centralSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
  const centralOffset = offset;

  const eocd = new Uint8Array(22);
  eocd.set(u32(0x06054b50), 0);
  eocd.set(u16(0), 4);
  eocd.set(u16(0), 6);
  eocd.set(u16(entries.length), 8);
  eocd.set(u16(entries.length), 10);
  eocd.set(u32(centralSize), 12);
  eocd.set(u32(centralOffset), 16);
  eocd.set(u16(0), 20);

  const parts = [...localHeaders, ...centralHeaders, eocd];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  return result;
}
