let audioCtx = new (window.webkitAudioContext || window.AudioContext)(),
  audioSfxPistolShot,
  audioSfxPlayerDamaged;

function audioInit() {
  sonantxrGenerateSong(audioCtx, backgroundMusic, function(buffer) {
    audioPlay(buffer, true);
  });
  sonantxrGenerateSound(audioCtx, pistolShot, 160, function(buffer) {
    audioSfxPistolShot = buffer;
  });
  sonantxrGenerateSound(audioCtx, playerDamaged, 120, function(buffer) {
    audioSfxPlayerDamaged = buffer;
  });
}

function audioPlay(buffer, loop) {
  var source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(audioCtx.destination);
  source.start();
}
