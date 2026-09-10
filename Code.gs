const CONFIG = {
  sheetId: '17YA37An8wM2dUR9_uK7toIFl4He983aMfHtpiAejvg8',
  driveFolderId: '18e4D2BD8dwmnjyhH49-S06aLas5u8P3S',
  senderAddress: 'thongnm@vmb.edu.vn',
  senderName: 'VMB - ICDL Việt Nam'
};

// Chạy hàm này một lần trong Apps Script để cấp quyền cho Drive, Sheet và Gmail.
function setupAuthorization() {
  const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
  const sheet = SpreadsheetApp.openById(CONFIG.sheetId);
  const aliases = GmailApp.getAliases();

  if (!folder || !sheet) {
    throw new Error('Không truy cập được thư mục Drive hoặc Google Sheet.');
  }
  if (!aliases.includes(CONFIG.senderAddress)) {
    throw new Error('Tài khoản Apps Script chưa có alias ' + CONFIG.senderAddress + ' trong Gmail.');
  }

  Logger.log('Đã cấp quyền và kiểm tra alias gửi mail: ' + CONFIG.senderAddress);
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const pdfBytes = Utilities.base64Decode(request.pdfBase64);
    const pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', request.fileName || 'Phieu_Dang_Ky_ICDL.pdf');
    const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    const driveFile = folder.createFile(pdfBlob);
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getSheets()[0];
    const record = request.record;

    sheet.appendRow([
      new Date(), record.cccd, record.name, record.phone, record.email,
      record.job, record.dob, record.gender, record.address, record.region,
      record.modules.join(', '), record.total, driveFile.getUrl()
    ]);

    sendEmailThroughGmail(request, pdfBlob);
    return jsonResponse({ ok: true, fileUrl: driveFile.getUrl() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function sendEmailThroughGmail(request, pdfBlob) {
  const aliases = GmailApp.getAliases();
  if (!aliases.includes(CONFIG.senderAddress)) {
    throw new Error('Tài khoản Apps Script chưa có quyền gửi thay mặt ' + CONFIG.senderAddress + '.');
  }

  const subject = 'Xác nhận đăng ký dự thi ICDL - VMB Education';
  const plainBody = request.emailHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  GmailApp.sendEmail(request.record.email, subject, plainBody, {
    from: CONFIG.senderAddress,
    name: CONFIG.senderName,
    htmlBody: request.emailHtml,
    attachments: [pdfBlob]
  });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
