# FireRisk Studio Cristian & Asociados | Calculadora de Carga Térmica y Riesgo de Incendio

Aplicación web estática, minimalista y responsiva con una estética de **telemetría técnica y seguridad contra incendios**, diseñada para el cálculo paramétrico de Carga de Fuego ponderada, potencial térmico e Índice de Riesgo e ignitabilidad de materiales y entornos según normativas técnicas (IRAM 3528, Ley 19.587 / Dec. 351/79 y NFPA).

---

## 🎨 Identidad Visual y Detalles Representativos

A diferencia del formato plano de tablas genéricas, la interfaz incorpora elementos visuales representativos de la termodinámica del fuego:

- **Paleta de Telemetría Térmica**: Fondo grafito/pizarra técnico con acentos luminosos en ámbar, naranja fuego y rojo ignición.
- **Detalles Representativos de Fuego**:
  - Emblema con gradiente térmico dinámico y halo de radiación que intensifica su pulso según el nivel de peligro.
  - Indicadores con chips temáticos para cada material: 🔥 R1 Explosivo, ⚡ R2 Inflamable, 🪵 R3 Muy Combustible, 📦 R4 Combustible y 🛡️ R5 Poco Combustible.
  - Medidor de Amenaza Térmica con barra de gradiente multicolor (Verde Seguro $\rightarrow$ Ámbar Moderado $\rightarrow$ Naranja Alto $\rightarrow$ Rojo Crítico).
  - Terminal interactiva para la verificación de fórmulas y constantes de combustión.
- **Soporte Tema Oscuro / Claro**: Selector integrado en el encabezado con memoria local (`localStorage`).
- **Eficiencia Tabular**: Entradas con tipografía monospace (`JetBrains Mono`), alineación numérica estricta y foco visual destacado.
- **Generador de Informe Técnico / Planilla Oficial (PDF A4)**:
  - Vista previa modal interactiva que simula una hoja membretada oficial.
  - Personalización en vivo de campos: Razón Social / Establecimiento, Profesional Actuante, Matrícula de HyST y N° de Informe.
  - Formato homologado según Ley 19.587 / Dec. 351/79 con desglose de inventario, memoria matemática paso a paso, cuadro de condición F y doble bloque de firmas.

---

## 📁 Organización del Proyecto

Estructura modular, limpia y eficiente para sitios web estáticos:

```text
fire-calculator/
├── docs/
│   └── version-previa.png      # Imagen de referencia original
├── assets/
│   ├── css/
│   │   ├── styles.css          # Estilos de telemetría térmica, componentes y adaptabilidad responsive
│   │   └── print.css           # Hoja de estilos @media print para generar informes técnicos PDF limpios
│   └── js/
│       ├── materials.js        # Catálogo de combustibles, poderes caloríficos y clasificación de riesgos
│       ├── calculator.js       # Motor matemático de cálculo de cargas, equivalencias e índice de riesgo
│       └── app.js              # Controlador de interfaz, eventos reactivos, tema y exportaciones
├── index.html                  # Estructura principal y paneles de telemetría
└── README.md                   # Documentación técnica del proyecto
```

---

## 🔬 Fórmulas y Cálculos Implementados

De acuerdo a la imagen de referencia `docs/version-previa.png` y la reglamentación técnica:

1. **Carga de Calor por Material ($Mcal$):**
   $$Q_i = \text{Cantidad}_i \times \text{Poder Calorífico}_i$$

2. **Carga de Calor Total ($Mcal$):**
   $$Q_{\text{total}} (\text{Mcal}) = \sum Q_i$$

3. **Conversión a Megajulios ($MJ$):**
   $$1 \text{ Mcal} = 4{,}1855 \text{ MJ}$$
   $$Q_{\text{total}} (\text{MJ}) = Q_{\text{total}} (\text{Mcal}) \times 4{,}1855$$

4. **Densidad de Carga Térmica ($MJ/m^2$):**
   $$q (\text{MJ/m}^2) = \frac{Q_{\text{total}} (\text{MJ})}{\text{Superficie}}$$

5. **Carga de Fuego Equivalente en Madera Patrón ($kg/m^2$):**
   $$\text{Patrón Madera} = 4{,}4 \text{ Mcal/kg} \quad (18{,}41 \text{ MJ/kg})$$
   $$Q_f (\text{kg/m}^2) = \frac{Q_{\text{total}} (\text{Mcal})}{\text{Superficie} \times 4{,}4}$$

6. **Índice de Riesgo y Probabilidad de Ignición / Propagación (%):**
   Determinado dinámicamente combinando:
   - Densidad de Carga de Fuego ($kg/m^2$).
   - Reactividad intrínseca de los materiales (R1 Explosivo, R2 Inflamable, R3 Muy Combustible, R4 Combustible, R5 Poco Combustible).
   - Tipo de actividad / sector y características de los ocupantes.
   - Requerimiento estructural de resistencia al fuego ($F\text{-}30, F\text{-}60, F\text{-}90, F\text{-}120, F\text{-}180$).
   - Dotación extintora mínima requerida por superficie y potencial extintor.

---

## 🚀 Características Principales

- **Estética Fiel a Excel**: Encabezados amarillos característicos, bordes definidos, números tabulares alineados y navegación intuitiva.
- **Cálculo Reactivo en Vivo**: Los resultados se actualizan instantáneamente al escribir o modificar cualquier celda sin recargar la página.
- **Autocompletado de Materiales**: Datalist integrado con materiales frecuentes (madera, algodón, seda, plásticos, solventes, etc.) que asigna automáticamente su poder calorífico y nivel de riesgo.
- **Exportación Dual**:
  - **Descargar PDF / Imprimir**: Formato oficial con pie para firma profesional de Higiene y Seguridad.
  - **Exportar Excel (.csv)**: Genera un archivo CSV con formato UTF-8 listo para abrir directamente en Microsoft Excel.
- **Cargar Ejemplo**: Botón en la barra superior para restablecer los valores idénticos a los observados en la captura de `docs/version-previa.png`.

---

## 💻 Cómo Ejecutarlo

Al tratarse de una web estática pura (HTML5, CSS3 y JavaScript), no requiere compilación ni dependencias de Node.js:

1. Simplemente haz doble clic en `index.html` para abrirlo en cualquier navegador (Chrome, Edge, Firefox).
2. O levanta un servidor local liviano si lo prefieres:
   ```bash
   # En Windows PowerShell / CMD con Python instalado:
   python -m http.server 8000
   ```
   Y accede en tu navegador a `http://localhost:8000`.

