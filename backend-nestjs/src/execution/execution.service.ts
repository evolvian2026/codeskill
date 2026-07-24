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
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      execFile(
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
    });
  }



  private compareArrays(actual: any, expected: any) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    if (actual.length !== expected.length) return false;
    const sortedA = [...actual].sort((a, b) => a - b);
    const sortedE = [...expected].sort((a, b) => a - b);
    return JSON.stringify(sortedA) === JSON.stringify(sortedE);
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

    for (const tc of testCases) {
      let nums = [];
      let target = 0;
      if (typeof tc.input === 'string') {
        const parts = tc.input.split('\\n');
        try {
          nums = JSON.parse(parts[0]);
        } catch (e) {}
        try {
          target = JSON.parse(parts[1]);
        } catch (e) {}
      } else if (tc.input && tc.input.nums) {
        nums = tc.input.nums;
        target = tc.input.target;
      }

      const tmpDir = path.join(os.tmpdir(), `cs_js_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      this.writeProjectFiles(tmpDir, runOpts.config);

      const script = `
const __logs = [];
const __print = process.stdout.write.bind(process.stdout);
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

const __input = { nums: ${JSON.stringify(nums)}, target: ${JSON.stringify(target)} };
let __result;
try {
  __result = twoSum(__input.nums, __input.target);
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
          const passed = this.compareArrays(parsed.__result, tc.expected);
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

    for (const tc of testCases) {
      let nums = [];
      let target = 0;
      if (typeof tc.input === 'string') {
        const parts = tc.input.split('\\n');
        try {
          nums = JSON.parse(parts[0]);
        } catch (e) {}
        try {
          target = JSON.parse(parts[1]);
        } catch (e) {}
      } else if (tc.input && tc.input.nums) {
        nums = tc.input.nums;
        target = tc.input.target;
      }

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

__input = { "nums": ${JSON.stringify(nums)}, "target": ${JSON.stringify(target)} }
try:
    __result = twoSum(__input["nums"], __input["target"])
    if __result is None:
        __result = None
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
          const passed = this.compareArrays(parsed.__result, tc.expected);
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
    const tmpDir = path.join(os.tmpdir(), `cs_cpp_${uuidv4()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    this.writeProjectFiles(tmpDir, runOpts.config);

    for (const tc of testCases) {
      let nums = [];
      let target = 0;
      if (typeof tc.input === 'string') {
        const parts = tc.input.split('\\n');
        try {
          nums = JSON.parse(parts[0]);
        } catch (e) {}
        try {
          target = JSON.parse(parts[1]);
        } catch (e) {}
      } else if (tc.input && tc.input.nums) {
        nums = tc.input.nums;
        target = tc.input.target;
      }

      const inputNums = JSON.stringify(nums);
      const inputTarget = target;

      const fullCode = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

${code}

int main() {
    vector<int> nums = {${nums.join(',')}};
    int target = ${inputTarget};
    
    vector<int> result;
    
    #ifdef __cpp_if_consteval
    result = twoSum(nums, target);
    #else
    result = twoSum(nums, target);
    #endif

    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        if (i > 0) cout << ",";
        cout << result[i];
    }
    cout << "]" << endl;
    return 0;
}
`;

      const srcPath = path.join(tmpDir, `solution_${tc.id}.cpp`);
      const binPath = path.join(tmpDir, `solution_${tc.id}`);
      fs.writeFileSync(srcPath, fullCode);

      try {
        try {
          execSync(`g++ -std=c++17 -o "${binPath}" "${srcPath}" 2>&1`, {
            timeout: runOpts.timeout,
          });
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
        );
        const stdout = output.stdout.trim();

        let parsed;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          results.push({
            id: tc.id,
            passed: false,
            output: stdout || 'No output',
            expected: JSON.stringify(tc.expected),
            error: 'Could not parse output',
            logs: [],
          });
          continue;
        }

        const passed = this.compareArrays(parsed, tc.expected);
        results.push({
          id: tc.id,
          passed,
          output: JSON.stringify(parsed),
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
      }
    }

    this.cleanup(tmpDir);
    return results;
  }

  private async runJava(code: string, testCases: any[], runOpts: any) {
    const results = [];

    for (const tc of testCases) {
      let nums = [];
      let target = 0;
      if (typeof tc.input === 'string') {
        const parts = tc.input.split('\\n');
        try {
          nums = JSON.parse(parts[0]);
        } catch (e) {}
        try {
          target = JSON.parse(parts[1]);
        } catch (e) {}
      } else if (tc.input && tc.input.nums) {
        nums = tc.input.nums;
        target = tc.input.target;
      }

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

    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] nums = {${nums.join(',')}};
        int target = ${target};
        int[] result = sol.twoSum(nums, target);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < result.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(result[i]);
        }
        sb.append("]");
        System.out.println(sb.toString());
    }
}
`;
      }

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
          ['Solution'],
          runOpts.timeout,
          tmpDir,
        );
        const stdout = output.stdout.trim();

        let parsed;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          results.push({
            id: tc.id,
            passed: false,
            output: stdout || 'No output',
            expected: JSON.stringify(tc.expected),
            error: 'Could not parse output',
            logs: [],
          });
          continue;
        }

        const passed = this.compareArrays(parsed, tc.expected);
        results.push({
          id: tc.id,
          passed,
          output: JSON.stringify(parsed),
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
