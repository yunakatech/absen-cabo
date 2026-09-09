import { NextResponse } from 'next/server';
import { getMakassarTime } from '@/lib/time';

export async function GET() {
  const makassarTime = getMakassarTime();
  return NextResponse.json({
    success: true,
    time: makassarTime,
  });
}
