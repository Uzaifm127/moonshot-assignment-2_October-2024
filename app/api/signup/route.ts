import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { email, password } = await req.json();

  const cookie = cookies();

  const token = cookie.get("token");

  if (token) {
    return NextResponse.json(
      { message: "You are already logged in" },
      { status: 400 }
    );
  } else {
    const token = jwt.sign(
      { email, password },
      process.env.JWT_SECRET || "This is JWT secret"
    );

    cookie.set("token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ message: "Login successful" });
  }
};
