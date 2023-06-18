// ./deno run -A watcher.js
const file = 'input.js';

console.log(`Watching ${file}`);

for (;;) {
  const watcher = Deno.watchFs('');
  for await (const {
      kind,
      paths
    }
    of watcher) {
    if (kind === 'modify' &&
      paths.find((path) => new RegExp(`${file}$`).test(path))) {
      // console.log(kind, paths);
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          "input.js",
        ],
      });
      const {
        code,
        stdout,
        stderr
      } = await command.output();
      break;
    }
  }
  try {
    watcher.close();
  } catch {}
  continue;
}
