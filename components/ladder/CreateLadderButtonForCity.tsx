"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateLadderModal } from "./CreateLadderModal";

interface CreateLadderButtonForCityProps {
  cityId: string;
}

/** City-page entry point: pre-fills the city so the user picks/creates a
 * club and names their ladder. Shown for "add another club/ladder here". */
export function CreateLadderButtonForCity({ cityId }: CreateLadderButtonForCityProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        🏆 Create a Ladder
      </Button>
      {open && <CreateLadderModal onClose={() => setOpen(false)} presetCityId={cityId} />}
    </>
  );
}
