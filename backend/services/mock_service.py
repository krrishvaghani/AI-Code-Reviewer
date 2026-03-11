"""
Mock AI service — returns realistic hardcoded review feedback.
This is used during development before the real API is wired up.
"""

from models.schemas import ReviewResponse, ComplexityAnalysis

# ---------------------------------------------------------------------------
# Language-specific mock responses
# ---------------------------------------------------------------------------

_MOCK_RESPONSES: dict[str, ReviewResponse] = {
    "python": ReviewResponse(
        issues=[
            "Using `range(len(arr))` is fragile — it raises an IndexError if `arr` is None.",
            "No input validation: the function will crash if a non-iterable is passed.",
            "Integer division used implicitly in some expressions (Python 2 legacy pattern).",
        ],
        suggestions=[
            "Replace index-based loops with direct iteration (`for item in arr`).",
            "Use list comprehensions or generator expressions for transformations.",
            "Add type hints to improve readability and enable static analysis.",
            "Cache repeated attribute lookups (e.g., `len(arr)`) outside the loop.",
        ],
        improved_code=(
            "from typing import Iterable\n\n"
            "def process_items(arr: Iterable) -> None:\n"
            "    \"\"\"Print each item in the iterable.\"\"\"\n"
            "    if arr is None:\n"
            "        raise ValueError(\"arr must not be None\")\n"
            "    for item in arr:\n"
            "        print(item)\n"
        ),
        explanation=(
            "The original code used `range(len(arr))` which is an anti-pattern in Python. "
            "Direct iteration is more readable, works with any iterable, and avoids off-by-one errors. "
            "Type hints were added for clarity. A guard clause handles None input gracefully."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["Single pass over the entire iterable with no early exit"],
            optimization_hint="Use Python's built-in sum() and len() for average calculation to leverage C-level speed.",
        ),
    ),
    "javascript": ReviewResponse(
        issues=[
            "`var` declarations are function-scoped, causing unintended hoisting bugs.",
            "No null/undefined check before iterating — will throw if the array is falsy.",
            "Implicit type coercion in comparisons (e.g., `==` instead of `===`).",
        ],
        suggestions=[
            "Replace `var` with `const` / `let` for block-scoped variables.",
            "Use `for...of` instead of index-based `for` loops for arrays.",
            "Use `Array.prototype.reduce` for accumulation patterns.",
            "Add strict equality checks (`===`) to avoid coercion bugs.",
        ],
        improved_code=(
            "/**\n"
            " * Prints each item in the array.\n"
            " * @param {Array} arr\n"
            " */\n"
            "function processItems(arr) {\n"
            "  if (!Array.isArray(arr)) {\n"
            "    throw new TypeError('arr must be an array');\n"
            "  }\n"
            "  for (const item of arr) {\n"
            "    console.log(item);\n"
            "  }\n"
            "}\n"
        ),
        explanation=(
            "Replaced `var` with `const` to avoid hoisting. `for...of` is the modern way to iterate arrays. "
            "Added an `Array.isArray` guard to prevent runtime errors. JSDoc documents the parameter."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["Linear iteration with console.log on every element (I/O bound)"],
            optimization_hint="Batch output using join() and a single console.log for large arrays.",
        ),
    ),
    "java": ReviewResponse(
        issues=[
            "Raw types used instead of generics — causes unchecked cast warnings.",
            "No null check on the collection parameter before iteration.",
            "Integer overflow possible when accumulating values in `int` without bounds check.",
        ],
        suggestions=[
            "Use the enhanced for-each loop instead of index-based iteration.",
            "Prefer `List<T>` with generics over raw `List` types.",
            "Use `Optional<T>` to express nullable return values explicitly.",
            "Consider the `Stream` API for functional-style transformations.",
        ],
        improved_code=(
            "import java.util.List;\n"
            "import java.util.Objects;\n\n"
            "public class ArrayProcessor {\n\n"
            "    public static <T> void processItems(List<T> items) {\n"
            "        Objects.requireNonNull(items, \"items must not be null\");\n"
            "        for (T item : items) {\n"
            "            System.out.println(item);\n"
            "        }\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "Introduced generics to eliminate raw types. Enhanced for-each replaces the index loop. "
            "`Objects.requireNonNull` provides clear early failure on null input."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["Sequential println calls — one system call per element"],
            optimization_hint="Buffer output with StringBuilder and print once for large collections.",
        ),
    ),
    "cpp": ReviewResponse(
        issues=[
            "Using `int` index with `std::vector::size()` (which returns `size_t`) causes signed/unsigned comparison warnings.",
            "No bounds checking — accessing out-of-range indices causes undefined behaviour.",
            "Missing `const` qualifier on the parameter — prevents passing const containers.",
        ],
        suggestions=[
            "Use a range-based for loop instead of index-based iteration.",
            "Pass containers by `const` reference to avoid unnecessary copies.",
            "Use `auto` to deduce element types and reduce verbosity.",
            "Prefer `std::size_t` or range-based loops to avoid signed/unsigned mismatch.",
        ],
        improved_code=(
            "#include <iostream>\n"
            "#include <vector>\n\n"
            "template <typename T>\n"
            "void processItems(const std::vector<T>& items) {\n"
            "    for (const auto& item : items) {\n"
            "        std::cout << item << '\\n';\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "Range-based for loop eliminates index arithmetic and signed/unsigned mismatch. "
            "The parameter is now `const std::vector<T>&` — const prevents modification, reference avoids a copy. "
            "Templating makes the function reusable for any element type."
        ),
        complexity=ComplexityAnalysis(
            time_complexity="O(n)",
            space_complexity="O(1)",
            has_nested_loops=False,
            bottlenecks=["std::endl flushes on every iteration; use '\\n' instead"],
            optimization_hint="Reserve vector capacity up-front when size is known to eliminate reallocations.",
        ),
    ),
}

