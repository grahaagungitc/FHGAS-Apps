import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatSaaNumber } from "@/lib/saa-number";

export const dynamic = "force-dynamic";

function formatTimestamp(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "medium",
        timeZone: "Asia/Jakarta",
      }).format(value)
    : "-";
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function verificationImage(
  saaNumber: string,
  category: string,
  heading: string,
  rows: { label: string; value: string }[],
) {
  const metadata = [
    { label: "Nomor SAA", value: saaNumber },
    { label: category === "Pengajuan" ? "Nama Pemohon" : "Nama Approver", value: heading },
    ...rows,
  ];

  const rowsMarkup = metadata.map((item, index) => {
    const y = 290 + index * 135;
    return `<g>
      <text x="72" y="${y}" fill="#64748b" font-family="Arial, sans-serif" font-size="20" font-weight="700">${escapeXml(item.label.toUpperCase())}</text>
      <text x="72" y="${y + 44}" fill="#0f172a" font-family="Arial, sans-serif" font-size="31" font-weight="700">${escapeXml(item.value)}</text>
      <line x1="72" y1="${y + 72}" x2="1128" y2="${y + 72}" stroke="#cbd5e1" stroke-width="2" />
    </g>`;
  }).join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <rect width="1200" height="900" fill="#f1f5f9" />
      <rect width="1200" height="18" fill="#0e7490" />
      <text x="72" y="88" fill="#0e7490" font-family="Arial, sans-serif" font-size="20" font-weight="700">FHGAS / SYSTEM ACCESS AUTHORIZATION</text>
      <text x="72" y="158" fill="#0f172a" font-family="Arial, sans-serif" font-size="42" font-weight="700">Data SAA Tercatat</text>
      <text x="72" y="202" fill="#475569" font-family="Arial, sans-serif" font-size="24">${escapeXml(category)}</text>
      ${rowsMarkup}
      <text x="72" y="850" fill="#64748b" font-family="Arial, sans-serif" font-size="17">Metadata diambil dari rekaman SAA pada sistem FHGAS.</text>
    </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const signature = new URL(request.url).searchParams.get("signature");
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return NextResponse.json({ message: "Data QR tidak valid." }, { status: 400 });
  }

  const requesterRecord = await db.saaRequest.findFirst({
    where: { requesterSignature: signature },
    select: {
      requestNumber: true,
      formType: true,
      name: true,
      requesterSignedByName: true,
      requesterSignedAt: true,
    },
  });

  if (requesterRecord) {
    return verificationImage(
      formatSaaNumber(requesterRecord.formType, requesterRecord.name, requesterRecord.requestNumber),
      "Pengajuan",
      requesterRecord.requesterSignedByName || requesterRecord.name,
      [{ label: "Waktu Request", value: formatTimestamp(requesterRecord.requesterSignedAt) }],
    );
  }

  const approvalRecord = await db.saaApprovalHistory.findFirst({
    where: { digitalSignature: signature },
    select: {
      status: true,
      signedAt: true,
      createdAt: true,
      signedByName: true,
      approver: { select: { name: true } },
      saaRequest: {
        select: { requestNumber: true, formType: true, name: true },
      },
    },
  });

  if (!approvalRecord) {
    return NextResponse.json({ message: "Rekaman tanda tangan tidak ditemukan." }, { status: 404 });
  }

  return verificationImage(
    formatSaaNumber(
      approvalRecord.saaRequest.formType,
      approvalRecord.saaRequest.name,
      approvalRecord.saaRequest.requestNumber,
    ),
    "Approval",
    approvalRecord.signedByName || approvalRecord.approver.name,
    [
      { label: "Waktu Approval", value: formatTimestamp(approvalRecord.signedAt || approvalRecord.createdAt) },
      { label: "Keputusan", value: approvalRecord.status === "APPROVED" ? "Disetujui" : "Ditolak" },
    ],
  );
}