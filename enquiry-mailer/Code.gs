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

var C = { deep: '#0D4B3B', green: '#1EAA4E', greenText: '#128A3C', grey: '#ECEDEB', line: '#DADDD9', ink: '#10251D', muted: '#5C6B64', soft: '#F5F6F4' };

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
  var typeBg = { 'Home': C.greenText, 'Rental / vacate': '#B5651D', 'Strata': C.deep, 'Commercial': C.deep, 'Insurance': '#7A3B8F' }[type] || C.greenText;
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
  return '<td style="background:' + (dark ? C.greenText : '#FFFFFF') + ';border:2px solid ' + (dark ? C.greenText : C.deep) + ';border-radius:22px;padding:10px 20px;">' +
    '<a href="' + href + '" style="color:' + (dark ? '#FFFFFF' : C.deep) + ';font-size:13px;font-weight:700;text-decoration:none;">' + label + '</a></td><td style="width:8px;">&nbsp;</td>';
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
    '<div style="font-size:12px;color:#B9CDC5;margin-top:5px;">' + v.received + '</div></td>' +
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
