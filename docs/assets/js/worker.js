/**
 * DataDojo Pyodide Web Worker
 * Runs user code and exercise tests in an isolated background thread.
 */

/* global importScripts, loadPyodide */

let pyodide = null;
let userNamespace = null;
let pyodideReadyPromise = null;

const PYODIDE_VERSION = '0.29.5';
const CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    importScripts(CDN_URL);
    pyodide = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
    });

    // Fetch single shared helper file published by MkDocs
    try {
      const helpersUrl = new URL('../py/dojo_helpers.py', import.meta.url);
      const res = await fetch(helpersUrl);
      if (res.ok) {
        const helperCode = await res.text();
        pyodide.FS.writeFile('dojo_helpers.py', helperCode);
      }
    } catch (e) {
      console.warn('Could not fetch external dojo_helpers.py, falling back to built-in definitions', e);
    }

    // Initialize custom test execution engine in Python
    await pyodide.runPythonAsync(`
import sys
import io
import ast

try:
    from dojo_helpers import DojoTestContext, TestFailure
except ImportError:
    class TestFailure(Exception):
        pass

    class DojoTestContext:
        def __init__(self, stdout_text="", globals_dict=None):
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
            return self.globals.get("__recorded_calls__", {}).get(func_name, []) == list(args)

class DojoRunner:
    def __init__(self):
        self.namespace = {
            '__name__': '__main__',
            '__doc__': None,
        }

    def reset(self):
        self.namespace = {
            '__name__': '__main__',
            '__doc__': None,
        }

    def _exec_code(self, code_str, capture_stdout=True):
        out_buf = io.StringIO()
        err_buf = io.StringIO()
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        last_val = None

        if capture_stdout:
            sys.stdout = out_buf
            sys.stderr = err_buf

        try:
            parsed = ast.parse(code_str)
            if not parsed.body:
                return "", "", None

            last = parsed.body[-1]
            if isinstance(last, ast.Expr):
                body_before = parsed.body[:-1]
                if body_before:
                    mod = ast.Module(body=body_before, type_ignores=[])
                    exec(compile(mod, '<dojo>', 'exec'), self.namespace)
                expr = ast.Expression(body=last.value)
                last_val = eval(compile(expr, '<dojo>', 'eval'), self.namespace)
            else:
                exec(compile(parsed, '<dojo>', 'exec'), self.namespace)
        finally:
            if capture_stdout:
                sys.stdout = old_stdout
                sys.stderr = old_stderr

        return out_buf.getvalue(), err_buf.getvalue(), last_val

    def run_user(self, code_str):
        stdout, stderr, last_val = self._exec_code(code_str)
        val_repr = repr(last_val) if last_val is not None else None
        return {
            'stdout': stdout,
            'stderr': stderr,
            'finalValue': val_repr,
        }

    def run_check(self, user_code, test_code):
        # 1. Run user code
        stdout, stderr, last_val = self._exec_code(user_code)

        # 2. Setup test context helpers from shared dojo_helpers
        ctx = DojoTestContext(stdout, self.namespace)
        test_env = dict(self.namespace)
        test_env['check'] = ctx.check
        test_env['stdout_contains'] = ctx.stdout_contains
        test_env['stdout_equals'] = ctx.stdout_equals
        test_env['var'] = ctx.var
        test_env['has_var'] = ctx.has_var
        test_env['calls'] = ctx.calls
        test_env['TestFailure'] = TestFailure

        # 3. Execute tests
        exec(compile(ast.parse(test_code), '<tests>', 'exec'), test_env)

        val_repr = repr(last_val) if last_val is not None else None
        return {
            'stdout': stdout,
            'stderr': stderr,
            'finalValue': val_repr,
            'passed': True
        }

_dojo_runner = DojoRunner()
`);

    return pyodide;
  })();

  return pyodideReadyPromise;
}

self.onmessage = async (event) => {
  const { type, id, code, tests, packages } = event.data || {};

  try {
    if (type === 'init') {
      await initPyodide();
      self.postMessage({ id, type: 'ready' });
      return;
    }

    await initPyodide();

    if (type === 'reset') {
      await pyodide.runPythonAsync(`_dojo_runner.reset()`);
      self.postMessage({ id, type: 'reset_done' });
      return;
    }

    // Optional packages load
    if (packages && typeof packages === 'string') {
      const pkgList = packages.split(',').map((p) => p.trim()).filter(Boolean);
      for (const pkg of pkgList) {
        await pyodide.loadPackage(pkg);
      }
    }

    if (type === 'run') {
      // Set globals and execute
      self._temp_code = code || '';
      const resultProxy = await pyodide.runPythonAsync(`_dojo_runner.run_user(getattr(__import__('js'), '_temp_code'))`);
      const result = resultProxy.toJs({ dict_converter: Object.fromEntries });
      resultProxy.destroy();

      self.postMessage({
        id,
        type: 'result',
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        finalValue: result.finalValue,
      });
      return;
    }

    if (type === 'check') {
      self._temp_code = code || '';
      self._temp_tests = tests || '';

      try {
        const resultProxy = await pyodide.runPythonAsync(`
_dojo_runner.run_check(
    getattr(__import__('js'), '_temp_code'),
    getattr(__import__('js'), '_temp_tests')
)
`);
        const result = resultProxy.toJs({ dict_converter: Object.fromEntries });
        resultProxy.destroy();

        self.postMessage({
          id,
          type: 'result',
          success: true,
          passed: true,
          stdout: result.stdout,
          stderr: result.stderr,
          finalValue: result.finalValue,
        });
      } catch (testErr) {
        const errStr = String(testErr);
        let failureMsg = null;
        if (errStr.includes('TestFailure:')) {
          failureMsg = errStr.split('TestFailure:')[1].trim();
        }

        self.postMessage({
          id,
          type: 'result',
          success: false,
          testFailure: failureMsg,
          rawError: errStr,
        });
      }
      return;
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'result',
      success: false,
      rawError: String(err && err.message ? err.message : err),
    });
  }
};
