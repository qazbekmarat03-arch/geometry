import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTex } from '../src/lib/quiz/import.ts';
test('alternate delimiters preserve formulas and matrix rows', () => {
 assert.equal(cleanTex(String.raw`\(\frac{a}{b}\)`), String.raw`$\frac{a}{b}$`);
 assert.equal(cleanTex(String.raw`\[\begin{matrix}1&2\\3&4\end{matrix}\]`), String.raw`$$\begin{matrix}1&2\\3&4\end{matrix}$$`);
 const align = String.raw`\begin{align}a&=b\\c&=d\end{align}`;
 assert.equal(cleanTex(align), align);
});
