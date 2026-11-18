/**
 * FireRisk Studio - Controlador de Aplicación y Telemetría Térmica
 * Gestiona la interfaz moderna, eventos reactivos, tema y cálculos dinámicos.
 */

// Estado inicial del sector
const DEFAULT_SECTOR = {
  name: 'Dormitorio Ppal.',
  code: '01',
  activity: 'Residencial',
  surface: 20,
  sectorRisk: 3,
  date: '2007-03-15',
  occupancyType: 'Habitantes hombres y mujeres jóvenes sin limitaciones.',
  occupancyFactor: 1.0
};

// Inventario de combustibles inicial (conforme a docs/version-previa.png)
const DEFAULT_FUELS = [
  {
    id: 'f1',
    name: 'Madera de la cama',
    risk: 3,
    quantity: 50,
    calorificPower: 4.4
  },
  {
    id: 'f2',
    name: 'Colchón (algodón)',
    risk: 3,
    quantity: 10,
    calorificPower: 4.0
  },
  {
    id: 'f3',
    name: 'Sábanas (seda)',
    risk: 4,
    quantity: 1,
    calorificPower: 4.0
  }
];

let fuels = JSON.parse(JSON.stringify(DEFAULT_FUELS));

// Utilidades de formato numérico técnico con coma decimal (1.234,56)
function formatNumber(num, decimals = 1) {
  if (isNaN(num) || num === null || num === undefined) return '0,0';
  const fixed = Number(num).toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
}

function parseInputNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  const normalized = String(val).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// Inicialización general al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSectorInputs();
  renderFuelsTable();
  recalculate();
  bindGlobalEvents();
});

/* ==========================================================================
   GESTIÓN DEL TEMA (OSCURO / CLARO)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('firerisk_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('firerisk_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('btnThemeToggle');
  if (!btn) return;
  if (theme === 'dark') {
    // Mostrar ícono de Sol para cambiar a claro
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    btn.title = "Cambiar a Modo Claro";
  } else {
    // Mostrar ícono de Luna para cambiar a oscuro
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    btn.title = "Cambiar a Modo Oscuro";
  }
}

/* ==========================================================================
   FORMULARIO Y ENTRADAS DEL SECTOR
   ========================================================================== */
function initSectorInputs() {
  document.getElementById('sectorName').value = DEFAULT_SECTOR.name;
  document.getElementById('sectorCode').value = DEFAULT_SECTOR.code;
  document.getElementById('sectorActivity').value = DEFAULT_SECTOR.activity;
  document.getElementById('sectorSurface').value = DEFAULT_SECTOR.surface;
  document.getElementById('sectorRisk').value = DEFAULT_SECTOR.sectorRisk;
  document.getElementById('sectorDate').value = DEFAULT_SECTOR.date;
  document.getElementById('sectorOccupancy').value = DEFAULT_SECTOR.occupancyType;

  const sectorInputs = [
    'sectorName', 'sectorCode', 'sectorActivity', 'sectorSurface',
    'sectorRisk', 'sectorDate', 'sectorOccupancy'
  ];

  sectorInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => recalculate());
      el.addEventListener('change', () => recalculate());
    }
  });
}

/* ==========================================================================
   TABLA DE COMBUSTIBLES Y MANIPULACIÓN REACTIVA
   ========================================================================== */
