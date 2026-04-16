"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface CalculatorState {
  productCost: number;
  sellingPrice: number;
  weightGrams: number;
  monthlyUnits: number;
}

function getFBAFee(weightGrams: number): number {
  if (weightGrams <= 100) return 2.47;
  if (weightGrams <= 200) return 2.97;
  if (weightGrams <= 500) return 3.22;
  if (weightGrams <= 1000) return 4.56;
  if (weightGrams <= 1500) return 5.01;
  if (weightGrams <= 2000) return 5.35;
  return 5.35 + ((weightGrams - 2000) / 500) * 0.38;
}

function getAITip(margin: number, price: number, _cost: number): string {
  if (margin >= 50) {
    return `Excellent margin of ${margin}%! At this margin, you have significant room for PPC advertising (budget 20-25% of revenue) while remaining highly profitable. Consider reinvesting profits into inventory scaling.`;
  }
  if (margin >= 35) {
    return `Good margin of ${margin}%. This is a sustainable FBA business. Keep PPC spend under 15% of revenue. Consider negotiating with your supplier for better pricing at higher MOQs to push margin above 40%.`;
  }
  if (margin >= 25) {
    return `Acceptable margin of ${margin}%, but thin. Leave room for unexpected fees, returns, and storage. At a $${price.toFixed(2)} price point, aim to source for ${((price * 0.15)).toFixed(2)} or less to improve margins.`;
  }
  if (margin >= 15) {
    return `Warning: Low margin of ${margin}%. After PPC costs and storage fees, you may be near break-even. Try to increase your selling price or reduce product cost. This product may not be viable unless you have high volume.`;
  }
  return `Critical: Negative or very low margin. This product as priced is not viable for FBA. Either source significantly cheaper (target ${((price * 0.1)).toFixed(2)} or less), increase the selling price, or choose a different product.`;
}

