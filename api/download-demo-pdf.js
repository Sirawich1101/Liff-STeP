function escapePdfText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function buildPdf(lines) {
  const text = [
    "BT",
    "/F1 16 Tf",
    "50 790 Td",
    "20 TL",
    ...lines.map((line, index) =>
      index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text, "utf8")} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

async function fetchRequest(requestCode) {
  const response = await fetch(
    "https://zennnnn.app.n8n.cloud/webhook/check-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.STEP_WEBHOOK_SECRET
          ? { "x-step-secret": process.env.STEP_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ requestCode }),
    }
  );

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { code = "", token = "" } = req.query;
  if (!code) {
    return res.status(400).json({ success: false, error: "Missing code" });
  }

  try {
    const data = await fetchRequest(code);
    if (!data?.found || !data?.request) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    const request = data.request;
    const expectedToken = request.pdf_download_token || "";
    if (expectedToken && token !== expectedToken) {
      return res.status(403).json({ success: false, error: "Invalid download token" });
    }

    const lines = [
      "STeP CMU Blueprint Document (Fallback Demo)",
      "",
      `Request Code: ${request.request_code || code}`,
      `Requester: ${request.requester_name || "-"}`,
      `Organization: ${request.company || "-"}`,
      `Document Type: ${request.document_type || "-"}`,
      `Area: ${request.area || "-"}`,
      `Building: ${request.building || "-"}`,
      `Floor: ${request.floor || "-"}`,
      `Room Number: ${request.objective || request.room_number || request.roomNumber || "-"}`,
      `Prepared File: ${request.admin_file_name || request.pdf_file_name || "-"}`,
      `Status: ${request.status || "-"}`,
      `Approved At: ${request.approved_at || request.updated_at || "-"}`,
      "",
      "This fallback PDF is generated only when a real uploaded file is not available.",
    ];

    const pdf = buildPdf(lines);
    const fileName = request.pdf_file_name || `${code}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(pdf);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}