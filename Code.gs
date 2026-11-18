// 동명 에코 교실 · 「끄고 갔어요」 공유 서버 (구글 앱스크립트)
// 설치: 구글 시트 「동명 에코 교실」 → 앱스크립트에 붙여 넣기 → 배포(웹 앱 / 실행: 나 / 액세스: 모든 사용자)
// 모으는 것: 반, 날짜, 교시(하교는 99), 끈 것(난방기·전등 등). 학생 이름은 모으지 않아요.
// 같은 반·같은 날·같은 교시는 한 번만 셉니다(여러 명이 눌러도 1번).

// 시트에 붙은 스크립트면 비워 두고, 따로 만든 스크립트면 시트 주소의 /d/ 뒤 ID를 넣어요.
const SHEET_ID = '';
const CLASSES = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2'];
// 시트에 '1-2'처럼 쓰면 날짜로 바뀌어서 '1학년 2반'으로 저장해요.
const label_ = gc => gc.split('-')[0] + '학년 ' + gc.split('-')[1] + '반';
const unlabel_ = s => String(s).replace(/^(\d)학년 (\d)반$/, '$1-$2');

function sheet_() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('offs');
  if (!sh) { sh = ss.insertSheet('offs'); sh.appendRow(['날짜', '반', '교시', '끈 것', '기기', '시각']); sh.setFrozenRows(1); }
  return sh;
}
const clean_ = (v, max) => String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ').trim().slice(0, max);
const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const ymd_ = d => Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd');
const rows_ = () => sheet_().getDataRange().getValues().slice(1)
  .map(r => ({ date: String(r[0]), gc: unlabel_(r[1]), per: +r[2], what: String(r[3]) }));

function list_(from, to) {
  return { ok: true, rows: rows_().filter(r => r.date >= from && r.date <= to) };
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const from = clean_(p.from, 8), to = clean_(p.to, 8);
  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) return json_({ ok: false, error: '날짜가 올바르지 않아요.' });
  return json_(list_(from, to));
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: '잘못된 요청이에요.' }); }
  const gc = String(b.gc || ''), date = clean_(b.date, 8), per = Math.round(+b.per), did = clean_(b.did, 20);
  if (CLASSES.indexOf(gc) < 0) return json_({ ok: false, error: '반 정보가 올바르지 않아요.' });
  if (date !== ymd_(new Date())) return json_({ ok: false, error: '오늘 기록만 남길 수 있어요.' });
  if (!(per >= 1 && per <= 99) || !did) return json_({ ok: false, error: '잘못된 요청이에요.' });
  const what = clean_(b.what, 20);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(), v = sh.getDataRange().getValues();
    for (let i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === date && String(v[i][1]) === label_(gc) && +v[i][2] === per) sh.deleteRow(i + 1);
    if (b.on) sh.appendRow([date, label_(gc), per, what, did, Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm')]);
  } finally { lock.releaseLock(); }
  return json_(list_(date, date));
}
