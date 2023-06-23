async function requestNativeScript(text) {
  try {
    /*
      Avoid DOMException: The requested file could not be read, 
      typically due to permission problems that have occurred 
      after a reference to a file was acquired.
      Execute showDirectoryPicker() before each file read/write
    */
    const fs = await showDirectoryPicker({
      mode: 'readwrite',
    });

    let input = await fs.getFileHandle('input.sh', {
      create: true,
    });

    await new Blob(
      [
        `#!/bin/bash
  espeak-ng -m -w output.wav "${text}"
  exit`,
      ],
      { type: 'application/x-shellscript' }
    )
      .stream()
      .pipeTo(await input.createWritable());

    let output;
    let fileNotFoundErrors = 0;
    do {
      try {
        output = await fs.getFileHandle('output.wav', {
          create: false,
        });
        break;
      } catch (e) {
        // Try to get file 1000 times
        if (++fileNotFoundErrors >= 999) {
          return Promise.reject(e);
        }
        console.dir(e.name);
      }
    } while (!(output instanceof FileSystemFileHandle));

    let ab = await (await output.getFile()).arrayBuffer();
    let url = URL.createObjectURL(
      new Blob([ab], {
        type: 'audio/wav',
      })
    );
    let audio = new Audio(url);
    audio.controls = true;
    document.body.appendChild(audio);
    await audio.play();
    console.log({
      fs,
      input,
      output,
    });

    await fs.removeEntry(output.name);
    await fs.removeEntry(input.name);

    return fs;
  } catch (e) {
    console.warn(e);
    console.trace();
  }
}
try {
  var fs = await requestNativeScript(`100,000`);
  console.log({ fs });
} catch (e) {
  console.warn(e);
}
