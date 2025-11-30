"use client"
import { banks } from '@/lib/bankData'
import { useState, useMemo, useEffect, useRef } from 'react'

interface BankComboboxProps {
  value: string
  onChange: (value: string) => void
}

export function BankCombobox({ value, onChange }: BankComboboxProps) {
  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Update search saat value berubah dari luar
  useEffect(() => {
    setSearch(value)
  }, [value])

  // Close dropdown saat click di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Memoize hasil filter untuk performa
  const filtered = useMemo(() => {
    if (!search) return banks.slice(0, 50) // Limit awal 50 bank
    return banks.filter(b => 
      b.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50)
  }, [search])

  const handleSelect = (bankName: string) => {
    setSearch(bankName)
    onChange(bankName)
    setOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Pilih atau ketik nama bank..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onChange(e.target.value)
        }}
        onFocus={() => setOpen(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Tidak ditemukan
            </div>
          ) : (
            filtered.map(bank => (
              <button
                type="button"
                key={bank.code}
                onClick={() => handleSelect(bank.name)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{bank.name}</div>
                <div className="text-xs text-gray-500">Kode: {bank.code}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}