// deno run -A watcher.js
const file = 'output';

console.log(`Watching ${file}`);

let data = 'abcdefghijklmnopqrstuvwxyz';

for (const char of data) {
  let handle = await Deno.open(`${file}`, {
    read: true,
    write: true
  });
  await new Blob([new Uint8Array(441 * 4)])
    .stream().pipeTo(handle.writable);
  const watcher = Deno.watchFs(`${file}`);
  for await (const event of watcher) {
    handle = await Deno.open(`${file}`, {
      read: true
    });
    const {
      size
    } = await handle.stat();
    if (size === 0) {
      try {
        handle.close();
        break;
      } catch {}
    }
  }
  try {
    watcher.close()
  } catch {}
}
