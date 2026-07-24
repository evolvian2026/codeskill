import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { execFile, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

const TIMEOUT_MS = 5000;

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  async executeCode(
    language: string,
    code: string,
    testCases: any[],
    config: any = {},
  ) {
    let currentTimeout = TIMEOUT_MS;
    if (config.executionProfiles && config.executionProfiles[language]) {
      currentTimeout =
        TIMEOUT_MS *
        (config.executionProfiles[language].timeLimitMultiplier || 1);
    }
    const runOpts = { timeout: currentTimeout, config };

    switch (language) {
      case 'javascript':
      case 'js':
      case 'node':
        return await this.runJavaScript(code, testCases, runOpts);
      case 'python':
      case 'py':
      case 'python3':
        return await this.runPython(code, testCases, runOpts);
      case 'cpp':
      case 'c++':
        return await this.runCpp(code, testCases, runOpts);
      case 'java':
        return await this.runJava(code, testCases, runOpts);
      default:
        throw new BadRequestException(`Language ${language} is not supported`);
    }
  }

  private writeProjectFiles(tmpDir: string, config: any) {
    if (
      config.isMultiFile &&
      config.projectFiles &&
      Array.isArray(config.projectFiles)
    ) {
      for (const file of config.projectFiles) {
        const filePath = path.join(tmpDir, file.filename);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content);
      }
    }
  }

  private execInChild(
    command: string,
    args: string[],
    timeout: number,
    cwd?: string,
    inputStr?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const child = execFile(
        command,
        args,
        { timeout, maxBuffer: 1024 * 1024, cwd },
        (error: any, stdout, stderr) => {
          if (error) {
            if (error.killed) {
              return reject(new Error('Time Limit Exceeded (5s)'));
            } else {
              const errMsg = stderr ? stderr.substring(0, 500) : error.message;
              return reject(new Error(errMsg));
            }
          }
          resolve({ stdout, stderr });
        },
      );

      if (inputStr && child.stdin) {
        child.stdin.write(inputStr + '\n');
        child.stdin.end();
      }
    });
  }

  private extractFunctionName(code: string, language: string): string {
    if (language === 'js' || language === 'javascript' || language === 'node') {
      const match = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) || code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/);
      if (match) return match[1];
    }
    if (language === 'py' || language === 'python' || language === 'python3') {
      const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match) return match[1];
    }
    if (language === 'cpp' || language === 'c++') {
      const match = code.match(/(?:int|string|vector|bool|double|float|long|void)\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match && match[1] !== 'main') return match[1];
    }
    if (language === 'java') {
      const match = code.match(/(?:public|private|protected)?\s*(?:static)?\s*(?:int|String|boolean|double|float|long|int\[\]|void)\s+([a-zA-Z0-9_]+)\s*\(/);
      if (match && match[1] !== 'main') return match[1];
    }
    return 'twoSum';
  }

  private parseInputArgs(input: any): any[] {
    if (input === undefined || input === null) return [];
    if (typeof input === 'object' && !Array.isArray(input)) {
      return Object.values(input);
    }
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return [parsed];
        if (typeof parsed === 'object') return Object.values(parsed);
        return [parsed];
      } catch {
        const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map(l => {
          try { return JSON.parse(l); } catch { return l; }
        });
      }
    }
    return [input];
  }

  private getInputString(input: any): string {
    if (typeof input === 'string') return input;
    if (typeof input === 'object') return Object.values(input).join('\n');
    return String(input || '');
  }

  private compareOutput(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      const sortedA = [...actual].sort((a, b) => (a > b ? 1 : -1));
      const sortedE = [...expected].sort((a, b) => (a > b ? 1 : -1));
      return JSON.stringify(sortedA) === JSON.stringify(sortedE);
    }
    return String(actual).trim() === String(expected).trim();
  }

  private cleanup(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (err) {
      this.logger.error(`Failed to cleanup directory ${dir}:`, err);
    }
  }

  private async runJavaScript(code: string, testCases: any[], runOpts: any) {
    const results = [];
    const fnName = this.extractFunctionName(code, 'js');

    for (const tc of testCases) {
      const args = this.parseInputArgs(tc.input);
      const inputStr = this.getInputString(tc.input);

      const tmpDir = path.join(os.tmpdir(), `cs_js_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      this.writeProjectFiles(tmpDir, runOpts.config);

      const script = `
const __logs = [];
const __origLog = console.log.bind(console);

const __mockConsole = {
  log: (...a) => __logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')),
  warn: (...a) => __logs.push('[warn] ' + a.map(x => String(x)).join(' ')),
  error: (...a) => __logs.push('[error] ' + a.map(x => String(x)).join(' ')),
};
console.log = __mockConsole.log;
console.warn = __mockConsole.warn;
console.error = __mockConsole.error;

${code}

let __fn = typeof ${fnName} === 'function' ? ${fnName} : null;
if (!__fn && typeof globalThis['${fnName}'] === 'function') __fn = globalThis['${fnName}'];
if (!__fn) {
  const funcs = Object.keys(globalThis).filter(k => typeof globalThis[k] === 'function' && !k.startsWith('__'));
  if (funcs.length > 0) __fn = globalThis[funcs[funcs.length - 1]];
}

if (typeof __fn !== 'function') {
  __origLog(JSON.stringify({ __error: "Function '${fnName}' is not defined", __logs }));
  process.exit(0);
}

let __result;
try {
  const __args = ${JSON.stringify(args)};
  __result = __fn(...__args);
} catch(e) {
  __origLog(JSON.stringify({ __error: e.message, __logs }));
  process.exit(0);
}
__origLog(JSON.stringify({ __result, __logs }));
`;

      const filePath = path.join(tmpDir, 'solution.js');
      fs.writeFileSync(filePath, script);

      try {
        const output = await this.execInChild(
          'node',
          ['solution.js'],
          runOpts.timeout,
          tmpDir,
          inputStr,
        );
        const parsed = JSON.parse(output.stdout.trim());

        if (parsed.__error) {
          results.push({
            id: tc.id,
            passed: false,
            output: 'Error',
            expected: JSON.stringify(tc.expected),
            error: parsed.__error,
            logs: parsed.__logs || [],
          });
        } else {
          const passed = this.compareOutput(parsed.__result, tc.expected);
          results.push({
            id: tc.id,
            passed,
            output: JSON.stringify(parsed.__result),
            expected: JSON.stringify(tc.expected),
            logs: parsed.__logs || [],
          });
        }
      } catch (err: any) {
        results.push({
          id: tc.id,
          passed: false,
          output: 'Error',
          expected: JSON.stringify(tc.expected),
          error: err.message,
          logs: [],
        });
      } finally {
        this.cleanup(tmpDir);
      }
    }

    return results;
  }

  private async runPython(code: string, testCases: any[], runOpts: any) {
    const results = [];
    const fnName = this.extractFunctionName(code, 'py');

    for (const tc of testCases) {
      const args = this.parseInputArgs(tc.input);
      const inputStr = this.getInputString(tc.input);

      const tmpDir = path.join(os.tmpdir(), `cs_py_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      this.writeProjectFiles(tmpDir, runOpts.config);

      const script = `
import json, sys, io

__logs = []
__orig_print = print

def print(*args, **kwargs):
    output = io.StringIO()
    __orig_print(*args, file=output, **kwargs)
    __logs.append(output.getvalue().rstrip('\\n'))

${code}

__args = ${JSON.stringify(args)}

try:
    __fn = globals().get('${fnName}')
    if not __fn:
        user_funcs = [v for k, v in globals().items() if callable(v) and not k.startswith('__')]
        if user_funcs:
            __fn = user_funcs[-1]

    if not callable(__fn):
        raise Exception("Function '${fnName}' is not defined")

    __result = __fn(*__args)
    __orig_print(json.dumps({"__result": __result, "__logs": __logs}))
except Exception as e:
    __orig_print(json.dumps({"__error": str(e), "__logs": __logs}))
`;

      const filePath = path.join(tmpDir, 'solution.py');
      fs.writeFileSync(filePath, script);

      try {
        const output = await this.execInChild(
          'python3',
          ['solution.py'],
          runOpts.timeout,
          tmpDir,
          inputStr,
        );
        const parsed = JSON.parse(output.stdout.trim());

        if (parsed.__error) {
          results.push({
            id: tc.id,
            passed: false,
            output: 'Error',
            expected: JSON.stringify(tc.expected),
            error: parsed.__error,
            logs: parsed.__logs || [],
          });
        } else {
          const passed = this.compareOutput(parsed.__result, tc.expected);
          results.push({
            id: tc.id,
            passed,
            output: JSON.stringify(parsed.__result),
            expected: JSON.stringify(tc.expected),
            logs: parsed.__logs || [],
          });
        }
      } catch (err: any) {
        results.push({
          id: tc.id,
          passed: false,
          output: 'Error',
          expected: JSON.stringify(tc.expected),
          error: err.message,
          logs: [],
        });
      } finally {
        this.cleanup(tmpDir);
      }
    }

    return results;
  }

  private async runCpp(code: string, testCases: any[], runOpts: any) {
    const results = [];
    const fnName = this.extractFunctionName(code, 'cpp');

    for (const tc of testCases) {
      const args = this.parseInputArgs(tc.input);
      const inputStr = this.getInputString(tc.input);

      const tmpDir = path.join(os.tmpdir(), `cs_cpp_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      this.writeProjectFiles(tmpDir, runOpts.config);

      const script = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <set>
#include <map>
#include <cmath>
using namespace std;

${code}

int main() {
    return 0;
}
`;

      const filePath = path.join(tmpDir, 'solution.cpp');
      fs.writeFileSync(filePath, script);

      try {
        try {
          execSync(
            `g++ -O2 "${filePath}" -o "${tmpDir}/solution_${tc.id}" 2>&1`,
            { timeout: runOpts.timeout },
          );
        } catch (compileErr: any) {
          const msg = compileErr.stdout
            ? compileErr.stdout.toString()
            : compileErr.message;
          results.push({
            id: tc.id,
            passed: false,
            output: 'Compilation Error',
            expected: JSON.stringify(tc.expected),
            error: msg.substring(0, 500),
            logs: [],
          });
          continue;
        }

        const output = await this.execInChild(
          'sh',
          ['-c', `./solution_${tc.id}`],
          runOpts.timeout,
          tmpDir,
          inputStr,
        );
        const stdout = output.stdout.trim();

        results.push({
          id: tc.id,
          passed: true,
          output: stdout || 'Success',
          expected: JSON.stringify(tc.expected),
          logs: [],
        });
      } catch (err: any) {
        results.push({
          id: tc.id,
          passed: false,
          output: 'Error',
          expected: JSON.stringify(tc.expected),
          error: err.message,
          logs: [],
        });
      } finally {
        this.cleanup(tmpDir);
      }
    }

    return results;
  }

  private async runJava(code: string, testCases: any[], runOpts: any) {
    const results = [];
    const fnName = this.extractFunctionName(code, 'java');

    for (const tc of testCases) {
      const args = this.parseInputArgs(tc.input);
      const inputStr = this.getInputString(tc.input);

      const tmpDir = path.join(os.tmpdir(), `cs_java_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      this.writeProjectFiles(tmpDir, runOpts.config);

      const importMatches = code.match(/import\s+[a-zA-Z0-9_.*]+;/g) || [];
      const customImports = Array.from(new Set(importMatches.map(s => s.trim()))).join('\n');
      let cleanCode = code.replace(/import\s+[a-zA-Z0-9_.*]+;/g, '').trim();

      let fullCode = '';
      if (cleanCode.includes('class Solution') || cleanCode.includes('class Main')) {
        cleanCode = cleanCode.replace(/public\s+class\s+Main/, 'public class Solution').replace(/class\s+Main/, 'class Solution');
        fullCode = `
import java.util.*;
import java.io.*;
${customImports}

${cleanCode}
`;
      } else {
        fullCode = `
import java.util.*;
import java.io.*;
${customImports}

public class Solution {
    ${cleanCode}
}
`;
      }

      const mainRunner = `
class __TestRunner {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            java.lang.reflect.Method targetMethod = null;
            for (java.lang.reflect.Method m : Solution.class.getDeclaredMethods()) {
                if (m.getName().equals("${fnName}")) {
                    targetMethod = m;
                    break;
                }
            }
            if (targetMethod == null) {
                for (java.lang.reflect.Method m : Solution.class.getDeclaredMethods()) {
                    if (!m.getName().equals("main")) {
                        targetMethod = m;
                        break;
                    }
                }
            }
            if (targetMethod == null) {
                System.out.println("Error: No solution method found");
                return;
            }
            targetMethod.setAccessible(true);
            
            Object[] argValues = new Object[] { ${args.map(a => JSON.stringify(a)).join(', ')} };
            Class<?>[] paramTypes = targetMethod.getParameterTypes();
            Object[] finalArgs = new Object[paramTypes.length];
            for (int i = 0; i < paramTypes.length; i++) {
                if (i < argValues.length) {
                    finalArgs[i] = castArg(argValues[i], paramTypes[i]);
                }
            }
            
            Object res = targetMethod.invoke(sol, finalArgs);
            if (res instanceof int[]) {
                System.out.println(Arrays.toString((int[])res));
            } else if (res instanceof String[]) {
                System.out.println(Arrays.toString((String[])res));
            } else {
                System.out.println(String.valueOf(res));
            }
        } catch (Exception e) {
            System.out.println("Error: " + e.getCause());
        }
    }

    private static Object castArg(Object val, Class<?> type) {
        if (val == null) return null;
        if (type == String.class) return String.valueOf(val);
        if (type == int.class || type == Integer.class) return ((Number)val).intValue();
        if (type == double.class || type == Double.class) return ((Number)val).doubleValue();
        if (type == boolean.class || type == Boolean.class) return Boolean.parseBoolean(String.valueOf(val));
        return val;
    }
}
`;
      fullCode += '\n' + mainRunner;

      const srcPath = path.join(tmpDir, 'Solution.java');
      fs.writeFileSync(srcPath, fullCode);

      try {
        try {
          execSync(`javac "${srcPath}" 2>&1`, { timeout: runOpts.timeout });
        } catch (compileErr: any) {
          const msg = compileErr.stdout
            ? compileErr.stdout.toString()
            : compileErr.message;
          results.push({
            id: tc.id,
            passed: false,
            output: 'Compilation Error',
            expected: JSON.stringify(tc.expected),
            error: msg.substring(0, 500),
            logs: [],
          });
          continue;
        }

        const output = await this.execInChild(
          'java',
          ['__TestRunner'],
          runOpts.timeout,
          tmpDir,
          inputStr,
        );
        const stdout = output.stdout.trim();
        let parsed;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          parsed = stdout;
        }

        const passed = this.compareOutput(parsed, tc.expected);
        results.push({
          id: tc.id,
          passed,
          output: typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed),
          expected: JSON.stringify(tc.expected),
          logs: [],
        });
      } catch (err: any) {
        results.push({
          id: tc.id,
          passed: false,
          output: 'Error',
          expected: JSON.stringify(tc.expected),
          error: err.message,
          logs: [],
        });
      } finally {
        this.cleanup(tmpDir);
      }
    }

    return results;
  }
}
