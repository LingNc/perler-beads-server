import { NextResponse } from 'next/server';
import { generateRootApiResponse } from '../../config/apiDocs';

export async function GET() {
  return NextResponse.json(generateRootApiResponse());
}
