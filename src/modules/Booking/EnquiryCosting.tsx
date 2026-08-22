import React, { useEffect, useState } from "react";
import { useFieldArray, useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, PlusCircle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Line = {
  fairName?: string;
  description?: string;
  cost?: string;
};

type FormInputs = {
  costingNote?: string;
  lines: Line[];
};

const EnquiryCosting = ({ bookingId }: { bookingId?: string }) => {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  const { register, control, handleSubmit, reset, watch } =
    useForm<FormInputs>({
      defaultValues: { costingNote: "", lines: [{ fairName: "", description: "", cost: "" }] },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["enquiry-costing", bookingId],
    queryFn: async () => get(`/booking-costings/${bookingId}/enquiry-costing`),
    enabled: !!bookingId,
  });

  useEffect(() => {
    setHydrated(false);
  }, [bookingId]);

  useEffect(() => {
    if (!data || hydrated) return;
    reset({
      costingNote: data.costingNote || "",
      lines:
        data.lines?.length > 0
          ? data.lines.map((l: any) => ({
              fairName: l.fairName || "",
              description: l.description || "",
              cost: l.cost != null ? String(l.cost) : "",
            }))
          : [{ fairName: "", description: "", cost: "" }],
    });
    setHydrated(true);
  }, [data, hydrated, reset]);

  const lines = watch("lines") || [];
  const total = lines.reduce((s, l) => s + (Number(l.cost) || 0), 0);

  const saveMutation = useMutation({
    mutationFn: (payload: FormInputs) =>
      put(`/booking-costings/${bookingId}/enquiry-costing`, payload),
    onSuccess: () => {
      toast.success("Enquiry costing saved. Estimate PDF generated.");
      queryClient.invalidateQueries({
        queryKey: ["enquiry-costing", bookingId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save enquiry costing");
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (form) => {
    saveMutation.mutate({
      costingNote: form.costingNote,
      lines: (form.lines || []).filter(
        (l) => l.fairName || l.description || l.cost
      ),
    });
  };

  const openEstimate = async () => {
    try {
      const response = await get(
        `/booking-costings/${bookingId}/estimate`,
        undefined,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        toast.error("Pop-up blocked. Allow pop-ups to view the PDF.");
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 120_000);
    } catch {
      toast.error("Failed to open estimate");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 border rounded-md p-4 bg-white">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Enquiry Costing</h2>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={openEstimate}>
          <ExternalLink className="mr-1 h-3 w-3" />
          Estimate PDF
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Fair</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[18%]">Cost</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id}>
              <TableCell>
                <Input {...register(`lines.${index}.fairName`)} placeholder="Fair" />
              </TableCell>
              <TableCell>
                <Input
                  {...register(`lines.${index}.description`)}
                  placeholder="Description"
                />
              </TableCell>
              <TableCell>
                <NumericInput
                  {...register(`lines.${index}.cost`)}
                  placeholder="0.00"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ fairName: "", description: "", cost: "" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add line
        </Button>
        <div className="font-semibold">
          Total: {formatCurrency(total)}
        </div>
      </div>

      <div>
        <Label>Costing Note</Label>
        <Textarea rows={3} {...register("costingNote")} className="mt-1" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Enquiry Costing
        </Button>
      </div>
    </form>
  );
};

export default EnquiryCosting;
