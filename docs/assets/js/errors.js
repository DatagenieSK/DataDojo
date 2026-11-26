/**
 * Friendly Python Error Translator
 * Pure function: translate(pythonErrorText) -> { title, explain, tryThis, line, raw }
 */

export function translate(rawError) {
  const raw = String(rawError || '').trim();
  if (!raw) {
    return {
      title: 'Something went wrong',
      explain: 'An unexpected issue occurred while running your code.',
      tryThis: 'Check your code and try running it again.',
      line: null,
      raw: '',
    };
  }

  // Look for line number in traceback (e.g., 'File "<string>", line 3' or 'line 3')
  let line = null;
  const lineMatch = raw.match(/line (\d+)/i);
  if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
  }

  const linePrefix = line ? `On line ${line}: ` : '';

  // Timeout error
  if (/timed?\s*out|timeout/i.test(raw)) {
    return {
      title: 'Time Limit Reached',
      explain: 'Your code ran for too long.',
      tryThis: 'Check for a loop that never ends (like a `while` loop that never stops).',
      line,
      raw,
    };
  }

  // input() unsupported error
  if (/input\(\) is not supported|INPUT_NOT_SUPPORTED/i.test(raw)) {
    return {
      title: 'Asking Questions with input()',
      explain: "This dojo can't ask you questions with `input()` yet.",
      tryThis: 'Try setting a variable instead, like `name = "Asha"`.',
      line,
      raw,
    };
  }

  // Unterminated string / EOF error
  if (/unterminated string literal|EOL while scanning string literal|unexpected EOF while parsing/i.test(raw)) {
    return {
      title: 'Unfinished Quote or Bracket',
      explain: `${linePrefix}Python reached the end of a line or file while looking for a matching quote or bracket.`,
      tryThis: 'Make sure every opening quote " or bracket ( has a matching closing pair.',
      line,
      raw,
    };
  }

  // IndentationError
  if (/IndentationError/i.test(raw)) {
    return {
      title: 'Indentation Issue',
      explain: `${linePrefix}Python is confused by the spaces at the start of this line.`,
      tryThis: 'Make sure all lines inside the same block line up with the same amount of spacing.',
      line,
      raw,
    };
  }

  // SyntaxError
  if (/SyntaxError/i.test(raw)) {
    return {
      title: 'Syntax Puzzle',
      explain: `${linePrefix}Python did not understand the way this line is written.`,
      tryThis: 'Check for missing punctuation, unmatched quotes, or missing parentheses.',
      line,
      raw,
    };
  }

  // NameError
  if (/NameError/i.test(raw)) {
    const nameMatch = raw.match(/name '([^']+)' is not defined/);
    const missingName = nameMatch ? nameMatch[1] : 'that name';
    return {
      title: 'Name Not Found',
      explain: `${linePrefix}Python doesn't know what "${missingName}" is yet.`,
      tryThis: `Did you spell it the same way everywhere, or forget to create the variable first?`,
      line,
      raw,
    };
  }

  // TypeError
  if (/TypeError/i.test(raw)) {
    return {
      title: 'Type Mismatch',
      explain: `${linePrefix}Python tried to combine or operate on two types that do not fit together (like adding text to a number).`,
      tryThis: 'Check the types of your variables or convert them before combining.',
      line,
      raw,
    };
  }

  // ValueError
  if (/ValueError/i.test(raw)) {
    return {
      title: 'Unexpected Value',
      explain: `${linePrefix}Python received the right type of data, but the content inside wasn't suitable.`,
      tryThis: 'Check the values passed into your function to ensure they are valid.',
      line,
      raw,
    };
  }

  // ZeroDivisionError
  if (/ZeroDivisionError/i.test(raw)) {
    return {
      title: 'Cannot Divide by Zero',
      explain: `${linePrefix}You cannot divide any number by zero in math or Python.`,
      tryThis: 'Check your math calculations to ensure the bottom number is not zero.',
      line,
      raw,
    };
  }

  // IndexError
  if (/IndexError/i.test(raw)) {
    return {
      title: 'Position Out of Range',
      explain: `${linePrefix}You asked for an item at a position that does not exist in the list.`,
      tryThis: 'Remember that lists start counting at 0. Check the length of your list.',
      line,
      raw,
    };
  }

  // KeyError
  if (/KeyError/i.test(raw)) {
    const keyMatch = raw.match(/KeyError:\s*(.+)/);
    const keyName = keyMatch ? keyMatch[1] : 'that key';
    return {
      title: 'Dictionary Key Missing',
      explain: `${linePrefix}Python could not find ${keyName} inside the dictionary.`,
      tryThis: 'Check the spelling of the key, or use `.get()` to provide a safe default.',
      line,
      raw,
    };
  }

  // AttributeError
  if (/AttributeError/i.test(raw)) {
    const attrMatch = raw.match(/has no attribute '([^']+)'/);
    const attrName = attrMatch ? attrMatch[1] : 'that action';
    return {
      title: 'Unknown Attribute or Action',
      explain: `${linePrefix}This object does not have the property or method "${attrName}".`,
      tryThis: 'Check the spelling or verify that this type of object supports that method.',
      line,
      raw,
    };
  }

  // ModuleNotFoundError
  if (/ModuleNotFoundError/i.test(raw)) {
    const modMatch = raw.match(/No module named '([^']+)'/);
    const modName = modMatch ? modMatch[1] : 'this module';
    return {
      title: 'Module Not Found',
      explain: `${linePrefix}Python could not find the library or module "${modName}".`,
      tryThis: 'Check the spelling of the module name.',
      line,
      raw,
    };
  }

  // Fallback
  return {
    title: 'Python Notice',
    explain: `${linePrefix}Something went wrong while running your code.`,
    tryThis: 'Read the technical details below to locate the issue, or compare with the lesson examples.',
    line,
    raw,
  };
}
