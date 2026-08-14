import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/user-queries";
import { getDb } from "@/../db/database";
import ExcelJS from "exceljs";

const DEPARTMENT_MAP: Record<string, string> = {
  ese: "ESE",
  wemea: "WEMEA",
  africa: "WEMEA",
  "middle-east": "WEMEA",
  canal: "CANAL",
  "anz-pacific": "CANAL",
  asia: "Asia",
};

const DEPARTMENTS = ["ESE", "WEMEA", "CANAL", "Asia"] as const;

function getDaysUntilExpiry(expires: string | null): number | null {
  if (!expires) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expires + "T00:00:00");
  return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusLabel(expires: string | null): string {
  const days = getDaysUntilExpiry(expires);
  if (days === null) return "No Date";
  if (days < 0) return "Expired";
  if (days <= 14) return "Expiring Soon";
  return "Active";
}

function getStatusFill(expires: string | null): Partial<ExcelJS.Fill> {
  const days = getDaysUntilExpiry(expires);
  if (days === null) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
  if (days < 0) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCDD2" } };
  if (days <= 14) return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFECB3" } };
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFC8E6C9" } };
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const user = await validateSession(sessionCookie.value);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const snap = await getDb().collection("destinations").get();

    interface StopSellRow {
      name: string;
      region_name: string;
      status: string;
      expires: string | null;
      days: number | null;
      urgency: string | null;
      note: string | null;
    }

    const byDepartment: Record<string, StopSellRow[]> = {};
    for (const dept of DEPARTMENTS) byDepartment[dept] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const urgency = ((data.urgency as string) || "").trim() || null;
      const stopSellExpires = (data.stop_sell_expires as string) || null;
      const status = (data.status as string) || "active";

      if (!urgency && !stopSellExpires && status !== "stop_sell") continue;

      const regionSlug = (data.region_slug as string) || "";
      const dept = DEPARTMENT_MAP[regionSlug];
      if (!dept) continue;

      byDepartment[dept].push({
        name: (data.name as string) || doc.id,
        region_name: (data.region_name as string) || "",
        status: getStatusLabel(stopSellExpires),
        expires: stopSellExpires,
        days: getDaysUntilExpiry(stopSellExpires),
        urgency,
        note: (data.stop_sell_note as string) || null,
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GTT Country Snapshot";
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3A5F54" } };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    const repNotesFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFDE7" } };

    const columns = [
      { header: "Destination", width: 28 },
      { header: "Region", width: 20 },
      { header: "Status", width: 16 },
      { header: "Expiration Date", width: 18 },
      { header: "Days Until Expiry", width: 18 },
      { header: "Urgency Notes", width: 35 },
      { header: "Stop Sell Notes", width: 35 },
      { header: "Rep Notes / Commentary", width: 35 },
    ];

    for (const dept of DEPARTMENTS) {
      const sheet = workbook.addWorksheet(dept);
      sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

      // Row 1: Title
      sheet.mergeCells("A1:H1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `GTT Stop Sell Report — ${dept}`;
      titleCell.font = { bold: true, size: 14 };

      // Row 2: Date
      sheet.mergeCells("A2:H2");
      const dateCell = sheet.getCell("A2");
      dateCell.value = `Generated: ${today}`;
      dateCell.font = { size: 10, color: { argb: "FF666666" } };

      // Row 3: spacer (empty)

      // Row 4: Column headers
      const headerRow = sheet.getRow(4);
      columns.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: "middle", horizontal: "left" };
        sheet.getColumn(i + 1).width = col.width;
      });
      headerRow.height = 22;

      // Freeze header row and add auto-filter
      sheet.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }];
      sheet.autoFilter = { from: "A4", to: "H4" };

      const rows = byDepartment[dept].sort((a, b) => a.name.localeCompare(b.name));

      if (rows.length === 0) {
        sheet.mergeCells("A5:H5");
        const emptyCell = sheet.getCell("A5");
        emptyCell.value = "No active stop sells";
        emptyCell.font = { italic: true, color: { argb: "FF999999" } };
        emptyCell.alignment = { horizontal: "center" };
        continue;
      }

      rows.forEach((row, idx) => {
        const excelRow = sheet.getRow(5 + idx);
        excelRow.getCell(1).value = row.name;
        excelRow.getCell(2).value = row.region_name;

        const statusCell = excelRow.getCell(3);
        statusCell.value = row.status;
        statusCell.fill = getStatusFill(row.expires) as ExcelJS.Fill;

        excelRow.getCell(4).value = row.expires || "";
        excelRow.getCell(5).value = row.days !== null ? row.days : "";
        excelRow.getCell(6).value = row.urgency || "";
        excelRow.getCell(7).value = row.note || "";

        const repCell = excelRow.getCell(8);
        repCell.value = "";
        repCell.fill = repNotesFill;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="GTT_Stop_Sell_Report_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("stop-sells export error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
