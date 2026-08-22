import React, { useEffect } from "react";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";

type Props = {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  /**
   * Field used as base for totalCost calculation.
   * Hotel: "totalAmount" (amount + extra bed). Others: "amount" | "cost".
   */
  costField?: "amount" | "cost" | "totalAmount";
  /**
   * Editable input field. Defaults to costField.
   * Hotel: pass "amount" while costField is "totalAmount".
   */
  amountField?: "amount" | "cost";
  amountLabel?: string;
  errors?: FieldErrors<any>;
};

/**
 * Compact ERP-style cost panel — placed at end of form, above action buttons.
 * totalCost = base(costField) + serviceCharge
 */
const LineCostingFields = ({
  register,
  setValue,
  watch,
  costField = "amount",
  amountField,
  amountLabel = "Amount",
  errors,
}: Props) => {
  const base = watch(costField);
  const serviceCharge = watch("serviceCharge");
  const editableField = amountField ?? (costField === "totalAmount" ? "amount" : costField);
  const amountError = errors?.[editableField];

  useEffect(() => {
    const cost = parseFloat(base) || 0;
    const sc = parseFloat(serviceCharge) || 0;
    setValue("inputGstPercentage", "0.00");
    setValue("inputGstAmount", "0.00");
    setValue("inputCost", cost.toFixed(2));
    setValue("serviceChargeGst", "0.00");
    setValue("serviceChargeGstAmount", "0.00");
    setValue("totalServiceCharge", sc.toFixed(2));
    setValue("inputCommission", "0.00");
    setValue("totalCost", (cost + sc).toFixed(2));
  }, [base, serviceCharge, setValue]);

  return (
    <div className="flex justify-end w-full mt-4 pt-3 border-t border-slate-200">
      <aside className="w-full sm:w-auto border border-slate-300 rounded bg-slate-50 shadow-sm">
        <div className="flex flex-wrap items-end gap-3 p-2.5 text-xs">
          <div className="min-w-[120px] flex-1 sm:flex-none">
            <Label htmlFor={editableField} className="text-[11px] text-slate-600">
              {amountLabel}
            </Label>
            <NumericInput
              id={editableField}
              className="h-8 mt-0.5 w-full sm:w-[130px] text-xs text-right font-medium"
              {...register(editableField)}
              placeholder="0.00"
            />
            {amountError?.message && (
              <p className="text-red-500 text-[10px] mt-0.5">
                {String(amountError.message)}
              </p>
            )}
          </div>

          <div className="min-w-[120px] flex-1 sm:flex-none">
            <Label htmlFor="serviceCharge" className="text-[11px] text-slate-600">
              Service Charge
            </Label>
            <NumericInput
              id="serviceCharge"
              className="h-8 mt-0.5 w-full sm:w-[130px] text-xs text-right font-medium"
              {...register("serviceCharge")}
              placeholder="0.00"
            />
          </div>

          <div className="min-w-[120px] flex-1 sm:flex-none pl-2 sm:border-l border-slate-200">
            <Label
              htmlFor="totalCost"
              className="text-[11px] font-semibold text-slate-700"
            >
              Total
            </Label>
            <NumericInput
              id="totalCost"
              className="h-8 mt-0.5 w-full sm:w-[130px] text-xs text-right font-semibold bg-slate-200/80"
              {...register("totalCost")}
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default LineCostingFields;
