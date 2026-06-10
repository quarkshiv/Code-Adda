import type { AIMode } from '@/store/useEditorStore';

// Mock AI responses for demonstration (replace with real Gemini API key)
const MOCK_RESPONSES: Record<AIMode, (code: string) => string> = {
  explain: (code) => `## Code Explanation

**Overview:**
This code ${code.includes('function') || code.includes('def') || code.includes('void') ? 'defines a function' : 'contains a script'} that performs specific operations.

**Key Components:**
${code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).slice(0, 3).map((l, i) => `${i + 1}. \`${l.trim()}\` — ${getLineSummary(l)}`).join('\n')}

**Logic Flow:**
1. The program initializes variables and sets up the execution context
2. Core logic processes the input data using defined algorithms
3. Results are computed and returned/displayed

**Complexity Analysis:**
- ⏱ **Time Complexity:** O(n) — linear with input size
- 💾 **Space Complexity:** O(1) — constant extra space

> 💡 **Tip:** Consider adding error handling for edge cases and input validation.`,

  debug: (code) => `## Debug Analysis

**Scanning for potential issues...**

${code.includes('==') && !code.includes('===') && (code.includes('javascript') || code.toLowerCase().includes('js')) ? '⚠️ **Warning:** Using \`==\` instead of \`===\` can cause type coercion bugs.\n\n' : ''}${code.includes('var ') ? '⚠️ **Warning:** \`var\` has function scope. Consider using \`const\`/\`let\` for block scoping.\n\n' : ''}

**Potential Issues Found:**
1. 🟡 **Missing null/undefined checks** — Validate inputs before processing
2. 🟡 **No error handling** — Wrap async operations in try/catch
3. 🟢 **Logic looks correct** — Core algorithm appears sound

**Suggested Fix:**
\`\`\`
// Add input validation
if (!input || input === null) {
  throw new Error("Invalid input provided");
}
\`\`\`

**Recommendations:**
- Add comprehensive unit tests
- Use TypeScript for type safety
- Implement proper error boundaries`,

  optimize: (code) => `## Optimization Report

**Current Performance Analysis:**
- ⏱ Estimated Time Complexity: O(n)
- 💾 Memory Usage: Moderate

**Optimization Opportunities:**

### 1. Memoization (High Impact)
Cache repeated computations to avoid redundant calculations:
\`\`\`
const memo = new Map();
function optimized(input) {
  if (memo.has(input)) return memo.get(input);
  const result = /* computation */;
  memo.set(input, result);
  return result;
}
\`\`\`

### 2. Early Exit Pattern (Medium Impact)
Return early when possible to reduce unnecessary iterations.

### 3. Data Structure Choice (Medium Impact)
Consider using a \`Set\` or \`Map\` for O(1) lookups instead of array searches.

**Expected Improvement:** 40-60% faster execution for large inputs

> 🚀 After optimization: **O(n log n)** → **O(n)** time complexity`,

  comments: (code) => {
    const lines = code.split('\n');
    const commented = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('function') || trimmed.startsWith('def ') || trimmed.startsWith('public ')) {
        return `// Defines the main function for processing input\n${line}`;
      }
      if (trimmed.startsWith('return ')) {
        return `${line} // Returns the computed result`;
      }
      if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ')) {
        return `${line} // Variable declaration`;
      }
      return line;
    });
    return `## Generated Comments\n\nHere's your code with inline documentation:\n\n\`\`\`\n${commented.join('\n')}\n\`\`\`\n\n> 💡 Consider using JSDoc/docstrings for better IDE integration.`;
  },
};

function getLineSummary(line: string): string {
  if (line.includes('return')) return 'Returns the computed value';
  if (line.includes('console.log') || line.includes('print')) return 'Outputs result to console';
  if (line.includes('import') || line.includes('#include')) return 'Imports required module/library';
  if (line.includes('for') || line.includes('while')) return 'Loop iteration';
  if (line.includes('if')) return 'Conditional branching logic';
  return 'Core business logic statement';
}

// Real Gemini API integration (uncomment and add your key to .env as VITE_GEMINI_API_KEY)
// import { GoogleGenerativeAI } from '@google/generative-ai';
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function getAIResponse(mode: AIMode, code: string, language: string): Promise<string> {
  // Simulate network delay for realistic UX
  await new Promise((res) => setTimeout(res, 1500 + Math.random() * 1000));
  
  // --- REAL GEMINI IMPLEMENTATION ---
  // Uncomment this block and add VITE_GEMINI_API_KEY to your .env file:
  /*
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompts: Record<AIMode, string> = {
      explain: `Explain this ${language} code clearly with complexity analysis:\n\n${code}`,
      debug: `Debug this ${language} code, identify bugs and suggest fixes:\n\n${code}`,
      optimize: `Optimize this ${language} code for performance and readability:\n\n${code}`,
      comments: `Add comprehensive inline comments to this ${language} code:\n\n${code}`,
    };
    const result = await model.generateContent(prompts[mode]);
    return result.response.text();
  } catch (err) {
    console.error('Gemini API error:', err);
    return MOCK_RESPONSES[mode](code);
  }
  */
  
  return MOCK_RESPONSES[mode](code);
}
