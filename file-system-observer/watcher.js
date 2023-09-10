// ./deno run -A watcher.js
const file = 'output.txt';

while (true) {

  console.log(`Watching ${file}`);

  const watcher = Deno.watchFs('');

  try {
    for await (const {
        kind,
        paths: [path]
      }
      of watcher) {

      if (path.split('/').pop() === file && kind === 'access') {
        console.log(kind, path);
        break;
      }
    }
  } catch {}

  try {
    watcher.close();
  } catch {}

  let data = 'abcdefghijklmnopqrstuvwxyz';

  for (const char of data) {
    console.log(char);
    const handle = await Deno.open(file, {
      read: true,
      write: true
    });
    await new Blob([char.toUpperCase().repeat(441 * 4)], {
        type: 'application/octet-stream'
      })
      .stream().pipeTo(handle.writable);

    while (true) {
      const {
        size
      } = await Deno.stat(file);
      if (size === 0) {
        break;
      } 
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  await Deno.remove(file);

  console.log('Done file streaming');
}
