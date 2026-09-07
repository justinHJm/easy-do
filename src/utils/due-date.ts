// 시각·시간대 없이 달력 날짜만 저장합니다. UTC 문자열 변환으로 날짜가 하루 밀리는 일을 피합니다.
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDueDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 1000 && year <= 9999 && dateKey(date) === value;
}

export function calendarCells(year: number, month: number): (number | null)[] {
  // 월은 0부터 시작합니다. 다음 달의 0일은 이번 달 마지막 날이므로 윤년도 Date가 처리합니다.
  const start = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((start + days) / 7) * 7 }, (_, i) =>
    i >= start && i < start + days ? i - start + 1 : null);
}

export function dueLabel(value: string, today = new Date()) {
  const [year, month, day] = value.split('-').map(Number);
  // 현지 날짜의 연·월·일만 UTC 기준 숫자로 비교해 서머타임의 23/25시간 하루에도 정확히 계산합니다.
  const days = Math.round((Date.UTC(year, month - 1, day) -
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  return { days, text: days < 0 ? '기한 지남' : days === 0 ? '오늘까지' : days === 1 ? '내일까지' :
    days <= 7 ? `${days}일 남음` : `${year !== today.getFullYear() ? `${year}년 ` : ''}${month}월 ${day}일까지` };
}

export function fullDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, days: number): string {
  const date = localDate(value);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

// 이번 주는 월요일~일요일입니다. 필터에서는 오늘 이전 날짜를 제외합니다.
export function endOfWeek(today: string): string {
  return addDays(today, (7 - localDate(today).getDay()) % 7);
}
