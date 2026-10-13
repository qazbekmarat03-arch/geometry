/** Bounded arithmetic parser for TikZ plot data. No eval, macros or file access. */
export function plotExpression(source: string): (x: number) => number {
  const text = source.replace(/\\x\b/g, "x").replace(/\s/g, "");
  const tokens = text.match(/\d*\.?\d+|[a-z]+|[()+*/^\-]/g) ?? [];
  if (tokens.join("") !== text || tokens.length > 200)
    throw new Error("График өрнегі танылмады.");
  let position = 0;
  type Fn = (x: number) => number;
  const functions: Record<string, (x: number) => number> = {
    ln: Math.log,
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    exp: Math.exp,
  };
  const take = (token: string) => tokens[position] === token && ++position > 0;
  function atom(depth: number): Fn {
    if (depth > 32) throw new Error("График өрнегі тым күрделі.");
    if (take("(")) {
      const f = sum(depth + 1);
      if (!take(")")) throw new Error("График жақшасы жабылмаған.");
      return f;
    }
    const token = tokens[position++];
    if (token === "x") return (x) => x;
    if (token && /^\d*\.?\d+$/.test(token)) return () => Number(token);
    if (Object.hasOwn(functions, token)) {
      if (!take("(")) throw new Error("Функция жақшасы қажет.");
      const f = sum(depth + 1);
      if (!take(")")) throw new Error("График жақшасы жабылмаған.");
      return (x) => functions[token](f(x));
    }
    throw new Error(
      "Графикте тек x, сандар және ln/sqrt/sin/cos/exp қолданылады.",
    );
  }
  function unary(depth: number): Fn {
    if (depth > 32) throw new Error("График өрнегі тым күрделі.");
    if (take("+")) return unary(depth + 1);
    if (take("-")) {
      const f = unary(depth + 1);
      return (x) => -f(x);
    }
    const base = atom(depth + 1);
    if (take("^")) {
      const power = unary(depth + 1);
      return (x) => base(x) ** power(x);
    }
    return base;
  }
  function product(depth: number): Fn {
    let f = unary(depth);
    while (tokens[position] === "*" || tokens[position] === "/") {
      const op = tokens[position++],
        left = f,
        right = unary(depth);
      f = op === "*" ? (x) => left(x) * right(x) : (x) => left(x) / right(x);
    }
    return f;
  }
  function sum(depth: number): Fn {
    let f = product(depth);
    while (tokens[position] === "+" || tokens[position] === "-") {
      const op = tokens[position++],
        left = f,
        right = product(depth);
      f = op === "+" ? (x) => left(x) + right(x) : (x) => left(x) - right(x);
    }
    return f;
  }
  const result = sum(0);
  if (position !== tokens.length)
    throw new Error("График өрнегін толық оқу мүмкін болмады.");
  return result;
}