export default function Calculator() {
  const searchParams = useSearchParams();
  const priceParam = searchParams.get("price");

  const [inputs, setInputs] = useState<CalculatorState>({
    productCost: 5.00,
    sellingPrice: priceParam ? Math.max(0, parseFloat(priceParam)) || 19.99 : 19.99,
    weightGrams: 300,
    monthlyUnits: 50,
  });

  const [results, setResults] = useState({
    referralFee: 0,
    fbaFee: 0,
    netProfit: 0,
    margin: 0,
    monthlyProfit: 0,
    roi: 0,
  });

  useEffect(() => {
    const { productCost, sellingPrice, weightGrams, monthlyUnits } = inputs;
    const referralFee = sellingPrice * 0.15;
    const fbaFee = getFBAFee(weightGrams);
    const netProfit = sellingPrice - productCost - referralFee - fbaFee;
    const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const monthlyProfit = netProfit * monthlyUnits;
    const roi = productCost > 0 ? (netProfit / productCost) * 100 : 0;

    setResults({
      referralFee,
      fbaFee,
      netProfit,
      margin,
      monthlyProfit,
      roi,
    });
  }, [inputs]);

  function update(key: keyof CalculatorState, value: string) {
    const num = Math.max(0, parseFloat(value) || 0);
    setInputs((prev) => ({ ...prev, [key]: num }));
  }

  const marginColor = results.margin >= 35 ? "text-green" : results.margin >= 20 ? "text-amber" : "text-red";
  const aiTip = getAITip(Math.round(results.margin), inputs.sellingPrice, inputs.productCost);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-bd p-6">
          <h3 className="font-bold text-txt mb-5">Product Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">
                Product Cost (from supplier)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-3">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputs.productCost}
                  onChange={(e) => update("productCost", e.target.value)}
                  className="input-field pl-7"
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">
                Selling Price (on Amazon)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-3">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputs.sellingPrice}
                  onChange={(e) => update("sellingPrice", e.target.value)}
                  className="input-field pl-7"
                  placeholder="19.99"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">
                Product Weight (grams)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={inputs.weightGrams}
                onChange={(e) => update("weightGrams", e.target.value)}
                className="input-field"
                placeholder="300"
              />
              <p className="text-xs text-txt-3 mt-1">Used to calculate FBA fulfillment fee</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">
                Estimated Monthly Units
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={inputs.monthlyUnits}
                onChange={(e) => update("monthlyUnits", e.target.value)}
                className="input-field"
                placeholder="50"
              />
            </div>
          </div>
        </div>

        {/* AI Tip */}
        <div className={`rounded-xl border p-4 ${
          results.margin >= 35 ? "bg-green-light border-green-border" :
          results.margin >= 20 ? "bg-amber-light border-amber-border" :
          "bg-red-light border-red-border"
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">🤖</span>
            <div>
              <p className={`font-semibold text-sm mb-1 ${
                results.margin >= 35 ? "text-green" :
                results.margin >= 20 ? "text-amber" :
                "text-red"
              }`}>AI Margin Advice</p>
              <p className="text-txt-2 text-sm leading-relaxed">{aiTip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Big margin stat */}
        <div className="bg-white rounded-xl border border-bd p-6 text-center">
          <p className="text-txt-3 text-sm mb-2">Net Profit per Unit</p>
          <p className={`text-5xl font-bold ${marginColor}`}>
            {results.netProfit >= 0 ? "+" : ""}${results.netProfit.toFixed(2)}
          </p>
          <p className={`text-lg font-semibold mt-1 ${marginColor}`}>
            {results.margin.toFixed(1)}% margin
          </p>
          <div className="mt-4 w-full bg-bg-2 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                results.margin >= 35 ? "bg-green" :
                results.margin >= 20 ? "bg-amber" :
                "bg-red"
              }`}
              style={{ width: `${Math.min(Math.max(results.margin, 0), 100)}%` }}
            />
          </div>
          <p className="text-xs text-txt-3 mt-1">Target: 35%+</p>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-white rounded-xl border border-bd p-6">
          <h3 className="font-bold text-txt mb-4">Fee Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Selling Price", value: inputs.sellingPrice, positive: true },
              { label: "Product Cost", value: -inputs.productCost },
              { label: "Referral Fee (15%)", value: -results.referralFee, sub: "Amazon's commission" },
              { label: "FBA Fulfillment Fee", value: -results.fbaFee, sub: `${inputs.weightGrams}g product` },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between py-2 ${i < 3 ? "border-b border-bd" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-txt">{row.label}</p>
                  {row.sub && <p className="text-xs text-txt-3">{row.sub}</p>}
                </div>
                <span className={`font-mono text-sm font-semibold ${row.positive ? "text-txt" : "text-red"}`}>
                  {row.positive ? "" : "-"}${Math.abs(row.value).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t-2 border-bd">
              <p className="font-bold text-txt">Net Profit / Unit</p>
              <span className={`font-mono font-bold text-base ${results.netProfit >= 0 ? "text-green" : "text-red"}`}>
                {results.netProfit >= 0 ? "+" : ""}${results.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Projections */}
        <div className="bg-white rounded-xl border border-bd p-6">
          <h3 className="font-bold text-txt mb-4">Monthly Projections ({inputs.monthlyUnits} units)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg rounded-lg p-3">
              <p className="text-txt-3 text-xs mb-1">Gross Revenue</p>
              <p className="font-bold text-txt">${(inputs.sellingPrice * inputs.monthlyUnits).toFixed(0)}</p>
            </div>
            <div className="bg-bg rounded-lg p-3">
              <p className="text-txt-3 text-xs mb-1">Total Fees</p>
              <p className="font-bold text-red">-${((results.referralFee + results.fbaFee) * inputs.monthlyUnits).toFixed(0)}</p>
            </div>
            <div className="bg-bg rounded-lg p-3">
              <p className="text-txt-3 text-xs mb-1">COGS</p>
              <p className="font-bold text-txt">-${(inputs.productCost * inputs.monthlyUnits).toFixed(0)}</p>
            </div>
            <div className={`rounded-lg p-3 ${results.monthlyProfit >= 0 ? "bg-green-light" : "bg-red-light"}`}>
              <p className="text-txt-3 text-xs mb-1">Monthly Profit</p>
              <p className={`font-bold text-lg ${results.monthlyProfit >= 0 ? "text-green" : "text-red"}`}>
                {results.monthlyProfit >= 0 ? "+" : ""}${results.monthlyProfit.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-bg rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-txt-2">Return on Investment (ROI)</span>
              <span className={`font-bold ${results.roi >= 50 ? "text-green" : results.roi >= 20 ? "text-amber" : "text-red"}`}>
                {results.roi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
