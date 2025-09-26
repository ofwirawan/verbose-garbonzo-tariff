import { NextResponse } from "next/server";

let history: any[] = []; // in-memory store

export async function GET() {
  return NextResponse.json(history);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newRecord = {
      id: history.length + 1,
      date: new Date().toISOString().split("T")[0],
      ...body,
    };
    history.push(newRecord);
    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
