/**
 * Nu-Feel enquiry mailer (Google Apps Script web app)
 * ---------------------------------------------------
 * Website "Ask for a price" form -> this script -> two emails:
 *   1. To NOTIFY_TO: "New job NF-0001" with the job sheet PDF attached (photos embedded),
 *      the customer's original photos attached, and the same job sheet in the email body.
 *   2. To the customer (only if they gave an email): a short auto-reply with their reference.
 * Returns {"success":true,"ref":"NF-0001"} to the website.
 *
 * Only Google permission needed: "Send email as you". No Drive, Sheets or external requests.
 * Deploy: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
 * Then paste the /exec URL into the website form's data-endpoint.
 */

var CONFIG = {
  NOTIFY_TO: 'hello@theserviceedit.com',   // who receives new jobs. Change to nufeelps@outlook.com once Luke confirms.
  NOTIFY_CC: '',                           // optional second inbox
  AUTOREPLY: true,                         // email the customer a copy (only when they gave an email)
  REPLY_TO: 'nufeelps@outlook.com',        // where the customer's replies go
  FROM_NAME: 'Nu-Feel Property Services',
  OWNER: 'Luke',
  PHONE: '0432 036 898',
  REF_PREFIX: 'NF-',
  TIMEZONE: 'Australia/Perth',
  MAX_PER_HOUR: 30,                        // global cap, stops abuse
  MAX_PHOTOS: 6,
  MAX_PHOTO_BYTES: 1500000                 // per photo, after the website shrinks it
};

var LOGO = 'data:image/png;base64,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';

var C = { deep: '#000000', green: '#5AB445', greenText: '#2F7F3A', grey: '#EDEEEE', line: '#DCDDDD', ink: '#111312', muted: '#5F6463', soft: '#F5F5F5', blue: '#0AACE0' };

function doGet() { return json_({ ok: true, service: 'nufeel-enquiry' }); }

function doPost(e) {
  try {
    var d = parse_(e);
    if (d.botcheck) return json_({ success: true });                       // honeypot: pretend success
    if (!clean_(d.name) || !clean_(d.phone)) return json_({ success: false, error: 'missing name or phone' });
    if (!underCap_()) return json_({ success: false, error: 'busy' });

    var ref = nextRef_();
    var now = new Date();
    var photos = photos_(d.photos);
    var v = view_(d, ref, now, photos);

    var autoreplyOk = false;
    if (CONFIG.AUTOREPLY && v.emailRaw && isEmail_(v.emailRaw) && firstReplyToday_(v.emailRaw)) {
      try {
        MailApp.sendEmail({
          to: v.emailRaw, replyTo: CONFIG.REPLY_TO, name: CONFIG.FROM_NAME,
          subject: 'Got your photos, ' + v.firstNameRaw + ' (' + ref + ')',
          htmlBody: autoreplyHtml_(v), body: autoreplyText_(v)
        });
        autoreplyOk = true;
      } catch (err) { console.error('autoreply failed', err); }
    }
    v.autoreplyLine = autoreplyOk
      ? '<b>Copy emailed</b> to ' + v.email + ' at ' + v.time + ' with reference ' + ref + '.'
      : (v.emailRaw ? '<b>No copy emailed</b> to ' + v.email + '. Text or call them.' : '<b>No email given.</b> Text or call them on ' + v.phone + '.');

    var html = pdfHtml_(v);
    var pdf = Utilities.newBlob(html, 'text/html', ref + '.html').getAs('application/pdf').setName('Nu-Feel job ' + ref + ' ' + v.suburbRaw + '.pdf');
    var attachments = [pdf].concat(photos.map(function (p, i) {
      return Utilities.newBlob(Utilities.base64Decode(p.data), p.type, ref + '-photo-' + (i + 1) + '.jpg');
    }));

    var notify = {
      to: CONFIG.NOTIFY_TO, name: 'Nu-Feel website',
      subject: 'New job ' + ref + ': ' + v.nameRaw + ', ' + (v.suburbRaw || 'suburb not given') + ' (' + v.serviceRaw + ')',
      htmlBody: html, body: notifyText_(v), attachments: attachments
    };
    if (v.emailRaw && isEmail_(v.emailRaw)) notify.replyTo = v.emailRaw;
    if (CONFIG.NOTIFY_CC) notify.cc = CONFIG.NOTIFY_CC;
    MailApp.sendEmail(notify);

    return json_({ success: true, ref: ref });
  } catch (err) {
    console.error(err);
    return json_({ success: false, error: 'server' });
  }
}

