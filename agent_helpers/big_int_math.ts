
/**
 * Adds two arbitrary-length integers encoded as base-10 strings.
 */
export function add(a: string, b: string): string {
  let i = a.length - 1;
  let j = b.length - 1;
  let carry = 0;
  const result: number[] = [];

  while (i >= 0 || j >= 0 || carry > 0) {
    const digitA = i >= 0 ? parseInt(a[i]) : 0;
    const digitB = j >= 0 ? parseInt(b[j]) : 0;
    const sum = digitA + digitB + carry;
    
    result.push(sum % 10);
    carry = Math.floor(sum / 10);
    
    i--;
    j--;
  }

  return result.reverse().join("") || "0";
}

/**
 * Multiplies two arbitrary-length integers encoded as base-10 strings.
 */
export function multiply(a: string, b: string): string {
  if (a === "0" || b === "0") return "0";

  const m = a.length;
  const n = b.length;
  const result = new Array(m + n).fill(0);

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const mul = parseInt(a[i]) * parseInt(b[j]);
      const p1 = i + j;
      const p2 = i + j + 1;
      const sum = mul + result[p2];

      result[p2] = sum % 10;
      result[p1] += Math.floor(sum / 10);
    }
  }

  // Remove leading zeros
  let start = 0;
  while (start < result.length && result[start] === 0) {
    start++;
  }
  
  return result.slice(start).join("") || "0";
}

