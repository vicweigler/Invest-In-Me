import React, { useState } from 'react';
import {
  Settings, DollarSign, PiggyBank, Info, ChevronRight, Check
} from 'lucide-react';
import clsx from 'clsx';
import {
  useSettingsStore, TaxBracket, FeeType,
  CGT_RATES, TAX_BRACKET_LABELS, DEFAULT_CGT_ALLOWANCE
} from '../store/settingsStore';

type TabId = 'trading' | 'tax';

function InputField({
  label, value, onChange, prefix = '£', suffix, min = 0, step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-medium mb-1.5">{label}</label>
      <div className="flex items-center gap-0">
        {prefix && (
          <span className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] border-r-0 rounded-l-lg text-slate-400 text-sm font-mono">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={clsx(
            'flex-1 px-3 py-2 bg-[#1E293B] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-colors',
            prefix && !suffix ? 'rounded-r-lg' : '',
            !prefix && suffix ? 'rounded-l-lg' : '',
            prefix && suffix ? '' : '',
            !prefix && !suffix ? 'rounded-lg' : '',
          )}
        />
        {suffix && (
          <span className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] border-l-0 rounded-r-lg text-slate-400 text-sm font-mono">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function FeeTypeToggle({
  value, onChange,
}: {
  value: FeeType;
  onChange: (v: FeeType) => void;
}) {
  return (
    <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
      {(['fixed', 'percentage'] as FeeType[]).map(type => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={clsx(
            'flex-1 px-3 py-2 text-xs font-semibold transition-all',
            value === type
              ? 'bg-indigo-500/20 text-indigo-300 border-r border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          )}
        >
          {type === 'fixed' ? 'Fixed (£)' : 'Percentage (%)'}
        </button>
      ))}
    </div>
  );
}

function TradingCostsTab() {
  const { tradingCosts, updateTradingCosts } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm leading-relaxed">
          Trading fees are deducted from your virtual cash when buying or selling shares.
          Your net P&amp;L in the portfolio will reflect all fees paid to date.
        </p>
      </div>

      {/* Buy fee */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Buy Commission
        </h3>
        <FeeTypeToggle
          value={tradingCosts.buyFeeType}
          onChange={v => updateTradingCosts({ buyFeeType: v })}
        />
        <InputField
          label={tradingCosts.buyFeeType === 'fixed' ? 'Fee per buy order (£)' : 'Fee as % of trade value'}
          value={tradingCosts.buyFeeAmount}
          onChange={v => updateTradingCosts({ buyFeeAmount: v })}
          prefix={tradingCosts.buyFeeType === 'fixed' ? '£' : undefined}
          suffix={tradingCosts.buyFeeType === 'percentage' ? '%' : undefined}
          step={tradingCosts.buyFeeType === 'fixed' ? 0.01 : 0.1}
        />
        {tradingCosts.buyFeeType === 'fixed' && (
          <p className="text-slate-600 text-xs">
            e.g. Hargreaves Lansdown charges £11.95 per online deal; Trading 212 £0.00
          </p>
        )}
        {tradingCosts.buyFeeType === 'percentage' && (
          <p className="text-slate-600 text-xs">
            e.g. 0.1% of trade value. £1,000 trade = £1.00 fee
          </p>
        )}
      </div>

      {/* Sell fee */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <h3 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          Sell Commission
        </h3>
        <FeeTypeToggle
          value={tradingCosts.sellFeeType}
          onChange={v => updateTradingCosts({ sellFeeType: v })}
        />
        <InputField
          label={tradingCosts.sellFeeType === 'fixed' ? 'Fee per sell order (£)' : 'Fee as % of trade value'}
          value={tradingCosts.sellFeeAmount}
          onChange={v => updateTradingCosts({ sellFeeAmount: v })}
          prefix={tradingCosts.sellFeeType === 'fixed' ? '£' : undefined}
          suffix={tradingCosts.sellFeeType === 'percentage' ? '%' : undefined}
          step={tradingCosts.sellFeeType === 'fixed' ? 0.01 : 0.1}
        />
      </div>

      {/* Preview */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Fee Preview — £1,000 trade</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Buy fee</p>
            <p className="text-white font-mono text-sm font-semibold">
              £{(tradingCosts.buyFeeType === 'fixed' ? tradingCosts.buyFeeAmount : 1000 * tradingCosts.buyFeeAmount / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Sell fee</p>
            <p className="text-white font-mono text-sm font-semibold">
              £{(tradingCosts.sellFeeType === 'fixed' ? tradingCosts.sellFeeAmount : 1000 * tradingCosts.sellFeeAmount / 100).toFixed(2)}
            </p>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/[0.06]">
            <p className="text-slate-500 text-xs mb-0.5">Round-trip cost (buy + sell)</p>
            <p className="text-amber-400 font-mono text-sm font-semibold">
              £{(
                (tradingCosts.buyFeeType === 'fixed' ? tradingCosts.buyFeeAmount : 1000 * tradingCosts.buyFeeAmount / 100) +
                (tradingCosts.sellFeeType === 'fixed' ? tradingCosts.sellFeeAmount : 1000 * tradingCosts.sellFeeAmount / 100)
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-xs text-center">
        Changes take effect on new trades. Historical transactions retain their original fee.
      </p>
    </div>
  );
}

function TaxCGTTab() {
  const { taxBracket, cgtAllowance, updateTaxBracket, updateCgtAllowance } = useSettingsStore();

  const brackets: TaxBracket[] = ['basic', 'higher', 'additional'];

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm leading-relaxed">
          CGT estimates are indicative only. They assume all unrealised gains are realised in the current
          tax year against your full annual allowance. Always consult a qualified tax adviser.
        </p>
      </div>

      {/* Income tax bracket */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 space-y-3">
        <h3 className="text-slate-200 font-semibold text-sm">Income Tax Bracket</h3>
        <p className="text-slate-500 text-xs">Used to determine your Capital Gains Tax rate on shares (post Oct 2024 Budget)</p>
        <div className="space-y-2 pt-1">
          {brackets.map(b => (
            <button
              key={b}
              onClick={() => updateTaxBracket(b)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all',
                taxBracket === b
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              )}
            >
              <div className="text-left">
                <p className="text-sm font-medium">{TAX_BRACKET_LABELS[b]}</p>
                <p className={clsx('text-xs mt-0.5', taxBracket === b ? 'text-indigo-400' : 'text-slate-600')}>
                  CGT on shares: {(CGT_RATES[b] * 100).toFixed(0)}%
                </p>
              </div>
              {taxBracket === b && <Check size={14} className="text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* CGT allowance */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-slate-200 font-semibold text-sm">Annual CGT Exempt Amount</h3>
          <p className="text-slate-500 text-xs mt-1">
            UK 2024/25: £{DEFAULT_CGT_ALLOWANCE.toLocaleString()}. Gains below this threshold are not taxed.
          </p>
        </div>
        <InputField
          label="Annual allowance (£)"
          value={cgtAllowance}
          onChange={updateCgtAllowance}
          prefix="£"
          min={0}
          step={100}
        />
      </div>

      {/* Current settings summary */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Current Effective Rates</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">CGT Rate (shares)</p>
            <p className="text-white font-mono text-lg font-bold">{(CGT_RATES[taxBracket] * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Annual Allowance</p>
            <p className="text-white font-mono text-lg font-bold">£{cgtAllowance.toLocaleString()}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/[0.06]">
            <p className="text-slate-500 text-xs mb-1">Example: £10,000 net gain</p>
            <p className="text-slate-300 text-sm font-mono">
              Taxable: £{Math.max(0, 10000 - cgtAllowance).toLocaleString()}
              &nbsp;→ CGT: <span className="text-amber-400 font-semibold">
                £{(Math.max(0, 10000 - cgtAllowance) * CGT_RATES[taxBracket]).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-xs text-center">
        Rates reflect post-Autumn Budget 2024 rules. Residential property CGT rates differ.
      </p>
    </div>
  );
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'trading', label: 'Trading Costs', icon: DollarSign },
  { id: 'tax', label: 'Tax & CGT', icon: PiggyBank },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('trading');

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
          <Settings size={18} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure trading costs and tax preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0F172A] border border-white/[0.06] rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'trading' && <TradingCostsTab />}
      {activeTab === 'tax' && <TaxCGTTab />}
    </div>
  );
}
