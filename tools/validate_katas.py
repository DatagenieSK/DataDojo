#!/usr/bin/env python3
"""
DataDojo Kata Content & Curriculum Validator (Phase 2)
Validates front matter, exercises, quizzes, order cells, grading pages, CPython execution, and internal links.
"""

import os
import sys
import re
import io
import ast
import yaml
import json
import threading

# Add workspace root to sys.path
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

# Import shared helpers directly from docs/assets/py/dojo_helpers.py
HELPERS_PATH = os.path.join(WORKSPACE_ROOT, "docs", "assets", "py", "dojo_helpers.py")
import importlib.util
spec = importlib.util.spec_from_file_location("dojo_helpers_canonical", HELPERS_PATH)
dojo_helpers_canonical = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dojo_helpers_canonical)

DojoTestContext = dojo_helpers_canonical.DojoTestContext
TestFailure = dojo_helpers_canonical.TestFailure

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

def deterministic_shuffle(arr, seed_str):
    """Deterministic PRNG shuffle with exact parity to docs/assets/js/quiz.js."""
    h = 0
    for ch in seed_str:
        h = ((31 * h + ord(ch)) & 0xFFFFFFFF)
        if h >= 0x80000000:
            h -= 0x100000000

    result = list(arr)
    for i in range(len(result) - 1, 0, -1):
        h = ((1664525 * h + 1013904223) & 0xFFFFFFFF)
        if h >= 0x80000000:
            h -= 0x100000000
        unsigned_h = h if h >= 0 else h + 0x100000000
        r = unsigned_h / 4294967296.0
        j = int(r * (i + 1))
        result[i], result[j] = result[j], result[i]
    return result

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
    """Extracts code blocks with language, content, and line numbers."""
    pattern = re.compile(r"```([a-zA-Z0-9_-]+)\n(.*?)```", re.DOTALL)
    blocks = []
    for match in pattern.finditer(body):
        lang = match.group(1)
        code = match.group(2)
        start_pos = match.start()
        line_num = body[:start_pos].count("\n") + 1
        blocks.append((lang, code, line_num))
    return blocks

def parse_sections(source):
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

def parse_quiz_questions(source):
    lines = source.strip().splitlines()
    meta = {}
    questions = []
    current_q = None

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
        if current_q is None and ":" in line_str and not line_str.startswith("?"):
            k, v = line_str.split(":", 1)
            meta[k.strip().lower()] = v.strip()
        elif line_str.startswith("?"):
            if current_q:
                questions.append(current_q)
            current_q = {
                "question": line_str[1:].strip(),
                "options": [],
                "explanation": "",
            }
        elif line_str.startswith("+") and current_q:
            current_q["options"].append({"text": line_str[1:].strip(), "correct": True})
        elif line_str.startswith("-") and current_q:
            current_q["options"].append({"text": line_str[1:].strip(), "correct": False})
        elif line_str.startswith(">") and current_q:
            current_q["explanation"] = line_str[1:].strip()

    if current_q:
        questions.append(current_q)

    return meta, questions

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
            with open(mkdocs_file, "r", encoding="utf-8") as f:
                for line in f:
                    if ".md" in line and ":" in line:
                        target = line.split(":", 1)[1].strip().strip("'\"")
                        if target.endswith(".md"):
                            nav_paths.add(target)

    # Check each kata and grading file in belts
    belts_dir = os.path.join(docs_dir, "belts")
    for root, _, files in os.walk(belts_dir):
        for file in files:
            if file.endswith(".md") and file != "index.md":
                rel = os.path.relpath(os.path.join(root, file), docs_dir).replace("\\", "/")
                if rel not in nav_paths:
                    errors.append(ValidationError(
                        rel, 1,
                        f"Page '{rel}' is missing from mkdocs.yml navigation.",
                        "Add this file under 'nav' in mkdocs.yml."
                    ))

