import { add, multiply } from "./big_int_math";

describe("BigIntMath", () => {
  describe("add", () => {
    test("1 + 1 = 2", () => {
      expect(add("1", "1")).toBe("2");
    });
    test("123 + 456 = 579", () => {
      expect(add("123", "456")).toBe("579");
    });
    test("99 + 1 = 100", () => {
      expect(add("99", "1")).toBe("100");
    });
    test("1 + 99 = 100", () => {
      expect(add("1", "99")).toBe("100");
    });
    test("0 + 0 = 0", () => {
      expect(add("0", "0")).toBe("0");
    });
    test("100 + 0 = 100", () => {
      expect(add("100", "0")).toBe("100");
    });
    test("0 + 100 = 100", () => {
      expect(add("0", "100")).toBe("100");
    });
    test("MAX_SAFE_INTEGER + 1", () => {
      expect(add("9007199254740991", "1")).toBe("9007199254740992");
    });
    test("MAX_SAFE_INTEGER + MAX_SAFE_INTEGER", () => {
      expect(add("9007199254740991", "9007199254740991")).toBe("18014398509481982");
    });
  });

  describe("multiply", () => {
    test("2 * 3 = 6", () => {
      expect(multiply("2", "3")).toBe("6");
    });
    test("12 * 12 = 144", () => {
      expect(multiply("12", "12")).toBe("144");
    });
    test("123 * 456 = 56088", () => {
      expect(multiply("123", "456")).toBe("56088");
    });
    test("0 * 100 = 0", () => {
      expect(multiply("0", "100")).toBe("0");
    });
    test("100 * 0 = 0", () => {
      expect(multiply("100", "0")).toBe("0");
    });
    test("99 * 99 = 9801", () => {
      expect(multiply("99", "99")).toBe("9801");
    });
    test("999 * 999 = 998001", () => {
      expect(multiply("999", "999")).toBe("998001");
    });
    test("Large multiplication", () => {
      expect(multiply("123456789", "987654321")).toBe("121932631112635269");
    });
  });
});
