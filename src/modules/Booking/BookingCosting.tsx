import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { get, put } from "@/services/apiService";
import { formatCurrency } from "@/lib/formatter.js";
import { paymentModeOptions } from "@/config/data";
import Validate from "@/lib/Handlevalidation";

const moneyField = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return "";
    return val;
  },
  z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || !isNaN(Number(val)),
      "Must be a number"
    )
);

const FormSchema = z.object({
  agentId: z.union([z.string(), z.number(), z.null()]).optional(),
  isPaid: z.boolean(),
  paymentMode: z.string().optional().nullable(),
  paidAmount: moneyField,
  transferBankId: z.union([z.string(), z.number(), z.null()]).optional(),
  accountNo: z.string().optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  chequeDate: z.string().optional().nullable(),
  ofBankId: z.union([z.string(), z.number(), z.null()]).optional(),
  inFavourOf: z.string().optional().nullable(),
  billDescription: z.string().optional().nullable(),
  journeyServiceCharge: moneyField,
  hotelServiceCharge: moneyField,
  vehicleServiceCharge: moneyField,
  otherServicesServiceCharge: moneyField,
  serviceChargeOnCost: moneyField,
  serviceChargeOnPackage: moneyField,
  discount: moneyField,
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  agentId: "",
  isPaid: false,
  paymentMode: "",
  paidAmount: "",
  transferBankId: "",
  accountNo: "",
  chequeNumber: "",
  chequeDate: "",
  ofBankId: "",
  inFavourOf: "",
  billDescription: "",
  journeyServiceCharge: "0.00",
  hotelServiceCharge: "0.00",
  vehicleServiceCharge: "0.00",
  otherServicesServiceCharge: "0.00",
  serviceChargeOnCost: "0.00",
  serviceChargeOnPackage: "0.00",
  discount: "0.00",
};

const toMoney = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatMoneyInput = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "0.00";
  return Number(value).toFixed(2);
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const BookingCosting = ({ bookingId }: { bookingId?: string }) => {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const { data: agents } = useQuery({
    queryKey: ["agents-all"],
    queryFn: async () => get(`/agents/all`),
  });

  const { data: banks } = useQuery({
    queryKey: ["banks-all"],
    queryFn: async () => get(`/banks/all`),
  });

  const { data: costingData, isLoading } = useQuery({
    queryKey: ["booking-costing", bookingId],
    queryFn: async () => get(`/booking-costings/${bookingId}`),
    enabled: !!bookingId,
    refetchOnMount: "always",
  });

  useEffect(() => {
    setHydrated(false);
  }, [bookingId]);

  useEffect(() => {
    if (!costingData || hydrated) return;
    const c = costingData.costing;
    const t = costingData.totals || {};
    reset({
      agentId: c?.agentId ?? "",
      isPaid: Boolean(c?.isPaid),
      paymentMode: c?.paymentMode ?? "",
      paidAmount: c?.paidAmount != null ? formatMoneyInput(c.paidAmount) : "",
      transferBankId: c?.transferBankId ?? "",
      accountNo: c?.accountNo ?? "",
      chequeNumber: c?.chequeNumber ?? "",
      chequeDate: c?.chequeDate ? String(c.chequeDate).slice(0, 10) : "",
      ofBankId: c?.ofBankId ?? "",
      inFavourOf: c?.inFavourOf ?? "",
      billDescription: c?.billDescription ?? "",
      journeyServiceCharge: formatMoneyInput(
        t.journeyServiceChargeFromLines ?? t.journeyServiceCharge
      ),
      hotelServiceCharge: formatMoneyInput(
        t.hotelServiceChargeFromLines ?? t.hotelServiceCharge
      ),
      vehicleServiceCharge: formatMoneyInput(
        t.vehicleServiceChargeFromLines ?? t.vehicleServiceCharge
      ),
      otherServicesServiceCharge: formatMoneyInput(
        t.otherServicesServiceChargeFromLines ?? t.otherServicesServiceCharge
      ),
      serviceChargeOnCost: formatMoneyInput(
        c?.serviceChargeOnCost ?? t.serviceChargeOnCost
      ),
      serviceChargeOnPackage: formatMoneyInput(
        c?.serviceChargeOnPackage ?? t.serviceChargeOnPackage
      ),
      discount: formatMoneyInput(c?.discount ?? t.discount),
    });
    setHydrated(true);
  }, [costingData, hydrated, reset]);

  // Keep service charges in sync when line bookings change (refetch)
  useEffect(() => {
    if (!costingData?.totals || !hydrated) return;
    const t = costingData.totals;
    setValue(
      "journeyServiceCharge",
      formatMoneyInput(
        t.journeyServiceChargeFromLines ?? t.journeyServiceCharge
      )
    );
    setValue(
      "hotelServiceCharge",
      formatMoneyInput(t.hotelServiceChargeFromLines ?? t.hotelServiceCharge)
    );
    setValue(
      "vehicleServiceCharge",
      formatMoneyInput(
        t.vehicleServiceChargeFromLines ?? t.vehicleServiceCharge
      )
    );
    setValue(
      "otherServicesServiceCharge",
      formatMoneyInput(
        t.otherServicesServiceChargeFromLines ?? t.otherServicesServiceCharge
      )
    );
  }, [
    costingData?.totals?.journeyServiceChargeFromLines,
    costingData?.totals?.hotelServiceChargeFromLines,
    costingData?.totals?.vehicleServiceChargeFromLines,
    costingData?.totals?.otherServicesServiceChargeFromLines,
    costingData?.totals?.journeyServiceCharge,
    costingData?.totals?.hotelServiceCharge,
    costingData?.totals?.vehicleServiceCharge,
    costingData?.totals?.otherServicesServiceCharge,
    hydrated,
    setValue,
  ]);

  const watched = useWatch({ control });
  const isPackage = Boolean(costingData?.isPackage);
  const isJourney = Boolean(costingData?.isJourney);
  const clientPaidAmount = toMoney(costingData?.clientPaidAmount);

  const liveTotals = useMemo(() => {
    const t = costingData?.totals || {};
    const hotelBookingAmount = toMoney(t.hotelBookingAmount);
    const vehicleBookingAmount = toMoney(t.vehicleBookingAmount);
    const otherServicesAmount = toMoney(t.otherServicesAmount);
    const journeyBookingAmount = toMoney(t.journeyBookingAmount);

    const journeyServiceCharge = toMoney(watched.journeyServiceCharge);
    const hotelServiceCharge = toMoney(watched.hotelServiceCharge);
    const vehicleServiceCharge = toMoney(watched.vehicleServiceCharge);
    const otherServicesServiceCharge = toMoney(
      watched.otherServicesServiceCharge
    );

    const journeyTotalCost = round2(
      journeyBookingAmount + journeyServiceCharge
    );

    const beforePackageCost = round2(
      hotelBookingAmount + vehicleBookingAmount + otherServicesAmount
    );
    const beforePackageServiceCharge = round2(
      hotelServiceCharge + vehicleServiceCharge + otherServicesServiceCharge
    );
    const beforePackageTotalCost = round2(
      beforePackageCost + beforePackageServiceCharge
    );

    const serviceChargeOnCost = isPackage
      ? toMoney(watched.serviceChargeOnCost)
      : 0;
    const serviceChargeOnPackage = isPackage
      ? toMoney(watched.serviceChargeOnPackage)
      : 0;
    const packageFeesTotal = round2(
      serviceChargeOnCost + serviceChargeOnPackage
    );
    const packageCost = round2(beforePackageCost + serviceChargeOnCost);
    const packageServiceCharge = round2(
      beforePackageServiceCharge + serviceChargeOnPackage
    );
    const packageTotalCost = round2(
      beforePackageTotalCost + packageFeesTotal
    );

    const discount = toMoney(watched.discount);
    const totalPackageCost = round2(packageTotalCost - discount);
    const journeyPart = isJourney ? journeyTotalCost : 0;
    const payableAmount = round2(journeyPart + totalPackageCost);

    const agentPayableTotal = round2(
      hotelBookingAmount +
        vehicleBookingAmount +
        (isPackage ? serviceChargeOnCost : 0)
    );
    const agentPaidAmount = toMoney(watched.paidAmount);
    const agentOutstanding = round2(
      Math.max(0, agentPayableTotal - agentPaidAmount)
    );

    return {
      journeyBookingAmount,
      journeyServiceCharge,
      journeyTotalCost,
      hotelBookingAmount,
      vehicleBookingAmount,
      otherServicesAmount,
      hotelServiceCharge,
      vehicleServiceCharge,
      otherServicesServiceCharge,
      hotelTotalCost: round2(hotelBookingAmount + hotelServiceCharge),
      vehicleTotalCost: round2(vehicleBookingAmount + vehicleServiceCharge),
      otherServicesTotalCost: round2(
        otherServicesAmount + otherServicesServiceCharge
      ),
      serviceChargeOnCost,
      serviceChargeOnPackage,
      packageFeesTotal,
      packageCost,
      packageServiceCharge,
      packageTotalCost,
      discount,
      totalPackageCost,
      payableAmount,
      agentPayableTotal,
      agentPaidAmount,
      agentOutstanding,
    };
  }, [costingData, watched, isPackage, isJourney]);

  const saveMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/booking-costings/${bookingId}`, {
        ...data,
        agentId: data.agentId || null,
        transferBankId: data.transferBankId || null,
        ofBankId: data.ofBankId || null,
        paymentMode: data.paymentMode || null,
        paidAmount: data.paidAmount === "" ? null : data.paidAmount,
        chequeDate: data.chequeDate || null,
        journeyServiceCharge: data.journeyServiceCharge || 0,
        hotelServiceCharge: data.hotelServiceCharge || 0,
        vehicleServiceCharge: data.vehicleServiceCharge || 0,
        otherServicesServiceCharge: data.otherServicesServiceCharge || 0,
        serviceChargeOnCost: isPackage ? data.serviceChargeOnCost || 0 : 0,
        serviceChargeOnPackage: isPackage
          ? data.serviceChargeOnPackage || 0
          : 0,
        discount: data.discount || 0,
        gstPercent: 0,
        gstAmount: 0,
        inclusiveServiceTax: false,
        inputCommission: 0,
        commissionAmount: 0,
      }),
    onSuccess: () => {
      toast.success("Costing saved. Quotation & tax invoice regenerated.");
      queryClient.invalidateQueries({ queryKey: ["booking-costing", bookingId] });
      setHydrated(false);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.errors?.message ||
          error.message ||
          "Failed to save costing"
      );
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    saveMutation.mutate(data);
  };

  const openPdfInNewTab = async (
    kind: "tax-invoice" | "quotation" | "package-summary"
  ) => {
    try {
      const response = await get(
        `/booking-costings/${bookingId}/${kind}`,
        undefined,
        { responseType: "blob" }
      );
      const contentType = response.headers?.["content-type"] || "";
      if (contentType.includes("application/json")) {
        toast.error(`Failed to open ${kind}`);
        return;
      }
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        toast.error("Pop-up blocked. Allow pop-ups to view the PDF.");
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 120_000);
    } catch {
      toast.error(`Failed to open ${kind}`);
    }
  };

  const selectedAgentId = watch("agentId");
  useEffect(() => {
    if (!selectedAgentId || !agents) return;
    const agent = agents.find(
      (a: { id: number | string }) => String(a.id) === String(selectedAgentId)
    );
    const currentFavour = watch("inFavourOf");
    if (agent?.agentName && (!currentFavour || currentFavour.trim() === "")) {
      setValue("inFavourOf", agent.agentName);
    }
  }, [selectedAgentId, agents, setValue, watch]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const fieldLabel = "mb-0.5 block text-[11px] font-medium text-slate-600";
  const panel =
    "rounded border border-slate-200 bg-white shadow-sm overflow-hidden";
  const panelHead =
    "px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-700";
  const inputSm = "h-7 text-xs";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 space-y-3 text-xs bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-md border border-slate-200 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Booking Costing</h2>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {costingData?.bookingType === "Confirm" && (
            <>
              {isPackage ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => openPdfInNewTab("package-summary")}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Print Package Summary
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => openPdfInNewTab("quotation")}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View Quotation
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => openPdfInNewTab("tax-invoice")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Print Invoice
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Package / Agent Costing */}
        <div className={panel}>
          <div className={panelHead}>Package / Agent Costing</div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {isPackage ? (
              <div>
                <Label className={fieldLabel}>Package Agent</Label>
                <Controller
                  name="agentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) =>
                        setValue("agentId", value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger className={inputSm}>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">---</SelectItem>
                        {(agents || []).map(
                          (agent: { id: number; agentName: string }) => (
                            <SelectItem key={agent.id} value={String(agent.id)}>
                              {agent.agentName}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="flex items-end pb-1">
              <Controller
                name="isPaid"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPaid"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isPaid" className="text-xs">
                      Is Paid
                    </Label>
                  </div>
                )}
              />
            </div>

            <div>
              <Label className={fieldLabel}>Payment Mode</Label>
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => setValue("paymentMode", value)}
                  >
                    <SelectTrigger className={inputSm}>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className={fieldLabel}>Paid Amount</Label>
              <NumericInput
                className={cn(inputSm, "text-right")}
                {...register("paidAmount")}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label className={fieldLabel}>Transfer To Bank</Label>
              <Controller
                name="transferBankId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) =>
                      setValue(
                        "transferBankId",
                        value === "none" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger className={inputSm}>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">---</SelectItem>
                      {(banks || []).map(
                        (bank: { id: number; bankName: string }) => (
                          <SelectItem key={bank.id} value={String(bank.id)}>
                            {bank.bankName}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className={fieldLabel}>Account No</Label>
              <Input className={inputSm} {...register("accountNo")} />
            </div>

            <div>
              <Label className={fieldLabel}>Cheque No</Label>
              <Input className={inputSm} {...register("chequeNumber")} />
            </div>

            <div>
              <Label className={fieldLabel}>Cheque Date</Label>
              <Input
                type="date"
                className={inputSm}
                {...register("chequeDate")}
              />
            </div>

            <div>
              <Label className={fieldLabel}>Of Bank</Label>
              <Controller
                name="ofBankId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) =>
                      setValue("ofBankId", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className={inputSm}>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">---</SelectItem>
                      {(banks || []).map(
                        (bank: { id: number; bankName: string }) => (
                          <SelectItem key={bank.id} value={String(bank.id)}>
                            {bank.bankName}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className={fieldLabel}>In Favour Of</Label>
              <Input className={inputSm} {...register("inFavourOf")} />
            </div>

            {isPackage ? (
              <div className="md:col-span-2">
                <Label className={fieldLabel}>Bill Description</Label>
                <Textarea
                  rows={2}
                  className="text-xs min-h-[52px]"
                  {...register("billDescription")}
                />
              </div>
            ) : null}

            <div className="md:col-span-2 text-[11px] border-t border-slate-200 pt-2 space-y-0.5 bg-slate-50 -mx-3 px-3 -mb-3 pb-2">
              <p className="text-[10px] text-slate-500 mb-1">
                Agent cost = hotel + vehicle + extra package cost (excludes
                service charges, other services &amp; journey)
              </p>
              <div className="flex justify-between">
                <span className="text-slate-600">Hotel booking charge</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(liveTotals.hotelBookingAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Vehicle booking charge</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(liveTotals.vehicleBookingAmount)}
                </span>
              </div>
              {isPackage ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Extra package cost</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(liveTotals.serviceChargeOnCost)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between font-medium text-slate-700 border-t border-slate-200 pt-1">
                <span>Agent payable total</span>
                <span className="tabular-nums">
                  {formatCurrency(liveTotals.agentPayableTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Paid to agent</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(liveTotals.agentPaidAmount)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Agent outstanding</span>
                <span className="tabular-nums">
                  {formatCurrency(liveTotals.agentOutstanding)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Costing */}
        <div className={panel}>
          <div className={panelHead}>Total Costing</div>
          <div className="p-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-200">
                  <TableHead className="h-7 text-[11px] px-2">
                    Particulars
                  </TableHead>
                  <TableHead className="h-7 text-[11px] px-2 text-right">
                    Cost
                  </TableHead>
                  <TableHead className="h-7 text-[11px] px-2 text-right">
                    Service Charge
                  </TableHead>
                  <TableHead className="h-7 text-[11px] px-2 text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Journey</TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.journeyBookingAmount)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <NumericInput
                      className="h-7 text-xs text-right"
                      {...register("journeyServiceCharge")}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.journeyTotalCost)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Hotel</TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.hotelBookingAmount)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <NumericInput
                      className="h-7 text-xs text-right"
                      {...register("hotelServiceCharge")}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.hotelTotalCost)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Vehicle</TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.vehicleBookingAmount)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <NumericInput
                      className="h-7 text-xs text-right"
                      {...register("vehicleServiceCharge")}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.vehicleTotalCost)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Other Services</TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.otherServicesAmount)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <NumericInput
                      className="h-7 text-xs text-right"
                      {...register("otherServicesServiceCharge")}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.otherServicesTotalCost)}
                  </TableCell>
                </TableRow>
                {isPackage && (
                  <TableRow className="border-slate-100">
                    <TableCell className="py-1 px-2">Package Cost</TableCell>
                    <TableCell className="py-1 px-2">
                      <NumericInput
                        className="h-7 text-xs text-right"
                        {...register("serviceChargeOnCost")}
                        placeholder="Package cost"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <NumericInput
                        className="h-7 text-xs text-right"
                        {...register("serviceChargeOnPackage")}
                        placeholder="SC on package"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2 text-right tabular-nums">
                      {formatCurrency(liveTotals.packageFeesTotal)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="font-semibold bg-slate-50 border-slate-200">
                  <TableCell className="py-1.5 px-2">
                    Total Package Amount
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.packageCost)}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.packageServiceCharge)}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right tabular-nums">
                    {formatCurrency(liveTotals.packageTotalCost)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Discount</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="py-1 px-2">
                    <NumericInput
                      className="h-7 text-xs text-right"
                      {...register("discount")}
                    />
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100 bg-emerald-50/60">
                  <TableCell className="py-1 px-2">
                    Amount Paid by Client
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="py-1 px-2 text-right tabular-nums font-medium text-emerald-800">
                    {formatCurrency(clientPaidAmount)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-slate-100">
                  <TableCell className="py-1 px-2">Client Outstanding</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="py-1 px-2 text-right tabular-nums font-medium">
                    {formatCurrency(
                      Math.max(0, liveTotals.payableAmount - clientPaidAmount)
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="font-bold bg-slate-200/80 border-slate-300">
                  <TableCell className="py-2 px-2">Total Payable</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums">
                    {formatCurrency(liveTotals.payableAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {costingData?.taxInvoiceNumber && (
            <p className="text-[10px] text-muted-foreground px-3 pb-2">
              Tax Invoice No: {costingData.taxInvoiceNumber}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className="h-8 text-xs"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && (
            <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
          )}
          Save Costing
        </Button>
      </div>
      {errors && Object.keys(errors).length > 0 ? null : null}
    </form>
  );
};

export default BookingCosting;
