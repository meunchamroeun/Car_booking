export const DateUtil = {
  pad: (n: number) => String(n).padStart(2, '0'),

  toDateStr(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },

  todayStr(): string {
    return this.toDateStr(new Date());
  },

  tomorrowStr(): string {
    return this.addDays(this.todayStr(), 1);
  },

  addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return this.toDateStr(dt);
  },

  toMins(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  },

  isOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    return Math.max(this.toMins(startA), this.toMins(startB)) < Math.min(this.toMins(endA), this.toMins(endB));
  },

  nowTimeStr(): string {
    const d = new Date();
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  },

  /** "YYYY-MM-DD HH:MM" — sorts and compares correctly as a string. */
  stamp(date: string, time: string): string {
    return `${date} ${time}`;
  },

  /** Every date from start to end inclusive. */
  dateRange(start: string, end: string): string[] {
    const out: string[] = [];
    for (let d = start; d <= end && out.length < 60; d = this.addDays(d, 1)) out.push(d);
    return out;
  },

  /** Whole days between two dates (0 = same day). */
  dayDiff(start: string, end: string): number {
    return Math.max(0, this.dateRange(start, end).length - 1);
  },

  /** Duration label for a date-time range: "4.5h" or "2d 3h". */
  duration(startDate: string, startTime: string, endDate: string, endTime: string): string {
    const mins = this.dayDiff(startDate, endDate) * 1440 + this.toMins(endTime) - this.toMins(startTime);
    if (mins <= 0) return '0h';
    const d = Math.floor(mins / 1440);
    const h = (mins % 1440) / 60;
    const hs = h % 1 === 0 ? String(h) : h.toFixed(1);
    return d ? `${d}d${h ? ` ${hs}h` : ''}` : `${hs}h`;
  },

  /** "Fri 16 Oct · 09:00–13:00" or, for multi-day, "Fri 16 Oct 13:00 → Sat 17 Oct 12:00". */
  window(b: { startDate: string; startTime: string; endDate?: string; endTime: string }, lang: 'en' | 'kh' = 'en'): string {
    const end = b.endDate || b.startDate;
    return end === b.startDate
      ? `${this.friendly(b.startDate, lang)} · ${b.startTime}–${b.endTime}`
      : `${this.friendly(b.startDate, lang)} ${b.startTime} → ${this.friendly(end, lang)} ${b.endTime}`;
  },

  /** Times only for same-day, full window otherwise (for lists already grouped by day). */
  timeSpan(b: { startDate: string; startTime: string; endDate?: string; endTime: string }, lang: 'en' | 'kh' = 'en'): string {
    return (b.endDate || b.startDate) === b.startDate ? `${b.startTime}–${b.endTime}` : this.window(b, lang);
  },

  nowStamp(): string {
    return `${this.todayStr()} ${this.nowTimeStr()}`;
  },

  diffHours(startStr: string, endStr: string): string {
    const diff = Math.max(0, this.toMins(endStr) - this.toMins(startStr));
    return diff % 60 === 0 ? String(diff / 60) : (diff / 60).toFixed(1);
  },

  /** 0..1 progress of now between two times today. */
  progress(startStr: string, endStr: string): number {
    const now = this.toMins(this.nowTimeStr());
    const s = this.toMins(startStr);
    const e = this.toMins(endStr);
    if (e <= s) return 0;
    return Math.min(1, Math.max(0, (now - s) / (e - s)));
  },

  /** "Today" / "Tomorrow" / "Wed, 16 Oct" */
  friendly(dateStr: string, lang: 'en' | 'kh' = 'en'): string {
    if (dateStr === this.todayStr()) return lang === 'kh' ? 'ថ្ងៃនេះ' : 'Today';
    if (dateStr === this.tomorrowStr()) return lang === 'kh' ? 'ថ្ងៃស្អែក' : 'Tomorrow';
    if (dateStr === this.addDays(this.todayStr(), -1)) return lang === 'kh' ? 'ម្សិលមិញ' : 'Yesterday';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  },

  /** "Thu 15 Oct", prefixed with Today/Tomorrow when relevant. */
  longDate(dateStr: string, lang: 'en' | 'kh' = 'en'): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const full = new Date(y, m - 1, d).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const rel = this.friendly(dateStr, lang);
    return rel === full || /\d/.test(rel) ? full : `${rel}, ${full}`;
  },

  weekdayShort(dateStr: string, lang: 'en' | 'kh' = 'en'): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-GB', { weekday: 'short' });
  },

  dayNum(dateStr: string): number {
    return Number(dateStr.split('-')[2]);
  },

  greeting(lang: 'en' | 'kh' = 'en'): string {
    const h = new Date().getHours();
    if (lang === 'kh') return h < 12 ? 'អរុណសួស្តី' : h < 17 ? 'ទិវាសួស្តី' : 'សាយណ្ហសួស្តី';
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  },
};
