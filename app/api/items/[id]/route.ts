import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const itemId = parseInt(id, 10);
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name, category, buyPrice, marketUrl, currentPrice, isUpdating, error, imageUrl } = await req.json();

        const existing = await prisma.trackerItem.findUnique({ where: { id: itemId } });
        if (!existing || existing.userId !== (session.user as any).id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updatedItem = await prisma.trackerItem.update({
            where: {
                id: itemId,
            },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                ...(buyPrice !== undefined && { buyPrice }),
                ...(marketUrl && { marketUrl }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(currentPrice !== undefined && { currentPrice }),
                ...(isUpdating !== undefined && { isUpdating }),
                ...(error !== undefined && {
                    // store error temporarily or simply we can just use this route for core updates,
                    // we will not store the error string in db for now to keep schema clean,
                    // but we update the lastUpdated field whenever price is checked 
                }),
                ...(currentPrice !== undefined && { lastUpdated: new Date() }),
                ...(currentPrice !== undefined && {
                    priceHistory: {
                        create: {
                            price: currentPrice
                        }
                    }
                })
            }
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("UPDATE ITEM ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const itemId = parseInt(id, 10);
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const existing = await prisma.trackerItem.findUnique({ where: { id: itemId } });
        if (!existing || existing.userId !== (session.user as any).id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.trackerItem.delete({
            where: {
                id: itemId,
            }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("DELETE ITEM ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
