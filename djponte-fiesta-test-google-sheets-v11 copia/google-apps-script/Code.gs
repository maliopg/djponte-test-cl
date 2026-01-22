/**
 * DJ Ponte - Lead Receiver for Google Sheets
 * Deploy as a Web App and set CONFIG.leadEndpoint to the Web App URL.
 *
 * Expected: POST JSON body (Content-Type: application/json)
 * It will append a row to the active spreadsheet.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = "Leads";
    const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    // Create header if empty
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        "createdAt",
        "name",
        "email",
        "whatsapp",
        "zone",
        "consent",
        "eventType",
        "guests",
        "venue",
        "timeline",
        "musicImportance",
        "worries",
        "badParty",
        "expectation",
        "investment",
        "note",
        "FiestaScore",
        "risk",
        "riskLevel",
        "packName",
        "packPrice",
        "page",
        "referrer",
        "userAgent",
        "rawJson"
      ]);
    }

    const lead = (data.lead || {});
    const report = (data.report || {});
    const answers = (report.answers || {});
    const source = (data.source || {});

    const row = [
      report.createdAt || new Date().toISOString(),
      lead.name || "",
      lead.email || "",
      lead.whatsapp || "",
      lead.zone || "",
      String(lead.consent || false),
      answers.eventType || "",
      answers.guests || "",
      answers.venue || "",
      answers.timeline || "",
      answers.musicImportance || "",
      Array.isArray(answers.worries) ? answers.worries.join(",") : (answers.worries || ""),
      answers.badParty || "",
      answers.expectation || "",
      answers.investment || "",
      answers.note || "",
      report.score ?? "",
      report.risk ?? "",
      report.riskLevel || "",
      (report.pack && report.pack.name) ? report.pack.name : "",
      (report.pack && report.pack.price) ? report.pack.price : "",
      source.page || "",
      source.ref || "",
      source.userAgent || "",
      JSON.stringify(data)
    ];

    sh.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: allow CORS preflight if needed (some browsers / hosts)
function doGet() {
  return ContentService
    .createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}



/**
 * Optional email notification (uncomment to enable)
 * This will send an email to djponteabailar@gmail.com each time a lead arrives (only if consent=true).
 */
// if (String(lead.consent) === "true") {
//   MailApp.sendEmail({
//     to: "djponteabailar@gmail.com",
//     subject: "Nuevo lead - Diagnóstico DJ Ponte",
//     htmlBody: "Nuevo lead:<br><pre>" + JSON.stringify(data, null, 2) + "</pre>"
//   });
// }
