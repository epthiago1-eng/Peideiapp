import React, { useState } from 'react';
import { formatCurrency, formatNumberBR, formatPercentBR } from '../calc';
import { MonthCalculation } from '../types';
import { BottomSheet } from './BottomSheet';

interface EarningsListProps {
  calc: MonthCalculation;
}

export const EarningsList: React.FC<EarningsListProps> = ({ calc }) => {
  const {
    proventos,
    descontos,
    prov,
    desc,
    off,
    dias,
    dobra,
    viagens,
    he,
    cambio,
    domingos,
    uteis,
    taxDetails,
  } = calc;

  const [showTaxDetailsModal, setShowTaxDetailsModal] = useState(false);

  // Proventos rows definition
  const provRows = [
    {
      key: 'salario',
      glyph: 'R$',
      color: '#8e8e93',
      label: 'Salário mensal',
      subtitle: 'Salário base',
      value: proventos.salario,
      showAlways: true,
    },
    {
      key: 'sob',
      glyph: '☎',
      color: '#5e5ce6',
      label: 'Adicional de sobreaviso',
      subtitle: calc.ap ? '20% sobre o salário base' : 'Inativo (mês sem dias no Suriname)',
      value: proventos.sob,
      showAlways: true,
    },
    {
      key: 'per',
      glyph: '⚠',
      color: '#ff453a',
      label: 'Adicional de periculosidade',
      subtitle: calc.ap ? '30% sobre o salário base' : 'Inativo (mês sem dias no Suriname)',
      value: proventos.per,
      showAlways: true,
    },
    {
      key: 'campo',
      glyph: '⛏',
      color: '#0a84ff',
      label: 'Adic. serviço no campo',
      subtitle: `${off} dias líquidos`,
      value: proventos.campo,
      showAlways: false,
    },
    {
      key: 'not',
      glyph: '☾',
      color: '#1c3faa',
      label: 'Adic. noturno serv. campo',
      subtitle: `${off} dias líquidos`,
      value: proventos.not,
      showAlways: false,
    },
    {
      key: 'viag',
      glyph: '✈',
      color: '#bf5af2',
      label: 'Adic. viagem com OS',
      subtitle: `${viagens} viagem(ns)`,
      value: proventos.viag,
      showAlways: false,
    },
    {
      key: 'bonus',
      glyph: '$',
      color: '#30d158',
      label: 'Bônus viagem exterior',
      subtitle: `${dias} dias × US$ 50 × ${formatNumberBR(cambio, 2, 2)}`,
      value: proventos.bonus,
      showAlways: false,
    },
    {
      key: 'dobra',
      glyph: '×2',
      color: '#ff9f0a',
      label: 'Valor total em dobra',
      subtitle: `${dobra} dia(s)`,
      value: proventos.dobra,
      showAlways: false,
    },
    {
      key: 'trab',
      glyph: '🌎',
      color: '#d4a300',
      label: 'Adic. trabalho no exterior',
      subtitle: `${dias} dias no Suriname`,
      value: proventos.trab,
      showAlways: false,
    },
    {
      key: 'he',
      glyph: '⏱',
      color: '#64d2ff',
      label: 'Horas extras 60%',
      subtitle: `${formatNumberBR(he, 1, 1)} h`,
      value: proventos.he,
      showAlways: false,
    },
    {
      key: 'dsr',
      glyph: '↺',
      color: '#40c8e0',
      label: 'DSR horas extras',
      subtitle: `${uteis} úteis · ${domingos} domingos`,
      value: proventos.dsr,
      showAlways: false,
    },
    {
      key: 'folgas',
      glyph: '🏖',
      color: '#34c759',
      label: 'Folgas indenizadas (cód. 01350)',
      subtitle: 'Adicional contratual de folgas',
      value: proventos.folgasIndenizadas || 0,
      showAlways: false,
    },
  ];

  const visibleProvRows = provRows.filter((r) => r.showAlways || r.value > 0);

  // Dynamic INSS and IRRF subtitles
  let inssSubtitle = 'Teto previdenciário';
  let irrfSubtitle = 'Alíquota efetiva estimada';

  if (taxDetails) {
    if (taxDetails.inssMethod === 'progressivo') {
      inssSubtitle = taxDetails.inssFaixaDescricao;
    } else {
      inssSubtitle = `Teto fixo (${formatCurrency(taxDetails.inssValue)})`;
    }

    if (taxDetails.irrfMethod === 'progressivo') {
      const depText = taxDetails.dependentesQtd > 0 ? ` · ${taxDetails.dependentesQtd} dep.` : '';
      irrfSubtitle = `Tabela progressiva (${formatPercentBR(taxDetails.irrfAliquotaNominal)}${depText} · efetivo: ${formatPercentBR(taxDetails.irrfAliquotaEfetiva)})`;
    } else {
      irrfSubtitle = `Alíquota efetiva manual (${formatPercentBR(taxDetails.irrfAliquotaNominal)})`;
    }
  }

  // Descontos rows definition
  const descRows = [
    {
      key: 'inss',
      glyph: '🏛',
      color: '#ff453a',
      label: 'INSS',
      subtitle: inssSubtitle,
      value: descontos.inss,
      isTax: true,
    },
    {
      key: 'irrf',
      glyph: '📋',
      color: '#ff3b30',
      label: 'IRRF (estimado)',
      subtitle: irrfSubtitle,
      value: descontos.irrf,
      isTax: true,
    },
    {
      key: 'adiant',
      glyph: '💵',
      color: '#ff9500',
      label: 'Adiantamento quinzenal',
      subtitle: '40% do salário base',
      value: descontos.adiant,
      isTax: false,
    },
    {
      key: 'prev',
      glyph: '🛡',
      color: '#af52de',
      label: 'Previdência privada básica',
      subtitle: '2% do salário base',
      value: descontos.prev,
      isTax: false,
    },
    {
      key: 'pgbl',
      glyph: '📈',
      color: '#5856d6',
      label: 'PGBL empregado',
      subtitle: '2% do salário base',
      value: descontos.pgbl,
      isTax: false,
    },
    {
      key: 'copart',
      glyph: '🏥',
      color: '#ff2d55',
      label: 'Co-participação médica',
      subtitle: 'Plano de saúde',
      value: descontos.copart,
      isTax: false,
    },
    {
      key: 'odonto',
      glyph: '🦷',
      color: '#5ac8fa',
      label: 'Assistência odontológica',
      subtitle: 'Plano odontológico',
      value: descontos.odonto,
      isTax: false,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* SECTION: PROVENTOS */}
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] mb-2 px-1">
          PROVENTOS
        </div>
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {visibleProvRows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: row.color }}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-white font-bold text-[13px] shadow-2xs shrink-0"
                >
                  {row.glyph}
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                    {row.label}
                  </span>
                  <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
                    {row.subtitle}
                  </span>
                </div>
              </div>
              <span className="text-[15px] font-bold tabular-nums text-[#111114] dark:text-[#f5f5f7]">
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}

          {/* Footer row */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-[#f7f7fa] dark:bg-[#2c2c2e]/60">
            <span className="text-[15px] font-extrabold text-[#111114] dark:text-[#f5f5f7]">
              Total de proventos
            </span>
            <span className="text-[16px] font-extrabold tabular-nums text-[#30d158] dark:text-[#30d158]">
              {formatCurrency(prov)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: DESCONTOS */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f]">
            DESCONTOS
          </span>
          <button
            type="button"
            onClick={() => setShowTaxDetailsModal(true)}
            className="text-[12px] font-semibold text-[#0a84ff] hover:opacity-75 transition"
          >
            Memória de cálculo dos impostos ℹ️
          </button>
        </div>
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {descRows.map((row) => (
            <div
              key={row.key}
              onClick={row.isTax ? () => setShowTaxDetailsModal(true) : undefined}
              className={`flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors ${
                row.isTax ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: row.color }}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-white font-bold text-[13px] shadow-2xs shrink-0"
                >
                  {row.glyph}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                      {row.label}
                    </span>
                    {row.isTax && (
                      <span className="rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-[#0a84ff]">
                        detalhes
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
                    {row.subtitle}
                  </span>
                </div>
              </div>
              <span className="text-[15px] font-bold tabular-nums text-[#ff453a]">
                − {formatCurrency(row.value)}
              </span>
            </div>
          ))}

          {/* Footer row */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-[#f7f7fa] dark:bg-[#2c2c2e]/60">
            <span className="text-[15px] font-extrabold text-[#111114] dark:text-[#f5f5f7]">
              Total de descontos
            </span>
            <span className="text-[16px] font-extrabold tabular-nums text-[#ff453a]">
              − {formatCurrency(desc)}
            </span>
          </div>
        </div>

        <p className="mt-2 text-[12px] text-[#6e6e78] dark:text-[#98989f] px-1 italic">
          * O IRRF é estimado por alíquota efetiva e pode diferir do holerite oficial.
        </p>
      </div>

      {/* SECTION: FGTS INFORMATIVO */}
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-wider text-[#6e6e78] dark:text-[#98989f] mb-2 px-1">
          INFORMATIVO (NÃO DESCONTADO)
        </div>
        <div className="rounded-[20px] bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none border border-black/[0.04] dark:border-white/[0.08] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#34c759] text-white font-bold text-[14px] shadow-2xs shrink-0">
              🏦
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#111114] dark:text-[#f5f5f7]">
                FGTS do mês (depósito da empresa)
              </span>
              <span className="text-[12px] text-[#6e6e78] dark:text-[#98989f]">
                8% sobre total de proventos ({formatCurrency(prov)}) · Depósito obrigatório do empregador
              </span>
            </div>
          </div>
          <span className="text-[15px] font-bold tabular-nums text-[#30d158]">
            {formatCurrency(calc.fgts)}
          </span>
        </div>
      </div>

      {/* Tax Calculation Details Modal */}
      {taxDetails && (
        <BottomSheet
          isOpen={showTaxDetailsModal}
          onClose={() => setShowTaxDetailsModal(false)}
          title="Memória de cálculo dos impostos"
          actionLabel="OK"
          onAction={() => setShowTaxDetailsModal(false)}
        >
          <div className="space-y-4 text-sm text-[#111114] dark:text-[#f5f5f7]">
            {/* INSS Box */}
            <div className="rounded-[16px] bg-[#f7f7fa] dark:bg-[#2c2c2e] p-4 border border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#0a84ff]">
                  1. Previdência Oficial (INSS)
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#0a84ff]/10 text-[#0a84ff]">
                  {taxDetails.inssMethod === 'progressivo' ? 'Tabela Progressiva' : 'Teto Fixo'}
                </span>
              </div>
              <div className="flex justify-between text-[13px] pt-1">
                <span className="text-[#6e6e78] dark:text-[#98989f]">Base do Salário:</span>
                <span className="font-semibold tabular-nums">{formatCurrency(proventos.salario)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#6e6e78] dark:text-[#98989f]">Regra aplicada:</span>
                <span className="font-medium text-right text-[12px]">{taxDetails.inssFaixaDescricao}</span>
              </div>
              <div className="flex justify-between text-[14px] font-bold pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span>Desconto de INSS:</span>
                <span className="text-[#ff453a] tabular-nums">− {formatCurrency(taxDetails.inssValue)}</span>
              </div>
            </div>

            {/* IRRF Box */}
            <div className="rounded-[16px] bg-[#f7f7fa] dark:bg-[#2c2c2e] p-4 border border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#5e5ce6]">
                  2. Imposto de Renda Retido (IRRF)
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5e5ce6]/10 text-[#5e5ce6]">
                  {taxDetails.irrfMethod === 'progressivo' ? 'Automático Progressivo' : 'Alíquota Efetiva'}
                </span>
              </div>

              <div className="flex justify-between text-[13px]">
                <span className="text-[#6e6e78] dark:text-[#98989f]">(+) Total de Proventos:</span>
                <span className="font-semibold tabular-nums">{formatCurrency(prov)}</span>
              </div>

              {taxDetails.irrfMethod === 'progressivo' ? (
                <>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6e6e78] dark:text-[#98989f]">(−) Dedução INSS:</span>
                    <span className="font-medium tabular-nums text-[#ff453a]">− {formatCurrency(taxDetails.inssValue)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6e6e78] dark:text-[#98989f]">(−) Previdência (Privada/PGBL):</span>
                    <span className="font-medium tabular-nums text-[#ff453a]">
                      − {formatCurrency(descontos.prev + descontos.pgbl)}
                    </span>
                  </div>
                  {taxDetails.dependentesQtd > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6e6e78] dark:text-[#98989f]">
                        (−) Dependentes ({taxDetails.dependentesQtd} × dedução legal):
                      </span>
                      <span className="font-medium tabular-nums text-[#ff453a]">
                        − {formatCurrency(taxDetails.irrfDeducaoDependentes)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-semibold pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <span>(=) Base de Cálculo do IRRF:</span>
                    <span className="tabular-nums text-[#0a84ff]">{formatCurrency(taxDetails.irrfBase)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6e6e78] dark:text-[#98989f]">Alíquota da Faixa:</span>
                    <span className="font-medium">{formatPercentBR(taxDetails.irrfAliquotaNominal)}</span>
                  </div>
                  {taxDetails.irrfDeducaoFaixa > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6e6e78] dark:text-[#98989f]">Parcela a deduzir da faixa:</span>
                      <span className="font-medium tabular-nums text-[#30d158]">
                        − {formatCurrency(taxDetails.irrfDeducaoFaixa)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#6e6e78] dark:text-[#98989f]">Alíquota efetiva direta:</span>
                  <span className="font-medium">{formatPercentBR(taxDetails.irrfAliquotaNominal)}</span>
                </div>
              )}

              <div className="flex justify-between text-[14px] font-bold pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span>Retenção de IRRF apurada:</span>
                <span className="text-[#ff453a] tabular-nums">− {formatCurrency(taxDetails.irrfValue)}</span>
              </div>
              <div className="flex justify-between text-[12px] text-[#6e6e78] dark:text-[#98989f]">
                <span>Alíquota efetiva sobre proventos:</span>
                <span className="font-semibold text-[#111114] dark:text-[#f5f5f7]">
                  {formatPercentBR(taxDetails.irrfAliquotaEfetiva)}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[#6e6e78] dark:text-[#98989f] leading-relaxed pt-1">
              Dica: Você pode alternar entre o cálculo manual por alíquota efetiva e o cálculo automático progressivo oficial da Receita Federal na aba <strong>Ajustes &gt; Descontos</strong>.
            </p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
