import { describe, expect, it } from "vitest";
import { calculateCheckoutTotals } from "./App";

describe("calculateCheckoutTotals", () => {
  it("applies a 15% discount to eligible blends with BREW3PM after 3pm", () => {
    const cart = [
      { product: { id: 1, name: "Morning Ritual", type: "Coffee", price: 20 }, qty: 1 },
      { product: { id: 2, name: "Midnight Chamomile", type: "Tea", price: 10 }, qty: 1 },
    ] as any[];

    const result = calculateCheckoutTotals(cart, "BREW3PM", new Date("2024-01-01T15:30:00"));

    expect(result.subtotal).toBe(30);
    expect(result.eligibleSubtotal).toBe(20);
    expect(result.discount).toBe(3);
    expect(result.total).toBe(27);
    expect(result.promoApplied).toBe(true);
  });

  it("does not apply the discount before 3pm", () => {
    const cart = [
      { product: { id: 1, name: "Morning Ritual", type: "Coffee", price: 20 }, qty: 1 },
    ] as any[];

    const result = calculateCheckoutTotals(cart, "BREW3PM", new Date("2024-01-01T14:59:59"));

    expect(result.promoApplied).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(20);
  });

  it("does not apply the discount for invalid codes", () => {
    const cart = [
      { product: { id: 1, name: "Morning Ritual", type: "Coffee", price: 20 }, qty: 1 },
    ] as any[];

    const result = calculateCheckoutTotals(cart, "WRONGCODE", new Date("2024-01-01T15:30:00"));

    expect(result.promoApplied).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(20);
  });
});
