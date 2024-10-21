import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { email, password } = await req.json();

  const cookie = cookies();

  const token = cookie.get("token");

  if (token) {
    const credentials = jwt.verify(
      token.value,
      process.env.JWT_SECRET || "This is JWT secret"
    ) as { email: string; password: string };

    if (credentials.email === email && credentials.password === password) {
      return NextResponse.json({ message: "Logged in successfully" });
    } else {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 404 }
      );
    }
  } else {
    return NextResponse.json(
      { message: "Authenticate yourself first" },
      { status: 404 }
    );
  }
};
