var decoder = new TextDecoder();

var {
  readable,
  writable
} = new TransformStream();

readable.pipeThrough(new TextDecoderStream()).pipeTo(
  new WritableStream({
    write(value) {
      console.log(value);
    },
    close() {
      console.log('Stream closed');
    }
  })
);

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

var fn = async (changedHandle, type = 'modify') => {
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

try {
  await fn(handle);
} catch (e) {
  console.log(e);
}

var fso = new FileSystemObserver(async ([{
  changedHandle,
  root,
  type
}], record) => {

  try {
    await fn(handle, type);
  } catch (e) {
    console.log(e);
  }
});

fso.observe(handle);