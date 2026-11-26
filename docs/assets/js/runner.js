/**
 * DataDojo Main-Thread Runner Supervisor
 * Manages worker lifecycle, timeouts, lazy initialization, and restarts.
 */

import { CONFIG } from './config.js';

class DojoRunnerSupervisor {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.isWakingUp = false;
    this.wakeUpListeners = new Set();
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
  }

  onWakeUp(listener) {
    this.wakeUpListeners.add(listener);
    return () => this.wakeUpListeners.delete(listener);
  }

  _notifyWakeUp(status) {
    for (const listener of this.wakeUpListeners) {
      try {
        listener(status);
      } catch (e) {
        console.error('Error in wakeUpListener', e);
      }
    }
  }

  ensureWorker() {
    if (this.worker) return this.worker;

    this.isWakingUp = true;
    this._notifyWakeUp('waking');

    // Use relative URL to support sub-path deployment
    const workerUrl = new URL('./worker.js', import.meta.url);
    this.worker = new Worker(workerUrl);

    this.worker.onmessage = (event) => {
      const { id, type, success, stdout, stderr, finalValue, error, rawError, testFailure, passed } = event.data || {};

      if (type === 'ready') {
        this.isReady = true;
        this.isWakingUp = false;
        this._notifyWakeUp('ready');
      }

      if (id && this.pendingRequests.has(id)) {
        const { resolve, timer } = this.pendingRequests.get(id);
        clearTimeout(timer);
        this.pendingRequests.delete(id);

        resolve({
          success,
          passed,
          stdout: stdout || '',
          stderr: stderr || '',
          finalValue: finalValue || null,
          error: error || null,
          rawError: rawError || null,
          testFailure: testFailure || null,
        });
      }
    };

    this.worker.onerror = (err) => {
      console.error('Dojo Worker Error:', err);
      this.isWakingUp = false;
      this._notifyWakeUp('error');
    };

    // Trigger Pyodide init
    this.worker.postMessage({ type: 'init' });
    return this.worker;
  }

  _terminateAndRestart() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
    this.isWakingUp = false;

    // Fail all pending requests with timeout
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.resolve({
        success: false,
        rawError: 'Error: Execution timed out after ' + CONFIG.EXECUTION_TIMEOUT_MS + 'ms',
      });
    }
    this.pendingRequests.clear();

    // Spawn a fresh worker
    this.ensureWorker();
  }

  _sendRequest(payload, timeoutMs = CONFIG.EXECUTION_TIMEOUT_MS) {
    this.ensureWorker();
    const id = `req_${++this.requestIdCounter}_${Date.now()}`;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        this._terminateAndRestart();
        resolve({
          success: false,
          rawError: 'Error: Execution timed out after ' + timeoutMs + 'ms',
        });
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, timer });
      this.worker.postMessage({ ...payload, id });
    });
  }

  async run(code, options = {}) {
    return this._sendRequest({
      type: 'run',
      code: code || '',
      packages: options.packages || null,
    }, options.timeoutMs || CONFIG.EXECUTION_TIMEOUT_MS);
  }

  async check(code, tests, options = {}) {
    return this._sendRequest({
      type: 'check',
      code: code || '',
      tests: tests || '',
      packages: options.packages || null,
    }, options.timeoutMs || CONFIG.EXECUTION_TIMEOUT_MS);
  }

  async reset() {
    return this._sendRequest({
      type: 'reset',
    }, 5000);
  }
}

export const runner = new DojoRunnerSupervisor();
