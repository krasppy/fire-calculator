/**
 * Base de datos de materiales combustibles y normativas de riesgo de incendio.
 * Basado en Normativa IRAM 3528, Ley 19587 (Dec. 351/79) y tablas internacionales NFPA.
 */

const MATERIALS_DATABASE = [
  { id: 'madera_cama', name: 'Madera de la cama', calorificPower: 4.4, risk: 3, category: 'Mobiliario' },
  { id: 'colchon_algodon', name: 'Colchón (algodón)', calorificPower: 4.0, risk: 3, category: 'Mobiliario' },
  { id: 'sabanas_seda', name: 'Sábanas (seda)', calorificPower: 4.0, risk: 4, category: 'Textiles' },
  { id: 'madera_pino', name: 'Madera (pino / álamo)', calorificPower: 4.4, risk: 3, category: 'Madera' },
  { id: 'madera_dura', name: 'Madera dura (roble / eucalipto)', calorificPower: 4.6, risk: 3, category: 'Madera' },
  { id: 'papel_libros', name: 'Papel y libros compactos', calorificPower: 4.0, risk: 4, category: 'Papel' },
  { id: 'carton', name: 'Cartón en cajas', calorificPower: 3.8, risk: 4, category: 'Papel' },
  { id: 'polietileno', name: 'Plásticos (Polietileno / PP)', calorificPower: 11.0, risk: 3, category: 'Plásticos' },
  { id: 'poliuretano', name: 'Goma espuma / Poliuretano', calorificPower: 6.5, risk: 3, category: 'Plásticos' },
  { id: 'telgopor', name: 'Poliestireno expandido (Telgopor)', calorificPower: 9.6, risk: 2, category: 'Plásticos' },
  { id: 'pvc', name: 'PVC / Vinilo', calorificPower: 4.5, risk: 4, category: 'Plásticos' },
  { id: 'algodon_textil', name: 'Textiles de algodón', calorificPower: 4.0, risk: 3, category: 'Textiles' },
  { id: 'lana', name: 'Lana / Fieltro', calorificPower: 4.8, risk: 4, category: 'Textiles' },
  { id: 'caucho_goma', name: 'Caucho / Neumáticos', calorificPower: 8.5, risk: 3, category: 'Gomas' },
  { id: 'aceite_vegetal', name: 'Aceites y grasas vegetales', calorificPower: 9.3, risk: 3, category: 'Líquidos' },
  { id: 'alcohol_etilico', name: 'Alcohol etílico (solvente)', calorificPower: 6.4, risk: 2, category: 'Líquidos inflamables' },
  { id: 'gasolina_nafta', name: 'Gasolina / Nafta / Diluyentes', calorificPower: 10.5, risk: 2, category: 'Líquidos inflamables' },
  { id: 'gasoil', name: 'Gasoil / Diésel', calorificPower: 10.2, risk: 2, category: 'Líquidos combustibles' },
  { id: 'gas_envasado', name: 'Gas licuado / Propano / Butano', calorificPower: 11.9, risk: 1, category: 'Gases' },
  { id: 'personalizado', name: 'Otro / Personalizado...', calorificPower: 4.0, risk: 3, category: 'Personalizado' }
];

const RISK_LEVELS_INFO = {
  1: {
    name: 'R1 - Explosivo',
    short: 'R1',
    description: 'Sustancias o mezclas que pueden reaccionar instantáneamente liberando gases a alta temperatura y presión.',
    ignitability: 'Extrema',
    factor: 1.6
  },
  2: {
    name: 'R2 - Inflamable',
    short: 'R2',
    description: 'Líquidos con punto de inflamación bajo (< 38°C) o gases con ignición casi inmediata a temperatura ambiente.',
    ignitability: 'Muy Alta',
    factor: 1.35
  },
  3: {
    name: 'R3 - Muy Combustible',
    short: 'R3',
    description: 'Materiales sólidos que en contacto con llama o fuente calórica arden activamente y propagan fuego rápidamente.',
    ignitability: 'Alta',
    factor: 1.1
  },
  4: {
    name: 'R4 - Combustible',
    short: 'R4',
    description: 'Materiales que queman de forma sostenida pero cuya combustión es moderada o requieren ignición prolongada.',
    ignitability: 'Moderada',
    factor: 0.85
  },
  5: {
    name: 'R5 - Poco Combustible',
    short: 'R5',
    description: 'Materiales difícilmente inflamables que se carbonizan de forma lenta o se apagan al retirar la fuente.',
    ignitability: 'Baja',
    factor: 0.6
  }
};

const OCCUPANCY_TYPES = [
  { id: 'normal', name: 'Habitantes hombres y mujeres jóvenes sin limitaciones', factor: 1.0 },
  { id: 'vulnerable', name: 'Personas de edad avanzada, niños o movilidad reducida', factor: 1.25 },
  { id: 'masiva', name: 'Alta concurrencia pública / Eventos / Espectáculos', factor: 1.35 },
  { id: 'restringida', name: 'Personal técnico capacitado / Operarios industriales', factor: 0.95 },
  { id: 'deshabitado', name: 'Depósito sin ocupación permanente / Almacén técnico', factor: 0.85 }
];

// Exportar para compatibilidad en entornos Node / Navegadores
if (typeof window !== 'undefined') {
  window.MATERIALS_DATABASE = MATERIALS_DATABASE;
  window.RISK_LEVELS_INFO = RISK_LEVELS_INFO;
  window.OCCUPANCY_TYPES = OCCUPANCY_TYPES;
} else if (typeof global !== 'undefined') {
  global.MATERIALS_DATABASE = MATERIALS_DATABASE;
  global.RISK_LEVELS_INFO = RISK_LEVELS_INFO;
  global.OCCUPANCY_TYPES = OCCUPANCY_TYPES;
}
