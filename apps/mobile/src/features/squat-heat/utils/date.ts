const MONDAY_INDEX = 1;
const SUNDAY_INDEX = 0;

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

export function toDateKey(input: Date | string) {
  const value = typeof input === 'string' ? new Date(input) : input;
  const date = Number.isNaN(value.getTime()) ? new Date() : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalTime(input: Date | string) {
  const value = typeof input === 'string' ? new Date(input) : input;
  const date = Number.isNaN(value.getTime()) ? new Date() : value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function startOfIsoWeek(input: Date = new Date()) {
  const value = new Date(input);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = day === SUNDAY_INDEX ? -6 : MONDAY_INDEX - day;
  value.setDate(value.getDate() + diff);
  return value;
}

export function endOfIsoWeek(input: Date = new Date()) {
  const start = startOfIsoWeek(input);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