/* ---------- helpers ---------- */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function parse_(e) {
  var d = {};
  if (e && e.postData && e.postData.contents) { try { d = JSON.parse(e.postData.contents); } catch (x) { d = {}; } }
  if (e && e.parameter) for (var k in e.parameter) if (!(k in d)) d[k] = e.parameter[k];
  return d;
}
function clean_(s, max) {
  if (s === undefined || s === null) return '';
  s = String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  return s.slice(0, max || 300);
}
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function isEmail_(s) { return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(clean_(s)); }
var NP = '<span style="color:#9AA49F;">Not given</span>';
function orNP_(s) { return s ? esc_(s) : NP; }

function photos_(list) {
  if (!list || !list.length) return [];
  var out = [];
  for (var i = 0; i < list.length && out.length < CONFIG.MAX_PHOTOS; i++) {
    var p = list[i] || {};
    var data = String(p.data || '').replace(/^data:[^,]+,/, '');
    var type = /^image\/(jpeg|png|webp)$/.test(p.type) ? p.type : 'image/jpeg';
    if (!data || data.length * 0.75 > CONFIG.MAX_PHOTO_BYTES) continue;
    out.push({ data: data, type: type });
  }
  return out;
}

function underCap_() {
  var c = CacheService.getScriptCache(), k = 'count_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var n = Number(c.get(k) || 0);
  if (n >= CONFIG.MAX_PER_HOUR) return false;
  c.put(k, String(n + 1), 3700);
  return true;
}
function firstReplyToday_(email) {
  var c = CacheService.getScriptCache(), k = 'ar_' + Utilities.base64EncodeWebSafe(email.toLowerCase()).slice(0, 200);
  if (c.get(k)) return false;
  c.put(k, '1', 21600);
  return true;
}
function nextRef_() {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var p = PropertiesService.getScriptProperties();
    var n = Number(p.getProperty('REF_COUNTER') || 0) + 1;
    p.setProperty('REF_COUNTER', String(n));
    return CONFIG.REF_PREFIX + ('0000' + n).slice(-4);
  } finally { lock.releaseLock(); }
}

function view_(d, ref, now, photos) {
  var name = clean_(d.name, 120), phone = clean_(d.phone, 40), email = clean_(d.email, 200);
  var suburb = clean_(d.suburb, 80), type = clean_(d.type, 40) || 'Home', service = clean_(d.service, 80) || 'Not chosen';
  var msg = clean_(d.message, 4000);
  var firstName = name.split(/\s+/)[0] || 'there';
  var digits = phone.replace(/[^\d+]/g, '');
  var time = Utilities.formatDate(now, CONFIG.TIMEZONE, 'h:mm a').toLowerCase();
  var typeBg = { 'Home': C.greenText, 'Rental / vacate': '#111312', 'Strata': C.blue, 'Commercial': '#5F6463' }[type] || C.greenText;
  return {
    ref: ref, received: Utilities.formatDate(now, CONFIG.TIMEZONE, 'EEE d MMM yyyy') + ', ' + time, time: time,
    nameRaw: name, name: esc_(name), firstName: esc_(firstName), firstNameRaw: firstName,
    phoneRaw: phone, phone: esc_(phone), phoneDigits: esc_(digits),
    emailRaw: email, email: orNP_(email), hasEmail: !!email,
    suburbRaw: suburb, suburb: orNP_(suburb),
    typeRaw: type, type: esc_(type), typeBg: typeBg,
    serviceRaw: service, service: esc_(service),
    headline: esc_(service) + (suburb ? ' &nbsp;&middot;&nbsp; ' + esc_(suburb) : ''),
    message: msg ? esc_(msg).replace(/\n/g, '<br>') : NP, messageRaw: msg,
    photos: photos, photoCount: photos.length,
    source: esc_(clean_(d.submitted_from, 120) || 'website form'),
    replyLink: email ? 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('Your Nu-Feel price ' + ref) : '',
    autoreplyLine: ''
  };
}

function row_(label, value, first) {
  return '<tr><td style="padding:8px 0;border-bottom:1px solid ' + C.line + ';color:' + C.muted + ';' + (first ? 'width:36%;' : '') + '">' + label +
    '</td><td style="padding:8px 0;border-bottom:1px solid ' + C.line + ';color:' + C.ink + ';">' + value + '</td></tr>';
}
function head_(t, right) {
  return '<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid ' + C.deep + ';"><tr>' +
    '<td style="font-size:10px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:' + C.greenText + ';padding-bottom:9px;">' + t + '</td>' +
    (right ? '<td style="text-align:right;font-size:11px;color:' + C.muted + ';padding-bottom:9px;">' + right + '</td>' : '') + '</tr></table>';
}
function btn_(href, label, dark) {
  return '<td style="background:' + (dark ? C.green : '#FFFFFF') + ';border-radius:22px;padding:11px 22px;">' +
    '<a href="' + href + '" style="color:' + (dark ? '#000000' : C.ink) + ';font-size:13px;font-weight:700;text-decoration:none;">' + label + '</a></td><td style="width:8px;">&nbsp;</td>';
}

