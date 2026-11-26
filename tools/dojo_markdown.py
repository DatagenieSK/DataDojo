"""
SuperFences formatters for DataDojo code blocks.
Extracts solutions to assets/solutions/<id>.json to prevent spoiling solutions.
"""

import os
import json
import html
import re

SOLUTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "assets", "solutions")

def parse_exercise_block(source):
    lines = source.strip().splitlines()
    metadata = {}
    sections = {}
    current_section = None
    section_lines = []

    for line in lines:
        if line.startswith("%%"):
            if current_section is not None:
                sections[current_section] = "\n".join(section_lines).strip()
            sec_name = line[2:].strip().lower()
            current_section = sec_name
            section_lines = []
        elif current_section is None:
            # Metadata line before first %%
            if ":" in line:
                key, val = line.split(":", 1)
                metadata[key.strip().lower()] = val.strip()
        else:
            section_lines.append(line)

    if current_section is not None:
        sections[current_section] = "\n".join(section_lines).strip()

    return metadata, sections

def fence_dojo_run(source, language, class_name, options, md, **kwargs):
    starter = source.strip()
    escaped_starter = html.escape(starter, quote=True)
    packages = options.get("packages", "") if options else ""
    return (
        f'<div class="dojo-cell" data-type="run" '
        f'data-starter="{escaped_starter}" '
        f'data-packages="{html.escape(packages, quote=True)}"></div>'
    )

def fence_dojo_exercise(source, language, class_name, options, md, **kwargs):
    metadata, sections = parse_exercise_block(source)
    exercise_id = metadata.get("id", "exercise")
    covers = metadata.get("covers", "")
    xp = metadata.get("xp", "0" if covers else "10")

    starter = sections.get("starter", "")
    tests = sections.get("tests", "")
    solution = sections.get("solution", "")
    tips_raw = sections.get("tips", "")

    # Parse tips
    tips = []
    for line in tips_raw.splitlines():
        line = line.strip()
        if not line:
            continue
        # Strip "Tip 1:", "Tip 2:", etc. if present
        clean_tip = re.sub(r"^Tip\s*\d+:\s*", "", line, flags=re.IGNORECASE)
        tips.append(clean_tip)

    # Save solution to external JSON
    os.makedirs(SOLUTIONS_DIR, exist_ok=True)
    solution_file = os.path.join(SOLUTIONS_DIR, f"{exercise_id}.json")
    with open(solution_file, "w", encoding="utf-8") as f:
        json.dump({"id": exercise_id, "solution": solution}, f, indent=2)

    tip1 = tips[0] if len(tips) > 0 else ""
    tip2 = tips[1] if len(tips) > 1 else ""
    tip3 = tips[2] if len(tips) > 2 else ""

    return (
        f'<div class="dojo-cell" data-type="exercise" '
        f'data-id="{html.escape(exercise_id, quote=True)}" '
        f'data-covers="{html.escape(covers, quote=True)}" '
        f'data-xp="{html.escape(str(xp), quote=True)}" '
        f'data-starter="{html.escape(starter, quote=True)}" '
        f'data-tests="{html.escape(tests, quote=True)}" '
        f'data-tip1="{html.escape(tip1, quote=True)}" '
        f'data-tip2="{html.escape(tip2, quote=True)}" '
        f'data-tip3="{html.escape(tip3, quote=True)}"></div>'
    )

def parse_quiz_block(source):
    lines = source.strip().splitlines()
    metadata = {}
    questions = []
    current_q = None

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
        if current_q is None and ":" in line_str and not line_str.startswith("?"):
            key, val = line_str.split(":", 1)
            metadata[key.strip().lower()] = val.strip()
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

    return metadata, questions

def fence_dojo_quiz(source, language, class_name, options, md, **kwargs):
    metadata, questions = parse_quiz_block(source)
    quiz_id = metadata.get("id", "quiz")
    xp = metadata.get("xp", "5")
    quiz_json = json.dumps(questions)
    return (
        f'<div class="dojo-quiz" '
        f'data-id="{html.escape(quiz_id, quote=True)}" '
        f'data-xp="{html.escape(str(xp), quote=True)}" '
        f'data-quiz="{html.escape(quiz_json, quote=True)}"></div>'
    )

def parse_order_block(source):
    lines = source.strip().splitlines()
    metadata = {}
    sections = {}
    current_section = None
    section_lines = []

    for line in lines:
        if line.startswith("%%"):
            if current_section is not None:
                sections[current_section] = "\n".join(section_lines).strip()
            sec_name = line[2:].strip().lower()
            current_section = sec_name
            section_lines = []
        elif current_section is None:
            if ":" in line:
                key, val = line.split(":", 1)
                metadata[key.strip().lower()] = val.strip()
        else:
            section_lines.append(line)

    if current_section is not None:
        sections[current_section] = "\n".join(section_lines).strip()

    return metadata, sections

def fence_dojo_order(source, language, class_name, options, md, **kwargs):
    metadata, sections = parse_order_block(source)
    order_id = metadata.get("id", "order")
    xp = metadata.get("xp", "10")
    goal = metadata.get("goal", "")
    lines = [l for l in sections.get("lines", "").splitlines() if l]
    distractors = [l for l in sections.get("distractors", "").splitlines() if l]
    tests = sections.get("tests", "")
    tips_raw = sections.get("tips", "")

    tips = []
    for line in tips_raw.splitlines():
        line = line.strip()
        if not line:
            continue
        clean_tip = re.sub(r"^Tip\s*\d+:\s*", "", line, flags=re.IGNORECASE)
        tips.append(clean_tip)

    tip1 = tips[0] if len(tips) > 0 else ""
    tip2 = tips[1] if len(tips) > 1 else ""
    tip3 = tips[2] if len(tips) > 2 else ""

    return (
        f'<div class="dojo-order" '
        f'data-id="{html.escape(order_id, quote=True)}" '
        f'data-xp="{html.escape(str(xp), quote=True)}" '
        f'data-goal="{html.escape(goal, quote=True)}" '
        f'data-lines="{html.escape(json.dumps(lines), quote=True)}" '
        f'data-distractors="{html.escape(json.dumps(distractors), quote=True)}" '
        f'data-tests="{html.escape(tests, quote=True)}" '
        f'data-tip1="{html.escape(tip1, quote=True)}" '
        f'data-tip2="{html.escape(tip2, quote=True)}" '
        f'data-tip3="{html.escape(tip3, quote=True)}"></div>'
    )
