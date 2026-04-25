import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q') ?? '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const upstream = await fetch(
    `${apiUrl}/mascotas/buscar?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
