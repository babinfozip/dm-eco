// 동명 에코 교실 공유 서버 (구글 앱스크립트)
// 설치: 구글 시트 「동명 에코 교실」 → 앱스크립트에 붙여 넣기 → 배포(웹 앱 / 실행: 나 / 액세스: 모든 사용자)
// 모으는 것 (학생 이름은 모으지 않아요)
//   plans : 🌅 아침 확인 — 반별 오늘 교실이 비는 교시(이동수업) → 행정실 중앙난방 끄기 안내
//   offs  : ✅ 자가점검 — 반별 「끄고 갔어요」(같은 반·날·교시는 한 번만 셈, 하교는 99)

// 시트에 붙은 스크립트면 비워 두고, 따로 만든 스크립트면 시트 주소의 /d/ 뒤 ID를 넣어요.
const SHEET_ID = '';
const CLASSES = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2'];
// 시트에 '1-2'처럼 쓰면 날짜로 바뀌어서 '1학년 2반'으로 저장해요.
const label_ = gc => gc.split('-')[0] + '학년 ' + gc.split('-')[1] + '반';
const unlabel_ = s => String(s).replace(/^(\d)학년 (\d)반$/, '$1-$2');

const ss_ = () => SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
function sheet_(name, head) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
const offsSheet_ = () => sheet_('offs', ['날짜', '반', '교시', '끈 것', '기기', '시각']);
const plansSheet_ = () => sheet_('plans', ['날짜', '반', '교실 비는 교시', '전체 교시', '기기', '시각']);
const clean_ = (v, max) => String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ').trim().slice(0, max);
const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const ymd_ = d => Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd');
const now_ = () => Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

function list_(from, to) {
  const rows = offsSheet_().getDataRange().getValues().slice(1)
    .map(r => ({ date: String(r[0]), gc: unlabel_(r[1]), per: +r[2], what: String(r[3]) }))
    .filter(r => r.date >= from && r.date <= to);
  const plans = plansSheet_().getDataRange().getValues().slice(1)
    .map(r => ({ date: String(r[0]), gc: unlabel_(r[1]), empty: (String(r[2]).match(/\d+/g) || []).map(Number), total: +r[3], at: String(r[5]) }))
    .filter(p => p.date >= from && p.date <= to);
  return { ok: true, rows: rows, plans: plans };
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
  const gc = String(b.gc || ''), date = clean_(b.date, 8), did = clean_(b.did, 20);
  if (CLASSES.indexOf(gc) < 0) return json_({ ok: false, error: '반 정보가 올바르지 않아요.' });
  if (date !== ymd_(new Date())) return json_({ ok: false, error: '오늘 기록만 남길 수 있어요.' });
  if (!did) return json_({ ok: false, error: '잘못된 요청이에요.' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (b.action === 'plan') {
      const empty = (Array.isArray(b.empty) ? b.empty : []).map(n => Math.round(+n)).filter(n => n >= 1 && n <= 10).sort((x, y) => x - y);
      const total = Math.round(+b.total) || 0;
      const sh = plansSheet_(), v = sh.getDataRange().getValues();
      for (let i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === date && String(v[i][1]) === label_(gc)) sh.deleteRow(i + 1);
      // 숫자만 쓰면 시트가 날짜로 바꿔서 「2교시 5교시」처럼 글자로 저장해요. (clear면 지우기만)
      if (!b.clear) sh.appendRow([date, label_(gc), empty.map(n => n + '교시').join(' ') || '없음', total, did, "'" + Utilities.formatDate(new Date(), 'Asia/Seoul', 'HH:mm')]);   // 앞의 ' 는 시트가 시간으로 바꾸지 않게 하는 표시
    } else {
      const per = Math.round(+b.per);
      if (!(per >= 1 && per <= 99)) return json_({ ok: false, error: '잘못된 요청이에요.' });
      const sh = offsSheet_(), v = sh.getDataRange().getValues();
      for (let i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === date && String(v[i][1]) === label_(gc) && +v[i][2] === per) sh.deleteRow(i + 1);
      if (b.on) sh.appendRow([date, label_(gc), per, clean_(b.what, 20), did, now_()]);
    }
  } finally { lock.releaseLock(); }
  return json_(list_(date, date));
}
