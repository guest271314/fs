var dir = await showDirectoryPicker();
var input = await dir.getFileHandle("stdin", {
  create: true
});
var output = await dir.getFileHandle("stdout", {
  create: true
});

const {
  readable: stdout,
  writable: stdin
} = new TransformStream();

stdout.pipeThrough(new TextDecoderStream()).pipeTo(new WritableStream({
  async write(value) {
    console.log(value);
    if (value === "Z") {
      await new Blob([]).stream().pipeTo(await output.createWritable());
      fso.unobserve(output);
      fso.disconnect();
    }
  },
}));

var fso = new FileSystemObserver(async ([{
  changedHandle,
  root,
  type
}], record) => {
  try {
    if (type === "modified") {
      await new Response(await (await output.getFile()).arrayBuffer()).body.pipeTo(stdin, {
        preventClose: true
      });
    }
  } catch (e) {
    console.warn(e);
  }
});

fso.observe(output);

[..."abcdefghijklmnopqrstuvwxyz"].reduce((a, b) => 
  a.then(async () => new Blob([b]).stream().pipeTo(await input.createWritable()))
, Promise.resolve());
