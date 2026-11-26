/**
 * DataDojo Pyodide Web Worker
 * Runs user code and exercise tests in an isolated background thread.
 */

/* global importScripts, loadPyodide */

let pyodide = null;
let userNamespace = null;
let pyodideReadyPromise = null;

const PYODIDE_VERSION = '0.26.4';
const CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    importScripts(CDN_URL);
    pyodide = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
    });

    // Initialize custom test execution engine in Python
    await pyodide.runPythonAsync(`
import sys
import io
import ast

class TestFailure(Exception):
    pass

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

        # 2. Setup test context helpers
        test_env = dict(self.namespace)
        
        def check(condition, message="Test condition failed."):
            if not condition:
                raise TestFailure(str(message))

        def stdout_contains(text):
            return str(text) in stdout

        def stdout_equals(text):
            return stdout.strip() == str(text).strip()

        def var(name):
            return self.namespace.get(name, None)

        def has_var(name):
            return name in self.namespace

        def calls(func_name, *args):
            recorded = self.namespace.get("__recorded_calls__", {})
            return recorded.get(func_name, []) == list(args)

        test_env['check'] = check
        test_env['stdout_contains'] = stdout_contains
        test_env['stdout_equals'] = stdout_equals
        test_env['var'] = var
        test_env['has_var'] = has_var
        test_env['calls'] = calls
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
