// app/api/profile/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_FONTS   = ["roboto", "poppins", "playfair", "times", "calibri"];
const VALID_THEMES  = ["dark", "light"];
const VALID_LANGS   = ["id", "en"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name:            true,
      email:           true,
      image:           true,
      phone:           true,
      institution:     true,
      fontPreference:  true,
      themePreference: true,
      langPreference:  true,
    },
  });

  return NextResponse.json(user ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, phone, institution, image,
    fontPreference, themePreference, langPreference,
  } = body;

  // Validate enum values
  if (fontPreference  && !VALID_FONTS.includes(fontPreference))
    return NextResponse.json({ error: "Invalid fontPreference" },  { status: 400 });
  if (themePreference && !VALID_THEMES.includes(themePreference))
    return NextResponse.json({ error: "Invalid themePreference" }, { status: 400 });
  if (langPreference  && !VALID_LANGS.includes(langPreference))
    return NextResponse.json({ error: "Invalid langPreference" },  { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name            !== undefined && { name }),
      ...(phone           !== undefined && { phone }),
      ...(institution     !== undefined && { institution }),
      ...(image           !== undefined && { image }),
      ...(fontPreference  !== undefined && { fontPreference }),
      ...(themePreference !== undefined && { themePreference }),
      ...(langPreference  !== undefined && { langPreference }),
    },
    select: {
      name: true, email: true, image: true,
      phone: true, institution: true,
      fontPreference: true, themePreference: true, langPreference: true,
    },
  });

  return NextResponse.json(updated);
}