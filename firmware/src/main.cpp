
#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <avr/wdt.h>

// Los módulos I2C para LCD traen el expansor PCF8574 (direcciones 0x20-0x27)
// o PCF8574A (0x38-0x3F) según el lote; se escanea todo ese rango en vez de
// asumir 0x27 fijo (causa típica de "la LCD no muestra nada" o se queda en
// recuadros en blanco sin inicializar: dirección equivocada).
LiquidCrystal_I2C* lcd = nullptr;

uint8_t detectarDireccionLCD() {
  for (uint8_t addr = 0x20; addr <= 0x27; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) return addr;
  }
  for (uint8_t addr = 0x38; addr <= 0x3F; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) return addr;
  }
  return 0x00; // ningún dispositivo respondió: problema de cableado/alimentación, no de dirección
}

const byte SENSOR = 2;
const byte RELE = 3;
const byte PULSADOR = 4;   // pulsador entre pin 4 y GND

// Calibración del sensor (pulsos por litro)
const float PULSOS_POR_LITRO = 450.0;

// Umbrales de caudal en L/min (ajústalos a tu instalación).
// El YF-S201 mide bien entre ~1 y 30 L/min. 5/12 (original) hacía que casi
// cualquier flujo bajo ya marcara MEDIO/FUERTE; 10/20 (segundo intento) se
// pasó al otro lado y con flujo normal se quedaba en DEBIL. Punto medio: 7/16.
const float UMBRAL_MEDIO  = 7.0;    // por debajo = DEBIL
const float UMBRAL_FUERTE = 16.0;   // por encima = FUERTE

// Ventana de medición en ms. Antes 1000ms: recalculaba una vez por segundo,
// lo que se sentía lento al abrir/cerrar el agua. Con 400ms reacciona más
// rápido a costa de un poco más de ruido entre lecturas.
const unsigned long VENTANA = 400;

volatile unsigned long pulsos = 0;
volatile unsigned long ultimoPulsoMicros = 0;

// Filtra ruido eléctrico/rebote en la señal del sensor de flujo: a la
// velocidad máxima real del YF-S201 (~30 L/min) un pulso legítimo llega
// cada ~4.4 ms; cualquier pulso más rápido que esto es ruido, no agua.
const unsigned long PULSO_MIN_INTERVALO_US = 1000;

// Mínimo de pulsos por ventana para no confundir ruido residual con flujo
// real. Se mantiene igual en pulsos/segundo que antes (3 en 1000ms) pero
// ajustado a la ventana más corta de 400ms.
const unsigned long PULSOS_MIN_VALIDOS = 2;

unsigned long tiempoVentana = 0;
float caudal = 0.0;   // L/min

// Estado del relé y antirrebote del pulsador
bool releEncendido = false;
bool estadoAnterior = HIGH;
unsigned long tiempoRebote = 0;
const unsigned long REBOTE = 50;

// Prototipos (obligatorios en .cpp; en .ino se generaban automáticamente)
void lcdLinea(uint8_t fila, String texto);
void contarPulsos();

void setup() {
  wdt_disable(); // por si el reinicio anterior lo dejó activo, evita un bucle de reinicios

  Serial.begin(9600);

  Wire.begin();
  // Sin esto, un cuelgue del bus I2C (ruido eléctrico, cable suelto) deja a
  // Wire.endTransmission() esperando para siempre y congela todo el sketch
  // -incluido el envío por Serial-, que es justo el síntoma de "deja de
  // mandar datos y no se recupera solo". Con el timeout, el bus se resetea
  // en vez de bloquear.
  Wire.setWireTimeout(3000, true);
  uint8_t direccionLCD = detectarDireccionLCD();
  if (direccionLCD == 0x00) {
    Serial.println("LCD I2C: ningun dispositivo respondio en el bus (revisar cableado SDA/SCL/VCC/GND del modulo)");
    direccionLCD = 0x27; // se sigue con la más común para no dejar el puntero nulo
  } else {
    Serial.print("LCD I2C detectada en 0x");
    Serial.println(direccionLCD, HEX);
  }
  lcd = new LiquidCrystal_I2C(direccionLCD, 20, 4);
  lcd->init();
  lcd->backlight();

  lcd->setCursor(2, 0);
  lcd->print("ELECTROALL");
  delay(1500);
  lcd->clear();

  pinMode(SENSOR, INPUT_PULLUP);
  pinMode(PULSADOR, INPUT_PULLUP);

  pinMode(RELE, OUTPUT);
  digitalWrite(RELE, LOW);

  attachInterrupt(digitalPinToInterrupt(SENSOR), contarPulsos, RISING);

  tiempoVentana = millis();

  // Red de seguridad: si loop() se llega a colgar por cualquier motivo
  // (I2C, lo que sea) y no se llama a wdt_reset() en 4s, el watchdog
  // reinicia la placa solo en vez de quedarse muerta hasta desenchufarla.
  wdt_enable(WDTO_4S);
}

