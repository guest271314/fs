var {
  readable,
  writable
} = new TransformStream();

var handle = await showSaveFilePicker({
  multiple: 'false',
  types: [{
    description: "Stream",
    accept: {
      "application/octet-stream": [".txt"],
    },
  }, ],
  excludeAcceptAllOption: true,
  startIn: 'documents',
  suggestedName: 'output.txt'
});

var status = await handle.requestPermission({
  mode: "readwrite"
});

var fileStream = async (changedHandle, type = '') => {
  try {
    var {
      size
    } = await changedHandle.getFile();
    if (size) {
      var stream = await changedHandle.createWritable();
      var file = await changedHandle.getFile();
      await file.stream().pipeTo(writable, {
        preventClose: true
      });
      await stream.truncate(0);
      await stream.close();
    }
  } catch (e) {
    fso.unobserve(changedHandle);
    await writable.close();
  }
}

readable.pipeThrough(new TextDecoderStream()).pipeTo(
  new WritableStream({
    async start() {
      try {
        return fileStream(handle);
      } catch (e) {
        console.log(e);
        throw e;
      }
    },
    write(value) {
      console.log(value);
    },
    close() {
      console.log('Stream closed');
    }
  })
).catch(console.error);

var fso = new FileSystemObserver(async ([{
  changedHandle,
  root,
  type
}], record) => {

  try {
    await fileStream(handle, type);
  } catch (e) {
    console.log(e);
  }
});

fso.observe(handle);
