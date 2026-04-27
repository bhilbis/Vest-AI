"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  Users,
  Search,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { PageWrapper } from "@/components/layout/page-wrapper"

interface UserRecord {
  id: string
  name: string | null
  email: string | null
  role: string
  isActive: boolean
  image: string | null
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = session?.user?.role === "ADMIN"

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data.users)
    } catch {
      setError("Gagal memuat data pengguna")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session || !isAdmin) {
      router.replace("/tracker")
      return
    }
    fetchUsers()
  }, [status, session, isAdmin, router, fetchUsers])

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError("")

    const formData = new FormData(e.currentTarget)
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add user")
      setAddDialogOpen(false)
      fetchUsers()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Gagal menambah pengguna")
    } finally {
      setAddLoading(false)
    }
  }

  const handleToggleActive = async (user: UserRecord) => {
    setActionLoading(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleRole = async (user: UserRecord) => {
    setActionLoading(user.id)
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN"
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah role")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (user: UserRecord) => {
    if (!confirm(`Hapus pengguna "${user.name || user.email}"? Semua data akan dihapus.`)) return
    setActionLoading(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus pengguna")
    } finally {
      setActionLoading(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) return null

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-muted">
      <PageWrapper className="space-y-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/tracker"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                  <p className="text-sm text-muted-foreground">
                    {users.length} pengguna terdaftar
                  </p>
                </div>
              </div>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus size={16} />
                    Tambah User
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                    <DialogDescription>
                      Buat akun pengguna baru. Password akan di-hash secara otomatis.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Nama</Label>
                      <Input id="add-name" name="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email *</Label>
                      <Input
                        id="add-email"
                        name="email"
                        type="email"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="add-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 8 karakter"
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-role">Role</Label>
                      <select
                        title="Add Role"
                        id="add-role"
                        name="role"
                        defaultValue="USER"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    {addError && (
                      <p className="text-sm text-destructive">{addError}</p>
                    )}

                    <DialogFooter>
                      <Button type="submit" disabled={addLoading} className="w-full">
                        {addLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Tambah Pengguna
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-destructive hover:text-destructive/80">
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Dibuat
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user, index) => {
                    const isSelf = user.id === session?.user?.id
                    const isActioning = actionLoading === user.id

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* User Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              {user.image && (
                                <AvatarImage asChild>
                                  <Image
                                    src={user.image}
                                    alt={user.name || "User"}
                                    width={36}
                                    height={36}
                                    className="object-cover"
                                  />
                                </AvatarImage>
                              )}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {user.name || "—"}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-semibold">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-chart-2/10 text-chart-2"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role === "ADMIN" ? (
                              <ShieldCheck size={12} />
                            ) : (
                              <ShieldOff size={12} />
                            )}
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                              user.isActive
                                ? "bg-chart-1/10 text-chart-1"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {user.isActive ? (
                              <>
                                <UserCheck size={12} /> Active
                              </>
                            ) : (
                              <>
                                <UserX size={12} /> Inactive
                              </>
                            )}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {isActioning ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleToggleActive(user)}
                                      disabled={isSelf}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {user.isActive ? (
                                        <UserX size={15} />
                                      ) : (
                                        <UserCheck size={15} />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isSelf
                                      ? "Tidak bisa mengubah akun sendiri"
                                      : user.isActive
                                      ? "Nonaktifkan"
                                      : "Aktifkan"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleToggleRole(user)}
                                      disabled={isSelf}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {user.role === "ADMIN" ? (
                                        <ShieldOff size={15} />
                                      ) : (
                                        <ShieldCheck size={15} />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isSelf
                                      ? "Tidak bisa mengubah role sendiri"
                                      : user.role === "ADMIN"
                                      ? "Ubah ke User"
                                      : "Ubah ke Admin"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      title="Delete User"
                                      onClick={() => handleDeleteUser(user)}
                                      disabled={isSelf}
                                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isSelf ? "Tidak bisa menghapus akun sendiri" : "Hapus pengguna"}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {search ? "Tidak ada pengguna ditemukan" : "Belum ada pengguna"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </PageWrapper>
      </div>
    </TooltipProvider>
  )
}
