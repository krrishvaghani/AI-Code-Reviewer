import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
  python:     'python',
  javascript: 'javascript',
  java:       'java',
  cpp:        'cpp',
};

const DEFAULT_CODE = {
  python: `def calculate_average(numbers):
    total = 0
    for n in numbers:
        total = total + n
    average = total / len(numbers)
    return average

result = calculate_average([10, 20, 30, 40, 50])
print("Average:", result)
`,
  javascript: `function calculateAverage(numbers) {
  var total = 0;
  for (var i = 0; i < numbers.length; i++) {
    total = total + numbers[i];
  }
  var average = total / numbers.length;
  return average;
}

const result = calculateAverage([10, 20, 30, 40, 50]);
console.log("Average:", result);
`,
  java: `public class Main {
    public static double calculateAverage(int[] numbers) {
        int total = 0;
        for (int i = 0; i < numbers.length; i++) {
            total = total + numbers[i];
        }
        double average = total / numbers.length;
        return average;
    }

    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40, 50};
        System.out.println("Average: " + calculateAverage(numbers));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>

double calculateAverage(std::vector<int> numbers) {
    int total = 0;
    for (int i = 0; i < numbers.size(); i++) {
        total = total + numbers[i];
    }
    double average = total / numbers.size();
    return average;
}

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    std::cout << "Average: " << calculateAverage(numbers) << std::endl;
    return 0;
}
`,
};

export default function CodeEditor({ language, code, onChange }) {
  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {language === 'cpp' ? 'main.cpp' : language === 'java' ? 'Main.java' : language === 'javascript' ? 'index.js' : 'main.py'}
        </span>
        <button
          onClick={() => onChange(DEFAULT_CODE[language])}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Load sample code"
        >
          Load Sample
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 rounded-b-lg overflow-hidden border border-t-0 border-gray-700">
        <Editor
          height="100%"
          language={LANGUAGE_MAP[language]}
          value={code !== undefined ? code : DEFAULT_CODE[language]}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
