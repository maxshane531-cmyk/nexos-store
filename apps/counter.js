// COUNTER.APP · demo con D-Pad
var W = 240, H = 320;
var count = 0;

function main() {
  __hw_log('counter abierta');
  count = 0;
  beepUI(1400, 60, 160, 0);
}

function draw() {
  clear(0x1082);

  // Header
  rect(0, 0, W, 22, 0x0000);
  rect(0, 21, W, 1, 0x2945);
  drawText(8, 8, 'COUNTER', 0x07E0);

  // Número grande en el centro
  var s = '' + count;
  var scale = 5;
  var tw = s.length * 6 * scale - scale;
  var x = Math.floor((W - tw) / 2);
  var y = 130;

  var color = count < 0 ? 0xF800 : (count === 0 ? 0xFFFF : 0x07E0);
  drawText(x, y, s, color, scale);

  // Pistas
  drawText(24, 220, 'ARRIBA = +1', 0xBDD7);
  drawText(24, 236, 'ABAJO  = -1', 0xBDD7);
  drawText(24, 252, 'OK     = 0',  0xBDD7);

  // Footer
  rect(0, H - 24, W, 24, 0x0000);
  rect(0, H - 24, W, 1, 0x2945);
  drawText(8, H - 16, 'BACK=SALIR', 0xCE79);
}

function frame() {
  draw();

  var k = r16(IO + IO_KEY);
  if (k === 0) return;

  if (k === K_UP)   { count++; needRedraw(); beepUI(900, 15, 80, 0); }
  if (k === K_DOWN) { count--; needRedraw(); beepUI(700, 15, 80, 0); }
  if (k === K_OK)   { count = 0; needRedraw(); beepUI(1200, 20, 100, 0); }
  if (k === K_BACK) { beepUI(600, 30, 120, 0); __os_exit(); }
}

function needRedraw() { /* el draw es cada frame, no hace falta */ }
