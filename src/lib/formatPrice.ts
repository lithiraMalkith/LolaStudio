/**
 * Format a price value with LKR prefix and thousand separators.
 * Uses en-IN locale for Sri Lankan/Indian style grouping.
 * Example: 5555 → "LKR 5,555.00"
 */
export function formatPrice(price: number): string {
  return `LKR ${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
