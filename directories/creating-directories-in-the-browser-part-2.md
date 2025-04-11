In Part 1 we created directories in the browser using the UI. In Part 2 we will be 

- Creating directories from `FormData`
- Creating `FormData` from files in directories
- Writing directories to the actual file system using WICG File System Access API
- Writing directories to the origin private file system using WHATWG File System
- Serializing directories to `FormData`
- Fetching GitHub repositories and writing those repositories to the local file system
- Getting files in the browser configuration folder written to origin private file system

### Preface

[WICG File System Access API](https://wicg.github.io/file-system-access): Writes directories and files to the actual files system. 

[WHATWG File System](https://fs.spec.whatwg.org/): Writes directories and files to the "origin private file system" which 
is stored in the browser configuration folder. 

For history and errata see [File system access prior art, current implementations and disambiguation: The difference between WICG File System Access and WHATWG File System](https://gist.github.com/guest271314/59be7a5b7c56ce48edea8821010c9cd2).

An article explaining the "origin private file system" which should illustrate the difference between that API and WICG File System Access API, which shared some of the same interfaces: [The origin private file system](https://web.dev/articles/origin-private-file-system).

So ultimately when `localStorage`, `webkitRequestFileSystem` are used that data is still
written to the local file system. We just have to know where to look for the data and how to parse the data.

### The code

The code in `createReadWriteDirectoriesInBrowser.js` below conatins several functions to programmatically create, read, write, extract directories
in the browser. There are comments explaining what is going on, with links to the relevant specifications.

The code is tested on Chromium 127 Developer Build. Desktop/laptop. The code was not tested on *mobile* devices. There are ways to create, read, and write directories exclusively
on mobile devices, too. That's not the focus of this code though. The focus of this code is using modern browser capabilities to
create and manipulate directories - both in the actual user filesystem and the origin private file system.

I would suggest testing the code on a Chromium-based browser, which supports WICG File System Access. Most modern browser support WHATWG File System.
Mozilla's Firefox does not support WICG File System Accerss API. Although we already demonstrated in Part 1 that we can create directories in the user filesystem
in the file picker upload or download UI with user complicity.

What you will notice is a directry is essentially a mapping of file or empty directory references to names. Technically that can be done using JSON,
Import Maps, e.g., 

```
<script type="importmap">
  {
    "imports": {
      "test/file": "./x.json",
      "test/sub/file": "./z.json"
   }
 }
</script>
<script type="module">
  import x from "test/file"
  with {
    type: "json"
  };
  import z from "test/sub/file"
  with {
    type: "json"
  };
  console.log(
    new TextDecoder().decode(new Uint8Array([x, z])), 
    import.meta.resolve("test/file"), 
    import.meta.resolve("test/sub/file")
  );
</script>
```

`CachedStorage` or other means. We'll explore various ways directories can be represented, parsed, compressed, transferred to peers, etc. in Part 3.