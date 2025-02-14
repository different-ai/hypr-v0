import { db } from '../index';
import { invoice, adminObligation } from '../schema';
import type { Invoice, AdminObligation, NewInvoice, NewAdminObligation } from '../schema';
import { and, eq, gte, desc } from 'drizzle-orm';

export async function storeInvoices(data: Array<Omit<Invoice, 'id' | 'ocrTimestamp' | 'source'> & {
  invoiceDate: string;
  dueDate: string;
}>) {
  try {
    for (const inv of data) {
      await db.insert(invoice).values({
        id: crypto.randomUUID(),
        invoiceNumber: inv.invoiceNumber,
        vendor: inv.vendor,
        amount: inv.amount,
        invoiceDate: new Date(inv.invoiceDate),
        dueDate: new Date(inv.dueDate),
        source: `ocr_batch_${new Date().toISOString()}`,
        userId: inv.userId,
      });
    }
    console.log('Stored', data.length, 'invoice entries');
  } catch (error) {
    console.error('Failed to store invoices:', error);
    throw error;
  }
}

export async function storeAdminObligations(data: Array<Omit<AdminObligation, 'id' | 'ocrTimestamp' | 'source'> & {
  dueDate: string;
}>) {
  try {
    for (const admin of data) {
      await db.insert(adminObligation).values({
        id: crypto.randomUUID(),
        obligation: admin.obligation,
        dueDate: new Date(admin.dueDate),
        notes: admin.notes || null,
        source: `ocr_batch_${new Date().toISOString()}`,
        userId: admin.userId,
      });
    }
    console.log('Stored', data.length, 'admin obligation entries');
  } catch (error) {
    console.error('Failed to store admin obligations:', error);
    throw error;
  }
}

export async function getRecentInvoices({
  userId,
  minutes = 15,
  limit = 5,
}: {
  userId: string;
  minutes?: number;
  limit?: number;
}) {
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    return await db
      .select()
      .from(invoice)
      .where(
        and(
          eq(invoice.userId, userId),
          gte(invoice.ocrTimestamp, startTime)
        )
      )
      .orderBy(desc(invoice.ocrTimestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get recent invoices:', error);
    throw error;
  }
}

export async function getRecentAdminObligations({
  userId,
  minutes = 15,
  limit = 5,
}: {
  userId: string;
  minutes?: number;
  limit?: number;
}) {
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    return await db
      .select()
      .from(adminObligation)
      .where(
        and(
          eq(adminObligation.userId, userId),
          gte(adminObligation.ocrTimestamp, startTime)
        )
      )
      .orderBy(desc(adminObligation.ocrTimestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get recent admin obligations:', error);
    throw error;
  }
}
