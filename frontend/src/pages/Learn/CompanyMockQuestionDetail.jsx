import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Code2, PlayCircle } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const languageTemplates = {
  JavaScript: `function solve(input) {
  // Parse input
  const data = input.trim().split(' ');

  // Write your logic here
  return '';
}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf8');
console.log(solve(input));
`,
  Python: `def solve(input_data: str) -> str:
    # Parse input
    data = input_data.strip().split()

    # Write your logic here
    return ""

if __name__ == "__main__":
    import sys
    print(solve(sys.stdin.read()))
`,
  Java: `import java.io.*;
import java.util.*;

public class Main {
    static String solve(String input) {
        // Parse input

        // Write your logic here
        return "";
    }

    public static void main(String[] args) throws Exception {
        String input = new String(System.in.readAllBytes());
        System.out.print(solve(input));
    }
}
`,
  'C++': `#include <bits/stdc++.h>
using namespace std;

string solve(const string& input) {
    // Parse input

    // Write your logic here
    return "";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    cout << solve(input);
    return 0;
}
`,
};

const mockQuestionBank = {
  'gq-1': {
    title: 'Two Sum',
    difficulty: 'Easy',
    statement:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    inputFormat: 'First line: n, second line: n space-separated integers, third line: target',
    outputFormat: 'Two indices separated by space',
  },
  'gq-2': {
    title: 'Merge Intervals',
    difficulty: 'Medium',
    statement: 'Given a collection of intervals, merge all overlapping intervals.',
    inputFormat: 'First line: n, next n lines: start end',
    outputFormat: 'Merged intervals line by line',
  },
  'gq-3': {
    title: 'LRU Cache',
    difficulty: 'Hard',
    statement: 'Design and implement an LRU cache with O(1) operations.',
    inputFormat: 'Sequence of operations and values',
    outputFormat: 'Values for each get operation',
  },
};

const normalizeQuestionData = (questionId) => {
  if (mockQuestionBank[questionId]) {
    return mockQuestionBank[questionId];
  }

  return {
    title: `Mock Question ${questionId}`,
    difficulty: 'Medium',
    statement:
      'This is a mock coding prompt. Implement an efficient solution and explain your approach in comments.',
    inputFormat: 'Custom test input',
    outputFormat: 'Program output',
  };
};

export default function CompanyMockQuestionDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { company, questionId } = useParams();
  const decodedCompany = decodeURIComponent(company || 'Company');
  const sourceParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const companyFromQuery = sourceParams.get('company') || decodedCompany;
  const sourcePath = sourceParams.get('from');
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/company-based');
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');

  const question = useMemo(() => normalizeQuestionData(questionId || ''), [questionId]);

  const [code, setCode] = useState(languageTemplates[selectedLanguage]);

  const onLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(languageTemplates[language]);
  };

  const backPath = isDashboardContext
    ? sourcePath === '/dashboard/practice/company-based'
      ? sourcePath
      : '/dashboard/practice/company-based'
    : '/learn/interview-questions/company';

  const backQuery = new URLSearchParams();
  if (companyFromQuery) {
    backQuery.set('company', companyFromQuery);
  }
  if (sourcePath && isDashboardContext) {
    backQuery.set('from', sourcePath);
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <section className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(`${backPath}?${backQuery.toString()}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to company preparation
        </button>

        <div className="rounded-[1.75rem] border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8fb7] dark:text-[#78b3de]">
                {decodedCompany} Mock Round
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                {question.title}
              </h1>
              <p className="mt-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">{question.statement}</p>
            </div>
            <span className="rounded-full bg-[#dbf1ff] px-3 py-1 text-xs font-semibold text-[#2d7fe8] dark:bg-[#0d366f] dark:text-[#8fd9ff]">
              {question.difficulty}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#86c4ff]/35 bg-[#f5fbff] p-4 dark:border-[#6fbfff]/25 dark:bg-[#0a2f6f]/55">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8fb7] dark:text-[#78b3de]">Input Format</p>
              <p className="mt-2 text-sm text-[#0d2a57] dark:text-[#8fd9ff]">{question.inputFormat}</p>
            </div>
            <div className="rounded-2xl border border-[#86c4ff]/35 bg-[#f5fbff] p-4 dark:border-[#6fbfff]/25 dark:bg-[#0a2f6f]/55">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f8fb7] dark:text-[#78b3de]">Output Format</p>
              <p className="mt-2 text-sm text-[#0d2a57] dark:text-[#8fd9ff]">{question.outputFormat}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] dark:text-[#8fd9ff]">
              <Code2 className="h-4 w-4" />
              Mock Code Editor
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="language" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f8fb7] dark:text-[#78b3de]">
                Language
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(event) => onLanguageChange(event.target.value)}
                className="rounded-lg border border-[#86c4ff]/45 bg-[#f5fbff] px-3 py-2 text-sm font-medium text-[#0d2a57] focus:border-[#2d7fe8] focus:outline-none dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff]"
              >
                {Object.keys(languageTemplates).map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            className="h-[24rem] w-full resize-y rounded-xl border border-[#86c4ff]/45 bg-[#f5fbff] p-4 font-mono text-sm leading-6 text-[#0d2a57] outline-none focus:border-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff]"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
              This is a mock coding environment. Run/submit actions are placeholders for now.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#86c4ff]/45 bg-[#dbf1ff] px-4 py-2 text-sm font-semibold text-[#2d7fe8] transition hover:bg-[#d2ecff] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff] dark:hover:bg-[#10417f]"
            >
              <PlayCircle className="h-4 w-4" />
              Run Mock
            </button>
          </div>
        </div>
      </section>
    </UserSidebarLayout>
  );
}
