import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getFusenchatText, readPngTextMetadata } from "../web/js/png_metadata.mjs";

const samplePath = new URL("../sample/bubble_20260614_190349_952_4h8mef.png", import.meta.url);
const sample = await readFile(samplePath);
const metadata = await readPngTextMetadata(
    sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength),
);

assert.equal(metadata["fusenchat:payload"].includes('"app":"fusenchat"'), true);
assert.equal(getFusenchatText(metadata), metadata["fusenchat:text"]);
assert.equal(getFusenchatText({ "fusenchat:payload": '{"text":"fallback"}' }), "fallback");
assert.throws(() => getFusenchatText({}), /fusenchat:text/);

console.log(`ok: ${getFusenchatText(metadata).length} prompt characters`);
