import { prisma } from "@/lib/prisma";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

export function resetPrismaMock() {
  mockReset(prismaMock);
}
