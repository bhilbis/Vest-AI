import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

interface Asset {
  id: string;
  type: string;
  name: string;
  category: string;
  color: string;
  position: { x: number; y: number };
  lots: number;
  buyPrice: number;
  currentPrice: number;
}

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

export function AssetDetailModal({ asset, isOpen, onClose, onUpdate, onDelete }: AssetDetailModalProps) {
  const [editData, setEditData] = useState<Asset | null>(null);

  React.useEffect(() => {
    if (asset) {
      setEditData({ ...asset });
    }
  }, [asset]);

  if (!asset || !editData) return null;

  
  const parseInputToNumber = (val: string): number => {
    const cleaned = val.toLowerCase().replace(/\s/g, "").replace(/,/g, "").replace(/\./g, "");

    if (cleaned.includes("rb")) return parseInt(cleaned) * 1_000;
    if (cleaned.includes("jt") || cleaned.includes("juta")) return parseInt(cleaned) * 1_000_000;
    if (cleaned.includes("m") || cleaned.includes("milyar") || cleaned.includes("miliar")) return parseInt(cleaned) * 1_000_000_000;

    return parseInt(cleaned) || 0;
  };

  const buyPriceNum = editData.buyPrice ?? 0;
  const currentPriceNum = editData.currentPrice ?? 0;
  const lotsNum = editData.lots ?? 0;

  const totalCost = lotsNum * buyPriceNum;
  const totalValue = lotsNum * currentPriceNum;
  const profitLoss = totalValue - totalCost;
  const profitPercentage = (profitLoss / totalCost) * 100;
  const isProfit = profitLoss > 0;

  const handleSave = () => {
    onUpdate(editData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(asset.id);
    onClose();
  };

  const suggestions = {
    stock: [
      "Diversifikasi portfolio dengan sektor lain",
      "Monitor earning report perusahaan",
      "Set stop loss pada 5-10% dari harga beli",
      "Pantau volume trading harian"
    ],
    crypto: [
      "Monitor sentimen market crypto",
      "Pantau update teknologi blockchain",
      "Dollar cost averaging untuk volatilitas tinggi",
      "Set target profit pada resistance level"
    ],
    cash: [
      "Alokasikan ke instrumen dengan yield lebih tinggi",
      "Pertimbangkan deposit berjangka",
      "Monitor inflasi vs return",
      "Siapkan emergency fund 6-12 bulan"
    ]
  };

const handleNumericInput = (
  e: React.ChangeEvent<HTMLInputElement>,
  setState: React.Dispatch<React.SetStateAction<Asset | null>>,
  field: keyof Asset
) => {
  const val = e.target.value;

  // Parsing string ke number tapi tetap izinkan koma/titik
  const num = parseInputToNumber(val);

  setState((prev) => prev ? { ...prev, [field]: num } : prev);
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${asset.color}`} />
            {asset.name}
            <Badge variant="secondary" className="capitalize">
              {asset.category}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Form */}
          <Card className="p-4">
            <h3 className="text-lg mb-4">Informasi Asset</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Asset</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Jumlah Lots/Unit</Label>
                <Input
                  inputMode='numeric'
                  pattern="[0-9.,]*"
                  value={editData.lots}
                  onChange={(e) => handleNumericInput(e, setEditData, "lots")}
                />
              </div>
              <div>
                <Label>Harga Beli (Rp)</Label>
                <Input
                  inputMode='numeric'
                  pattern="[0-9.,]*"
                  value={editData.buyPrice}
                  onChange={(e) => handleNumericInput(e, setEditData, "buyPrice")}
                />
              </div>
              <div>
                <Label>Harga Sekarang (Rp)</Label>
                <Input
                  inputMode='numeric'
                  pattern="[0-9.,]*"
                  value={editData.currentPrice}
                  onChange={(e) => handleNumericInput(e, setEditData, "currentPrice")}
                />
              </div>
            </div>
          </Card>

          {/* Profit/Loss Analysis */}
          {editData.lots > 0 && (
            <Card className="p-4">
              <h3 className="text-lg mb-4">Analisis Profit & Loss</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Modal:</span>
                    <span>Rp {totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nilai Sekarang:</span>
                    <span>Rp {totalValue.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>Profit/Loss:</span>
                    <div className={`flex items-center gap-2 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>
                        Rp {Math.abs(profitLoss).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Persentase:</span>
                    <span className={isProfit ? 'text-green-500' : 'text-red-500'}>
                      {profitPercentage > 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Unit:</span>
                    <span>Rp {(editData.currentPrice - editData.buyPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Breakeven:</span>
                    <span>Rp {editData.buyPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* AI Suggestions */}
          <Card className="p-4">
            <h3 className="text-lg mb-4">💡 Saran AI</h3>
            <div className="space-y-2">
              {(suggestions[editData.type as keyof typeof suggestions] || suggestions.stock).map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-2 rounded-lg bg-accent/50"
                >
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm">{suggestion}</span>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Hapus Asset
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save size={16} />
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}