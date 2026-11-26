"""
Shared Dojo test helpers used in both CPython CI and Pyodide worker.
"""

class TestFailure(Exception):
    pass

class DojoTestContext:
    def __init__(self, stdout_text, globals_dict):
        self.stdout = stdout_text or ""
        self.globals = globals_dict or {}

    def check(self, condition, message="Test condition failed."):
        if not condition:
            raise TestFailure(str(message))

    def stdout_contains(self, text):
        return str(text) in self.stdout

    def stdout_equals(self, text):
        return self.stdout.strip() == str(text).strip()

    def var(self, name):
        return self.globals.get(name, None)

    def has_var(self, name):
        return name in self.globals

    def calls(self, func_name, *args):
        # Optional helper for checking recorded calls
        recorded = self.globals.get("__recorded_calls__", {})
        return recorded.get(func_name, []) == list(args)
