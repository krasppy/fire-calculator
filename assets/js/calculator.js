/**
 * Motor de Cálculo de Carga de Fuego e Índice de Riesgo de Incendio
 * Conforme a las fórmulas técnicas de la imagen y normativa de protección contra incendios.
 */

const WOOD_CALORIFIC_POWER_MCAL = 4.4;     // Mcal/kg (Patrón de madera estándar)
const WOOD_CALORIFIC_POWER_MJ = 18.41;     // MJ/kg
const MCAL_TO_MJ = 4.1855;                 // 1 Mcal = 4.1855 MJ

class FireCalculator {
  /**
   * Calcula la carga de fuego y riesgos asociados a partir de los datos del sector y materiales.
   * @param {Object} sectorData
   * @param {Array} materialsList
   * @returns {Object} Resultados completos del cálculo
   */
  static calculate(sectorData, materialsList) {
    const surface = parseFloat(sectorData.surface) > 0 ? parseFloat(sectorData.surface) : 1;
    const sectorRisk = parseInt(sectorData.sectorRisk, 10) || 3;
    const occupancyFactor = parseFloat(sectorData.occupancyFactor) || 1.0;

    let totalHeatMcal = 0;
    let totalMassKg = 0;
    let weightedRiskSum = 0;
    let hasExplosives = false;
    let hasFlammableLiquids = false;

    // Procesar cada combustible
    const processedMaterials = materialsList.map((item) => {
      const quantity = Math.max(0, parseFloat(item.quantity) || 0);
      const calorificPower = Math.max(0, parseFloat(item.calorificPower) || 0);
      const risk = parseInt(item.risk, 10) || 3;
      const heatLoadMcal = quantity * calorificPower;

      totalHeatMcal += heatLoadMcal;
      totalMassKg += quantity;
      weightedRiskSum += risk * quantity;

      if (risk === 1) hasExplosives = true;
      if (risk === 2) hasFlammableLiquids = true;

      return {
        ...item,
        quantity,
        calorificPower,
        risk,
        heatLoadMcal
      };
    });

    // Cálculos de calor total y cargas
    const totalHeatMJ = totalHeatMcal * MCAL_TO_MJ;
    const fireLoadMJ_m2 = surface > 0 ? totalHeatMJ / surface : 0;
    
    // Carga de Fuego equivalente en madera (kg/m²)
    // Fórmula: Carga Calor Total (Mcal) / (Superficie * 4.4)
    const fireLoadKgM2 = surface > 0 ? totalHeatMcal / (surface * WOOD_CALORIFIC_POWER_MCAL) : 0;

    // Promedio ponderado de riesgo de materiales (1 es más peligroso, 5 menos peligroso)
    const avgMaterialRisk = totalMassKg > 0 ? weightedRiskSum / totalMassKg : sectorRisk;

    // Cálculo del Porcentaje de Riesgo y Probabilidad de Ignición / Propagación
    const riskAnalysis = this.computeRiskIndex({
      fireLoadKgM2,
      surface,
      avgMaterialRisk,
      sectorRisk,
      occupancyFactor,
      hasExplosives,
      hasFlammableLiquids,
      totalMassKg
    });

    // Requisitos de Resistencia al Fuego (Condición F)
    const fireResistance = this.getFireResistance(fireLoadKgM2);

    // Recomendación de dotación extintora
    const extinguishers = this.getExtinguisherRecommendation(surface, fireLoadKgM2, sectorRisk);

    return {
      sector: sectorData,
      materials: processedMaterials,
      summary: {
        totalHeatMcal,
        totalHeatMJ,
        surface,
        fireLoadMJ_m2,
        fireLoadKgM2,
        totalMassKg,
        avgMaterialRisk
      },
      riskAnalysis,
      fireResistance,
      extinguishers
    };
  }

