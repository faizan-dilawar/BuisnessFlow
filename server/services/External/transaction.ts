import { getDb } from "server/db";
import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

export interface TransactionRow extends RowDataPacket {
  id: number;
  date: Date;
  account: string;
  debit: number;
  credit: number;
  balance?: number; // Optional, only for getTransactions
}

export async function getPnLTransactions(
  companyId: string,   // ✅ string instead of number
  from: Date,
  to: Date
): Promise<TransactionRow[]> {
  const db = await getDb(); // ✅ now it's MySql2Database with .$client

const client = db.$client as PoolConnection;
const [rows] = await client.execute<TransactionRow[]>(    `
      SELECT id, date, 'Sales Income Revenue' AS account, 0 AS debit, total AS credit
      FROM invoices
      WHERE company_id = ? AND date BETWEEN ? AND ?

      UNION ALL

      SELECT id, paid_at AS date, 'Customer Payment' AS account, amount AS debit, 0 AS credit
      FROM payments
      WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id = ?)
        AND paid_at BETWEEN ? AND ?

      UNION ALL

      SELECT id, date, CONCAT('Expense: ', category, ' - ', vendor) AS account, amount AS debit, 0 AS credit
      FROM expenses
      WHERE company_id = ? AND date BETWEEN ? AND ?

      ORDER BY date ASC
    `,
    [companyId, from, to, companyId, from, to, companyId, from, to]
  );

  return rows;
}
export async function getTransactions(
  companyId: string,
  from: Date,
  to: Date
): Promise<TransactionRow[]> {
  const db = await getDb();
  const client = db.$client as PoolConnection;

  const [rows] = await client.execute<TransactionRow[]>(
    `
      SELECT
        t.id,
        t.date,
        t.account,
        t.debit,
        t.credit,
        SUM(t.credit - t.debit) OVER (ORDER BY t.date, t.id) AS balance
      FROM (
        SELECT id, date, 'Sales Income' AS account, 0 AS debit, total AS credit
        FROM invoices
        WHERE company_id = ? AND date BETWEEN ? AND ?

        UNION ALL

        SELECT id, paid_at AS date, 'Customer Payment' AS account, amount AS debit, 0 AS credit
        FROM payments
        WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id = ?)
          AND paid_at BETWEEN ? AND ?

        UNION ALL

        SELECT id, date, CONCAT('Expense: ', category, ' - ', vendor) AS account, amount AS debit, 0 AS credit
        FROM expenses
        WHERE company_id = ? AND date BETWEEN ? AND ?
      ) AS t
      ORDER BY t.date ASC, t.id ASC
    `,
    [companyId, from, to, companyId, from, to, companyId, from, to]
  );

  return rows;
}


