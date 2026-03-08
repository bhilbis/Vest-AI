import { prisma } from "@/lib/prisma";

type CreateAssetParams = {
  name: string;
  amount?: number | null;
  buyPrice?: number | null;
  type: string;
  category?: string | null;
  color?: string | null;
  coinId?: string | null;
  userId: string;
};

function toOptionalFiniteNumber(value?: number | null) {
  if (value == null) return null;
  return Number.isFinite(value) ? value : null;
}

export async function getAssets(userId: string) {
  return prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAsset({
  name,
  amount,
  buyPrice,
  type,
  category,
  color,
  coinId,
  userId,
}: CreateAssetParams) {
  if (!name?.trim()) {
    throw new Error("Invalid name");
  }
  if (!type?.trim()) {
    throw new Error("Invalid type");
  }

  return prisma.asset.create({
    data: {
      name: name.trim(),
      amount: toOptionalFiniteNumber(amount),
      buyPrice: toOptionalFiniteNumber(buyPrice),
      type: type.trim(),
      category,
      color,
      coinId,
      userId,
    },
  });
}
