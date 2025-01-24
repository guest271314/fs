// node --experimental-default-type=module watcher.js
import { watchFile, readFileSync, writeFileSync } from "node:fs";

const input = "./stdin";
const output = "./stdout";
const { readable, writable } = new TransformStream();
const writer = writable.getWriter();

readable.pipeThrough(new TextDecoderStream()).pipeTo(
  new WritableStream({
    write(value) {
      writeFileSync(output, value.toUpperCase());
      writeFileSync(input, "");
    },
  }),
);

watchFile(input, { interval: 5 }, () => {
  writer.write(new Uint8Array(readFileSync(input)));
});
