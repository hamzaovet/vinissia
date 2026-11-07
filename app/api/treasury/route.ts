import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    const [transactions, orders, branches] = await Promise.all([
      prisma.treasuryTransaction.findMany({
        where,
        include: { branch: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.order.findMany({
        where: {
          ...(branchId && branchId !== "ALL" ? { branchId } : {}),
          status: { not: "CANCELLED" },
        },
      }),
      prisma.branch.findMany({ where: { isActive: true } }),
    ]);

    // Financial Metrics Calculation
    let totalCashIn = 0;
    let totalCashOut = 0;
    let ownerWithdrawals = 0;
    let ownerDeposits = 0;
    let totalExpenses = 0;

    for (const t of transactions) {
      if (t.type === "IN") totalCashIn += t.amount;
      if (t.type === "OUT") totalCashOut += t.amount;

      if (t.category === "OWNER_WITHDRAWAL") ownerWithdrawals += t.amount;
      if (t.category === "OWNER_DEPOSIT") ownerDeposits += t.amount;
      if (t.category === "EXPENSE") totalExpenses += t.amount;
    }

    const currentCashBalance = Number((totalCashIn - totalCashOut).toFixed(2));
    const netOwnerAccount = Number((ownerDeposits - ownerWithdrawals).toFixed(2));

    // Sales and COGS calculation
    let totalSalesRevenue = 0;
    let posSales = 0;
    let deliverySales = 0;

    for (const ord of orders) {
      totalSalesRevenue += ord.totalAmount;
      if (ord.orderType === "pos") posSales += ord.totalAmount;
      if (ord.orderType === "delivery") deliverySales += ord.totalAmount;
    }

    // Estimated COGS (~65% average dairy cost based on product margins)
    const estimatedCOGS = Number((totalSalesRevenue * 0.65).toFixed(2));
    const grossProfit = Number((totalSalesRevenue - estimatedCOGS).toFixed(2));
    const netProfit = Number((grossProfit - totalExpenses).toFixed(2));

    return NextResponse.json({
      success: true,
      branches,
      transactions,
      metrics: {
        currentCashBalance,
        totalCashIn,
        totalCashOut,
        ownerWithdrawals,
        ownerDeposits,
        netOwnerAccount,
        totalExpenses,
        totalSalesRevenue,
        posSales,
        deliverySales,
        ordersCount: orders.length,
        estimatedCOGS,
        grossProfit,
        netProfit,
      },
    });
  } catch (error: any) {
    console.error("Treasury GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branchId, type, category, amount, description, reference, recordedBy } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال مبلغ صحيح أكبر من الصفر" },
        { status: 400 }
      );
    }

    if (!type || !category || !description) {
      return NextResponse.json(
        { success: false, error: "يرجى تحديد نوع الحركة والتبويب والبيان" },
        { status: 400 }
      );
    }

    // Calculate latest balance for this branch
    const lastTx = await prisma.treasuryTransaction.findFirst({
      where: branchId ? { branchId } : {},
      orderBy: { createdAt: "desc" },
    });

    const previousBalance = lastTx ? lastTx.balanceAfter : 0;
    const balanceAfter =
      type === "IN"
        ? Number((previousBalance + numAmount).toFixed(2))
        : Number((previousBalance - numAmount).toFixed(2));

    const transaction = await prisma.treasuryTransaction.create({
      data: {
        branchId: branchId || null,
        type,
        category,
        amount: numAmount,
        balanceAfter,
        description,
        reference: reference || null,
        recordedBy: recordedBy || "المايسترو",
      },
      include: { branch: true },
    });

    return NextResponse.json({
      success: true,
      transaction,
      balanceAfter,
      message: "تم تسجيل حركة الخزينة بنجاح",
    });
  } catch (error: any) {
    console.error("Treasury POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
