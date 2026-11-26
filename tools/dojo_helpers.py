"""
Compatibility shim importing from docs/assets/py/dojo_helpers.py
"""
import os
import sys
import importlib.util

HELPERS_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "docs", "assets", "py", "dojo_helpers.py"))
spec = importlib.util.spec_from_file_location("dojo_helpers_canonical", HELPERS_PATH)
canonical = importlib.util.module_from_spec(spec)
spec.loader.exec_module(canonical)

TestFailure = canonical.TestFailure
DojoTestContext = canonical.DojoTestContext
