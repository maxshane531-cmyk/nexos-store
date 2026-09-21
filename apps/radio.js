// =====================================================
// RADIO.APP · radio por internet
// =====================================================
var W = 240, H = 320;

var STATIONS = [
  { name: 'GROOVE SALAD',  genre: 'ambient/electronica',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    meta: 'https://somafm.com/songs/groovesalad.json' },
  { name: 'DRONE ZONE',    genre: 'ambient/drone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    meta: 'https://somafm.com/songs/dronezone.json' },
  { name: 'DEEP SPACE ONE', genre: 'ambient/space',
    url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    meta: 'https://somafm.com/songs/deepspaceone.json' },
  { name: 'INDIE POP ROCKS', genre: 'indie/pop',
    url: 'https://ice1.somafm.com/indiepop-128-mp3',
    meta: 'https://somafm.com/songs/indiepop.json' },
  { name: 'SECRET AGENT', genre: 'lounge/spy',
    url: 'https://ice1.somafm.com/secretagent-128-mp3',
    meta: 'https://somafm.com/songs/secretagent.json' },
  { name: 'BOOT LIQUOR', genre: 'blues/country',
    url: 'https://ice1.somafm.com/bootliquor-128-mp3',
    meta: 'https://somafm.com/songs/bootliquor.json' },
  { name: 'LUSH', genre: 'vocal/chill',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    meta: 'https://somafm.com/songs/lush.json' },
  { name: 'METAL DETECTOR', genre: 'metal',
    url: 'https://ice1.somafm.com/metal-128-mp3',
    meta: 'https://somafm.com/songs/metal.json' }
];

var sel = 0;
var currentIdx = -1;
var nowPlaying = null;   // { title, artist, album }
var needRedraw = true;
var lastMetaRefresh = 0;

function main() {
  __hw_log('radio abierta');
  sel = 0;
  currentIdx = -1;
  nowPlaying = null;
  needRedraw = true;
  beepUI(1400, 60, 160, 0);
  radioVolume(200);
}

// -----------------------------------------------------
// Dibujo
// -----------------------------------------------------
function drawHeader() {
  rect(0, 0, W, 26, 0x0000);
  rect(0, 25, W, 1, 0x2945);
  drawText(8, 10, 'RADIO', 0x07E0);

  // Estado global
  var st = radioState();
  var label, color;
  if (st === 0)      { label = 'OFF';     color = 0x8410; }
  else if (st === 1) { label = 'CONECTANDO'; color = 0xFFE0; }
  else if (st === 2) { label = 'EN VIVO';  color = 0xF800; }
  else               { label = 'ERROR';    color = 0xF800; }

  // Punto parpadeante si playing
  if (st === 2) {
    var phase = Math.floor(r16(IO + IO_TICK) / 20) % 2;
    if (phase === 0) rect(W - 8 - label.length * 6 - 14, 12, 5, 5, 0xF800);
  }

  var lw = label.length * 6 - 6;
  drawText(W - 8 - lw, 10, label, color);
}

function drawStations() {
  var y0 = 32;
  var rowH = 26;
  var visible = 8;
  var start = 0;
  if (sel >= visible) start = sel - visible + 1;

  for (var i = 0; i < visible; i++) {
    var idx = start + i;
    if (idx >= STATIONS.length) break;

    var s = STATIONS[idx];
    var y = y0 + i * rowH;
    var isSel = (idx === sel);
    var isPlaying = (idx === currentIdx);

    if (isSel) {
      rect(4, y, W - 8, rowH - 2, 0x0320);
      rect(4, y, 3, rowH - 2, 0x07E0);
      rect(4, y, W - 8, 1, 0x07E0);
      rect(4, y + rowH - 3, W - 8, 1, 0x07E0);
    } else if (isPlaying) {
      rect(4, y, W - 8, rowH - 2, 0x2104);
      rect(4, y, 3, rowH - 2, 0xF800);
    }

    var fg = isSel ? 0xFFFF : (isPlaying ? 0xBDD7 : 0xCE79);
    drawText(12, y + 5, s.name, fg);

    // Género pequeño a la derecha
    var g = s.genre;
    if (g.length > 16) g = g.substring(0, 15) + '\u2026';
    var gw = g.length * 6 - 6;
    drawText(W - 10 - gw, y + 5, g, isSel ? 0x8410 : 0x630C);

    // Indicador EN VIVO
    if (isPlaying && radioState() === 2) {
      var lbl = 'AIR';
      var lw = lbl.length * 6 - 6;
      rect(W - 12 - lw - 4, y + 15, lw + 8, 8, 0xF800);
      drawText(W - 12 - lw, y + 16, lbl, 0xFFFF);
    }
  }

  // Scrollbar
  if (STATIONS.length > visible) {
    var trackY = y0;
    var trackH = visible * rowH;
    var thumbH = Math.max(16, Math.floor(trackH * visible / STATIONS.length));
    var thumbY = trackY + Math.floor((trackH - thumbH) * start / Math.max(1, STATIONS.length - visible));
    rect(W - 3, trackY, 2, trackH, 0x2124);
    rect(W - 3, thumbY, 2, thumbH, 0x07E0);
  }
}

function drawNowPlaying() {
  var barY = H - 70;
  rect(0, barY, W, 46, 0x0000);
  rect(0, barY, W, 1, 0x2945);

  if (currentIdx < 0) {
    drawText(60, barY + 16, 'SIN EMISORA', 0x8410);
    return;
  }

  var s = STATIONS[currentIdx];
  drawText(8, barY + 6, s.name, 0x07E0);

  if (nowPlaying) {
    var line1 = nowPlaying.artist + ' - ' + nowPlaying.title;
    if (line1.length > 36) line1 = line1.substring(0, 35) + '\u2026';
    drawText(8, barY + 20, line1, 0xFFFF);

    if (nowPlaying.album) {
      var line2 = nowPlaying.album;
      if (line2.length > 36) line2 = line2.substring(0, 35) + '\u2026';
      drawText(8, barY + 32, line2, 0x8410);
    }
  } else if (radioMetaStatus() === 3) {
    drawText(8, barY + 20, 'CARGANDO INFO...', 0x8410);
  } else {
    drawText(8, barY + 20, 'SIN INFO DISPONIBLE', 0x8410);
  }

  // Indicador de señal
  var sigY = barY + 12;
  for (var i = 0; i < 4; i++) {
    var h = 3 + i * 2;
    var active = (radioState() === 2 && Math.floor(r16(IO + IO_TICK) / 12 + i) % 4 > i - 1);
    rect(W - 20 + i * 4, sigY + (12 - h), 2, h, active ? 0xF800 : 0x4208);
  }
}

function drawSoftkeys(hint) {
  rect(0, H - 24, W, 24, 0x0000);
  rect(0, H - 24, W, 1, 0x2945);
  drawText(6, H - 16, hint, 0xCE79);
}

function drawAll() {
  clear(0x1082);
  drawHeader();
  drawStations();
  drawNowPlaying();

  var hint;
  if (currentIdx < 0) {
    hint = 'OK=TOCAR  BACK=SALIR';
  } else {
    hint = 'OK=PAUSA  IZQ=STOP  BACK=SALIR';
  }
  drawSoftkeys(hint);
}

// -----------------------------------------------------
// Polling de metadata
// -----------------------------------------------------
function pollMeta() {
  var ms = radioMetaStatus();
  if (ms === 1) {
    var raw = radioTakeMeta();
    try {
      var data = JSON.parse(raw);
      var song = data.songs && data.songs[0];
      if (song) {
        nowPlaying = {
          title: song.title || '?',
          artist: song.artist || '?',
          album: song.album || ''
        };
      }
    } catch (e) {}
    needRedraw = true;
  }
}

// -----------------------------------------------------
// Frame
// -----------------------------------------------------
function frame() {
  pollMeta();

  // Refresco de metadata cada ~20 segundos
  var tick = r16(IO + IO_TICK);
  if (radioState() === 2) {
    if (tick - lastMetaRefresh > 1200) {
      radioRefreshMeta();
      lastMetaRefresh = tick;
    }
  }

  if (needRedraw) {
    drawAll();
    needRedraw = false;
  } else if (radioState() === 2 || radioState() === 1) {
    // Redibujo ligero para animación de la señal
    if (tick % 8 === 0) {
      drawHeader();
      drawNowPlaying();
    }
  }

  var k = r16(IO + IO_KEY);
  if (k === 0) return;

  if (k === K_UP) {
    if (currentIdx === sel && radioState() === 2) {
      // Ignorar navegación mientras suena la seleccionada
    }
    sel = (sel - 1 + STATIONS.length) % STATIONS.length;
    needRedraw = true;
    beepUI(700, 12, 70, 0);
    return;
  }
  if (k === K_DOWN) {
    sel = (sel + 1) % STATIONS.length;
    needRedraw = true;
    beepUI(700, 12, 70, 0);
    return;
  }

  if (k === K_OK) {
    if (currentIdx === sel && radioState() === 2) {
      // Pausa
      radioStop();
      currentIdx = -1;
      nowPlaying = null;
      needRedraw = true;
      beepUI(500, 30, 120, 0);
    } else {
      var s = STATIONS[sel];
      currentIdx = sel;
      nowPlaying = null;
      lastMetaRefresh = r16(IO + IO_TICK);
      needRedraw = true;
      beepUI(1400, 40, 160, 0);
      radioPlay(s.url, s.meta);
    }
    return;
  }

  if (k === K_LEFT) {
    if (currentIdx >= 0) {
      radioStop();
      currentIdx = -1;
      nowPlaying = null;
      needRedraw = true;
      beepUI(400, 40, 120, 0);
    }
    return;
  }

  if (k === K_BACK) {
    if (currentIdx >= 0) radioStop();
    beepUI(600, 30, 120, 0);
    __os_exit();
    return;
  }
}

// NEXOS-ICON BEGIN
// palette=0000,07E0,FFFF,F800,8410,FFE0
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000111111000000000000000
// row=00000000001111111100000000000000
// row=00000000011111111110000000000000
// row=00000000111000000111000000000000
// row=00000001100000000001100000000000
// row=00000011000000000000110000000000
// row=00000010000000000000010000000000
// row=00000010000000000000010000000000
// row=00000011000000000000110000000000
// row=00000001100000000001100000000000
// row=00000000111000000111000000000000
// row=00000000011111111110000000000000
// row=00000000001111111100000000000000
// row=00000000000111111000000000000000
// row=00000000000000000000000000000000
// row=00000000000003300000000000000000
// row=00000000000003300000000000000000
// row=00000000000033000000000000000000
// row=00000000000033000000000000000000
// row=00000000000330000000000000000000
// row=00000000000330000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// NEXOS-ICON END