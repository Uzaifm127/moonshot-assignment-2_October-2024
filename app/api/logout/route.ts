import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = () => {
  const cookie = cookies();

  const token = cookie.get("token");

  if (token) {
    cookies().delete("token");

    return NextResponse.json({ message: "Logged out successfully" });
  } else {
    return NextResponse.json(
      { message: "You already logged out" },
      { status: 400 }
    );
  }
};
