// *Mostly* specfication conformant
// <input type="file" webkitdirectory> does not upload empty directories
// drop event with DataTransfer.item.getAsFileSystemDirectory() *does*
// list empty folders.
// W3C File API does not have a way to represent an empty directory.
// We use a File with type set to "inode/directory".
try {
    // HTMLInputElement.webkitdirectory
    // https://wicg.github.io/entries-api/#dom-htmlinputelement-webkitdirectory
    var html = `<form 
      enctype="multipart/form-data" 
      name="dir" 
      style="z-index:1000;display:block;position:absolute;top:95vh !important;left:50vw !important;background:dodgerblue;">
        <input type="file" webkitdirectory directory name="">
        <div id="download-gh">Download GH repo</div>
      </form>`;
  
    document.body.insertAdjacentHTML("beforeend", html);
  
    var download = document.forms["dir"].querySelector("#download-gh");
  
    var input = document.forms["dir"].querySelector("input[type=file]");
  
    var { resolve, promise } = Promise.withResolvers();
    
    var repo = "persistent-serviceworker";
    
    var branch = "main";
  
    input.addEventListener("change", async (e) => {
      console.log(e.target.files[0].webkitRelativePath, [...e.target.files]);
      // Set name in <input type="file" webkitdirectory> to uploaded directory name
      e.target.name = e.target.files[0].webkitRelativePath.split("/").shift();
      // POST FormData including <form>, handle Response.formData()
      // https://xhr.spec.whatwg.org/#dom-formdata
      // https://fetch.spec.whatwg.org/#ref-for-dom-body-formdata
      /*
      const request = await fetch("./", {
        method: "post",
        body: new FormData(input.form),
      });
      const fd = await request.formData();
      */
      const fd = new FormData(input.form);
      resolve(fd);
      input.value = null;
      input.form.remove();
    }, {
      once: true,
    });
  
    input.addEventListener("dragover", async (e) => {
      e.preventDefault();
    });
  
    input.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      e.target.files = files;
      const [item] = await e.dataTransfer.items;
      // Create FileSystemFileHandle from DataTransfer item
      const entry = await item.getAsFileSystemHandle();
      resolve(entry);
      input.value = null;
      input.form.remove();
    }, {
      once: true,
    });
  
    download.addEventListener("click", async (e) => {
      const fd = new FormData();
      const files = await Array.fromAsync(getGitHubRepositoryAsDirectory());
  
      console.log(files);
      const foldername = files[0].name.split("/").shift();
      for (const file of files) {
        fd.append(foldername, file, file.name);
      }
      resolve(fd);
      e.target.parentElement.remove();
    }, {
      once: true,
    });
  
    // Fetch GitHub repository
    async function* getGitHubRepositoryAsDirectory(
      r = `https://api.github.com/repos/guest271314/${repo}/contents?recursive=1`,
    ) {
      const request = await fetch(r);
      const json = await request.json();
      const files = await Promise.all(json.map(async (entry) => {
        const {
          download_url,
        } = entry;
        if (download_url) {
          const url = new URL(download_url);
          const blob = await (await fetch(url)).blob();
          console.log(url.pathname);
          const file = new File(
            [blob],
            url.pathname.replace(new RegExp(`^\\/\\w+\\/|\\/${branch}`, "g"), ""),
            {
              type: blob.type,
            },
          );
          return file;
        } else {
          const {
            _links,
          } = entry;
          if (_links) {
            return await Array.fromAsync(getGitHubRepositoryAsDirectory(_links.self));
          }
        }
      }));
      yield* files.flat();
    }
    // Helper function for filesystem *development*
    // Get directory in origin private file system from Chrome configuration folder.
    // fetch() file: protocol with "file://*/*" or "<all_urls>" in "host_permissions"
    // in browser extension manifest.json
    async function parseChromeDefaultFileSystem(path) {
      try {
        const set = new Set([
          32, 45, 46, 47, 48, 49, 50, 51, 52, 53,
          54, 55, 56, 57, 58, 64, 65, 66, 67, 68,
          69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
          79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
          89, 90, 95, 97, 98, 99, 100, 101, 102, 
          103, 104, 105, 106, 107, 108, 109, 110,
          111, 112, 113, 114, 115, 116, 117, 118,
          119, 120, 121, 122,
        ]);
        const request = await fetch(path);
        const text = (await request.text()).replace(/./g, (s) => set.has(s.codePointAt()) ? s : "");
        const files = [
          ...new Set(
            text.match(
              /00000\d+[A-Za-z-_.0-9\s]+\.crswap/g,
            ),
          ),
        ].map((s) => {
          const dir = [...new Set(text.slice(0, text.indexOf(s)).match(/(?<=[@\s]|CHILD_OF:0:)([\w-_])+(?=Ux)/g).map((d) =>
            d.split(/\d+|D140/)
          ))].flat().pop();
          const re = /00000[\d\s]+|\.crswap/g;
          const [key] = s.match(re);
          return ({
            [key]: s.replace(re, ""),
            dir
          })
        });
        return {
          name: files[0].dir,
          files
        }
      } catch (e) {
        console.error(e);
      }
    }  
    // let paths = await parseChromeDefaultFileSystem("file:///home/user/.config/chromium/Default/File\ System/021/t/Paths/000003.log");
    // console.log(JSON.stringify(paths, null, 2));
  
    // Write FormData to FileSystemDirectoryHandle
    async function writeFormDataToDirectory(fd, dir) {
      const [key] = [...new Set(fd.keys())];
      console.log({
        key,
      });
      // Remove all directories in FileSystemDirectoryHandle
      for await (const key of dir.keys()) {
        await dir.removeEntry(key, {
          recursive: true,
        });
      }
      // Create root directory with uploaded directory name
      const root = await dir.getDirectoryHandle(key, {
        create: true,
      });
  
      for (const [dirname, file] of fd) {
        // Path components are the File name, including directory names
        // e.g., "web-directory/file.txt", "web-directory/empty-directory"
        // ["web-directory", "file.txt"], ["web-directory", "empty-directory"]
        // Check if file is a File object https://www.w3.org/TR/FileAPI/
        // or a string that is name of an empty directory
        const pathComponents =
          (file.name.includes("/") ? file.name : file.webkitRelativePath).split(
            "/",
          );
        // With two path components write file to root directory
        if (pathComponents.length === 2) {
          const handle = await root.getFileHandle(pathComponents[1], {
            create: true,
          });
          await file.stream().pipeTo(await handle.createWritable());
        } else {
          // File or directory name
          const path = pathComponents.pop();
          if (file.type === "inode/directory") {
            // https://www.w3.org/TR/FileAPI/
            console.log(
              `Empty directory stored as File object: ${file.name}, ${file.type}, ${file.size}`,
            );
          }
          // Shift the path component, key variable is root directory name
          pathComponents.shift();
          // Create subdirectories
          const subdir = await pathComponents.reduce(
            async (handle, subfolder) => {
              const cwd = await handle;
              // Empty array or directory names in FileSystemDirectoryHandle
              const stat = await Array.fromAsync(await cwd.keys());
              const fileExists = !stat.includes(subfolder);
              return await cwd.getDirectoryHandle(subfolder, {
                create: fileExists,
              });
            },
            Promise.resolve(root),
          );
          // Create file in subdirectory, write File to path
          if (file instanceof File && file.type !== "inode/directory") {
            const fileHandle = await subdir.getFileHandle(path, {
              create: true,
            });
  
            await file.stream().pipeTo(await fileHandle.createWritable());
          } else {
            // Create empty directory
            await subdir.getDirectoryHandle(path, {
              create: true,
            });
          }
        }
      }
      return root;
    }
    // FileSystemDirectoryHandle to File's
    async function* directoryToFiles(dir, subdir = "") {
      const entries = await Array.fromAsync(dir.entries());
      if (subdir) {
        subdir += "/";
      }
      for (const [filename, cwd] of entries) {
        if (cwd.kind === "directory") {
          const keys = await Array.fromAsync(cwd.keys());
          if (keys.length) {
            yield* directoryToFiles(cwd, `${subdir}${dir.name}`);
          } else {
            yield new File([], `${subdir}${dir.name}/${cwd.name}`, {
              type: "inode/directory",
            });
          }
        } else {
          const file = await cwd.getFile();
          yield new File([file], `${subdir}${dir.name}/${filename}`, {
            type: file.type,
          });
        }
      }
    }
    // Read and log current FileSystemDirectoryHandle and FileSystemFileHandle
    async function readCurrentDirectory(dir) {
      const sortedEntries = (await Array.fromAsync(dir.values())).sort((a, b) =>
        a.kind === "file" ? -1 : 1
      );
      for (const handle of sortedEntries) {
        if (handle.kind === "file") {
          console.log(`Directory: ${dir.name}, file: ${handle.name}`);
        } else {
          console.log(`Directory: ${dir.name}, subdirectory: ${handle.name}`);
          // Read subdirectories
          await readCurrentDirectory(handle);
          console.log(
            `\x1B[38;2;0;0;255;1mDone iterating subdirectory ${handle.name} of ${dir.name}`,
          );
        }
      }
      return `Done iterating ${dir.kind} ${dir.name}`;
    }
  
    // Read and log FileSystemDirectoryHandle's and FileSystemFileHandle's
    async function readDirectories(dir) {
      // Iterate root FileSystemDirectoryHandle
      for await (const [, entry] of dir) {
        if (entry.kind === "directory") {
          // Read subdirectories
          console.log(`\x1B[38;2;0;0;255;1m${await readCurrentDirectory(entry)}`);
        }
        if (entry.kind === "file") {
          console.log(`Directory: ${dir.name}, file: ${entry.name}`);
        }
      }
      return dir;
    }
  
    // Iterate and list all directories and files of FileSystemDirectoryHandle
    async function* listDirectory(dir, subdir = "") {
      const entries = await Array.fromAsync(dir.entries());
      if (subdir) {
        subdir += "/";
      }
      for (const [filename, cwd] of entries) {
        if (cwd.kind === "directory") {
          const keys = await Array.fromAsync(cwd.keys());
          if (keys.length) {
            yield* listDirectory(cwd, `${subdir}${dir.name}`);
          } else {
            yield `${subdir}${dir.name}/${filename}`;
          }
        } else {
          yield `${subdir}${dir.name}/${filename}`;
        }
      }
    }
    // FormData or FileSystemDirectoryHandle from local or remote network or peer
    let fd = await promise;
    // FileSystemDirectoryHandle to write FormData or FileSystemDirectoryHandle
    // WICG File System Access: Actual local filesystem
    // WHATWG File System: Origin Private Storage filesystem
    let dir;
    // Root directory of created FileSystemDirectoryHandle
    let root;
  
    // Set Chromium, Chrome policy for file or directory picker without gesture
    /*
    {
      "FileOrDirectoryPickerWithoutGestureAllowedForOrigins": [
        "[*.]github.com"
      ]
    }
    */
  
    let permission;
    if (Object.hasOwn(globalThis, "showDirectoryPicker")) {
      permission = await navigator.permissions.query({
        name: "notifications",
      });
      if (permission.state !== "granted") {
        permission = await Notification.requestPermission();
      }
      if (permission.state === "granted" || permission === "granted") {
        const showDirectoryPickerNotification = new Notification(
          `Create ${fd?.name || [...fd][0][0]} directory in local filesystem?`,
          {},
        );
        showDirectoryPickerNotification.addEventListener(
          "click",
          async function handleShowDirectoryPickerNotification(e) {
            dir = await showDirectoryPicker({
              id: "fetch-folder",
              mode: "readwrite",
              startIn: "downloads",
            });
            abortable.abort(
              `${showDirectoryPickerNotification.title} notification clicked within 15 seconds.`,
            );
          },
          { once: true },
        );
        const abortable = new AbortController();
        const { signal } = abortable;
  
        await new Promise((r) => {
          showDirectoryPickerNotification.addEventListener("show", r, {
            once: true,
          });
        }).then(() =>
          scheduler.postTask(() => {
            console.log(
              `${showDirectoryPickerNotification.title} notification not clicked within 15 seconds.`,
            );
            showDirectoryPickerNotification.close();
          }, { priority: "background", delay: 20000, signal })
        ).catch(console.log);
      }
    }
    if (
      dir == undefined
    ) {
      const originPrivateStorageNotification = new Notification(
        `Create ${
          fd?.name || [...fd][0][0]
        } directory in origin private storage filesystem?`,
        {},
      );
      originPrivateStorageNotification.addEventListener(
        "click",
        async function handleOriginPrivateStorageNotification(e) {
          dir = await navigator.storage.getDirectory();
          abortable.abort(
            `${originPrivateStorageNotification.title} notification clicked within 15 seconds.`,
          );
        },
        { once: true },
      );
      const abortable = new AbortController();
      const { signal } = abortable;
  
      await new Promise((r) => {
        originPrivateStorageNotification.addEventListener("show", r, {
          once: true,
        });
      }).then(() =>
        scheduler.postTask(() => {
          console.log(
            `${originPrivateStorageNotification.title} notification not clicked within 15 seconds.`,
          );
          originPrivateStorageNotification.close();
        }, { priority: "background", delay: 20000, signal })
      ).catch(console.log);
    }
  
    // WHATWG File System
    // https://fs.spec.whatwg.org/
    // dir = await navigator.storage.getDirectory();
    // WICG File System Access API
    // https://wicg.github.io/file-system-access/#api-showdirectorypicker
    /*
    dir = await showDirectoryPicker({
            id: "fetch-folder",
            mode: "readwrite",
            startIn: "downloads",
          });
    */
    if (dir) {
      if (fd instanceof FormData) {
        console.log(...fd);
        // Create FormData from FileSystemDirectoryHandle
        const folder = await writeFormDataToDirectory(fd, dir);
        root = await readDirectories(folder);
        console.log(root);
      }
  
      if (fd instanceof FileSystemDirectoryHandle) {
        const formData = new FormData();
        // Create Array of File objects from FileSystemDirectoryHandle
        const files = await Array.fromAsync(directoryToFiles(fd));
        const key = files[0].name.split("/").shift();
        for (const file of files) {
          if (file instanceof File) {
            formData.append(key, file, file.name);
          } else {
            // Use string to reference empty directory entry
            // formData.append(key, file);
          }
        }
  
        root = await readDirectories(fd);
  
        console.log(root);
        // POST directory to ServiceWorker or server as FormData
        // const request = await fetch("./", {
        //  method: "post",
        //  body: formData,
        // });
        // await request.formData().then((form) => {
        //  console.log(
        //    [...form].filter(([, { type }]) => type === "inode/directory"),
        //  );
        // }).catch(console.error);
        await new Response(fd).text()
          .then((body) => {
            console.log(body);
            const boundary = body.slice(2, body.indexOf("\r\n"));
            return new Response(body, {
              headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
              },
            })
              .formData()
              .then((data) => {
                console.log([...data]);
                return data;
              }).catch((e) => {
                throw e;
              });
          }).catch(console.warn);
        // File objects in FormData referencing empty directories
        console.log(
          [...formData].filter(([, { type }]) => type === "inode/directory"),
        );
        // Recreate directory from FormData
        await writeFormDataToDirectory(formData, dir);
      }
      console.log(`\x1B[38;2;0;0;255;1mDone iterating ${root.kind} ${root.name}`);
      console.log(
        JSON.stringify(await Array.fromAsync(listDirectory(root)), null, 2),
      );
    }
  } catch (e) {
    console.log(e);
    console.trace();
  }