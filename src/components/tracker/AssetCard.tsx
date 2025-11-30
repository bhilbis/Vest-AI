/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { GripVertical, TrendingUp, TrendingDown, Edit3, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

interface AssetCardProps {
  asset: Asset;
  onUpdate: (asset: Asset) => void;
  onClick: (asset: Asset) => void;
  constraints?: any;
  index: number;
  // layout helpers from parent
  columns: number;
  padding: number;
  gapX: number;
  stepY: number;
}

const colorOptions = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-red-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-gray-500',
];

const CARD_WIDTH = 288; // w-72 = 18rem = 288px

export function AssetCard({ asset, onUpdate, onClick, constraints, index, columns, padding, gapX, stepY }: AssetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const dragControls = useDragControls();

  const profitLoss = (asset.currentPrice - asset.buyPrice) * asset.lots;
  const profitPercentage = asset.buyPrice > 0 ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const handleDragEnd = (event: any, info: any) => {
    const fallback = getDefaultPosition(index);
    const newPosition = {
      x: (asset.position?.x ?? fallback.x) + info.offset.x,
      y: (asset.position?.y ?? fallback.y) + info.offset.y,
    };
    onUpdate({ ...asset, position: newPosition });
  };

  const handleColorChange = (color: string) => {
    onUpdate({ ...asset, color });
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      onUpdate({ ...asset, name: name.trim() });
      setIsEditing(false);
    }
  };

  function getDefaultPosition(i: number) {
    const cols = Math.max(1, columns || 1);
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: padding + col * (CARD_WIDTH + gapX),
      y: padding + row * stepY,
    };
  }


  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraints}
      initial={{ 
        x: asset.position?.x ?? getDefaultPosition(index).x, 
        y: asset.position?.y ?? getDefaultPosition(index).y,
      }}
      animate={{ 
        x: asset.position?.x ?? getDefaultPosition(index).x, 
        y: asset.position?.y ?? getDefaultPosition(index).y,
      }}
      onDragEnd={handleDragEnd}
      className="absolute cursor-move"
      whileHover={{ scale: 1.02, zIndex: 10 }}
      whileDrag={{ scale: 1.05, zIndex: 20 }}
    >
      <Card className="w-72 bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Card Header with drag handle */}
        <div 
          className="flex items-center justify-between p-3 pb-2"
        >
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${asset.color}`} />
            <Badge variant="secondary" className="text-xs capitalize">
              {asset.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Palette size={12} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-2">
                <div className="grid grid-cols-5 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Pilih warna ${color}`}
                      title={`Pilih warna ${color}`}
                      className={`w-6 h-6 rounded-full ${color} hover:scale-110 transition-transform ${
                        asset.color === color ? 'ring-2 ring-foreground' : ''
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleColorChange(color); }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit3 size={12} />
            </Button>
            
            <GripVertical 
              size={16} 
              className="text-muted-foreground cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            />
          </div>
        </div>
        
        {/* Card Content */}
        <div 
          className="p-3 pt-1 cursor-pointer"
          onClick={() => onClick(asset)}
        >
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setName(asset.name);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-lg mb-2"
              autoFocus
              aria-label="Nama aset"
              placeholder="Nama aset"
              title="Nama aset"
            />
          ) : (
            <h3 className="text-lg mb-2 truncate">{asset.name}</h3>
          )}
          
          {asset.lots > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lots:</span>
                <span>{asset.lots}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Beli:</span>
                <span>Rp {asset.buyPrice.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Sekarang:</span>
                <span>Rp {asset.currentPrice.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-sm">P&L:</span>
                <div className={`flex items-center gap-1 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                  {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="text-sm">
                    Rp {Math.abs(profitLoss).toLocaleString()} ({Math.abs(profitPercentage).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {asset.lots === 0 && (
            <p className="text-sm text-muted-foreground">
              Klik untuk menambahkan detail asset
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}