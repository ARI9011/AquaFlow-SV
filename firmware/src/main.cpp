/*
 * AquaFlow SV — Nodo de telemetría (Arduino Mega 2560)
 * Lee pulsos del sensor de flujo (YF-S201), calcula litros,
 * muestra en LCD I2C y controla el relé.
 *
 * Migrado desde electroalltest1.ino para PlatformIO / VS Code.
 */

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 20, 4);

const byte SENSOR = 2;   // En el Mega, el pin 2 = interrupción INT0
const byte RELE   = 3;

volatile unsigned long pulsos = 0;

unsigned long tiempoLCD = 0;
unsigned long tiempoSerial = 0;

// Prototipo de la ISR (obligatorio en .cpp; en .ino era automático)
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

  pinMode(RELE, OUTPUT);
  digitalWrite(RELE, LOW);

  attachInterrupt(digitalPinToInterrupt(SENSOR), contarPulsos, RISING);
}

void loop() {
  float litros = pulsos / 450.0;  // YF-S201: ~450 pulsos por litro

  // --- LCD ---
  if (millis() - tiempoLCD >= 250) {
    tiempoLCD = millis();

    lcd.setCursor(0, 0);
    lcd.print("Pulsos: ");
    lcd.print(pulsos);
    lcd.print("      ");

    lcd.setCursor(0, 1);
    lcd.print("Litros: ");
    lcd.print(litros, 3);
    lcd.print(" L     ");

    if (litros >= 5.0) {
      lcd.setCursor(0, 2);
      lcd.print("RELE ACTIVADO ");
    } else {
      lcd.setCursor(0, 2);
      lcd.print("RELE APAGADO  ");
    }
  }

  // --- Monitor Serie ---
  if (millis() - tiempoSerial >= 500) {
    tiempoSerial = millis();

    Serial.print("Pulsos: ");
    Serial.print(pulsos);
    Serial.print("   Litros: ");
    Serial.print(litros, 3);
    Serial.print("   Estado: ");
    Serial.println(digitalRead(RELE) == HIGH ? "RELE ON" : "RELE OFF");
  }

  // --- Control del relé ---
  if (litros >= 1.0) {
    digitalWrite(RELE, HIGH);
  } else {
    digitalWrite(RELE, LOW);
  }
}

void contarPulsos() {
  pulsos++;
}
