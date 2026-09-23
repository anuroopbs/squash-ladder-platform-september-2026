"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateLadderModal } from "./CreateLadderModal";

interface CreateLadderButtonForClubProps {
  cityId: string;
  clubId: string;
}

/** Empty-club-page entry point: pre-fills city + club so the user only has
 * to type a ladder name. Used where a club exists but has zero ladders. */
export function CreateLadderButtonForClub({ cityId, clubId }: CreateLadderButtonForClubProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="mt-4">
        🏆 Create a Ladder for This Club
      </Button>
      {open && (
        <CreateLadderModal
          onClose={() => setOpen(false)}
          presetCityId={cityId}
          presetClubId={clubId}
        />
      )}
    </>
  );
}