  /**
   * Calcula el porcentaje y nivel de riesgo de incendio del entorno/materiales
   */
  static computeRiskIndex({
    fireLoadKgM2,
    surface,
    avgMaterialRisk,
    sectorRisk,
    occupancyFactor,
    hasExplosives,
    hasFlammableLiquids,
    totalMassKg
  }) {
    if (totalMassKg === 0) {
      return {
        percentage: 0,
        index: 0,
        level: 'Nulo',
        colorClass: 'risk-none',
        description: 'No hay materiales combustibles registrados en el sector.',
        factors: { loadScore: 0, materialScore: 0, sectorScore: 0, occupancyScore: 0 }
      };
    }

    // 1. Puntaje por Carga de Fuego (kg/m²):
    // Normativa: Residencial/Oficina ordinario es hasta 15-30 kg/m²
    // 0 a 15 kg/m²: Carga baja (hasta 25 pts)
    // 16 a 30 kg/m²: Carga moderada (26 a 50 pts)
    // 31 a 60 kg/m²: Carga alta (51 a 75 pts)
    // > 60 kg/m²: Carga severa / crítica (76 a 100 pts)
    let loadScore = 0;
    if (fireLoadKgM2 <= 15) {
      loadScore = (fireLoadKgM2 / 15) * 25;
    } else if (fireLoadKgM2 <= 30) {
      loadScore = 25 + ((fireLoadKgM2 - 15) / 15) * 25;
    } else if (fireLoadKgM2 <= 60) {
      loadScore = 50 + ((fireLoadKgM2 - 30) / 30) * 25;
    } else {
      loadScore = Math.min(100, 75 + ((fireLoadKgM2 - 60) / 40) * 25);
    }

    // 2. Puntaje por Reactividad / Peligrosidad intrínseca de materiales (R1 a R5):
    // R1 (Explosivo): 100 pts
    // R2 (Inflamable - solventes, hidrocarburos): 80 pts
    // R3 (Muy Combustible - madera, telas comunes): 38 pts
    // R4 (Combustible - papel, cartón prensado): 20 pts
    // R5 (Poco combustible): 5 pts
    let materialDangerScore = 38;
    if (avgMaterialRisk <= 1.2) materialDangerScore = 100;
    else if (avgMaterialRisk <= 2.2) materialDangerScore = 80;
    else if (avgMaterialRisk <= 3.2) materialDangerScore = 38;
    else if (avgMaterialRisk <= 4.2) materialDangerScore = 20;
    else materialDangerScore = 5;

    // 3. Puntaje por Riesgo de la Actividad / Sector (R1 a R5):
    let sectorDangerScore = 35;
    if (sectorRisk === 1) sectorDangerScore = 100;
    else if (sectorRisk === 2) sectorDangerScore = 75;
    else if (sectorRisk === 3) sectorDangerScore = 35;
    else if (sectorRisk === 4) sectorDangerScore = 20;
    else sectorDangerScore = 5;

    // Ponderación de factores de riesgo:
    // Carga térmica de fuego (50%), Peligrosidad de materiales (28%), Actividad/Sector (22%)
    let baseScore = (loadScore * 0.50) + (materialDangerScore * 0.28) + (sectorDangerScore * 0.22);

    // Modificadores por acelerantes o explosivos
    if (hasExplosives) baseScore = Math.max(baseScore * 1.40, 80);
    if (hasFlammableLiquids) baseScore = Math.max(baseScore * 1.25, 60);

    // Factor de vulnerabilidad humana / ocupación
    let finalPercentage = baseScore * (occupancyFactor || 1.0);
    finalPercentage = Math.min(99.9, Math.max(1.0, finalPercentage));

    const index = Math.round(finalPercentage);

    // Nivel cualitativo y color
    let level = 'Bajo (Leve)';
    let colorClass = 'risk-low';
    let description = 'Riesgo ordinario. Combustión controlable con medios básicos.';

    if (finalPercentage > 75) {
      level = 'Muy Alto (Crítico)';
      colorClass = 'risk-critical';
      description = 'Peligro severo de ignición rápida y propagación violenta. Se requieren sistemas fijos automáticos y control estricto.';
    } else if (finalPercentage > 50) {
      level = 'Alto (Grave)';
      colorClass = 'risk-high';
      description = 'Alta concentración térmica o materiales de fácil inflamabilidad. Riesgo elevado de propagación.';
    } else if (finalPercentage > 25) {
      level = 'Moderado (Medio)';
      colorClass = 'risk-moderate';
      description = 'Carga térmica moderada o actividad con presencia regular de fuentes de calor.';
    }

    return {
      percentage: parseFloat(finalPercentage.toFixed(1)),
      index,
      level,
      colorClass,
      description,
      factors: {
        loadScore: Math.round(loadScore),
        materialScore: Math.round(materialDangerScore),
        sectorScore: Math.round(sectorDangerScore),
        occupancyFactor
      }
    };
  }

  /**
   * Resistencia al Fuego requerida según Norma IRAM / Dec. 351/79
   */
  static getFireResistance(fireLoadKgM2) {
    if (fireLoadKgM2 <= 15) {
      return { code: 'F-30', minutes: 30, description: 'Resistencia estructural mínima de 30 minutos.' };
    } else if (fireLoadKgM2 <= 30) {
      return { code: 'F-60', minutes: 60, description: 'Resistencia estructural mínima de 60 minutos (1 hora).' };
    } else if (fireLoadKgM2 <= 60) {
      return { code: 'F-90', minutes: 90, description: 'Resistencia estructural requerida de 90 minutos (1.5 horas).' };
    } else if (fireLoadKgM2 <= 100) {
      return { code: 'F-120', minutes: 120, description: 'Resistencia estructural requerida de 120 minutos (2 horas).' };
    } else {
      return { code: 'F-180', minutes: 180, description: 'Carga crítica. Resistencia estructural superior a 180 minutos (3 horas).' };
    }
  }

  /**
   * Dotación extintora básica sugerida
   */
  static getExtinguisherRecommendation(surface, fireLoadKgM2, sectorRisk) {
    // 1 extintor cada 200 m² mínimo, al menos 1 por sector
    const count = Math.max(1, Math.ceil(surface / 200));
    let potential = '1A';

    if (fireLoadKgM2 > 60 || sectorRisk <= 2) {
      potential = '3A : 20B:C (Polvo químico ABC 10 kg)';
    } else if (fireLoadKgM2 > 30 || sectorRisk === 3) {
      potential = '2A : 10B:C (Polvo químico ABC 5 kg)';
    } else {
      potential = '1A : 5B:C (Polvo ABC o Agua pulverizada)';
    }

    return {
      count,
      potential,
      description: `Mínimo ${count} extintor(es) con potencial extintor ${potential} a distancia máxima de recorrido no superior a 20 metros.`
    };
  }
}

// Exportar para compatibilidad en entornos Node / Navegadores
if (typeof window !== 'undefined') {
  window.FireCalculator = FireCalculator;
} else if (typeof global !== 'undefined') {
  global.FireCalculator = FireCalculator;
}
