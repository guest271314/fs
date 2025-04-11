We will start this series with creating a directory on the local filesystem using HTML.

### Creating directories (folders) in the browser using HTML

Chrome and Firefox browsers use [Gtk FileChooser](https://docs.gtk.org/gtk3/iface.FileChooser.html) for the file picker for upload and download of folders and files.
The `FileChooser` interface has a [FileChooser:create-folders](https://docs.gtk.org/gtk3/property.FileChooser.create-folders.html) property.

What this means for us is we can create a folder when a file is downloaded or uploaded within the file picker UI.

Prerequisite: Set `Ask where to save each file before downloading` to true on Chromium-based browsers (e.g., Chrome), and set `Always ask you where to save files` on Firefox in `Settings`.

Add [`webkitdirectory`](https://wicg.github.io/entries-api/#dom-htmlinputelement-webkitdirectory) property to an `HTMLInputElement` with `type` set to `file`

### Creating a local directory without creating a file therein

```
var input = document.createElement("input");
input.type = "file";
input.webkitdirectory = true;
input.click();
```

In the file picker select `Downloads` or any other folder where the directory is to be created in the initial UI. The UI will change to ask what directory to open in the `Downloads` folder.
In the UI there will be an folder icon that upon click will create a directory.

Click the folder, which will create a popup in the UI `Folder Name`. Enter a folder name, then click `Create`. Then click `Upload`. The folder will be created, whether `Upload` in the UI isclicked or not.

Note, the `input` and `change` events, respectively, of the `<input type="file">` element will not be dispated because no file (`File` object in the browser) is selected in the UI.


### Creating a local directory with creating a file therein

We'll make use of the [`download`](https://html.spec.whatwg.org/multipage/links.html#attr-hyperlink-download) attribute. 

The same Gtk `FileChooser` is used by the browser, so we can repeat the steps above to create a folder where the file will be downloaded into.

```
var a = document.createElement("a");
a.download = "file.txt";
a.href = "data:,";
a.click();
```

### Creating a local directory with creating a file therein and triggering input and change events

We will be launching two (2) Gtk `FileChooser` UI instances. The first we'll handle manually is the `Save` UI. Repeat the steps above for creating a folder first, then downloading the file to the folder created in the file picker/file saver UI.
Then select the created folder in the directory upload UI, click `Upload`. `input` and `change` events will be dispatched to the `<input type="file" webkitdirectory>` element.
```
{
  var html = \`<a download="file.txt" href="data:,"></a><form enctype="multipart/form-data" name="dir">
      <input type="file" webkitdirectory directory name="create-directory">
    </form>\`;

  document.body.insertAdjacentHTML("beforeend", html);
  
  var [input] = document.forms["dir"].children;
  var a = document.querySelector("a[download='file.txt']");
  input.addEventListener("input", async(e) => {
    console.log(e.type, e.target.value, e.target.files[0]?.webkitRelativePath);
  }, {once: true});
  input.addEventListener("change", async (e) => {
    console.log(e.type, e.target.files[0].webkitRelativePath, [...e.target.files]);
    input.parentElement.remove();  
    a.remove();
  }, {
    once: true,
  });
  a.click();
  input.click();
}
```

### Summary

Above we have created folders in the browser using HTML alone. In Part 2 of this series we will be making use of `FormData` object, raw `multipart/form-data`, and `Response.formData()` to recreate folders both directly on the local filesystem with WICG File System Access API and in the Origin Private File System with WHATWG File System, which are *not* the same Web API even though the two (2) discrete Web API's share some of the same interfaces, i.e., `FileSystemDirectorHandle`. We will also preface Part 3 of this series, serializing directories for the ability to download folders from GitHub, and transfer folders to peers as an `ArrayBuffer` with `fetch()`,  WebRTC `RTCDataChannel`, `WebTransport`, or `WebSocket`, et al.