_DEFAULT_RESPONSE = ReviewResponse(
    issues=["Unable to detect language-specific patterns for a detailed analysis."],
    suggestions=["Ensure the correct language is selected for better suggestions."],
    improved_code="# No improved code available for this language in mock mode.",
    explanation="This is a mock response. Set AI_PROVIDER and the corresponding API key for real AI-powered reviews.",
    complexity=ComplexityAnalysis(
        time_complexity="O(n)",
        space_complexity="O(1)",
        has_nested_loops=False,
        bottlenecks=["Language not recognized for detailed analysis"],
        optimization_hint="Select a supported language to receive complexity-specific suggestions.",
    ),
)


def get_mock_review(language: str) -> ReviewResponse:
    """Return a mock ReviewResponse for the given language."""
    return _MOCK_RESPONSES.get(language, _DEFAULT_RESPONSE)

# ---------------------------------------------------------------------------
# Language-specific mock responses
# ---------------------------------------------------------------------------

_MOCK_RESPONSES: dict[str, ReviewResponse] = {
    "python": ReviewResponse(
        issues=[
            "Using `range(len(arr))` is fragile — it raises an IndexError if `arr` is None.",
            "No input validation: the function will crash if a non-iterable is passed.",
            "Integer division used implicitly in some expressions (Python 2 legacy pattern).",
        ],
        suggestions=[
            "Replace index-based loops with direct iteration (`for item in arr`).",
            "Use list comprehensions or generator expressions for transformations.",
            "Add type hints to improve readability and enable static analysis.",
            "Cache repeated attribute lookups (e.g., `len(arr)`) outside the loop.",
        ],
        improved_code=(
            "from typing import Iterable\n\n"
            "def process_items(arr: Iterable) -> None:\n"
            "    \"\"\"Print each item in the iterable.\"\"\"\n"
            "    if arr is None:\n"
            "        raise ValueError(\"arr must not be None\")\n"
            "    for item in arr:\n"
            "        print(item)\n"
        ),
        explanation=(
            "The original code used `range(len(arr))` which is an anti-pattern in Python. "
            "Direct iteration (`for item in arr`) is more readable, works with any iterable, "
            "and avoids off-by-one errors. Type hints were added for clarity and static analysis support. "
            "A guard clause was added to handle None input gracefully."
        ),
    ),
    "javascript": ReviewResponse(
        issues=[
            "`var` declarations are function-scoped, causing unintended hoisting bugs.",
            "No null/undefined check before iterating — will throw if the array is falsy.",
            "Implicit type coercion in comparisons (e.g., `==` instead of `===`).",
        ],
        suggestions=[
            "Replace `var` with `const` / `let` for block-scoped variables.",
            "Use `for...of` instead of index-based `for` loops for arrays.",
            "Use `Array.prototype.forEach` or functional methods (`map`, `filter`) where appropriate.",
            "Add strict equality checks (`===`) to avoid coercion bugs.",
        ],
        improved_code=(
            "/**\n"
            " * Prints each item in the array.\n"
            " * @param {Array} arr\n"
            " */\n"
            "function processItems(arr) {\n"
            "  if (!Array.isArray(arr)) {\n"
            "    throw new TypeError('arr must be an array');\n"
            "  }\n"
            "  for (const item of arr) {\n"
            "    console.log(item);\n"
            "  }\n"
            "}\n"
        ),
        explanation=(
            "Replaced `var` with `const` to avoid hoisting and accidental re-assignment. "
            "`for...of` is the modern, readable way to iterate arrays in JavaScript. "
            "Added an `Array.isArray` guard to prevent runtime errors on bad input. "
            "JSDoc was added to document the function's expected parameter type."
        ),
    ),
    "java": ReviewResponse(
        issues=[
            "Raw types used instead of generics — causes unchecked cast warnings and potential ClassCastExceptions.",
            "No null check on the collection parameter before iteration.",
            "Integer overflow possible when accumulating values in `int` without bounds check.",
        ],
        suggestions=[
            "Use the enhanced for-each loop instead of index-based iteration.",
            "Prefer `List<T>` with generics over raw `List` types.",
            "Use `Optional<T>` to express nullable return values explicitly.",
            "Consider `Stream` API for functional-style transformations.",
        ],
        improved_code=(
            "import java.util.List;\n"
            "import java.util.Objects;\n\n"
            "public class ArrayProcessor {\n\n"
            "    /**\n"
            "     * Prints each element of the list.\n"
            "     *\n"
            "     * @param items a non-null list of items to print\n"
            "     */\n"
            "    public static <T> void processItems(List<T> items) {\n"
            "        Objects.requireNonNull(items, \"items must not be null\");\n"
            "        for (T item : items) {\n"
            "            System.out.println(item);\n"
            "        }\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "Introduced a generic type parameter `<T>` to eliminate raw types and enable compile-time type safety. "
            "Replaced the index-based loop with an enhanced for-each loop — cleaner and less error-prone. "
            "`Objects.requireNonNull` provides a clear, early failure on null input instead of a NullPointerException deep in the loop."
        ),
    ),
    "cpp": ReviewResponse(
        issues=[
            "Using `int` index with `std::vector::size()` (which returns `size_t`) causes signed/unsigned comparison warnings.",
            "No bounds checking — accessing out-of-range indices causes undefined behaviour.",
            "Missing `const` qualifier on the parameter — prevents passing const containers.",
        ],
        suggestions=[
            "Use a range-based for loop instead of index-based iteration.",
            "Pass containers by `const` reference to avoid unnecessary copies.",
            "Use `auto` to deduce element types and reduce verbosity.",
            "Prefer `std::size_t` or range-based loops to avoid signed/unsigned mismatch.",
        ],
        improved_code=(
            "#include <iostream>\n"
            "#include <vector>\n\n"
            "/**\n"
            " * Prints each element in the vector.\n"
            " * @param items  read-only reference to the vector\n"
            " */\n"
            "template <typename T>\n"
            "void processItems(const std::vector<T>& items) {\n"
            "    for (const auto& item : items) {\n"
            "        std::cout << item << '\\n';\n"
            "    }\n"
            "}\n"
        ),
        explanation=(
            "A range-based for loop eliminates index arithmetic and signed/unsigned mismatch. "
            "The parameter is now `const std::vector<T>&` — const prevents modification, the reference avoids a copy. "
            "Templating makes the function reusable for any element type. "
            "`'\\n'` is preferred over `std::endl` because it avoids flushing the stream on every iteration."
        ),
    ),
}

_DEFAULT_RESPONSE = ReviewResponse(
    issues=["Unable to detect language-specific patterns for a detailed analysis."],
    suggestions=["Ensure the correct language is selected for better suggestions."],
    improved_code="# No improved code available for this language in mock mode.",
    explanation="This is a mock response. Set AI_PROVIDER and the corresponding API key for real AI-powered reviews.",
)


def get_mock_review(language: str) -> ReviewResponse:
    """Return a mock ReviewResponse for the given language."""
    return _MOCK_RESPONSES.get(language, _DEFAULT_RESPONSE)
