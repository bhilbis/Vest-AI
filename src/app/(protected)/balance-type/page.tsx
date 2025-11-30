"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, PlusIcon, Trash2, Edit } from "lucide-react";
import { AccountBalanceFormDialog } from "@/components/balance-type/BalanceTypeFormDialog";

export interface AccountBalance {
  id: string;
  name: string;
  type: string;
  balance: number;
  createdAt: string;
}

export default function AccountBalancePage() {
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AccountBalance | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);

    const res = await fetch("/api/account-balance");
    const data = await res.json();

    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus akun saldo ini?")) return;

    await fetch(`/api/account-balance/${id}`, { method: "DELETE" });

    fetchAccounts();
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Akun Saldo
          </h1>
          <p className="text-muted-foreground">
            Kelola semua akun saldo (Bank, E-Wallet, Cash)
          </p>
        </div>

        <Button
          className="gap-2 bg-linear-to-r from-blue-600 to-purple-600"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <PlusIcon className="w-4 h-4" /> Tambah Akun
        </Button>
      </div>

      <AccountBalanceFormDialog
        isOpen={openForm}
        onOpenChange={setOpenForm}
        fetchData={fetchAccounts}
        editing={editing}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            Belum ada akun saldo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{acc.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Tipe: {acc.type || "-"}
                </p>
                <p className="font-bold text-blue-600 text-lg">
                  Rp {acc.balance.toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setEditing(acc);
                    setOpenForm(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleDelete(acc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}