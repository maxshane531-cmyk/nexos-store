// =====================================================
// CLIMA.APP · clima real con Open-Meteo
// =====================================================
var W = 240, H = 320;
var view = 'loading';
var datos = null;
var errorMsg = '';
var needRedraw = true;

function main() {
  __hw_log('clima abierta');
  view = 'loading';
  needRedraw = true;
  beepUI(1400, 60, 160, 0);
  climaGeo();
}

// Mapeo de códigos WMO a texto
function codeToText(c) {
  if (c === 0) return 'DESPEJADO';
  if (c <= 3) return 'PARCIALMENTE NUBLADO';
  if (c === 45 || c === 48) return 'NIEBLA';
  if (c <= 57) return 'LLOVIZNA';
  if (c <= 67) return 'LLUVIA';
  if (c <= 77) return 'NIEVE';
  if (c <= 82) return 'CHAPARRONES';
  if (c <= 86) return 'NIEVE';
  if (c >= 95) return 'TORMENTA';
  return 'DESCONOCIDO';
}

// Icono en pixel-art (muy simple)
function drawWeatherIcon(cx, cy, code) {
  if (code === 0) { // Sol
    for (var i = -10; i <= 10; i++) rect(cx + i, cy, 1, 1, 0xFFE0);
    for (var i = -10; i <= 10; i++) rect(cx, cy + i, 1, 1, 0xFFE0);
    // Relleno circular
    for (var dy = -7; dy <= 7; dy++) {
      var dx = Math.floor(Math.sqrt(49 - dy*dy));
      rect(cx - dx, cy + dy, dx * 2 + 1, 1, 0xFFE0);
    }
  } else if (code <= 3) { // Nublado
    rect(cx - 15, cy - 5, 30, 15, 0xBDD7);
    rect(cx - 10, cy - 10, 20, 10, 0xBDD7);
    rect(cx - 12, cy + 5, 24, 3, 0x8410);
  } else { // Lluvia
    rect(cx - 15, cy - 10, 30, 15, 0x8410);
    for (var r = 0; r < 5; r++) {
      rect(cx - 10 + r * 5, cy + 8, 2, 6, 0x07FF);
    }
  }
}

function drawLoading() {
  clear(0x1082);
  rect(0, 0, W, 22, 0x0000);
  drawText(8, 8, 'CLIMA', 0x07E0);

  var dots = '';
  var phase = Math.floor(r16(IO + IO_TICK) / 20) % 4;
  for (var i = 0; i < phase; i++) dots += '.';

  drawText(50, 130, 'OBTENIENDO', 0x07E0);
  drawText(70, 150, 'DATOS' + dots, 0x07E0);
  drawText(30, 200, 'ESPERANDO GPS', 0x8410);

  rect(0, H - 24, W, 24, 0x0000);
  drawText(6, H - 16, 'BACK=SALIR', 0xCE79);
}

function drawError() {
  clear(0x1082);
  rect(0, 0, W, 22, 0x0000);
  drawText(8, 8, 'CLIMA', 0xF800);

  drawText(30, 100, 'ERROR', 0xF800);
  var m = errorMsg;
  if (m.length > 28) m = m.substring(0, 27) + '\u2026';
  drawText(20, 130, m, 0xBDD7);

  drawSoftkeys('OK=REINTENTAR  BACK=SALIR');
}