def validate_all_katas():
    docs_dir = os.path.join(WORKSPACE_ROOT, "docs")
    belts_dir = os.path.join(docs_dir, "belts")
    errors = []
    warnings = []
    seen_item_ids = {}
    used_glossary_terms = set()
    defined_kata_ids = set()

    # Load glossary terms
    glossary_file = os.path.join(docs_dir, "glossary.json")
    defined_glossary_terms = {}
    if os.path.exists(glossary_file):
        try:
            with open(glossary_file, "r", encoding="utf-8") as f:
                defined_glossary_terms = json.load(f)
        except Exception as e:
            errors.append(ValidationError("docs/glossary.json", 1, f"Failed to parse glossary.json: {e}", "Ensure valid JSON dictionary."))

    validate_nav_and_links(docs_dir, errors)

    # First pass: collect all kata file IDs
    for root, _, files in os.walk(belts_dir):
        for file in files:
            if file.endswith(".md") and file != "index.md" and file != "grading.md":
                # E.g. 01-hello-dojo.md -> white-01 or white/01-hello-dojo
                rel_parts = os.path.relpath(os.path.join(root, file), belts_dir).replace("\\", "/").split("/")
                belt_name = rel_parts[0]
                base_name = file.replace(".md", "")
                prefix_match = re.match(r"^(\d+)", base_name)
                if prefix_match:
                    num_prefix = prefix_match.group(1)
                    defined_kata_ids.add(f"{belt_name}-{num_prefix}")
                    defined_kata_ids.add(base_name)

    # Process all markdown files
    for root, _, files in os.walk(belts_dir):
        for file in files:
            if not file.endswith(".md") or file == "index.md":
                continue

            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, WORKSPACE_ROOT).replace("\\", "/")

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            fm, body, fm_lines = parse_frontmatter(content)

            if not fm or isinstance(fm, Exception):
                errors.append(ValidationError(
                    rel_path, 1,
                    "Invalid or missing YAML front matter.",
                    "Ensure file begins with '---' and contains valid YAML."
                ))
                continue

            # Check glossary term occurrences
            for term_match in re.finditer(r'data-term=["\']([^"\']+)["\']', body):
                term = term_match.group(1)
                used_glossary_terms.add(term)
                if term not in defined_glossary_terms:
                    line_no = fm_lines + body[:term_match.start()].count("\n") + 1
                    errors.append(ValidationError(
                        rel_path, line_no,
                        f"Unknown glossary term '{term}' in data-term attribute.",
                        f"Add '{term}' to docs/glossary.json with a plain-English definition."
                    ))

            # Prose readability check (warning only)
            body_no_code = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
            body_no_tags = re.sub(r"<[^>]+>", "", body_no_code)
            words = body_no_tags.split()
            if len(words) > 700:
                warnings.append(f"[{rel_path}] Kata prose has {len(words)} words (recommended under ~700 words).")

            sentences = re.split(r"[.!?]+", body_no_tags)
            for s in sentences:
                s_words = s.strip().split()
                if len(s_words) > 25:
                    warnings.append(f"[{rel_path}] Long sentence ({len(s_words)} words): '{' '.join(s_words[:6])}...'")

            is_grading_page = fm.get("type") == "grading"

            if is_grading_page:
                # Grading page validation
                belt_val = str(fm.get("belt", "")).lower()
                if belt_val not in VALID_BELTS:
                    errors.append(ValidationError(
                        rel_path, 2,
                        f"Invalid belt '{belt_val}' on grading page.",
                        f"Must be one of: {sorted(list(VALID_BELTS))}."
                    ))
                try:
                    pass_val = int(fm.get("pass", 0))
                except (ValueError, TypeError):
                    errors.append(ValidationError(
                        rel_path, 3,
                        f"Invalid pass target '{fm.get('pass')}'.",
                        "Specify pass as a positive integer."
                    ))
                    pass_val = 0

                blocks = extract_fenced_blocks(body)
                grading_exercises = [b for b in blocks if b[0] == "dojo-exercise"]

                if len(grading_exercises) < 5:
                    errors.append(ValidationError(
                        rel_path, fm_lines,
                        f"Grading page has {len(grading_exercises)} tasks (at least 5 required).",
                        "Include at least 5 dojo-exercise tasks in grading."
                    ))

                if len(grading_exercises) > 0:
                    pct = (pass_val / len(grading_exercises)) * 100
                    if pct < 60 or pct > 100:
                        errors.append(ValidationError(
                            rel_path, 3,
                            f"Grading pass target {pass_val} of {len(grading_exercises)} ({pct:.0f}%) must be between 60% and 100%.",
                            "Adjust 'pass: ...' in front matter."
                        ))

                covered_katas = set()
                for lang, code, line_num in grading_exercises:
                    actual_line = fm_lines + line_num
                    meta, sections = parse_sections(code)
                    ex_id = meta.get("id")
                    covers = meta.get("covers")

                    if not covers:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Grading exercise '{ex_id}' is missing required 'covers: <kata_id>' metadata.",
                            "Add 'covers: <kata_id>' indicating which kata this task tests."
                        ))
                    else:
                        covered_katas.add(covers)

                if len(covered_katas) < 5 and len(grading_exercises) >= 5:
                    errors.append(ValidationError(
                        rel_path, fm_lines,
                        f"Grading exercises only cover {len(covered_katas)} distinct katas ({covered_katas}). Must cover at least 5.",
                        "Spread tasks across at least 5 distinct katas in the belt."
                    ))

            else:
                # Regular kata validation
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

            # Validate all code blocks inside this page
            blocks = extract_fenced_blocks(body)
            for lang, code, line_num in blocks:
                actual_line = fm_lines + line_num

                # Enforce rule: No input() call in code blocks
                if re.search(r"\binput\s*\(", code):
                    errors.append(ValidationError(
                        rel_path, actual_line,
                        "Found 'input()' call in code block. input() is strictly disallowed in katas.",
                        "Replace input() with hardcoded variables, like name = 'Asha'."
                    ))

                # Check random without random.seed
                if re.search(r"\bimport\s+random\b", code) and not is_grading_page:
                    if not re.search(r"random\.seed\(", code):
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            "Code imports 'random' without calling 'random.seed(...)'.",
                            "Add 'random.seed(42)' to ensure deterministic kata behavior."
                        ))

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
                    meta, sections = parse_sections(code)
                    ex_id = meta.get("id")
                    if not ex_id:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            "dojo-exercise is missing 'id: ...' metadata.",
                            "Add 'id: belt-XX-name' before the first '%%' section."
                        ))
                    elif ex_id in seen_item_ids:
                        prev_file = seen_item_ids[ex_id]
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Duplicate item ID '{ex_id}'. Previously defined in {prev_file}.",
                            "Ensure all item IDs are globally unique across the site."
                        ))
                    else:
                        seen_item_ids[ex_id] = rel_path

                    # In grading pages, tips are optional
                    required_sections = ["starter", "tests", "solution"] if is_grading_page else ["starter", "tests", "tips", "solution"]
                    for sec in required_sections:
                        if sec not in sections or not sections[sec]:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"dojo-exercise is missing section '%% {sec}'.",
                                f"Add '%% {sec}' with content."
                            ))

                    if not is_grading_page:
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
                        try:
                            execute_exercise(solution, tests)
                        except Exception as e:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"Solution failed tests: {e}",
                                "Ensure %% solution passes all assertions in %% tests."
                            ))

                    if tests and starter:
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

                elif lang == "dojo-quiz":
                    meta, questions = parse_quiz_questions(code)
                    quiz_id = meta.get("id")
                    if not quiz_id:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            "dojo-quiz is missing 'id: ...' metadata.",
                            "Add 'id: belt-XX-quiz' at top of quiz block."
                        ))
                    elif quiz_id in seen_item_ids:
                        prev_file = seen_item_ids[quiz_id]
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Duplicate quiz ID '{quiz_id}'. Previously defined in {prev_file}.",
                            "Ensure all quiz IDs are globally unique."
                        ))
                    else:
                        seen_item_ids[quiz_id] = rel_path

                    if len(questions) < 2 or len(questions) > 4:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"dojo-quiz must have 2 to 4 questions, found {len(questions)}.",
                            "Provide between 2 and 4 questions per quiz block."
                        ))

                    for q_idx, q in enumerate(questions):
                        opts = q.get("options", [])
                        if len(opts) < 2 or len(opts) > 4:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"Question {q_idx + 1} ('{q.get('question')}') has {len(opts)} options (must have 2 to 4).",
                                "Provide 2 to 4 options starting with + or -."
                            ))
                        correct_count = sum(1 for opt in opts if opt.get("correct"))
                        if correct_count != 1:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"Question {q_idx + 1} must have exactly one correct option starting with '+', found {correct_count}.",
                                "Ensure exactly one option starts with '+' and the rest start with '-'."
                            ))

                elif lang == "dojo-order":
                    meta, sections = parse_sections(code)
                    order_id = meta.get("id")
                    if not order_id:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            "dojo-order is missing 'id: ...' metadata.",
                            "Add 'id: belt-XX-order' at top of order block."
                        ))
                    elif order_id in seen_item_ids:
                        prev_file = seen_item_ids[order_id]
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Duplicate order ID '{order_id}'. Previously defined in {prev_file}.",
                            "Ensure all order IDs are globally unique."
                        ))
                    else:
                        seen_item_ids[order_id] = rel_path

                    for sec in ["lines", "tests", "tips"]:
                        if sec not in sections or not sections[sec]:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"dojo-order is missing required section '%% {sec}'.",
                                f"Add '%% {sec}' with content."
                            ))

                    raw_lines = [l for l in sections.get("lines", "").splitlines() if l]
                    distractors = [l for l in sections.get("distractors", "").splitlines() if l]
                    all_lines = raw_lines + distractors

                    # Check that distractors are not in correct lines
                    for d in distractors:
                        if d in raw_lines:
                            errors.append(ValidationError(
                                rel_path, actual_line,
                                f"Distractor line '{d}' is also in %% lines.",
                                "Distractor lines must not be part of the correct solution lines."
                            ))

                    # Check solution order passes tests
                    solution_code = "\n".join(raw_lines)
                    tests_code = sections.get("tests", "")
                    try:
                        execute_exercise(solution_code, tests_code)
                    except Exception as e:
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"dojo-order solution order failed tests: {e}",
                            "Ensure lines in %% lines pass the tests."
                        ))

                    # Check deterministic shuffle is not already solved
                    shuffled = deterministic_shuffle(all_lines, order_id)
                    if len(shuffled) == len(raw_lines) and all(shuffled[i] == raw_lines[i] for i in range(len(raw_lines))):
                        errors.append(ValidationError(
                            rel_path, actual_line,
                            f"Initial deterministic shuffle for '{order_id}' is already in solved order.",
                            "Change the order ID or adjust lines so the initial shuffle is mixed."
                        ))

            # Internal links check
            link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
            for match in link_pattern.finditer(body):
                target = match.group(2)
                if target.startswith(("http://", "https://", "#", "mailto:")):
                    continue
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

    # Check for unused glossary terms
    if defined_glossary_terms:
        unused_terms = set(defined_glossary_terms.keys()) - used_glossary_terms
        if unused_terms:
            errors.append(ValidationError(
                "docs/glossary.json", 1,
                f"Glossary contains unused terms: {sorted(list(unused_terms))}.",
                "Every term in glossary.json must be used in at least one kata via <abbr class='dojo-term' data-term='...'>."
            ))

    if warnings:
        print("\n⚠️ Readability & Style Notices (non-fatal):")
        for w in warnings[:10]:
            print(f"  • {w}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more warnings.")

    if errors:
        print(f"\n❌ Validation Failed: {len(errors)} error(s) found.\n")
        for err in errors:
            print(err)
        return False

    print("\n✅ All katas validated successfully! 🥋")
    print(f"Validated {len(seen_item_ids)} curriculum items across site.\n")
    return True

if __name__ == "__main__":
    success = validate_all_katas()
    sys.exit(0 if success else 1)
