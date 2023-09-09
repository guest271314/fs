await navigator.permissions.request({
  name: 'notifications'
});
new Notification('Observe files')
  .onclick = async () => {
    var dir = await showDirectoryPicker({
      startIn: 'downloads'
    });

    await dir.requestPermission({
      mode: 'readwrite'
    });

    var {
      readable,
      writable
    } = new TransformStream();
    readable.pipeTo(new WritableStream({
      start(c) {
        return console.log('Start');
      },
      async write(value) {
        try {
          // File is modified twice, when created, when removed
          var handle = await dir.getFileHandle(value, {
            create: false
          });
          console.log(await new Response(await handle.getFile()).json());
          await dir.removeEntry(value);
        } catch {

        }
      }
    }));

    var writer = writable.getWriter();

    var fso = new FileSystemObserver(async ([{
      changedHandle,
      root,
      type
    }]) => {
      try {
        writer.write(changedHandle.name);
      } catch (e) {
        console.log(e);
      }
    });

    fso.observe(dir, {
      recursive: false
    });
  }

/*
for (const [index, n] of Array.from({
    length: 256
  }, (_, index) => index).entries()) {
  await Deno.writeTextFile(`${index}`, JSON.stringify([...new Array(1024)].map(() => 255)));
}
*/
