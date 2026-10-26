// Own name tables so Khmer dates work even where the browser has no Khmer locale data
const NAMES = {
  en: {
    dayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    monthShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  kh: {
    dayShort: ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍'],
    dayLong: ['ថ្ងៃអាទិត្យ', 'ថ្ងៃច័ន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'],
    dayNarrow: ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស'],
    monthShort: ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'],
    monthLong: ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'],
  },
} as const;
type Lang = keyof typeof NAMES;

export const DateUtil = {
  names(lang: Lang = 'en') {
    return NAMES[lang] ?? NAMES.en;
  },

  /** "Thu 15 Oct" (short) or "Thursday 15 October" (long), in the given language. */
  formatDate(dateStr: string, lang: Lang = 'en', style: 'short' | 'long' = 'short'): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const n = this.names(lang);
    const wd = new Date(y, m - 1, d).getDay();
    return style === 'long' ? `${n.dayLong[wd]} ${d} ${n.monthLong[m - 1]}` : `${n.dayShort[wd]} ${d} ${n.monthShort[m - 1]}`;
  },

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
  duration(startDate: string, startTime: string, endDate: string, endTime: string, lang: 'en' | 'kh' = 'en'): string {
    const [hu, du] = lang === 'kh' ? [' ម៉ោង', ' ថ្ងៃ'] : ['h', 'd'];
    const mins = this.dayDiff(startDate, endDate) * 1440 + this.toMins(endTime) - this.toMins(startTime);
    if (mins <= 0) return `0${hu}`;
    const d = Math.floor(mins / 1440);
    const h = (mins % 1440) / 60;
    const hs = h % 1 === 0 ? String(h) : h.toFixed(1);
    return d ? `${d}${du}${h ? ` ${hs}${hu}` : ''}` : `${hs}${hu}`;
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
    return (b.endDate || b.startDate) === b.startDate ? `${b.startTime} - ${b.endTime}` : this.window(b, lang);
  },

  /** "Just now", "12 min ago", "09:40" (today) or "Wed 14 Oct · 09:40". */
  relative(stamp: string, lang: 'en' | 'kh' = 'en'): string {
    const [d, tm] = stamp.split(' ');
    if (d === this.todayStr()) {
      const diff = this.toMins(this.nowTimeStr()) - this.toMins(tm);
      if (diff >= 0 && diff < 1) return lang === 'kh' ? 'ឥឡូវនេះ' : 'Just now';
      if (diff >= 0 && diff < 60) return lang === 'kh' ? `${diff} នាទីមុន` : `${diff} min ago`;
      return tm;
    }
    return `${this.friendly(d, lang)} · ${tm}`;
  },

  nowStamp(): string {
    return `${this.todayStr()} ${this.nowTimeStr()}`;
  },

  /** Time between two clock times in words: "45min", "1h", "1h 30min" (kh: "45 នាទី", "1 ម៉ោង 30 នាទី"). */
  spanLabel(startStr: string, endStr: string, lang: 'en' | 'kh' = 'en'): string {
    const mins = Math.max(0, this.toMins(endStr) - this.toMins(startStr));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const [hu, mu] = lang === 'kh' ? [' ម៉ោង', ' នាទី'] : ['h', 'min'];
    return [h ? `${h}${hu}` : '', m ? `${m}${mu}` : ''].filter(Boolean).join(' ') || `0${mu}`;
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
    return this.formatDate(dateStr, lang);
  },

  /** "Thu 15 Oct", prefixed with Today/Tomorrow when relevant. */
  longDate(dateStr: string, lang: 'en' | 'kh' = 'en'): string {
    const full = this.formatDate(dateStr, lang);
    const rel = this.friendly(dateStr, lang);
    return rel === full || /\d/.test(rel) ? full : `${rel}, ${full}`;
  },

  weekdayShort(dateStr: string, lang: 'en' | 'kh' = 'en'): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return this.names(lang).dayShort[new Date(y, m - 1, d).getDay()];
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
