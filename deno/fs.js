{
  var fs;
  if (!fs) {
    fs = await showDirectoryPicker({
      mode: 'readwrite'
    });
    console.log(fs);
  }
  var handle = await fs.getFileHandle('input.js', {
    create: true
  });
  var text = `So we need people to have weird new
ideas ... we need more ideas to break it
and make it better ...

Use it. Break it. File bugs. Request features.

- Soledad Penadés, Real time front-end alchemy, or: capturing, playing,
  altering and encoding video and audio streams, without
  servers or plugins!
   
von Braun believed in testing. I cannot
emphasize that term enough – test, test,
test. Test to the point it breaks.

- Ed Buckbee, NASA Public Affairs Officer, Chasing the Moon

Now watch. ..., this how science works.
One researcher comes up with a result.
And that is not the truth. No, no.
A scientific emergent truth is not the
result of one experiment. What has to
happen is somebody else has to verify
it. Preferably a competitor. Preferably
someone who doesn't want you to be correct.

- Neil deGrasse Tyson, May 3, 2017 at 92nd Street Y

It’s like they say - if the system fails you, you create your own system.

- Michael K. Williams, Black Market

1. If a (logical or axiomatic formal) system is consistent, it cannot be complete.
2. The consistency of axioms cannot be proved within their own system.

- Kurt Gödel, Incompvareness Theorem, On Formally Undecidable Propositions of Principia Mathematica and Related Systems`;

  await new Blob([`const command = new Deno.Command("espeak-ng", {
  args: [
    "-w",
    "output.wav",
    \`${text}\`
  ],
});
const { code, stdout, stderr } = await command.output();`]).stream().pipeTo(await handle.createWritable());
  await new Promise((r) => setTimeout(r, 500));
  var output = await fs.getFileHandle('output.wav', {
    create: false
  });
  var ab = await (await output.getFile()).arrayBuffer();
  var url = URL.createObjectURL(new Blob([ab]));
  var audio = new Audio(url);
  audio.controls = true;
  document.body.appendChild(audio);
  await handle.remove();
  await output.remove();
}
