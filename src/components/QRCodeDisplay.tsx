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
          <div className="bg-[#1A1F1A] text-[#C9A86A] font-serif text-[9px] font-bold px-1.5 py-0.5 border border-[#C9A86A] shadow-sm">
            IM
          </div>
        </div>
      </div>

      {/* ID Label & Verification Badges */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-mono text-xs font-bold text-[#C9A86A] tracking-wider">
            {uniqueId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy Unique ID"
            className="text-[#8A9A7E] hover:text-[#EDE6D3] transition-colors p-0.5 cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>

        <p className="font-sans text-[9px] uppercase tracking-[0.16em] text-[#8A9A7E]">
          {subtitle}
        </p>

        {showScannerTest && (
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-[#2E3B2F] hover:bg-[#3d4d3e] border border-[#C9A86A]/30 text-[#C9A86A] font-sans text-[9px] font-medium uppercase tracking-wider transition-all cursor-pointer"
          >
            <QrCode className="h-3 w-3 text-[#C9A86A]" />
            Test Scanner Display
          </button>
        )}
      </div>

      {/* Simulated QR Scanner Readout Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141814]/90 backdrop-blur-md p-4 animate-fade-in" id="qr-scanner-test-modal">
          <div className="relative w-full max-w-md bg-[#2E3B2F] border-2 border-[#C9A86A] p-6 shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 p-1 border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#8A9A7E] hover:text-[#EDE6D3] hover:border-[#C9A86A] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 text-[#C9A86A]">
              <ShieldCheck className="h-6 w-6 text-[#C9A86A]" />
              <div>
                <h3 className="font-serif text-lg font-normal text-[#EDE6D3] tracking-wide">
                  QR Scanner Decoded Payload
                </h3>
                <p className="font-sans text-[10px] text-[#8A9A7E] tracking-wider uppercase">
                  Simulating Camera / Smartphone Scanner Readout
                </p>
              </div>
            </div>

            <div className="bg-[#1A1F1A] border border-[#8A9A7E]/20 p-4 font-mono text-xs text-[#EDE6D3] space-y-2 whitespace-pre-wrap">
              <div className="flex items-center justify-between border-b border-[#8A9A7E]/20 pb-2 mb-2">
                <span className="text-[10px] uppercase text-[#C9A86A] font-bold flex items-center gap-1 font-sans tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Scanned Valid ID
                </span>
                <span className="text-[10px] text-[#8A9A7E]">{new Date().toLocaleTimeString()}</span>
              </div>
              <p className="text-[#C9A86A] font-bold text-sm">UNIQUE ID: {uniqueId}</p>
              <p className="text-[#EDE6D3]">Candidate: {candidateName}</p>
              <p className="text-[#EDE6D3]/80 text-[11px] font-sans">
                Notice: Registration Confirmed. Council portfolio allotment pending EB review.
              </p>
            </div>

            <div className="flex items-center justify-between text-[#8A9A7E] font-sans text-[10px]">
              <span>Verified by IIST MUN Secretariat</span>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="px-4 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
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
