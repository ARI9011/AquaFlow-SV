
#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 20, 4);

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

// Ventana de medición en ms
const unsigned long VENTANA = 1000;

volatile unsigned long pulsos = 0;
volatile unsigned long ultimoPulsoMicros = 0;

// Filtra ruido eléctrico/rebote en la señal del sensor de flujo: a la
// velocidad máxima real del YF-S201 (~30 L/min) un pulso legítimo llega
// cada ~4.4 ms; cualquier pulso más rápido que esto es ruido, no agua.
const unsigned long PULSO_MIN_INTERVALO_US = 1000;

// Con pocos pulsos en la ventana (1-2) el caudal calculado ya es casi cero,
// pero para que el estado no oscile por ruido residual, se ignoran del todo.
const unsigned long PULSOS_MIN_VALIDOS = 3;

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
  Serial.begin(9600);

  lcd.init();
  lcd.backlight();

  lcd.setCursor(2, 0);
  lcd.print("ELECTROALL");
  delay(1500);
  lcd.clear();

  pinMode(SENSOR, INPUT_PULLUP);
  pinMode(PULSADOR, INPUT_PULLUP);

  pinMode(RELE, OUTPUT);
  digitalWrite(RELE, LOW);

  attachInterrupt(digitalPinToInterrupt(SENSOR), contarPulsos, RISING);

  tiempoVentana = millis();
}

void loop() {

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
  lcd.setCursor(0, fila);
  lcd.print(texto);
}

void contarPulsos() {
  unsigned long ahora = micros();
  if (ahora - ultimoPulsoMicros < PULSO_MIN_INTERVALO_US) return; // demasiado rápido: ruido, no agua
  ultimoPulsoMicros = ahora;
  pulsos++;
}