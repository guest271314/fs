var handle = await showSaveFilePicker({
  id: "repl",
  startIn: "documents",
  suggestedName: "sock",
});

async function repl(script, fs) {
  let readWrites = 0;
  const { resolve, promise } = Promise.withResolvers();
  const fso = new FileSystemObserver(async ([{
    changedHandle,
    root,
    type,
  }], record) => {
    try {
      if (++readWrites === 2) {
        readWrites = 0;
        const text = await (await changedHandle.getFile()).text();
        fso.unobserve(fs);
        fso.disconnect();
        const currentHandle = await changedHandle.createWritable({ keepExistingData: false })
        await currentHandle.truncate(0);
        await currentHandle.close();
        resolve(text);
      }
    } catch (e) {
      console.log(e);
    }
  });

  fso.observe(fs);
  return new Response(script).body.pipeTo(await handle.createWritable())
    .then(() => promise).then(console.log).then(() =>
      console.log(`Done writing to and reading from ${handle.name}`)
    ).catch((e) => console.log(e));

/*
repl(`console.log(Deno.version)`, handle).then(console.log)
{ deno: "2.2.6+b880087", v8: "13.5.212.4-rusty", typescript: "5.7.3" }
Done writing to and reading from sock
*/
