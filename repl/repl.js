#!/usr/bin/env -S /home/user/bin/deno -A repl.js
for await (const e of Deno.watchFs("/home/user/Documents")) {
  for (const [index, path] of Object.entries(e.paths)) {
    if (path.split("/").pop() === "sock") {
      const input = Deno.readTextFileSync(path);
      console.log(e.kind, path);
      if (input.length > 0) {
        console.log(input);
        const command = new Deno.Command(Deno.execPath(), {
          args: [
            "eval",
            input,
          ],
        });
        const { code, stdout, stderr } = command.outputSync();
        await Deno.stdout.write(stdout);
        Deno.writeFileSync(path, stdout);
      } else {
        continue;
      }
    }
  }
}
