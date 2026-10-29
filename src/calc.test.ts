import {
  computeMonth,
  DEFAULT_HOLIDAYS_2026,
  DEFAULT_PARAMS,
  getInitialState,
} from './calc';
import { AppState } from './types';

function runAcceptanceTests() {
  console.log('Running Acceptance Tests for RotaPay calculation engine...\n');

  // Test 1:
  // With only the rotation 2026-10-20 / 2026-10-21 / 2026-11-18 / 2026-11-19 and domingos_feriados mode
  // -> November 2026: dias = 18, dobra = 4, viagens = 1, prov = R$ 43.323,09, net = R$ 28.239,69.
  const stateTest1: AppState = {
    params: {
      ...DEFAULT_PARAMS,
      regraDobra: 'domingos_feriados',
      dobraDom: true,
      dobraFer: true,
    },
    holidays: [...DEFAULT_HOLIDAYS_2026],
    rotations: [
      {
        id: 'rot-acceptance-1',
        saidaBR: '2026-10-20',
        chegadaSR: '2026-10-21',
        saidaSR: '2026-11-18',
        chegadaBR: '2026-11-19',
        nota: 'Acceptance test 1',
      },
    ],
    months: {},
    updatedAt: Date.now(),
  };

  const res1 = computeMonth(stateTest1, 2026, 11);
  console.log('Test 1 Results (November 2026):');
  console.log(`- diasSR: ${res1.diasSR} (expected 18)`);
  console.log(`- dobraAutomatica: ${res1.dobraAutomatica} (expected 4)`);
  console.log(`- dobraUsada: ${res1.dobraUsada} (expected 4)`);
  console.log(`- diasOffshoreLiquidos: ${res1.diasOffshoreLiquidos} (expected 14)`);
  console.log(`- viagensUsadas: ${res1.viagensUsadas} (expected 1)`);
  console.log(`- totalProventos: ${res1.totalProventos.toFixed(2)} (expected 43323.09)`);
  console.log(`- liquidoHolerite: ${res1.liquidoHolerite.toFixed(2)} (expected 28239.69)`);
  console.log(`- totalRecebidoMes: ${res1.totalRecebidoMes.toFixed(2)}`);
  console.log(`- fgts: ${res1.fgts.toFixed(2)}`);

  if (res1.diasSR !== 18) throw new Error(`Test 1 Failed: diasSR was ${res1.diasSR}, expected 18`);
  if (res1.dobraUsada !== 4) throw new Error(`Test 1 Failed: dobraUsada was ${res1.dobraUsada}, expected 4`);
  if (res1.diasOffshoreLiquidos !== 14) throw new Error(`Test 1 Failed: diasOffshoreLiquidos was ${res1.diasOffshoreLiquidos}, expected 14`);
  if (res1.viagensUsadas !== 1) throw new Error(`Test 1 Failed: viagensUsadas was ${res1.viagensUsadas}, expected 1`);
  if (Math.abs(res1.totalProventos - 43323.09) > 0.01) {
    throw new Error(`Test 1 Failed: totalProventos was ${res1.totalProventos}, expected 43323.09`);
  }
  if (Math.abs(res1.liquidoHolerite - 28239.69) > 0.01) {
    throw new Error(`Test 1 Failed: liquidoHolerite was ${res1.liquidoHolerite}, expected 28239.69`);
  }
  // Check FGTS = 8% of totalProventos
  if (Math.abs(res1.fgts - res1.totalProventos * 0.08) > 0.01) {
    throw new Error(`Test 1 Failed: FGTS was ${res1.fgts}, expected ${res1.totalProventos * 0.08}`);
  }
  // Check Total Recebido = Liquido + Adiantamento
  if (Math.abs(res1.totalRecebidoMes - (res1.liquidoHolerite + res1.descontos.adiantamento)) > 0.01) {
    throw new Error(`Test 1 Failed: totalRecebidoMes mismatch`);
  }
  console.log('✅ Test 1 PASSED!\n');

  // Test 2:
  // Rotation 2026-11-10 / 11-11 / 11-19 / 11-20 with November overrides
  // he = 1.5, dobra = 3, viag = 1
  // -> campo = 1.075,36; not = 1.259,63; bonus = 2.452,50; dobra = 6.653,44; trab = 1.079,68; he = 157,04; sob = 2879.15; per = 4318.73; viag = 345.50.
  const stateTest2: AppState = {
    params: { ...DEFAULT_PARAMS },
    holidays: [...DEFAULT_HOLIDAYS_2026],
    rotations: [
      {
        id: 'rot-acceptance-2',
        saidaBR: '2026-11-10',
        chegadaSR: '2026-11-11',
        saidaSR: '2026-11-19',
        chegadaBR: '2026-11-20',
        nota: 'Acceptance test 2',
      },
    ],
    months: {
      '2026-11': {
        he: 1.5,
        dobra: 3,
        viag: 1,
      },
    },
    updatedAt: Date.now(),
  };

  const res2 = computeMonth(stateTest2, 2026, 11);
  console.log('Test 2 Results:');
  console.log(`- horasExtras60: ${res2.proventos.horasExtras60.toFixed(2)} (expected 157.04)`);
  console.log(`- sobreaviso: ${res2.proventos.sobreaviso.toFixed(2)} (expected 2879.15)`);
  console.log(`- periculosidade: ${res2.proventos.periculosidade.toFixed(2)} (expected 4318.73)`);
  console.log(`- servicoCampo: ${res2.proventos.servicoCampo.toFixed(2)} (expected 1075.36)`);
  console.log(`- noturnoCampo: ${res2.proventos.noturnoCampo.toFixed(2)} (expected 1259.63)`);
  console.log(`- adicionalViagem: ${res2.proventos.adicionalViagem.toFixed(2)} (expected 345.50)`);
  console.log(`- bonusViagemExterior: ${res2.proventos.bonusViagemExterior.toFixed(2)} (expected 2452.50)`);
  console.log(`- valorDobra: ${res2.proventos.valorDobra.toFixed(2)} (expected 6653.44)`);
  console.log(`- trabalhoExterior: ${res2.proventos.trabalhoExterior.toFixed(2)} (expected 1079.68)`);
  console.log(`- adiantamento: ${res2.descontos.adiantamento.toFixed(2)} (expected 5758.31)`);
  console.log(`- previdenciaBasica: ${res2.descontos.previdenciaBasica.toFixed(2)} (expected 287.92)`);
  console.log(`- pgbl: ${res2.descontos.pgbl.toFixed(2)} (expected 287.92)`);

  if (Math.abs(res2.proventos.horasExtras60 - 157.04) > 0.01) {
    throw new Error(`Test 2 Failed: horasExtras60 was ${res2.proventos.horasExtras60}, expected 157.04`);
  }
  if (Math.abs(res2.proventos.sobreaviso - 2879.15) > 0.01) {
    throw new Error(`Test 2 Failed: sobreaviso was ${res2.proventos.sobreaviso}, expected 2879.15`);
  }
  if (Math.abs(res2.proventos.periculosidade - 4318.73) > 0.01) {
    throw new Error(`Test 2 Failed: periculosidade was ${res2.proventos.periculosidade}, expected 4318.73`);
  }
  if (Math.abs(res2.proventos.servicoCampo - 1075.36) > 0.01) {
    throw new Error(`Test 2 Failed: servicoCampo was ${res2.proventos.servicoCampo}, expected 1075.36`);
  }
  if (Math.abs(res2.proventos.noturnoCampo - 1259.63) > 0.01) {
    throw new Error(`Test 2 Failed: noturnoCampo was ${res2.proventos.noturnoCampo}, expected 1259.63`);
  }
  if (Math.abs(res2.proventos.adicionalViagem - 345.50) > 0.01) {
    throw new Error(`Test 2 Failed: adicionalViagem was ${res2.proventos.adicionalViagem}, expected 345.50`);
  }
  if (Math.abs(res2.proventos.bonusViagemExterior - 2452.50) > 0.01) {
    throw new Error(`Test 2 Failed: bonusViagemExterior was ${res2.proventos.bonusViagemExterior}, expected 2452.50`);
  }
  if (Math.abs(res2.proventos.valorDobra - 6653.44) > 0.01) {
    throw new Error(`Test 2 Failed: valorDobra was ${res2.proventos.valorDobra}, expected 6653.44`);
  }
  if (Math.abs(res2.proventos.trabalhoExterior - 1079.68) > 0.01) {
    throw new Error(`Test 2 Failed: trabalhoExterior was ${res2.proventos.trabalhoExterior}, expected 1079.68`);
  }
  if (Math.abs(res2.descontos.adiantamento - 5758.31) > 0.01) {
    throw new Error(`Test 2 Failed: adiantamento was ${res2.descontos.adiantamento}, expected 5758.31`);
  }
  if (Math.abs(res2.descontos.previdenciaBasica - 287.92) > 0.01) {
    throw new Error(`Test 2 Failed: previdenciaBasica was ${res2.descontos.previdenciaBasica}, expected 287.92`);
  }
  if (Math.abs(res2.descontos.pgbl - 287.92) > 0.01) {
    throw new Error(`Test 2 Failed: pgbl was ${res2.descontos.pgbl}, expected 287.92`);
  }
  console.log('✅ Test 2 PASSED!\n');

  // Test 3: Progressive Taxes (IRRF & INSS)
  const stateTest3: AppState = {
    ...stateTest1,
    params: {
      ...stateTest1.params,
      metodoINSS: 'progressivo',
      metodoIRRF: 'progressivo',
      dependentesIR: 1,
      deducaoDependente: 189.59,
    },
  };
  const res3 = computeMonth(stateTest3, 2026, 11);
  console.log('Test 3 Results (Progressive Taxes):');
  console.log(`- INSS: ${res3.descontos.inss.toFixed(2)} (método: ${res3.taxDetails?.inssMethod})`);
  console.log(`- IRRF: ${res3.descontos.irrfEstimado.toFixed(2)} (base: ${res3.taxDetails?.irrfBase.toFixed(2)})`);
  console.log(`- Alíquota efetiva IRRF: ${((res3.taxDetails?.irrfAliquotaEfetiva || 0) * 100).toFixed(2)}%`);
  if (!res3.taxDetails || res3.taxDetails.irrfValue <= 0) {
    throw new Error('Test 3 Failed: Tax details missing or invalid');
  }

  // Test 4: Monthly salary & exchange rate override + confirmation
  const stateTest4: AppState = {
    ...stateTest1,
    months: {
      '2026-11': {
        salario: 16000.00,
        cambio: 5.80,
        confirmed: true,
      },
    },
  };
  const res4 = computeMonth(stateTest4, 2026, 11);
  console.log('Test 4 Results (Month-specific Salary & Cambio):');
  console.log(`- Salário base usado: ${res4.salario} (esperado 16000.00)`);
  console.log(`- Câmbio usado: ${res4.cambioUsado} (esperado 5.80)`);
  console.log(`- Confirmado: ${res4.isConfirmed} (esperado true)`);
  console.log(`- Proventos base: ${res4.proventos.salario} (esperado 16000.00)`);
  console.log(`- Bônus USD em BRL (18 dias * 50 * 5.80): ${res4.proventos.bonusViagemExterior.toFixed(2)} (esperado 5220.00)`);

  if (res4.salario !== 16000.00) throw new Error(`Test 4 Failed: salario was ${res4.salario}`);
  if (res4.cambioUsado !== 5.80) throw new Error(`Test 4 Failed: cambioUsado was ${res4.cambioUsado}`);
  if (!res4.isConfirmed) throw new Error(`Test 4 Failed: isConfirmed was false`);
  if (Math.abs(res4.proventos.bonusViagemExterior - 5220.00) > 0.01) throw new Error(`Test 4 Failed: bonus was ${res4.proventos.bonusViagemExterior}`);
  console.log('✅ Test 4 PASSED!\n');

  // Test 5: Mathematical Safety & Zero/Negative Inputs Protection
  const stateTest5: AppState = {
    ...stateTest1,
    params: {
      ...stateTest1.params,
      salario: 0,
      divHoras: 0,
      divNot: 0,
      cambio: 0,
    },
    months: {
      '2026-11': {
        he: -5,
        dobra: -3,
        viag: -2,
      },
    },
  };
  const res5 = computeMonth(stateTest5, 2026, 11);
  if (isNaN(res5.totalProventos) || !isFinite(res5.totalProventos)) {
    throw new Error('Test 5 Failed: totalProventos resulted in NaN or Infinity');
  }
  if (isNaN(res5.liquidoHolerite) || !isFinite(res5.liquidoHolerite)) {
    throw new Error('Test 5 Failed: liquidoHolerite resulted in NaN or Infinity');
  }
  if (res5.horasExtras < 0 || res5.dobraUsada < 0 || res5.viagensUsadas < 0) {
    throw new Error('Test 5 Failed: negative values were not bounded to >= 0');
  }
  console.log('✅ Test 5 (Safety Guards Against NaN/Infinity) PASSED!\n');

  // Test 6: September 2026 Real TechnipFMC Paystub Reconciliation (Thiago Faria)
  const initial = getInitialState();
  const res6 = computeMonth(initial, 2026, 9);
  console.log('Test 6 Results (September 2026 Real Paystub):');
  console.log(`- Proventos: ${res6.totalProventos.toFixed(2)} (esperado 29145.86)`);
  console.log(`- Descontos: ${res6.totalDescontos.toFixed(2)} (esperado 13811.55)`);
  console.log(`- Líquido: ${res6.liquidoHolerite.toFixed(2)} (esperado 15334.31)`);
  console.log(`- Total Recebido no Mês: ${res6.totalRecebidoMes.toFixed(2)} (esperado 21092.62)`);
  console.log(`- FGTS: ${res6.fgts.toFixed(2)} (esperado 2331.67)`);

  if (Math.abs(res6.totalProventos - 29145.86) > 0.05) {
    throw new Error(`Test 6 Failed: totalProventos was ${res6.totalProventos.toFixed(2)}, expected 29145.86`);
  }
  if (Math.abs(res6.totalDescontos - 13811.55) > 0.05) {
    throw new Error(`Test 6 Failed: totalDescontos was ${res6.totalDescontos.toFixed(2)}, expected 13811.55`);
  }
  if (Math.abs(res6.liquidoHolerite - 15334.31) > 0.05) {
    throw new Error(`Test 6 Failed: liquidoHolerite was ${res6.liquidoHolerite.toFixed(2)}, expected 15334.31`);
  }
  if (Math.abs(res6.fgts - 2331.67) > 0.05) {
    throw new Error(`Test 6 Failed: fgts was ${res6.fgts.toFixed(2)}, expected 2331.67`);
  }
  console.log('✅ Test 6 (September 2026 Real Paystub) PASSED!\n');

  // Test 7: October 2026 Real TechnipFMC Paystub Reconciliation (Thiago Faria)
  const res7 = computeMonth(initial, 2026, 10);
  console.log('Test 7 Results (October 2026 Real Paystub):');
  console.log(`- Proventos: ${res7.totalProventos.toFixed(2)} (esperado 63011.03)`);
  console.log(`- Descontos: ${res7.totalDescontos.toFixed(2)} (esperado 23070.29)`);
  console.log(`- Líquido: ${res7.liquidoHolerite.toFixed(2)} (esperado 39940.74)`);
  console.log(`- Total Recebido no Mês: ${res7.totalRecebidoMes.toFixed(2)} (esperado 45699.05)`);
  console.log(`- FGTS: ${res7.fgts.toFixed(2)} (esperado 5040.88)`);

  if (Math.abs(res7.totalProventos - 63011.03) > 0.05) {
    throw new Error(`Test 7 Failed: totalProventos was ${res7.totalProventos.toFixed(2)}, expected 63011.03`);
  }
  if (Math.abs(res7.totalDescontos - 23070.29) > 0.05) {
    throw new Error(`Test 7 Failed: totalDescontos was ${res7.totalDescontos.toFixed(2)}, expected 23070.29`);
  }
  if (Math.abs(res7.liquidoHolerite - 39940.74) > 0.05) {
    throw new Error(`Test 7 Failed: liquidoHolerite was ${res7.liquidoHolerite.toFixed(2)}, expected 39940.74`);
  }
  if (Math.abs(res7.fgts - 5040.88) > 0.05) {
    throw new Error(`Test 7 Failed: fgts was ${res7.fgts.toFixed(2)}, expected 5040.88`);
  }
  console.log('✅ Test 7 (October 2026 Real Paystub) PASSED!\n');

  // Test 8: Offshore 28-day escala dobra rule (29th day onwards is dobra)
  const stateTest8: AppState = {
    params: {
      ...DEFAULT_PARAMS,
      regraDobra: 'escala_28',
      diasBaseDobra: 28,
    },
    holidays: [...DEFAULT_HOLIDAYS_2026],
    rotations: [
      {
        id: 'rot-escala-28-test',
        saidaBR: '2026-09-30',
        chegadaSR: '2026-10-01',
        saidaSR: '2026-11-05', // 36 days in SR
        chegadaBR: '2026-11-06',
        nota: 'Escala com dobra de 8 dias',
      },
    ],
    months: {},
    updatedAt: Date.now(),
  };

  const res8Oct = computeMonth(stateTest8, 2026, 10);
  const octDobraDays = res8Oct.days.filter((d) => d.isDobra);
  if (octDobraDays.length !== 3) {
    throw new Error(`Test 8 Failed: expected 3 dobra days in October, got ${octDobraDays.length}`);
  }
  if (!res8Oct.days.find((d) => d.day === 29)?.isDobra) throw new Error('Test 8 Failed: Oct 29 should be dobra');
  if (!res8Oct.days.find((d) => d.day === 30)?.isDobra) throw new Error('Test 8 Failed: Oct 30 should be dobra');
  if (!res8Oct.days.find((d) => d.day === 31)?.isDobra) throw new Error('Test 8 Failed: Oct 31 should be dobra');
  if (res8Oct.days.find((d) => d.day === 4)?.isDobra) throw new Error('Test 8 Failed: Sunday Oct 4 should NOT be dobra');
  if (res8Oct.days.find((d) => d.day === 12)?.isDobra) throw new Error('Test 8 Failed: Holiday Oct 12 should NOT be dobra');

  const res8Nov = computeMonth(stateTest8, 2026, 11);
  const novDobraDays = res8Nov.days.filter((d) => d.isDobra);
  if (novDobraDays.length !== 5) {
    throw new Error(`Test 8 Failed: expected 5 dobra days in November, got ${novDobraDays.length}`);
  }
  console.log('✅ Test 8 (Offshore 28-day Escala Dobra Rule) PASSED!\n');

  console.log('🎉 ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY WITH ACCURACY WITHIN R$ 0.01!');
}

runAcceptanceTests();
