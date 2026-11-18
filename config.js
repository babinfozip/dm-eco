// 동명 에코 교실 · 선생님 설정 파일
window.APP_CONFIG = {
  NEIS_KEY: '9b5de599ad2a4f9a9194019100d13001',   // 나이스 인증키 (알림장과 같은 키)
  SHARE_URL: 'https://script.google.com/macros/s/AKfycbxq_8GAy8-x2WZ1V-7WIPT8Gx5u1mNcsYl-1snP4SHKWYLVRxzqTX9K0V_3POWexnw/exec',    // 「끄고 갔어요」 공유 서버(Code.gs, 시트 「동명 에코 교실」). 비워 두면 기록·순위·아낀 에너지만 꺼져요
  HEAT_BELOW: 10,   // 수업 시간(9~16시) 바깥 최저 기온이 이 값보다 낮으면 「난방 켜요」
  COOL_ABOVE: 28,   // 수업 시간 바깥 최고 기온이 이 값 이상이면 「냉방 켜요」
  LAT: 36.35, LON: 127.38,   // 대전 (날씨: Open-Meteo, 인증키 없음)
  // 아낀 에너지 계산용 추정값 — 학생들이 우리 학교 기기를 조사해서 바꿔 보세요
  HEATER_KW: 3,     // 교실 냉난방기(난방) 소비전력 kW
  AC_KW: 3,         // 교실 냉난방기(냉방) 소비전력 kW
  LIGHT_KW: 0.4,    // 교실 전등 전체 kW
  PERIOD_MIN: 45,   // 한 번 끄면 아낀 것으로 셀 시간(분)
  CO2_KG_PER_KWH: 0.4781   // 전기 1kWh당 탄소 배출량(kg)
};
