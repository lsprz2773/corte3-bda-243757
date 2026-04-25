export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/veterinarios`);
  const data = await res.json();
  return Response.json(data);
}
