import { Suspense } from "react";
import Calculator from "@/components/Calculator";

export default function CalculatorPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-txt">Profit Calculator</h1>
        <p className="text-txt-2 text-sm mt-0.5">
          Calculate exact FBA fees and net margins before you source
        </p>
      </div>

      <Suspense fallback={<div className="text-txt-3 text-sm">Loading calculator…</div>}>
        <Calculator />
      </Suspense>
    </div>
  );
}
