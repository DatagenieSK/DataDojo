import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../docs/assets/js/errors.js';

test('translates TimeoutError', () => {
  const result = translate('Error: Execution timed out after 10000ms');
  assert.equal(result.title, 'Time Limit Reached');
  assert.match(result.tryThis, /loop that never ends/i);
});

test('translates Unterminated String / EOF', () => {
  const result = translate('File "<string>", line 2\n  print("Hello\nSyntaxError: unterminated string literal');
  assert.equal(result.title, 'Unfinished Quote or Bracket');
  assert.equal(result.line, 2);
  assert.match(result.tryThis, /matching/i);
});

test('translates IndentationError', () => {
  const result = translate('File "<string>", line 4\n    x = 1\nIndentationError: unexpected indent');
  assert.equal(result.title, 'Indentation Issue');
  assert.equal(result.line, 4);
});

test('translates SyntaxError', () => {
  const result = translate('File "<string>", line 1\n  print "hello"\nSyntaxError: Missing parentheses');
  assert.equal(result.title, 'Syntax Puzzle');
  assert.equal(result.line, 1);
});

test('translates NameError with variable name', () => {
  const result = translate("File \"<string>\", line 3\nNameError: name 'nmae' is not defined");
  assert.equal(result.title, 'Name Not Found');
  assert.match(result.explain, /nmae/);
  assert.equal(result.line, 3);
});

test('translates TypeError', () => {
  const result = translate("TypeError: can only concatenate str (not 'int') to str");
  assert.equal(result.title, 'Type Mismatch');
});

test('translates ValueError', () => {
  const result = translate("ValueError: invalid literal for int() with base 10: 'abc'");
  assert.equal(result.title, 'Unexpected Value');
});

test('translates ZeroDivisionError', () => {
  const result = translate('ZeroDivisionError: division by zero');
  assert.equal(result.title, 'Cannot Divide by Zero');
});

test('translates IndexError', () => {
  const result = translate('IndexError: list index out of range');
  assert.equal(result.title, 'Position Out of Range');
});

test('translates KeyError', () => {
  const result = translate("KeyError: 'username'");
  assert.equal(result.title, 'Dictionary Key Missing');
  assert.match(result.explain, /username/);
});

test('translates AttributeError', () => {
  const result = translate("AttributeError: 'str' object has no attribute 'append'");
  assert.equal(result.title, 'Unknown Attribute or Action');
  assert.match(result.explain, /append/);
});

test('translates ModuleNotFoundError', () => {
  const result = translate("ModuleNotFoundError: No module named 'nonexistent'");
  assert.equal(result.title, 'Module Not Found');
  assert.match(result.explain, /nonexistent/);
});

test('falls back gracefully on unknown errors', () => {
  const result = translate('CustomSystemError: hardware interrupted');
  assert.equal(result.title, 'Python Notice');
  assert.match(result.raw, /CustomSystemError/);
});
