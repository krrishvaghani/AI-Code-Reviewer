"""
Mock AI service — returns realistic hardcoded review feedback.
Used during development or when USE_MOCK=true in .env.

All responses now include the full ReviewResponse schema:
  issues, performance_issues, security_issues, suggestions,
  improved_code, explanation, complexity.
"""

from models.schemas import ReviewResponse, ComplexityAnalysis

# ---------------------------------------------------------------------------
# Language-specific mock responses
# ---------------------------------------------------------------------------

_MOCK_RESPONSES: dict[str, ReviewResponse] = {
    "python": ReviewResponse(
        issues=[
            "[SEVERITY: HIGH] Line 3 — `range(len(arr))` raises IndexError when `arr` is None.",
            "[SEVERITY: MEDIUM] No input validation: passing a non-iterable causes an unhelpful TypeError.",
            "[SEVERITY: LOW] Python 2-style implicit integer division may give unexpected float results.",
        ],
        performance_issues=[
            "[PERF] Repeated `len(arr)` call inside the loop recomputes the length on every iteration — cache it before the loop.",
            "[PERF] Index-based loop prevents the iterator protocol; use direct iteration to allow lazy evaluation.",
        ],
        security_issues=[
            "[OWASP CWE-20] No input sanitisation — unvalidated external data passed directly to processing logic; add type and bounds checks at the boundary.",
        ],
        suggestions=[
            "Replace `range(len(arr))` with a direct `for item in arr` loop.",
            "Add type hints (e.g., `arr: Iterable`) for IDE support and static analysis.",
            "Extract the None guard into a reusable `validate_input` helper for testability.",
            "Add a docstring describing parameters, return type, and raised exceptions.",
        ],
        improved_code=(
            "from __future__ import annotations\n"
            "from collections.abc import Iterable\n\n\n"
            "def process_items(arr: Iterable[object]) -> None:\n"
            "    \"\"\"Print each item in *arr*.\n\n"
            "    Args:\n"
            "        arr: Any non-None iterable of objects.\n\n"
            "    Raises:\n"
            "        TypeError: If *arr* is not iterable.\n"
            "        ValueError: If *arr* is None.\n"
            "    \"\"\"\n"
            "    if arr is None:\n"
            "        raise ValueError(\"arr must not be None\")\n"
            "    if not hasattr(arr, \"__iter__\"):\n"
            "        raise TypeError(f\"arr must be iterable, got {type(arr).__name__}\")\n"
            "    for item in arr:\n"
            "        print(item)\n"
        ),
        explanation=(
            "Replaced index-based `range(len(arr))` with direct iteration — more readable, works with "
            "any iterable, and avoids off-by-one errors. Added a None guard and a type guard to provide "
            "clear error messages at the boundary (CWE-20 mitigation). Type hint uses the abstract "
            "`Iterable` rather than `list` so the function accepts generators, tuples, and any iterator. "
            "A full docstring documents parameters, return type, and exceptions."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["Single sequential pass — no early exit on a match"],
            optimization_hint="If only membership needs to be tested, use a set for O(1) lookups instead of iterating.",
        ),
    ),

    "javascript": ReviewResponse(
        issues=[
            "[SEVERITY: HIGH] `var` declarations are function-scoped — hoisting causes subtle bugs in loops.",
            "[SEVERITY: HIGH] No null/undefined guard before iteration — throws if `arr` is falsy.",
            "[SEVERITY: MEDIUM] Uses `==` instead of `===` — implicit type coercion leads to unexpected equality.",
        ],
        performance_issues=[
            "[PERF] Calling `console.log` on every element is I/O-bound for large arrays; batch into a single call.",
            "[PERF] `Array.indexOf` inside a loop creates an O(n²) search — replace with a Set for O(n).",
        ],
        security_issues=[
            "[OWASP CWE-79] If array items are rendered as HTML, unsanitised output enables XSS — escape values before insertion into the DOM.",
        ],
        suggestions=[
            "Replace `var` with `const` / `let` for block-scoped, predictable bindings.",
            "Use `for...of` or `Array.prototype.forEach` instead of an index-based loop.",
            "Add a JSDoc comment documenting the parameter type and expected behaviour.",
            "Use `Array.isArray(arr)` for a clear, type-safe guard.",
        ],
        improved_code=(
            "/**\n"
            " * Prints each item in the array to the console.\n"
            " *\n"
            " * @param {unknown[]} arr - The array to iterate over.\n"
            " * @throws {TypeError} If arr is not an Array.\n"
            " */\n"
            "function processItems(arr) {\n"
            "  if (!Array.isArray(arr)) {\n"
            "    throw new TypeError(`arr must be an Array, received ${typeof arr}`);\n"
            "  }\n\n"
            "  // Batch for performance on large arrays\n"
            "  console.log(arr.join('\\n'));\n"
            "}\n"
        ),
        explanation=(
            "Replaced `var` with `const` to eliminate hoisting issues. Switched to `Array.isArray` "
            "guard for explicit type safety (mitigates CWE-20). Batched console output into a single "
            "`join` + `log` call to avoid O(n) I/O calls. JSDoc added for IDE autocomplete support. "
            "Strict equality (`===`) enforced throughout."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(n)",
            has_nested_loops=False,
            bottlenecks=["join() allocates an O(n) string — acceptable trade-off for I/O batching"],
            optimization_hint="For very large arrays, use a streaming approach or chunk the output to avoid memory spikes.",
        ),
    ),

    "java": ReviewResponse(
        issues=[
            "[SEVERITY: HIGH] Raw `List` type used — bypasses generics and produces unchecked cast warnings at runtime.",
            "[SEVERITY: HIGH] No null check on the parameter — NullPointerException if `items` is null.",
            "[SEVERITY: MEDIUM] Using `int` accumulator without overflow guard — silent wrapping for large sums.",
        ],
        performance_issues=[
            "[PERF] One `System.out.println` call per element — sequential I/O; batch with `StringBuilder` for large collections.",
            "[PERF] Index-based `for` loop on a `LinkedList` causes O(n²) traversal — use enhanced for-each or an Iterator.",
        ],
        security_issues=[
            "[OWASP CWE-134] If item `toString()` output is user-controlled and later written to a log, it may cause log injection — sanitise or escape before logging.",
        ],
        suggestions=[
            "Use parameterised generics `List<T>` rather than raw `List`.",
            "Prefer the enhanced for-each loop over index iteration.",
            "Use `Objects.requireNonNull` for an expressive null guard with a clear message.",
            "Consider the `Stream` API for functional-style pipelines (`stream().forEach(...)`).",
        ],
        improved_code=(
            "import java.util.List;\n"
            "import java.util.Objects;\n\n"
            "public final class ArrayProcessor {\n\n"
            "    private ArrayProcessor() { /* utility class */ }\n\n"
            "    /**\n"
            "     * Prints each element of {@code items} to standard output.\n"
            "     *\n"
            "     * @param <T>   the element type\n"
            "     * @param items non-null list of items to print\n"
            "     * @throws NullPointerException if {@code items} is null\n"
            "     */\n"
            "    public static <T> void processItems(final List<T> items) {\n"
            "        Objects.requireNonNull(items, \"items must not be null\");\n"
            "        final StringBuilder sb = new StringBuilder();\n"
            "        for (final T item : items) {\n"
            "            sb.append(item).append(System.lineSeparator());\n"
            "        }\n"
            "        System.out.print(sb);\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "Generic `List<T>` replaces the raw type, eliminating unchecked cast warnings. "
            "`Objects.requireNonNull` provides a clean null guard with an informative message. "
            "Enhanced for-each works efficiently with any `Iterable`, including `LinkedList`. "
            "Batching output into a `StringBuilder` reduces I/O calls from O(n) to O(1). "
            "Class marked `final` and constructor private to enforce the utility-class pattern."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(n)",
            has_nested_loops=False,
            bottlenecks=["StringBuilder grows linearly — acceptable; avoids per-element I/O"],
            optimization_hint="For very large lists, write to a BufferedWriter and flush once to further reduce syscall overhead.",
        ),
    ),

    "cpp": ReviewResponse(
        issues=[
            "[SEVERITY: HIGH] Signed `int` index compared against `size_t` return of `size()` — UB on large vectors (signed overflow).",
            "[SEVERITY: HIGH] No bounds check — out-of-range index access is undefined behaviour.",
            "[SEVERITY: MEDIUM] Parameter passed by value — copies the entire vector unnecessarily.",
        ],
        performance_issues=[
            "[PERF] `std::endl` flushes the stream on every iteration — use `'\\n'` to avoid unnecessary flushes.",
            "[PERF] Passing `std::vector` by value causes O(n) copy at each call site — pass by const reference.",
        ],
        security_issues=[
            "[OWASP CWE-120] Manual index arithmetic without bounds checking allows buffer over-read; use `.at()` for checked access or a range-based loop.",
        ],
        suggestions=[
            "Use a range-based `for (const auto& item : items)` loop to eliminate index arithmetic.",
            "Declare the parameter as `const std::vector<T>&` to avoid the copy and enforce immutability.",
            "Template the function on the element type for maximum reuse.",
            "Add a `[[nodiscard]]` attribute if a computed result is returned.",
        ],
        improved_code=(
            "#include <iostream>\n"
            "#include <vector>\n\n"
            "/**\n"
            " * Prints every element of \\p items to stdout.\n"
            " * @tparam T  Element type (must support operator<<).\n"
            " * @param items  Container to iterate over.\n"
            " */\n"
            "template <typename T>\n"
            "void processItems(const std::vector<T>& items) {\n"
            "    for (const auto& item : items) {\n"
            "        std::cout << item << '\\n';  // '\\n' avoids flush on every line\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "Range-based for loop eliminates all index arithmetic and the signed/unsigned mismatch (CWE-120 mitigation). "
            "Parameter is now `const std::vector<T>&` — `const` prevents accidental mutation, reference avoids an O(n) copy. "
            "Templating on `T` makes the function reusable for any element type that supports `operator<<`. "
            "Replaced `std::endl` with `'\\n'` to eliminate per-line stream flushes."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["Per-element output — one write syscall per item; buffer with ostringstream for bulk writes"],
            optimization_hint="Use `std::copy` with `std::ostream_iterator<T>` and a single `\\n` separator for cleaner, potentially faster output.",
        ),
    ),
}

_DEFAULT_RESPONSE = ReviewResponse(
    issues=["[SEVERITY: LOW] Could not determine language-specific patterns for a detailed analysis."],
    performance_issues=[],
    security_issues=[],
    suggestions=["Ensure the correct language is selected from the dropdown for targeted suggestions."],
    improved_code="# No improved code available for this language in mock mode.",
    explanation=(
        "This is a mock response used when USE_MOCK=true or no API key is configured. "
        "Set AI_PROVIDER and the corresponding API key in .env for real AI-powered reviews."
    ),
    complexity=ComplexityAnalysis(
        time_complexity="O(n)",
        space_complexity="O(1)",
        has_nested_loops=False,
        bottlenecks=["Language not recognised — select a supported language for detailed analysis"],
        optimization_hint="Select Python, JavaScript, Java, or C++ to receive language-specific complexity analysis.",
    ),
)


def get_mock_review(language: str) -> ReviewResponse:
    """Return a mock ReviewResponse for the given language."""
    return _MOCK_RESPONSES.get(language, _DEFAULT_RESPONSE)