function photoGrid_(v) {
  if (!v.photoCount) {
    return '<div style="background:' + C.soft + ';padding:18px 20px;margin-top:14px;font-size:13px;color:' + C.muted + ';">No photos sent. Text ' + v.firstName + ' and ask for two or three before pricing.</div>';
  }
  var cells = '', html = '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">';
  for (var i = 0; i < v.photos.length; i++) {
    if (i % 4 === 0) html += '<tr>';
    html += '<td style="width:25%;padding:0 ' + (i % 4 === 3 ? '0' : '8px') + ' 8px 0;">' +
      '<img src="data:' + v.photos[i].type + ';base64,' + v.photos[i].data + '" width="160" style="display:block;width:100%;height:auto;border-radius:6px;">' +
      '<div style="font-size:10px;color:' + C.muted + ';padding-top:4px;">Photo ' + (i + 1) + '</div></td>';
    if (i % 4 === 3 || i === v.photos.length - 1) {
      for (var k = (i % 4) + 1; k < 4 && i === v.photos.length - 1; k++) html += '<td style="width:25%;"></td>';
      html += '</tr>';
    }
  }
  return html + '</table>';
}

/* ---------- job sheet (PDF + notify email body) ---------- */
function pdfHtml_(v) {
  var btns = btn_('tel:' + v.phoneDigits, 'Call ' + v.phone, true) + btn_('sms:' + v.phoneDigits, 'Text ' + v.firstName, false) +
    (v.replyLink ? btn_(v.replyLink, 'Email', false) : '');
  return '<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><title>Nu-Feel job ' + v.ref + '</title>' +
    '<style>@page{size:A4;margin:0}body{margin:0;padding:0;background:#FFFFFF;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:' + C.ink + '}table{border-collapse:collapse}td{vertical-align:top}a{color:inherit;text-decoration:none}</style></head><body>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="width:100%;">' +

    // header
    '<tr><td style="background:' + C.deep + ';padding:24px 44px 20px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="vertical-align:middle;"><img src="' + LOGO + '" width="190" alt="Nu-Feel Property Services" style="display:block;width:190px;height:auto;"></td>' +
    '<td style="vertical-align:middle;text-align:right;"><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:' + C.green + ';">New job enquiry</div>' +
    '<div style="font-size:22px;font-weight:700;color:#FFFFFF;margin-top:4px;">' + v.ref + '</div>' +
    '<div style="font-size:12px;color:#C9CBCC;margin-top:5px;">' + v.received + '</div></td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="background:' + C.green + ';height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>' +

    // summary
    '<tr><td style="background:' + C.grey + ';padding:22px 44px 20px;">' +
    '<table cellpadding="0" cellspacing="0"><tr><td style="background:' + v.typeBg + ';color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;padding:6px 11px;border-radius:4px;">' + v.type + '</td>' +
    '<td style="padding-left:10px;font-size:12px;color:' + C.muted + ';vertical-align:middle;">' + v.photoCount + ' photo' + (v.photoCount === 1 ? '' : 's') + ' attached</td></tr></table>' +
    '<div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.15;margin-top:14px;">' + v.name + '</div>' +
    '<div style="font-size:17px;font-weight:600;color:' + C.greenText + ';margin-top:6px;">' + v.headline + '</div>' +
    '<table cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>' + btns + '</tr></table>' +
    '</td></tr>' +

    // contact + job
    '<tr><td style="padding:22px 44px 4px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="width:47%;padding-right:26px;">' + head_('Customer') + '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">' +
    row_('Name', v.name, true) + row_('Phone', '<b>' + v.phone + '</b>') + row_('Email', v.email) + row_('Suburb', v.suburb) + '</table></td>' +
    '<td style="width:53%;">' + head_('Job') + '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">' +
    row_('Property', v.type, true) + row_('Main service', v.service) + row_('Photos', v.photoCount ? v.photoCount + ' (below, and attached full size)' : NP) +
    row_('Price to', 'Text ' + v.firstName + ' on ' + v.phone) + '</table></td>' +
    '</tr></table></td></tr>' +

    // message
    '<tr><td style="padding:18px 44px 2px;">' + head_('What needs doing') +
    '<div style="background:' + C.soft + ';border-left:4px solid ' + C.green + ';padding:13px 18px;margin-top:12px;font-size:13px;line-height:1.55;">' + v.message + '</div></td></tr>' +

    // photos
    '<tr><td style="padding:18px 44px 2px;">' + head_('Their photos', v.photoCount ? 'Tap to open full size in the email' : '') + photoGrid_(v) + '</td></tr>' +

    // quote notes
    '<tr><td style="padding:12px 44px 2px;">' + head_('Quote notes') +
    '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:' + C.muted + ';margin-top:6px;">' +
    '<tr><td style="padding:10px 0 5px;border-bottom:1px solid ' + C.line + ';width:50%;">Price $</td><td style="padding:10px 0 5px 20px;border-bottom:1px solid ' + C.line + ';">Booked for</td></tr>' +
    '<tr><td style="padding:10px 0 5px;border-bottom:1px solid ' + C.line + ';">Time on site</td><td style="padding:10px 0 5px 20px;border-bottom:1px solid ' + C.line + ';">Tip / green waste loads</td></tr></table></td></tr>' +

    // status + footer
    '<tr><td style="padding:12px 44px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:' + C.grey + ';border-radius:6px;"><tr><td style="padding:12px 18px;font-size:12px;">' + v.autoreplyLine + '</td></tr></table></td></tr>' +
    '<tr><td style="padding:10px 44px 12px;"><table width="100%" cellpadding="0" cellspacing="0" style="font-size:10.5px;color:' + C.muted + ';"><tr>' +
    '<td>Nu-Feel Property Services &middot; Rockingham WA &middot; Mandurah to Joondalup</td>' +
    '<td style="text-align:right;">Sent from ' + v.source + '</td></tr></table></td></tr>' +
    '</table></body></html>';
}

