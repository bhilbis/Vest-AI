export const toMonthStart = (input?: string | null) => {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const isValid = /^\d{4}-\d{2}$/.test(input);
  if (!isValid) throw new Error("Invalid month format");

  const [year, month] = input.split("-").map(Number);
  if (!year || month < 1 || month > 12) throw new Error("Invalid month value");

  return new Date(Date.UTC(year, month - 1, 1));
};