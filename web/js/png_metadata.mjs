const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const UTF8 = new TextDecoder("utf-8");
const LATIN1 = new TextDecoder("latin1");

function assertPng(bytes) {
    if (
        bytes.length < PNG_SIGNATURE.length ||
        PNG_SIGNATURE.some((value, index) => bytes[index] !== value)
    ) {
        throw new Error("PNGファイルではありません");
    }
}

function readUint32(bytes, offset) {
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

function readNullTerminated(bytes, offset, decoder) {
    const end = bytes.indexOf(0, offset);
    if (end < 0) {
        throw new Error("PNGテキストチャンクが壊れています");
    }
    return {
        value: decoder.decode(bytes.subarray(offset, end)),
        next: end + 1,
    };
}

async function inflate(bytes) {
    if (typeof DecompressionStream === "undefined") {
        throw new Error("圧縮PNGメタデータをこのブラウザでは展開できません");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function parseTextChunk(type, data) {
    const keyword = readNullTerminated(data, 0, LATIN1);

    if (type === "tEXt") {
        return [keyword.value, LATIN1.decode(data.subarray(keyword.next))];
    }

    if (type === "zTXt") {
        const compressionMethod = data[keyword.next];
        if (compressionMethod !== 0) {
            throw new Error("未対応のPNG圧縮方式です");
        }
        const text = await inflate(data.subarray(keyword.next + 1));
        return [keyword.value, LATIN1.decode(text)];
    }

    const compressionFlag = data[keyword.next];
    const compressionMethod = data[keyword.next + 1];
    let offset = keyword.next + 2;
    offset = readNullTerminated(data, offset, UTF8).next;
    offset = readNullTerminated(data, offset, UTF8).next;

    let textBytes = data.subarray(offset);
    if (compressionFlag === 1) {
        if (compressionMethod !== 0) {
            throw new Error("未対応のPNG圧縮方式です");
        }
        textBytes = await inflate(textBytes);
    } else if (compressionFlag !== 0) {
        throw new Error("PNGテキストチャンクの圧縮フラグが不正です");
    }

    return [keyword.value, UTF8.decode(textBytes)];
}

export async function readPngTextMetadata(source) {
    const buffer = source instanceof ArrayBuffer ? source : await source.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    assertPng(bytes);

    const metadata = {};
    let offset = PNG_SIGNATURE.length;

    while (offset + 12 <= bytes.length) {
        const length = readUint32(bytes, offset);
        const type = LATIN1.decode(bytes.subarray(offset + 4, offset + 8));
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;

        if (dataEnd + 4 > bytes.length) {
            throw new Error("PNGチャンクが途中で切れています");
        }

        if (type === "tEXt" || type === "zTXt" || type === "iTXt") {
            const [key, value] = await parseTextChunk(type, bytes.subarray(dataStart, dataEnd));
            metadata[key] = value;
        }

        offset = dataEnd + 4;
        if (type === "IEND") {
            break;
        }
    }

    return metadata;
}

export function getFusenchatText(metadata) {
    const directText = metadata["fusenchat:text"];
    if (typeof directText === "string" && directText.length > 0) {
        return directText;
    }

    const payload = metadata["fusenchat:payload"];
    if (typeof payload === "string" && payload.length > 0) {
        try {
            const parsed = JSON.parse(payload);
            if (typeof parsed?.text === "string" && parsed.text.length > 0) {
                return parsed.text;
            }
        } catch {
            throw new Error("fusenchat:payloadが有効なJSONではありません");
        }
    }

    throw new Error("fusenchat:textメタデータがありません");
}

export async function readFusenchatText(source) {
    return getFusenchatText(await readPngTextMetadata(source));
}
