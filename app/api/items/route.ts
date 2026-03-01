import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const items = await prisma.trackerItem.findMany({
            where: {
                userId: (session.user as any).id,
            },
            include: {
                priceHistory: {
                    orderBy: {
                        date: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("GET ITEMS ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, category, buyPrice, marketUrl, imageUrl } = body;

        const newItem = await prisma.trackerItem.create({
            data: {
                name,
                category,
                buyPrice,
                marketUrl,
                imageUrl,
                userId: (session.user as any).id,
            }
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("POST ITEM ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
