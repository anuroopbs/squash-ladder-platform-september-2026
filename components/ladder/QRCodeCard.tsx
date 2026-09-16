"use client";

import { useState } from "react";

interface QRCodeCardProps {
  clubName: string;
  ladderName: string;
  url: string;
}

export function QRCodeCard({ clubName, ladderName, url }: QRCodeCardProps) {
  const [showQR, setShowQR] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">{clubName}</h4>
          <p className="text-xs text-white/40">{ladderName}</p>
        </div>
        <button
          onClick={() => setShowQR(!showQR)}
          className="rounded-lg bg-court-500/15 px-3 py-1.5 text-xs font-medium text-court-300 ring-1 ring-court-500/20 hover:bg-court-500/25"
        >
          {showQR ? "Hide QR" : "Show QR"}
        </button>
      </div>

      {showQR && (
        <div className="mt-4 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR Code for ${clubName} - ${ladderName}`}
            className="rounded-lg"
            width={200}
            height={200}
          />
          <p className="text-xs text-white/40 text-center">
            Scan to open this ladder ranking
          </p>
          <p className="text-xs text-white/30 text-center break-all max-w-[250px]">
            {url}
          </p>
        </div>
      )}
    </div>
  );
}
