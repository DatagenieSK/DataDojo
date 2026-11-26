#!/usr/bin/env python3
"""
DataDojo Kata Content Validator
Validates front matter, exercise structures, CPython execution, and internal links.
"""

import os
import sys
import re
import io
import ast
import yaml
import threading

# Add workspace root to sys.path so tools.dojo_helpers can be imported
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from tools.dojo_helpers import DojoTestContext, TestFailure

VALID_BELTS = {"white", "yellow", "orange", "green", "blue", "purple", "brown", "black"}

class ValidationError:
    def __init__(self, file_path, line_num, message, how_to_fix):
        self.file_path = file_path
        self.line_num = line_num
        self.message = message
        self.how_to_fix = how_to_fix

    def __str__(self):
        line_info = f":{self.line_num}" if self.line_num else ""
        return (
            f"\n❌ [{self.file_path}{line_info}]\n"
            f"   Issue: {self.message}\n"
            f"   Fix:   {self.how_to_fix}\n"
        )

def run_python_code(code_str, timeout_sec=5.0):
    """Executes python code string, capturing stdout, stderr, and globals."""
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    ns = {"__name__": "__main__", "__doc__": None}
    exc_box = []

    def target():
        try:
            parsed = ast.parse(code_str)
            exec(compile(parsed, "<validate>", "exec"), ns)
        except Exception as e:
            exc_box.append(e)

    sys.stdout = stdout_buf
    sys.stderr = stderr_buf
    try:
        t = threading.Thread(target=target)
        t.daemon = True
        t.start()
        t.join(timeout_sec)
        if t.is_alive():
            raise TimeoutError(f"Code timed out after {timeout_sec}s")
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    if exc_box:
        raise exc_box[0]

    return stdout_buf.getvalue(), stderr_buf.getvalue(), ns

def execute_exercise(code_str, test_str):
    """Runs learner code then tests in CPython with Dojo test helpers."""
    stdout, stderr, ns = run_python_code(code_str)

    ctx = DojoTestContext(stdout, ns)
    test_env = dict(ns)
    test_env["check"] = ctx.check
    test_env["stdout_contains"] = ctx.stdout_contains
    test_env["stdout_equals"] = ctx.stdout_equals
    test_env["var"] = ctx.var
    test_env["has_var"] = ctx.has_var
    test_env["calls"] = ctx.calls
    test_env["TestFailure"] = TestFailure

    parsed_tests = ast.parse(test_str)
    exec(compile(parsed_tests, "<tests>", "exec"), test_env)
    return True

def parse_frontmatter(content):
    if not content.startswith("---"):
        return None, content, 0
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content, 0
    fm_str = parts[1]
    body = parts[2]
    line_count = len(fm_str.splitlines()) + 2
    try:
        data = yaml.safe_load(fm_str)
        return data, body, line_count
    except Exception as e:
        return e, body, line_count

def extract_fenced_blocks(body):
    """Extracts code blocks with language and content."""
    pattern = re.compile(r"```([a-zA-Z0-9_-]+)\n(.*?)```", re.DOTALL)
    blocks = []
    for match in pattern.finditer(body):
        lang = match.group(1)
        code = match.group(2)
        start_pos = match.start()
        line_num = body[:start_pos].count("\n") + 1
        blocks.append((lang, code, line_num))
    return blocks

def parse_exercise_sections(source):
    lines = source.strip().splitlines()
    meta = {}
    sections = {}
    current = None
    buf = []
    for line in lines:
        if line.startswith("%%"):
            if current:
                sections[current] = "\n".join(buf).strip()
            current = line[2:].strip().lower()
            buf = []
        elif current is None:
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip().lower()] = v.strip()
        else:
            buf.append(line)
    if current:
        sections[current] = "\n".join(buf).strip()
    return meta, sections

def validate_nav_and_links(docs_dir, errors):
    mkdocs_file = os.path.join(WORKSPACE_ROOT, "mkdocs.yml")
    nav_paths = set()
    if os.path.exists(mkdocs_file):
        try:
            from mkdocs.config import load_config
            cfg = load_config(mkdocs_file)
            def collect_nav(item):
                if isinstance(item, str):
                    nav_paths.add(item)
                elif isinstance(item, list):
                    for sub in item:
                        collect_nav(sub)
                elif isinstance(item, dict):
                    for v in item.values():
                        collect_nav(v)
            if "nav" in cfg:
                collect_nav(cfg["nav"])
        except Exception:
            # Fallback manual text scan for nav entries
            with open(mkdocs_file, "r", encoding="utf-8") as f:
                for line in f:
                    if ".md" in line and ":" in line:
                        target = line.split(":", 1)[1].strip().strip("'\"")
                        if target.endswith(".md"):
                            nav_paths.add(target)

    # Check each kata markdown file in belts
    belts_dir = os.path.join(docs_dir, "belts")
    for root, _, files in os.walk(belts_dir):
        for file in files:
            if file.endswith(".md") and file != "index.md":
                rel = os.path.relpath(os.path.join(root, file), docs_dir).replace("\\", "/")
                if rel not in nav_paths:
                    errors.append(ValidationError(
                        rel, 1,
                        f"Kata '{rel}' is missing from mkdocs.yml navigation.",
                        "Add this file under 'nav' in mkdocs.yml."
                    ))

