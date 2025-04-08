import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AddSubscription = () => {
  const [open, setOpen] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [agent, setAgent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New subscription:", { packageName, agent });
    // reset & close
    setPackageName("");
    setAgent("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Subscription</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="package">Package</Label>
            <Input
              id="package"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent">Agent</Label>
            <Input
              id="agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="submit">Add</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscription;