function drawMain() {
  clear(0x1082);
  rect(0, 0, W, 22, 0x0000);
  rect(0, 21, W, 1, 0x2945);
  drawText(8, 8, 'CLIMA', 0x07E0);

  // Actual
  var actual = datos.current;
  var temp = Math.round(actual.temperature_2m);
  var code = actual.weather_code;
  var text = codeToText(code);

  drawWeatherIcon(120, 70, code);

  drawText(70, 120, temp + '\u00B0C', 0xFFFF, 3);
  drawText(40, 150, text, 0xBDD7);

  // Detalles
  drawText(20, 180, 'ST', 0x8410);
  drawText(44, 180, Math.round(actual.apparent_temperature) + '\u00B0C', 0xFFFF);
  drawText(120, 180, 'HUM', 0x8410);
  drawText(150, 180, actual.relative_humidity_2m + '%', 0xFFFF);
  drawText(20, 196, 'VIENTO', 0x8410);
  drawText(80, 196, Math.round(actual.wind_speed_10m) + ' KM/H', 0xFFFF);

  // Pronóstico
  rect(20, 216, W - 40, 1, 0x2945);
  drawText(20, 224, 'PROXIMOS DIAS', 0x8410);

  var daily = datos.daily;
  for (var i = 1; i <= 3; i++) {
    if (!daily || !daily.time[i]) break;
    var y = 242 + (i - 1) * 18;
    drawText(20, y, daily.time[i].substring(5), 0xBDD7); // MM-DD
    drawText(80, y, Math.round(daily.temperature_2m_min[i]) + '\u00B0', 0x07FF);
    drawText(110, y, Math.round(daily.temperature_2m_max[i]) + '\u00B0', 0xF800);
    var dCode = daily.weather_code[i];
    drawText(150, y, codeToText(dCode).substring(0, 12), 0x8410);
  }

  rect(0, H - 24, W, 24, 0x0000);
  drawText(6, H - 16, 'BACK=SALIR', 0xCE79);
}

function drawSoftkeys(hint) {
  rect(0, H - 24, W, 24, 0x0000);
  rect(0, H - 24, W, 1, 0x2945);
  drawText(6, H - 16, hint, 0xCE79);
}

function frame() {
  var status = climaStatus();
  if (view === 'loading' && status === 1) {
    var raw = climaTake();
    try {
      datos = JSON.parse(raw);
      // Guardar resumen para el widget
try {
  var cache = {
    temp: Math.round(datos.current.temperature_2m),
    code: datos.current.weather_code,
    ts: Date.now()
  };
  __fs_write('CLIMA.JSON', JSON.stringify(cache));
} catch (e) {
  __hw_log('clima: no pude cachear');
}
      view = 'main';
      needRedraw = true;
      beepUI(1400, 40, 160, 0);
    } catch (e) {
      errorMsg = 'JSON invalido';
      view = 'error';
      needRedraw = true;
    }
  } else if (view === 'loading' && status === 2) {
    errorMsg = climaError();
    view = 'error';
    needRedraw = true;
    beepUI(300, 200, 180, 1);
  }

  if (needRedraw) {
    if (view === 'loading') drawLoading();
    else if (view === 'error') drawError();
    else if (view === 'main') drawMain();
    needRedraw = false;
  }

  if (view === 'loading' && r16(IO + IO_TICK) % 8 === 0) drawLoading();

  var k = r16(IO + IO_KEY);
  if (k === 0) return;

  if (k === K_BACK) {
    beepUI(600, 30, 120, 0);
    __os_exit();
  }
  if (k === K_OK && view === 'error') {
    view = 'loading';
    errorMsg = '';
    needRedraw = true;
    climaGeo();
    beepUI(1000, 30, 120, 0);
  }
}

// NEXOS-ICON BEGIN
// palette=0000,07E0,FFE0,BDD7,07FF,FFFF,8410
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000022222000000000000000
// row=00000000000222222200000000000000
// row=00000000002222222220000000000000
// row=00000000002222222220000000000000
// row=00000000002222222220000000000000
// row=00000000000222222200000000000000
// row=00000000000022222000000000000000
// row=00000000000000200000000000000000
// row=00000000000000300000000000000000
// row=00000000000000300000000000000000
// row=00000000000033333000000000000000
// row=00000000000333333300000000000000
// row=00000000003333333330000000000000
// row=00000000033333333333000000000000
// row=00000000333333333333300000000000
// row=00000003333333333333330000000000
// row=00000033333333333333333000000000
// row=00000033333333333333333000000000
// row=00000033333333333333333000000000
// row=00000000333333333333300000000000
// row=00000000000040000000000000000000
// row=00000000000400400000000000000000
// row=00000000040040040000000000000000
// row=00000004004004000000000000000000
// row=00000000000400400000000000000000
// row=00000000000040000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// row=00000000000000000000000000000000
// NEXOS-ICON END