void loop() {
  wdt_reset();

  // --- Lectura del pulsador (toggle con antirrebote) ---
  bool lectura = digitalRead(PULSADOR);

  // Flanco de bajada: el botón pasa de suelto (HIGH) a presionado (LOW)
  if (lectura == LOW && estadoAnterior == HIGH && (millis() - tiempoRebote) > REBOTE) {
    releEncendido = !releEncendido;
    digitalWrite(RELE, releEncendido ? HIGH : LOW);
    tiempoRebote = millis();
  }
  estadoAnterior = lectura;

  // --- Medición de caudal cada ventana ---
  if (millis() - tiempoVentana >= VENTANA) {

    // Lectura segura del contador
    noInterrupts();
    unsigned long pulsosVentana = pulsos;
    pulsos = 0;
    interrupts();

    tiempoVentana = millis();

    // Muy pocos pulsos en la ventana = ruido residual, no flujo real.
    if (pulsosVentana < PULSOS_MIN_VALIDOS) pulsosVentana = 0;

    // Litros en la ventana -> caudal en L/min
    float litrosVentana = pulsosVentana / PULSOS_POR_LITRO;
    caudal = litrosVentana * (60000.0 / VENTANA);

    // Clasificación del caudal
    String estado;

    if (caudal < 0.3) {
      estado = "SIN FLUJO";
    } else if (caudal < UMBRAL_MEDIO) {
      estado = "DEBIL";
    } else if (caudal < UMBRAL_FUERTE) {
      estado = "MEDIO";
    } else {
      estado = "FUERTE";
    }

    // LCD
    lcdLinea(0, "Caudal: " + String(caudal, 1) + " L/min");
    lcdLinea(1, "Estado: " + estado);
    lcdLinea(2, "Rele:   " + String(releEncendido ? "ON" : "OFF"));
    lcdLinea(3, "Pulsos/s: " + String((int)(pulsosVentana * 1000.0 / VENTANA)));

    // Monitor Serie (lectura humana)
    Serial.print("Caudal: ");
    Serial.print(caudal, 2);
    Serial.print(" L/min   Estado: ");
    Serial.print(estado);
    Serial.print("   Rele: ");
    Serial.println(releEncendido ? "ON" : "OFF");

    // Línea de datos estructurada (JSON) para que la app la lea de forma confiable.
    // Prefijo "DATA:" para que el puente en la PC la distinga de cualquier otro texto.
    Serial.print("DATA:{\"caudal\":");
    Serial.print(caudal, 2);
    Serial.print(",\"estado\":\"");
    Serial.print(estado);
    Serial.print("\",\"rele\":");
    Serial.print(releEncendido ? "true" : "false");
    Serial.println("}");
  }
}

// Imprime una línea de 20 caracteres exactos (rellena con espacios)
void lcdLinea(uint8_t fila, String texto) {
  while (texto.length() < 20) texto += " ";
  if (texto.length() > 20) texto = texto.substring(0, 20);
  lcd->setCursor(0, fila);
  lcd->print(texto);
}

void contarPulsos() {
  unsigned long ahora = micros();
  if (ahora - ultimoPulsoMicros < PULSO_MIN_INTERVALO_US) return; // demasiado rápido: ruido, no agua
  ultimoPulsoMicros = ahora;
  pulsos++;
}