import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check admin role
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });
  if (user?.role !== "ADMIN") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }
  return { session, user };
}

// PATCH /api/admin/users/[id] — Update user (role, isActive)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.isActive === "boolean") {
      // Prevent admin from deactivating themselves
      if (id === auth.user.id && !body.isActive) {
        return NextResponse.json(
          { error: "Cannot deactivate your own account" },
          { status: 400 }
        );
      }
      updateData.isActive = body.isActive;
    }

    if (body.role === "ADMIN" || body.role === "USER") {
      // Prevent admin from demoting themselves
      if (id === auth.user.id && body.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Cannot change your own role" },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — Delete user
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const params = await context.params;
    const id = params.id;

    // Prevent admin from deleting themselves
    if (id === auth.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete related records first (cascade)
    await prisma.$transaction([
      prisma.expense.deleteMany({ where: { userId: id } }),
      prisma.income.deleteMany({ where: { userId: id } }),
      prisma.accountTransfer.deleteMany({ where: { userId: id } }),
      prisma.budget.deleteMany({ where: { userId: id } }),
      prisma.asset.deleteMany({ where: { userId: id } }),
      prisma.accountBalance.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
