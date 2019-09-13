let audioCtx = new (window.webkitAudioContext || window.AudioContext)(),
  audioSfxPistolShot;

function audioInit() {
  sonantxrGenerateSong(audioCtx, backgroundMusic, function(buffer) {
    audioPlay(buffer, true);
  });
  sonantxrGenerateSound(audioCtx, pistolShot, 160, function(buffer) {
    audioSfxPistolShot = buffer;
  });
}

function audioPlay(buffer, loop) {
  var source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(audioCtx.destination);
  source.start();
}