function renderFuelsTable() {
  const tbody = document.getElementById('fuelsTableBody');
  tbody.innerHTML = '';

  const badgeCount = document.getElementById('materialsCountBadge');
  if (badgeCount) {
    badgeCount.innerText = `${fuels.length} Combustible${fuels.length === 1 ? '' : 's'}`;
  }

  fuels.forEach((fuel, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;

    const q = parseInputNumber(fuel.quantity);
    const p = parseInputNumber(fuel.calorificPower);
    const heatLoad = q * p;

    tr.innerHTML = `
      <td>
        <input type="text" 
               class="table-input" 
               value="${escapeHtml(fuel.name)}" 
               placeholder="Nombre del material o combustible..."
               list="materialsPresetList"
               onchange="updateFuelField(${index}, 'name', this.value)"
               oninput="handleMaterialSelection(${index}, this)">
      </td>
      <td class="text-center">
        <select class="table-select font-mono text-center" onchange="updateFuelField(${index}, 'risk', this.value)">
          <option value="1" ${fuel.risk == 1 ? 'selected' : ''}>🔥 R1 (Explosivo)</option>
          <option value="2" ${fuel.risk == 2 ? 'selected' : ''}>⚡ R2 (Inflamable)</option>
          <option value="3" ${fuel.risk == 3 ? 'selected' : ''}>🪵 R3 (Muy Comb.)</option>
          <option value="4" ${fuel.risk == 4 ? 'selected' : ''}>📦 R4 (Combustible)</option>
          <option value="5" ${fuel.risk == 5 ? 'selected' : ''}>🛡️ R5 (Poco Comb.)</option>
        </select>
      </td>
      <td>
        <input type="number" 
               step="any" 
               min="0" 
               class="table-input font-mono text-right" 
               value="${fuel.quantity}" 
               oninput="updateFuelField(${index}, 'quantity', this.value)">
      </td>
      <td>
        <input type="number" 
               step="any" 
               min="0" 
               class="table-input font-mono text-right" 
               value="${fuel.calorificPower}" 
               oninput="updateFuelField(${index}, 'calorificPower', this.value)">
      </td>
      <td class="text-right">
        <span class="heat-cell-display font-mono" id="heatLoad-${index}">
          ${formatNumber(heatLoad, 1)}
        </span>
      </td>
      <td class="text-center">
        <button type="button" 
                class="btn-del-fuel" 
                title="Eliminar combustible" 
                aria-label="Eliminar fila"
                onclick="removeFuelRow(${index})">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleMaterialSelection(index, inputEl) {
  const enteredVal = inputEl.value.trim().toLowerCase();
  const match = MATERIALS_DATABASE.find(m => m.name.toLowerCase() === enteredVal);
  if (match && match.id !== 'personalizado') {
    fuels[index].name = match.name;
    fuels[index].calorificPower = match.calorificPower;
    fuels[index].risk = match.risk;
    renderFuelsTable();
    recalculate();
  }
}

function updateFuelField(index, field, value) {
  if (!fuels[index]) return;
  if (field === 'quantity' || field === 'calorificPower') {
    fuels[index][field] = parseInputNumber(value);
  } else if (field === 'risk') {
    fuels[index][field] = parseInt(value, 10) || 3;
  } else {
    fuels[index][field] = value;
  }

  // Actualizar cálculo individual en tiempo real
  const q = parseInputNumber(fuels[index].quantity);
  const p = parseInputNumber(fuels[index].calorificPower);
  const loadEl = document.getElementById(`heatLoad-${index}`);
  if (loadEl) {
    loadEl.innerText = formatNumber(q * p, 1);
  }

  recalculate();
}

function addFuelRow() {
  fuels.push({
    id: 'f_' + Date.now(),
    name: '',
    risk: 3,
    quantity: 0,
    calorificPower: 4.4
  });
  renderFuelsTable();
  const inputs = document.querySelectorAll('#fuelsTableBody input[type="text"]');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
  recalculate();
}

function removeFuelRow(index) {
  fuels.splice(index, 1);
  renderFuelsTable();
  recalculate();
}

/* ==========================================================================
   RECALCULAR Y ACTUALIZAR TELEMETRÍA TÉRMICA
   ========================================================================== */
function recalculate() {
  const sectorData = {
    name: document.getElementById('sectorName').value,
    code: document.getElementById('sectorCode').value,
    activity: document.getElementById('sectorActivity').value,
    surface: parseInputNumber(document.getElementById('sectorSurface').value) || 20,
    sectorRisk: parseInt(document.getElementById('sectorRisk').value, 10) || 3,
    date: document.getElementById('sectorDate').value,
    occupancyType: document.getElementById('sectorOccupancy').value,
    occupancyFactor: 1.0
  };

  const occMatch = OCCUPANCY_TYPES.find(o => o.name === sectorData.occupancyType);
  if (occMatch) {
    sectorData.occupancyFactor = occMatch.factor;
  }

  const results = FireCalculator.calculate(sectorData, fuels);

  // 1. Carga Calor Total (Mcal)
  document.getElementById('totalHeatMcal').innerText = formatNumber(results.summary.totalHeatMcal, 1);
  
  // 2. Fórmulas aplicadas (Superficie dinámica)
  document.getElementById('formulaSurfaceVal').innerText = formatNumber(results.summary.surface, 0);

  // 3. Carga Calor Total (MJ)
  document.getElementById('totalHeatMJ').innerText = formatNumber(results.summary.totalHeatMJ, 2);

  // 4. Carga de Fuego A (kg/m²)
  const fireLoadA = results.summary.fireLoadKgM2;
  const fireLoadFormatted = Number.isInteger(Math.round(fireLoadA * 10) / 10) 
    ? Math.round(fireLoadA).toString() 
    : formatNumber(fireLoadA, 1);
  document.getElementById('fireLoadA').innerText = fireLoadFormatted;

  // 5. Actualizar Medidor de Riesgo e Ignitabilidad
  updateRiskUI(results);
}

function updateRiskUI(results) {
  const risk = results.riskAnalysis;
  const percentageEl = document.getElementById('riskPercentageVal');
  const progressEl = document.getElementById('riskProgressBar');
  const badgeEl = document.getElementById('riskLevelBadge');
  const indexEl = document.getElementById('riskIndexScore');
  const fireResistanceEl = document.getElementById('fireResistanceVal');
  const extinguisherEl = document.getElementById('extinguisherVal');
  const riskDescriptionEl = document.getElementById('riskDescriptionText');
  const flameHalo = document.getElementById('flameHaloEffect');
  const headerFlame = document.getElementById('headerFlameBadge');

  if (percentageEl) {
    percentageEl.innerText = `${risk.percentage.toFixed(1)}%`;
  }

  if (progressEl) {
    progressEl.style.width = `${Math.min(100, Math.max(3, risk.percentage))}%`;
  }

  if (badgeEl) {
    badgeEl.innerText = risk.level;
    badgeEl.className = `risk-badge ${risk.colorClass}`;
  }

  if (indexEl) {
    indexEl.innerText = `${risk.index} / 100`;
  }

  if (fireResistanceEl) {
    fireResistanceEl.innerText = `${results.fireResistance.code} (${results.fireResistance.minutes} min)`;
  }

  if (extinguisherEl) {
    extinguisherEl.innerText = `${results.extinguishers.count} Extintor(es)`;
    extinguisherEl.title = results.extinguishers.description;
  }

  if (riskDescriptionEl) {
    riskDescriptionEl.innerText = risk.description;
  }

  // Aura térmica dinámica según nivel de riesgo
  if (flameHalo) {
    if (risk.percentage > 75) {
      flameHalo.style.background = 'radial-gradient(circle, rgba(239, 35, 60, 0.45) 0%, transparent 70%)';
      if (headerFlame) headerFlame.style.boxShadow = '0 0 28px rgba(239, 35, 60, 0.6)';
    } else if (risk.percentage > 50) {
      flameHalo.style.background = 'radial-gradient(circle, rgba(249, 115, 22, 0.35) 0%, transparent 70%)';
      if (headerFlame) headerFlame.style.boxShadow = '0 0 22px rgba(249, 115, 22, 0.45)';
    } else if (risk.percentage > 25) {
      flameHalo.style.background = 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)';
      if (headerFlame) headerFlame.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.35)';
    } else {
      flameHalo.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)';
      if (headerFlame) headerFlame.style.boxShadow = '0 0 14px rgba(255, 84, 0, 0.25)';
    }
  }
}

/* ==========================================================================
   UTILIDADES: RESET, EJEMPLO BASE, CSV, MODAL Y GENERACIÓN DE INFORME PDF
   ========================================================================== */
function resetForm() {
  if (confirm('¿Desea limpiar los datos del sector para iniciar un nuevo análisis?')) {
    document.getElementById('sectorName').value = 'Sector A';
    document.getElementById('sectorCode').value = '01';
    document.getElementById('sectorActivity').value = 'Residencial';
    document.getElementById('sectorSurface').value = '20';
    document.getElementById('sectorRisk').value = '3';
    document.getElementById('sectorDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('sectorOccupancy').value = DEFAULT_SECTOR.occupancyType;

    fuels = [
      { id: 'f_new_1', name: '', risk: 3, quantity: 0, calorificPower: 4.4 }
    ];
    renderFuelsTable();
    recalculate();
  }
}

function loadExampleDocData() {
  document.getElementById('sectorName').value = DEFAULT_SECTOR.name;
  document.getElementById('sectorCode').value = DEFAULT_SECTOR.code;
  document.getElementById('sectorActivity').value = DEFAULT_SECTOR.activity;
  document.getElementById('sectorSurface').value = DEFAULT_SECTOR.surface;
  document.getElementById('sectorRisk').value = DEFAULT_SECTOR.sectorRisk;
  document.getElementById('sectorDate').value = DEFAULT_SECTOR.date;
  document.getElementById('sectorOccupancy').value = DEFAULT_SECTOR.occupancyType;

  fuels = JSON.parse(JSON.stringify(DEFAULT_FUELS));
  renderFuelsTable();
  recalculate();
}

function exportToCSV() {
  const sectorName = document.getElementById('sectorName').value || 'Sector';
  let csv = '\uFEFF';
  
  csv += 'FIRERISK STUDIO - INFORME TECNICO DE CARGA DE FUEGO\n';
  csv += `Sector Incendio;${document.getElementById('sectorName').value};Codigo Sector;${document.getElementById('sectorCode').value}\n`;
  csv += `Actividad;${document.getElementById('sectorActivity').value};Fecha;${document.getElementById('sectorDate').value}\n`;
  csv += `Superficie (m2);${document.getElementById('sectorSurface').value};Riesgo Sector;${document.getElementById('sectorRisk').value}\n`;
  csv += `Tipo de Personas;${document.getElementById('sectorOccupancy').value}\n\n`;

  csv += 'Item;Combustible;Riesgo;Cantidad (kg);Poder Calorifico (Mcal/kg);Carga Calor (Mcal)\n';
  fuels.forEach((f, idx) => {
    const q = parseInputNumber(f.quantity);
    const p = parseInputNumber(f.calorificPower);
    csv += `${idx + 1};"${f.name}";${f.risk};${q};${p};${(q * p).toFixed(1).replace('.', ',')}\n`;
  });

  const mcal = document.getElementById('totalHeatMcal').innerText;
  const mj = document.getElementById('totalHeatMJ').innerText;
  const cargaA = document.getElementById('fireLoadA').innerText;
  const riesgoPct = document.getElementById('riskPercentageVal').innerText;
  const riesgoNivel = document.getElementById('riskLevelBadge').innerText;
  const resistencia = document.getElementById('fireResistanceVal').innerText;

  csv += `\nCarga Calor Total (Mcal);${mcal}\n`;
  csv += `Carga Calor Total (MJ);${mj}\n`;
  csv += `Carga de Fuego A (kg/m2);${cargaA}\n`;
  csv += `Porcentaje Estimado de Riesgo;${riesgoPct}\n`;
  csv += `Nivel de Peligro;${riesgoNivel}\n`;
  csv += `Resistencia al Fuego Requerida;${resistencia}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FireRisk_${sectorName.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   GENERACIÓN DE INFORME Y PLANILLA PERSONALIZADA PARA IMPRESIÓN / PDF
   ========================================================================== */
function openReportModal() {
  updateReportSheetData();
  const modal = document.getElementById('reportModal');
  if (modal) {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function updateReportSheetData() {
  const sectorData = {
    name: document.getElementById('sectorName').value || 'Sin Definir',
    code: document.getElementById('sectorCode').value || '01',
    activity: document.getElementById('sectorActivity').value || 'Residencial',
    surface: parseInputNumber(document.getElementById('sectorSurface').value) || 20,
    sectorRisk: parseInt(document.getElementById('sectorRisk').value, 10) || 3,
    date: document.getElementById('sectorDate').value || new Date().toISOString().split('T')[0],
    occupancyType: document.getElementById('sectorOccupancy').value || 'Sin Limitaciones',
    occupancyFactor: 1.0
  };

  const occMatch = OCCUPANCY_TYPES.find(o => o.name === sectorData.occupancyType);
  if (occMatch) {
    sectorData.occupancyFactor = occMatch.factor;
  }

  const results = FireCalculator.calculate(sectorData, fuels);

  // Metadatos personalizables
  const company = document.getElementById('metaCompany')?.value || 'Establecimiento Modelo S.A.';
  const professional = document.getElementById('metaProfessional')?.value || 'Ing. en Higiene y Seguridad';
  const license = document.getElementById('metaLicense')?.value || 'MP-5892 / Reg. HyST';
  const reportNum = document.getElementById('metaReportNum')?.value || 'INF-CF-2026-001';

  // 1. Encabezado del documento
  document.getElementById('repReportNum').innerText = reportNum;
  document.getElementById('repDate').innerText = formatDateSpanish(sectorData.date);

  // 2. Sección 1: Datos del Establecimiento y Sector
  document.getElementById('repCompany').innerText = company;
  document.getElementById('repSectorCode').innerText = sectorData.code;
  document.getElementById('repSectorName').innerText = sectorData.name;
  document.getElementById('repSectorActivity').innerText = sectorData.activity;
  document.getElementById('repSectorSurface').innerText = formatNumber(sectorData.surface, 1);
  document.getElementById('repSectorRisk').innerText = `Riesgo ${sectorData.sectorRisk}`;
  document.getElementById('repSectorOccupancy').innerText = sectorData.occupancyType;

  // 3. Sección 2: Planilla de Combustibles
  const repTbody = document.getElementById('repFuelsTableBody');
  repTbody.innerHTML = '';

  let totalMass = 0;
  fuels.forEach((fuel, idx) => {
    const q = parseInputNumber(fuel.quantity);
    const p = parseInputNumber(fuel.calorificPower);
    const heat = q * p;
    totalMass += q;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center font-mono">${String(idx + 1).padStart(2, '0')}</td>
      <td><strong>${escapeHtml(fuel.name || 'Combustible sin nombrar')}</strong></td>
      <td class="text-center font-mono">Riesgo ${fuel.risk}</td>
      <td class="text-right font-mono">${formatNumber(q, 1)}</td>
      <td class="text-right font-mono">${formatNumber(p, 1)}</td>
      <td class="text-right font-mono"><strong>${formatNumber(heat, 1)}</strong></td>
    `;
    repTbody.appendChild(tr);
  });

  document.getElementById('repTotalItems').innerText = fuels.length;
  document.getElementById('repTotalMass').innerText = formatNumber(totalMass, 1);
  document.getElementById('repTotalHeatMcal').innerText = formatNumber(results.summary.totalHeatMcal, 1);

  // 4. Sección 3: Fórmulas y Memoria de Cálculo
  const mcal = results.summary.totalHeatMcal;
  const mj = results.summary.totalHeatMJ;
  const surf = results.summary.surface;
  const qf = results.summary.fireLoadKgM2;
  const qDensity = results.summary.fireLoadMJ_m2;

  document.getElementById('repFormulaMJ').innerHTML = 
    `${formatNumber(mcal, 1)} Mcal × 4,1855 = <strong>${formatNumber(mj, 2)} MJ</strong>`;
  document.getElementById('repFormulaDensity').innerHTML = 
    `${formatNumber(mj, 2)} MJ / ${formatNumber(surf, 1)} m² = <strong>${formatNumber(qDensity, 2)} MJ/m²</strong>`;
  document.getElementById('repFormulaQf').innerHTML = 
    `${formatNumber(mcal, 1)} Mcal / (${formatNumber(surf, 1)} m² × 4,4) = <strong>${formatNumber(qf, 2)} kg/m²</strong>`;

  const qfFormatted = Number.isInteger(Math.round(qf * 10) / 10) 
    ? Math.round(qf).toString() 
    : formatNumber(qf, 1);
  document.getElementById('repHeroQf').innerText = qfFormatted;
  document.getElementById('repTotalMJ').innerText = `${formatNumber(mj, 2)} MJ`;

  let loadClassText = 'CARGA BAJA (≤ 15 kg/m²)';
  if (qf > 60) loadClassText = 'CARGA SEVERA / CRÍTICA (> 60 kg/m²)';
  else if (qf > 30) loadClassText = 'CARGA ALTA (31 a 60 kg/m²)';
  else if (qf > 15) loadClassText = 'CARGA MODERADA (16 a 30 kg/m²)';
  document.getElementById('repLoadClass').innerText = loadClassText;

  // 5. Sección 4: Evaluación de Riesgo y Protección
  document.getElementById('repRiskScore').innerText = `${results.riskAnalysis.index} / 100`;
  document.getElementById('repRiskLevel').innerText = results.riskAnalysis.level.toUpperCase();
  document.getElementById('repRiskPct').innerText = `${results.riskAnalysis.percentage.toFixed(1)}%`;
  document.getElementById('repFireResistance').innerText = `${results.fireResistance.code} (${results.fireResistance.minutes} min)`;
  document.getElementById('repExtinguishers').innerText = results.extinguishers.description;
  document.getElementById('repDiagnostic').innerText = results.riskAnalysis.description;

  // 6. Firmas
  document.getElementById('repProfessionalName').innerText = professional;
  document.getElementById('repProfessionalLicense').innerText = license;
  document.getElementById('repCompanySig').innerText = company;
}

function formatDateSpanish(dateStr) {
  if (!dateStr) return '15/03/2007';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function printReport() {
  openReportModal();
}

function printDirectFromModal() {
  window.print();
}

function bindGlobalEvents() {
  document.getElementById('btnAddFuel').addEventListener('click', addFuelRow);
  document.getElementById('btnReset').addEventListener('click', resetForm);
  document.getElementById('btnPrintPdf').addEventListener('click', printReport);
  document.getElementById('btnLoadExample').addEventListener('click', loadExampleDocData);
  document.getElementById('btnExportCsv').addEventListener('click', exportToCSV);
  
  // Botones y eventos del Modal de Informe
  const btnPrintModal = document.getElementById('btnPrintModal');
  if (btnPrintModal) {
    btnPrintModal.addEventListener('click', printDirectFromModal);
  }

  const btnCloseModal = document.getElementById('btnCloseModal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeReportModal);
  }

  // Cerrar al hacer clic fuera del diálogo
  const reportModal = document.getElementById('reportModal');
  if (reportModal) {
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) {
        closeReportModal();
      }
    });
  }

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeReportModal();
    }
  });

  // Actualización en tiempo real al editar campos de metadatos en el modal
  const metaInputs = ['metaCompany', 'metaProfessional', 'metaLicense', 'metaReportNum'];
  metaInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => updateReportSheetData());
    }
  });

  // Selector de tema
  const themeToggle = document.getElementById('btnThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
