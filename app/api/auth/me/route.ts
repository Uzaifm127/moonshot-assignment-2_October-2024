import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async () => {
  const cookie = cookies();

  const token = cookie.get("token");

  if (token) {
    return NextResponse.json({ message: "Authenticated" });
  } else {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 404 });
  }
};
