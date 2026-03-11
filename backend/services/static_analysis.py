"""
Static analysis service — runs language-specific linters before AI review.

Supported tools:
  Python      → pylint  (must be installed: pip install pylint)
  JavaScript  → ESLint  (must be installed: npm install -g eslint)

Both runners write code to a temp file, invoke the tool as a subprocess with
a strict timeout, parse JSON output, and clean up — no user input ever reaches
a shell string (no shell=True), preventing command-injection attacks.

Returns a List[StaticAnalysisFinding] (empty list if the tool is unavailable
or the language has no supported linter). Failures are logged as warnings and
never raise — the AI review proceeds regardless.
"""

import json
import logging
import os
import subprocess
import tempfile
from typing import List

from models.schemas import StaticAnalysisFinding

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Severity maps
# ---------------------------------------------------------------------------

_PYLINT_SEVERITY: dict[str, str] = {
    "fatal":      "error",
    "error":      "error",
    "warning":    "warning",
    "refactor":   "info",
    "convention": "info",
    "info":       "info",
}


# ---------------------------------------------------------------------------
# Pylint runner  (Python)
# ---------------------------------------------------------------------------

def _run_pylint(code: str) -> List[StaticAnalysisFinding]:
    """Write *code* to a temp .py file, run pylint --output-format=json, parse."""
    findings: List[StaticAnalysisFinding] = []

    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, "review_code.py")

    try:
        with open(tmp_path, "w", encoding="utf-8") as fh:
            fh.write(code)

        result = subprocess.run(
            [
                "pylint",
                tmp_path,
                "--output-format=json",
                # Suppress missing-docstring codes — not useful for snippets
                "--disable=C0114,C0115,C0116,C0301",
                # Never prompt for user input
                "--score=no",
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )

        stdout = result.stdout.strip()
        if not stdout:
            return findings

        data = json.loads(stdout)
        for item in data:
            findings.append(
                StaticAnalysisFinding(
                    line=item.get("line"),
                    column=item.get("column"),
                    severity=_PYLINT_SEVERITY.get(
                        (item.get("type") or "warning").lower(), "warning"
                    ),
                    code=item.get("message-id", ""),
                    message=item.get("message", ""),
                    tool="pylint",
                )
            )

    except FileNotFoundError:
        logger.warning("static_analysis: pylint not found — install with `pip install pylint`")
    except subprocess.TimeoutExpired:
        logger.warning("static_analysis: pylint timed out after 20 s")
    except json.JSONDecodeError as exc:
        logger.warning("static_analysis: could not parse pylint output — %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("static_analysis: pylint unexpected error — %s", exc)
    finally:
        try:
            os.unlink(tmp_path)
            os.rmdir(tmp_dir)
        except OSError:
            pass

    return findings


# ---------------------------------------------------------------------------
# ESLint runner  (JavaScript)
# ---------------------------------------------------------------------------

_ESLINT_RULES = json.dumps({
    "no-unused-vars":    "warn",
    "no-undef":          "warn",
    "eqeqeq":            ["warn", "always"],
    "no-var":            "warn",
    "prefer-const":      "warn",
    "semi":              ["warn", "always"],
    "no-eval":           "error",
    "no-implied-eval":   "error",
    "no-new-func":       "error",
})

_ESLINT_ENV = "browser,es2021,node"


def _run_eslint(code: str) -> List[StaticAnalysisFinding]:
    """Write *code* to a temp .js file, run eslint --format=json, parse."""
    findings: List[StaticAnalysisFinding] = []

    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, "review_code.js")

    # Write a minimal .eslintrc.json so we control all rules and avoid
    # picking up any project-level config from parent directories.
    eslint_cfg_path = os.path.join(tmp_dir, ".eslintrc.json")
    eslint_cfg = {
        "env": {"browser": True, "es2021": True, "node": True},
        "parserOptions": {"ecmaVersion": 2021, "sourceType": "module"},
        "rules": json.loads(_ESLINT_RULES),
    }

    try:
        with open(tmp_path, "w", encoding="utf-8") as fh:
            fh.write(code)
        with open(eslint_cfg_path, "w", encoding="utf-8") as fh:
            json.dump(eslint_cfg, fh)

        result = subprocess.run(
            [
                "npx",
                "--yes",
                "eslint",
                "--format=json",
                "--no-ignore",
                f"--rulesdir={tmp_dir}" if False else "",   # placeholder; not needed
                tmp_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=tmp_dir,   # ensures .eslintrc.json is picked up
        )

        # ESLint exits 1 when it finds lint errors — that's expected and fine.
        stdout = result.stdout.strip()
        if not stdout:
            return findings

        data = json.loads(stdout)
        for file_result in data:
            for msg in file_result.get("messages", []):
                severity_int = msg.get("severity", 1)
                findings.append(
                    StaticAnalysisFinding(
                        line=msg.get("line"),
                        column=msg.get("column"),
                        severity="error" if severity_int == 2 else "warning",
                        code=msg.get("ruleId") or "eslint",
                        message=msg.get("message", ""),
                        tool="eslint",
                    )
                )

    except FileNotFoundError:
        logger.warning(
            "static_analysis: npx/eslint not found — install Node.js and run `npm install -g eslint`"
        )
    except subprocess.TimeoutExpired:
        logger.warning("static_analysis: eslint timed out after 30 s")
    except json.JSONDecodeError as exc:
        logger.warning("static_analysis: could not parse eslint output — %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("static_analysis: eslint unexpected error — %s", exc)
    finally:
        try:
            os.unlink(tmp_path)
            try:
                os.unlink(eslint_cfg_path)
            except OSError:
                pass
            os.rmdir(tmp_dir)
        except OSError:
            pass

    return findings


# ---------------------------------------------------------------------------
# Public dispatcher
# ---------------------------------------------------------------------------

def run_static_analysis(language: str, code: str) -> List[StaticAnalysisFinding]:
    """
    Run the appropriate static analyser for *language* against *code*.

    Returns an empty list for unsupported languages or when the tool is not
    installed — never raises.
    """
    if language == "python":
        logger.info("static_analysis: running pylint")
        return _run_pylint(code)
    if language == "javascript":
        logger.info("static_analysis: running eslint")
        return _run_eslint(code)
    # java / cpp — no tool integrated yet
    logger.debug("static_analysis: no tool configured for language=%s", language)
    return []
