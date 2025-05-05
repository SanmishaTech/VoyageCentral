import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { post, get } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Validate from "@/lib/Handlevalidation";

interface Country {
  id: number;
  countryName: string;
  createdAt: string;
  updatedAt: string;
}

interface CountriesResponse {
  countries: Country[];
  page: number;
  totalPages: number;
  totalCountries: number;
}

const statesSchema = z.object({
  stateName: z.string().min(1, "State name is required"),
  countryId: z.number().min(1, "Country is required"),
});

type StateFormData = z.infer<typeof statesSchema>;

interface CreateStateProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateState: React.FC<CreateStateProps> = ({ isOpen, onClose }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: countriesResponse } = useQuery<CountriesResponse>({
    queryKey: ["countries"],
    queryFn: () => get("/countries"),
  });

  const countries = countriesResponse?.countries || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
    watch,
  } = useForm<StateFormData>({
    resolver: zodResolver(statesSchema),
    defaultValues: {
      stateName: "",
      countryId: undefined,
    },
  });

  const createStateMutation = useMutation({
    mutationFn: (newState: StateFormData) => post("/states", newState),
    onSuccess: () => {
      toast.success("State created successfully");
      queryClient.invalidateQueries(["states"]);
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to create states");
      Validate(error, setError);
    },
  });

  const onSubmit = (data: StateFormData) => {
    createStateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 space-y-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="countryId">Country</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between"
                  >
                    {watch("countryId")
                      ? countries.find(
                          (country) => country.id === watch("countryId")
                        )?.countryName
                      : "Select country..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={country.id}
                          onSelect={() => {
                            setValue("countryId", country.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              watch("countryId") === country.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {country.countryName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.countryId && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[105%]">
                  {errors.countryId.message}
                </span>
              )}
            </div>

            <div className="grid gap-2 relative">
              <Label htmlFor="stateName">State Name</Label>
              <Input
                id="stateName"
                placeholder="Enter State Name..."
                {...register("stateName")}
              />
              {errors.stateName && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.stateName.message}
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateState;
