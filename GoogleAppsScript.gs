/**
 * AL KALAM DENTAL CLINIC - Contact Form Backend (Google Apps Script)
 * 
 * This script will automatically:
 * 1. Send an email notification to drckrahman@gmail.com with patient details.
 * 2. (Optional) Save patient inquiries into a Google Spreadsheet.
 * 
 * ==========================================================================
 * 📋 DEPLOYMENT INSTRUCTIONS
 * ==========================================================================
 * 1. Open Google Sheets (https://sheets.google.com) and create a new blank spreadsheet.
 * 2. Rename it to "Al Kalam Inquiries" and copy the entire spreadsheet URL from the address bar.
 * 3. Go to Google Apps Script (https://script.google.com) and click "New Project".
 * 4. Clear any code in the editor, and paste this entire file's content inside.
 * 5. Paste your Spreadsheet URL in the SPREADSHEET_URL constant below (between '').
 * 6. Click the "Save" icon (or press Ctrl+S).
 * 7. Click the "Deploy" button at the top-right and select "New deployment".
 * 8. Click the Gear icon next to "Select type" and choose "Web app".
 * 9. Configure the settings exactly like this:
 *    - Description: "Al Kalam Web Form Backend"
 *    - Execute as: "Me (your email address)"
 *    - Who has access: "Anyone" (CRITICAL: If set to "Only myself", submissions will fail)
 * 10. Click "Deploy". Google will ask you to authorize access; click "Authorize Access", 
 *     select your Google account, click "Advanced", and click "Go to Untitled project (unsafe)".
 * 11. Once completed, copy the generated "Web app URL" (the link ending in /exec).
 * 12. Open `index.html` in your project folder, locate the `<form>` tag, and replace the 
 *     `action` link with your copied URL!
 */

// CONFIGURATION
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1BriaTWqsAY9xJo5nXjZ4QzLzHeK53WowUXwEL_YBVdo/edit?usp=sharing'; // Paste your Google Sheet URL here to record submissions
const RECIPIENT_EMAIL = '366adamj@gmail.com'; // Notification recipient email

function doPost(e) {
  try {
    var params = e.parameter;
    
    // Parse JSON body if parameters are not present directly
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // Fallback to query parameters
      }
    }
    
    var name = params.name || 'Not Provided';
    var phone = params.phone || 'Not Provided';
    var email = params.email || 'Not Provided';
    var message = params.message || 'Not Provided';
    
    // Get formatted date string in Indian Standard Time (IST)
    var dateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    
    // 1. SAVE TO SPREADSHEET (Optional but highly recommended)
    if (SPREADSHEET_URL && SPREADSHEET_URL !== '') {
      try {
        var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
        var sheet = ss.getSheets()[0]; // Appends to the first sheet
        
        // Add spreadsheet header titles if the sheet is completely empty
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(["Timestamp (IST)", "Full Name", "Phone Number", "Email Address", "Inquiry Message"]);
          
          // Format headers to look professional
          sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#e6f7ff").setFontColor("#0050b3");
        }
        
        sheet.appendRow([dateString, name, phone, email, message]);
      } catch (sheetError) {
        console.error("Failed to append to spreadsheet: " + sheetError.toString());
      }
    }
    
    // 2. SEND CLINIC EMAIL NOTIFICATION
    var subject = "New Al Kalam Clinic Inquiry from " + name;
    var emailBody = "You have received a new contact inquiry from the Al Kalam Dental Clinic website.\n\n" +
                    "==================================================\n" +
                    "📝 INQUIRY DETAILS\n" +
                    "==================================================\n" +
                    "📅 Date & Time : " + dateString + " (IST)\n" +
                    "👤 Patient Name: " + name + "\n" +
                    "📞 Phone Number: " + phone + "\n" +
                    "✉️ Email Address: " + email + "\n\n" +
                    "💬 Message:\n" + message + "\n" +
                    "==================================================\n\n" +
                    "This message was routed and delivered securely via Google Apps Script.";
                    
    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: emailBody
    });
    
    // Return a success JSON response
    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      success: true,
      message: "Message sent successfully!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error information back to the client
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      success: false,
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
