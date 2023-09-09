var [handle] = await showOpenFilePicker({
  multiple: 'false',
  startIn: 'documents'
});

var status = await handle.requestPermission({ mode : "readwrite" })

var fso = new FileSystemObserver(async ([{
  changedHandle,
  root,
  type
}], record) => {
  try {
    /*
    console.log({
      changedHandle,
      root,
      type
    }, record);
    */
    var {size} = await handle.getFile();
    
    if (size) {
      //console.log(size);
      var writable = await handle.createWritable();
      var ab = await (await handle.getFile()).arrayBuffer();
      await writable.truncate(0);
      await writable.close();
      console.log(new Uint8Array(ab));
    }
  } catch (e) {
    console.log(e);
  }
});

fso.observe(handle);
