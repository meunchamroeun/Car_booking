import { NextResponse } from 'next/server';

export interface TelegramNotifyPayload {
  event: 'created' | 'approved' | 'rejected' | 'cancelled';
  bookingId: string;
  requesterName: string;
  vehicleName: string;
  plate?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  destination?: string;
  needDriver?: boolean;
  driverName?: string;
  actorName: string;
  reason?: string;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as TelegramNotifyPayload;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const rawChatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !rawChatId) {
      return NextResponse.json({
        success: false,
        warning: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment variables.',
      });
    }

    const chatIds = rawChatId
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (chatIds.length === 0) {
      return NextResponse.json({
        success: false,
        warning: 'No valid TELEGRAM_CHAT_ID found.',
      });
    }

    let titleKh = '';
    let titleEn = '';
    let statusKh = '';
    let statusEn = '';

    if (payload.event === 'created') {
      titleKh = 'សំណើកក់រថយន្តថ្មី';
      titleEn = 'New Booking Request';
      statusKh = 'កំពុងរង់ចាំអនុម័ត';
      statusEn = 'Pending Approval';
    } else if (payload.event === 'approved') {
      titleKh = 'ការកក់ត្រូវបានអនុម័ត';
      titleEn = 'Booking Approved';
      statusKh = 'បានអនុម័ត';
      statusEn = 'Approved';
    } else if (payload.event === 'rejected') {
      titleKh = 'ការកក់ត្រូវបានបដិសេធ';
      titleEn = 'Booking Rejected';
      statusKh = 'បានបដិសេធ';
      statusEn = 'Rejected';
    } else {
      titleKh = 'ការកក់ត្រូវបានលុបចោល';
      titleEn = 'Booking Cancelled';
      statusKh = 'បានលុបចោល';
      statusEn = 'Cancelled';
    }

    const dateRange =
      payload.endDate && payload.endDate !== payload.startDate
        ? `${payload.startDate} ដល់ ${payload.endDate}`
        : payload.startDate;

    const lines: string[] = [
      `<b>[ ${titleKh} / ${titleEn} ]</b>`,
      '',
      `<b>កូដ / ID:</b> <code>${payload.bookingId}</code>`,
      `<b>អ្នកស្នើសុំ / Requester:</b> ${payload.requesterName}`,
      `<b>រថយន្ត / Vehicle:</b> ${payload.vehicleName}${payload.plate ? ` (${payload.plate})` : ''}`,
      `<b>កាលបរិច្ឆេទ / Date:</b> ${dateRange}`,
      `<b>ម៉ោង / Time:</b> ${payload.startTime} - ${payload.endTime}`,
    ];

    if (payload.destination) {
      lines.push(`<b>ទិសដៅ / Destination:</b> ${payload.destination}`);
    }

    if (payload.purpose) {
      lines.push(`<b>គោលបំណង / Purpose:</b> ${payload.purpose}`);
    }

    if (payload.event === 'created') {
      lines.push(
        payload.needDriver
          ? `<b>អ្នកបើកបរ / Driver:</b> ត្រូវការអ្នកបើកបរក្រុមហ៊ុន (Need Company Driver)`
          : `<b>អ្នកបើកបរ / Driver:</b> បើកបរខ្លួនឯង (Self-Drive)`
      );
    }

    if (payload.event === 'approved') {
      lines.push(`<b>អនុម័តដោយ / Approved by:</b> ${payload.actorName}`);
      if (payload.driverName) {
        lines.push(`<b>អ្នកបើកបរ / Assigned Driver:</b> ${payload.driverName}`);
      } else {
        lines.push(`<b>អ្នកបើកបរ / Driver:</b> បើកបរខ្លួនឯង (Self-Drive)`);
      }
    }

    if (payload.event === 'rejected') {
      lines.push(`<b>បដិសេធដោយ / Rejected by:</b> ${payload.actorName}`);
      if (payload.reason) {
        lines.push(`<b>មូលហេតុ / Reason:</b> ${payload.reason}`);
      }
    }

    if (payload.event === 'cancelled') {
      lines.push(`<b>លុបចោលដោយ / Cancelled by:</b> ${payload.actorName}`);
      if (payload.reason) {
        lines.push(`<b>មូលហេតុ / Reason:</b> ${payload.reason}`);
      }
    }

    lines.push(`<b>ស្ថានភាព / Status:</b> ${statusKh} (${statusEn})`);

    const messageText = lines.join('\n');

    const sendResults = await Promise.all(
      chatIds.map(async chatId => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: messageText,
              parse_mode: 'HTML',
            }),
          });
          const json = await res.json();
          return { chatId, ok: res.ok && json.ok, result: json };
        } catch (err: unknown) {
          return { chatId, ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      })
    );

    return NextResponse.json({
      success: sendResults.some(r => r.ok),
      details: sendResults,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}