def validate_all_katas():
    docs_dir = os.path.join(WORKSPACE_ROOT, "docs")
    belts_dir = os.path.join(docs_dir, "belts")
    errors = []
    seen_exercise_ids = {}

    validate_nav_and_links(docs_dir, errors)

    for root, _, files in os.walk(belts_dir):
        for file in files:
            if not file.endswith(".md") or file == "index.md":
                continue

            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, WORKSPACE_ROOT).replace("\\", "/")

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            fm, body, fm_lines = parse_frontmatter(content)

            # 1. Front matter validation
            if not fm or isinstance(fm, Exception):
                errors.append(ValidationError(
                    rel_path, 1,
                    "Invalid or missing YAML front matter.",
                    "Ensure file begins with '---' and contains valid YAML."
                ))
                continue

            for key in ["title", "belt", "minutes", "goal"]:
                if key not in fm:
                    errors.append(ValidationError(
                        rel_path, 1,
                        f"Missing required front matter key: '{key}'.",
                        f"Add '{key}: ...' to front matter."
                    ))

            belt_val = str(fm.get("belt", "")).lower()
            if belt_val not in VALID_BELTS:
                errors.append(ValidationError(
                    rel_path, 2,
                    f"Invalid belt '{belt_val}'.",
                    f"Must be one of: {sorted(list(VALID_BELTS))}."
                ))

            try:
                minutes = int(fm.get("minutes", 0))
                if minutes <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                errors.append(ValidationError(
                    rel_path, 3,
                    f"Invalid minutes value: '{fm.get('minutes')}'.",
                    "Specify minutes as a positive integer, e.g. 'minutes: 5'."
                ))

            # 2. Check blocks
            blocks = extract_fenced_blocks(body)
            for lang, code, line_num in blocks:
                actual_line = fm_lines + line_num

                if lang == "dojo-run":
                    lines = code.strip().splitlines()
                    if lines and lines[0].strip() == "# ci: skip":
                        continue
                    try:
                        run_python_code(code)
                    except Exception as e:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"dojo-run block failed execution: {e}",
                            "Fix the Python code or add '# ci: skip' on line 1 if demonstrating a deliberate error."
                        ))

                elif lang == "dojo-exercise":
                    meta, sections = parse_exercise_sections(code)
                    ex_id = meta.get("id")
                    if not ex_id:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            "dojo-exercise is missing 'id: ...' metadata.",
                            "Add 'id: belt-XX-name' before the first '%%' section."
                        ))
                    elif ex_id in seen_exercise_ids:
                        prev_file = seen_exercise_ids[ex_id]
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Duplicate exercise ID '{ex_id}'. Previously defined in {prev_file}.",
                            "Ensure all exercise IDs are globally unique."
                        ))
                    else:
                        seen_exercise_ids[ex_id] = rel_path

                    # Check required sections
                    for sec in ["starter", "tests", "tips", "solution"]:
                        if sec not in sections or not sections[sec]:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"dojo-exercise is missing section '%% {sec}'.",
                                f"Add '%% {sec}' with content."
                            ))

                    # Check exactly 3 tips
                    tips_raw = sections.get("tips", "")
                    tip_lines = [l for l in tips_raw.splitlines() if l.strip()]
                    if len(tip_lines) != 3:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"dojo-exercise must have exactly 3 tips, found {len(tip_lines)}.",
                            "Provide exactly Tip 1, Tip 2, and Tip 3."
                        ))

                    starter = sections.get("starter", "")
                    tests = sections.get("tests", "")
                    solution = sections.get("solution", "")

                    if tests and solution:
                        # Test solution passes
                        try:
                            execute_exercise(solution, tests)
                        except Exception as e:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"Solution failed tests: {e}",
                                "Ensure %% solution passes all assertions in %% tests."
                            ))

                    if tests and starter:
                        # Test starter fails
                        starter_failed = False
                        try:
                            execute_exercise(starter, tests)
                        except Exception:
                            starter_failed = True

                        if not starter_failed:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                "Starter code passed all tests (exercises must NOT be pre-solved).",
                                "Ensure %% starter fails at least one test in %% tests."
                            ))

            # 3. Check internal markdown links
            link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
            for match in link_pattern.finditer(body):
                target = match.group(2)
                # Ignore web URLs, anchors, mailto
                if target.startswith(("http://", "https://", "#", "mailto:")):
                    continue
                # Remove query or anchor
                clean_target = target.split("#")[0].split("?")[0]
                if clean_target:
                    target_path = os.path.normpath(os.path.join(root, clean_target))
                    if not os.path.exists(target_path):
                        line_num = fm_lines + body[:match.start()].count("\n") + 1
                        errors.append(ValidationError(
                            rel_path, line_num,
                            f"Broken internal link to '{target}'.",
                            "Ensure the referenced file exists."
                        ))

    if errors:
        print(f"\n❌ Validation Failed: {len(errors)} error(s) found.\n")
        for err in errors:
            print(err)
        return False

    print("\n✅ All katas validated successfully! 🥋")
    print(f"Validated {len(seen_exercise_ids)} exercise(s) across curriculum.\n")
    return True

if __name__ == "__main__":
    success = validate_all_katas()
    sys.exit(0 if success else 1)