function notifyText_(v) {
  return 'New job ' + v.ref + ' (' + v.received + ')\n\n' +
    v.nameRaw + '\n' + v.phoneRaw + (v.emailRaw ? '\n' + v.emailRaw : '') + '\n' + (v.suburbRaw || '') + '\n\n' +
    v.typeRaw + ': ' + v.serviceRaw + '\n\n' + (v.messageRaw || '') + '\n\n' +
    v.photoCount + ' photo(s) attached. The job sheet PDF is attached too.';
}

/* ---------- copy to the customer ---------- */
function autoreplyHtml_(v) {
  return '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:' + C.ink + ';max-width:560px;">' +
    '<p>Hi ' + v.firstName + ',</p>' +
    '<p>Thanks, I’ve got your details' + (v.photoCount ? ' and ' + v.photoCount + ' photo' + (v.photoCount === 1 ? '' : 's') : '') + ' (reference ' + v.ref + '). ' +
    'I’ll look over it and text you a price on ' + v.phone + '. If I can’t tell enough from the photos, I’ll come out and have a look.</p>' +
    '<p>Anything else to add? Just reply to this email or text me on ' + CONFIG.PHONE + '.</p>' +
    '<p>' + CONFIG.OWNER + '<br>Nu-Feel Property Services<br><span style="color:' + C.muted + ';">Rockingham WA &middot; Mandurah to Joondalup</span></p>' +
    '<hr style="border:0;border-top:1px solid ' + C.line + ';margin:26px 0 14px;">' +
    '<p style="font-size:12px;color:' + C.muted + ';margin:0 0 6px;text-transform:uppercase;letter-spacing:1.5px;">What you sent</p>' +
    '<table cellpadding="0" cellspacing="0" style="font-size:13px;">' +
    '<tr><td style="padding:3px 16px 3px 0;color:' + C.muted + ';">Job</td><td>' + v.service + '</td></tr>' +
    '<tr><td style="padding:3px 16px 3px 0;color:' + C.muted + ';">Suburb</td><td>' + v.suburb + '</td></tr>' +
    '<tr><td style="padding:3px 16px 3px 0;color:' + C.muted + ';vertical-align:top;">Notes</td><td>' + v.message + '</td></tr></table></div>';
}
function autoreplyText_(v) {
  return 'Hi ' + v.firstNameRaw + ',\n\nThanks, I’ve got your details (reference ' + v.ref + '). I’ll look over it and text you a price on ' + v.phoneRaw +
    '. If I can’t tell enough from the photos, I’ll come out and have a look.\n\nAnything else to add? Reply to this email or text me on ' + CONFIG.PHONE + '.\n\n' +
    CONFIG.OWNER + '\nNu-Feel Property Services\nRockingham WA, Mandurah to Joondalup';
}

/* ---------- run once from the editor to test (sends to NOTIFY_TO only) ---------- */
function testSend() {
  var r = doPost({ postData: { contents: JSON.stringify({
    name: 'Test Customer', phone: '0400 000 000', email: CONFIG.NOTIFY_TO, suburb: 'Baldivis',
    type: 'Rental / vacate', service: 'Lawn care & mowing',
    message: 'TEST. Front verge has died off and the back lawn is overgrown. Tenants move out on the 20th.',
    submitted_from: 'nufeel.theserviceedit.com'
  }) } });
  Logger.log(r.getContent());
}
