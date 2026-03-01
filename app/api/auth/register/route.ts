import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new NextResponse("Missing email or password", { status: 400 });
        }

        const exist = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (exist) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            }
        });

        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
    } catch (error: any) {
        console.error("REGISTRATION ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
