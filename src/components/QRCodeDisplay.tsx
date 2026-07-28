import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, CheckCircle2, ShieldCheck, ExternalLink, X, Copy, Check } from "lucide-react";

interface QRCodeDisplayProps {
  uniqueId: string;
  candidateName: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showScannerTest?: boolean;
}

export default function QRCodeDisplay({
  uniqueId,
  candidateName,
  title = "IIST MUN 2026 Boarding Pass",
  subtitle = "Scan at Security / Verification Counter",
  size = 140,
  showScannerTest = true,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Encode text so phone QR scanners read the Unique ID clearly
  const qrEncodedText = `UNIQUE ID: ${uniqueId}\n${title}\nDelegate: ${candidateName}\nStatus: CONFIRMED (Portfolio Allotment Pending)\nVerification URL: https://iistmun.in/verify?id=${encodeURIComponent(
    uniqueId
  )}`;

  useEffect(() => {
    QRCode.toDataURL(
      qrEncodedText,
      {
        width: size * 2,
        margin: 1,
        color: {
          dark: "#090d16",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [uniqueId, candidateName, title, size]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* QR Code Frame */}
      <div className="relative group p-2.5 bg-white rounded-2xl shadow-xl border border-slate-200">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for ${uniqueId}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded-lg object-contain"
          />
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-100 rounded-lg"
          >
            <div className="h-6 w-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Small center logo badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950 text-cyan-400 font-mono text-[8px] font-black px-1.5 py-0.5 rounded border border-cyan-500/50 shadow-md">
            IIST
          </div>
        </div>
      </div>

      {/* ID Label & Verification Badges */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-mono text-xs font-extrabold text-cyan-400 tracking-wider">
            {uniqueId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy Unique ID"
            className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>

        <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
          {subtitle}
        </p>

        {showScannerTest && (
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <QrCode className="h-3 w-3 text-cyan-400" />
            Test Scanner Display
          </button>
        )}
      </div>

      {/* Simulated QR Scanner Readout Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-cyan-400">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
              <div>
                <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">
                  QR Scanner Decoded Payload
                </h3>
                <p className="font-mono text-[10px] text-slate-400">
                  Simulating Camera / Smartphone Scanner Readout
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 space-y-2 whitespace-pre-wrap">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                <span className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Scanned Valid ID
                </span>
                <span className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</span>
              </div>
              <p className="text-cyan-300 font-bold text-sm">UNIQUE ID: {uniqueId}</p>
              <p className="text-slate-300">Candidate: {candidateName}</p>
              <p className="text-amber-400 text-[11px] font-sans">
                Notice: Registration Confirmed. Portfolio will be allotted shortly.
              </p>
            </div>

            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span>Verified by IIST MUN Telemetry</span>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
