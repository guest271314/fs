var [input, output] = await Promise.all(
  ["stdin", "stdout"].map((stdio) =>
    showSaveFilePicker({
      startIn: "documents",
      suggestedName: stdio,
    })
  ),
);

const { readable: stdout, writable: stdin } = new TransformStream();

stdout.pipeThrough(new TextDecoderStream()).pipeTo(
  new WritableStream({
    async write(value) {
      console.log(value);
      if (value === "Z") {
        new Blob([]).stream().pipeTo(await output.createWritable());
      }
    },
  }),
);

var fso = new FileSystemObserver(
  async ([{ changedHandle, root, type }], record) => {
    try {
      if (type === "modified") {
        new Response(await(await output.getFile()).arrayBuffer()).body.pipeTo(stdin, {
          preventClose: true
        });
      }
    } catch (e) {
      console.warn(e);
    }
  },
);

fso.observe(output);

[..."abcdefghijklmnopqrstuvwxyz"]
  .reduce(
    (a, b) =>
      a.then(async () =>
        new Blob([b]).stream().pipeTo(await input.createWritable())
      ),
    Promise.resolve(),
  );
