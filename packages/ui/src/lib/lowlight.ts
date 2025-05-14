import { all, createLowlight } from 'lowlight';
export const lowlight = createLowlight(all);
const lowlightLanguages = lowlight.listLanguages();

interface CodeHighlightNode {
  text: string;
  classes: string[];
}

interface CodeHighlight {
  language?: string;
  nodes: CodeHighlightNode[];
}

interface CodeLanguage {
  name: string;
  code: string;
}

export const languages: CodeLanguage[] = [
  { name: 'Arduino', code: 'arduino' },
  { name: 'Bash', code: 'bash' },
  { name: 'C', code: 'c' },
  { name: 'C++', code: 'cpp' },
  { name: 'C#', code: 'csharp' },
  { name: 'CSS', code: 'css' },
  { name: 'Diff', code: 'diff' },
  { name: 'Go', code: 'go' },
  { name: 'GraphQL', code: 'graphql' },
  { name: 'INI', code: 'ini' },
  { name: 'Java', code: 'java' },
  { name: 'JavaScript', code: 'javascript' },
  { name: 'JSON', code: 'json' },
  { name: 'Kotlin', code: 'kotlin' },
  { name: 'LESS', code: 'less' },
  { name: 'Lua', code: 'lua' },
  { name: 'Makefile', code: 'makefile' },
  { name: 'Markdown', code: 'markdown' },
  { name: 'Objective-C', code: 'objectivec' },
  { name: 'Perl', code: 'perl' },
  { name: 'PHP', code: 'php' },
  { name: 'PHP Template', code: 'php-template' },
  { name: 'Plain Text', code: 'plaintext' },
  { name: 'Python', code: 'python' },
  { name: 'Python REPL', code: 'python-repl' },
  { name: 'R', code: 'r' },
  { name: 'Ruby', code: 'ruby' },
  { name: 'Rust', code: 'rust' },
  { name: 'SCSS', code: 'scss' },
  { name: 'Shell', code: 'shell' },
  { name: 'SQL', code: 'sql' },
  { name: 'Swift', code: 'swift' },
  { name: 'TypeScript', code: 'typescript' },
  { name: 'VB.NET', code: 'vbnet' },
  { name: 'WebAssembly', code: 'wasm' },
  { name: 'XML', code: 'xml' },
  { name: 'YAML', code: 'yaml' },
  { name: '1C', code: '1c' },
  { name: 'ABNF', code: 'abnf' },
  { name: 'Access Log', code: 'accesslog' },
  { name: 'ActionScript', code: 'actionscript' },
  { name: 'Ada', code: 'ada' },
  { name: 'AngelScript', code: 'angelscript' },
  { name: 'Apache', code: 'apache' },
  { name: 'AppleScript', code: 'applescript' },
  { name: 'Arcade', code: 'arcade' },
  { name: 'ARM Assembly', code: 'armasm' },
  { name: 'AsciiDoc', code: 'asciidoc' },
  { name: 'AspectJ', code: 'aspectj' },
  { name: 'AutoHotkey', code: 'autohotkey' },
  { name: 'AutoIt', code: 'autoit' },
  { name: 'AVR Assembly', code: 'avrasm' },
  { name: 'AWK', code: 'awk' },
  { name: 'Axapta', code: 'axapta' },
  { name: 'Basic', code: 'basic' },
  { name: 'BNF', code: 'bnf' },
  { name: 'Brainfuck', code: 'brainfuck' },
  { name: 'Cal', code: 'cal' },
  { name: "Cap'n Proto", code: 'capnproto' },
  { name: 'Ceylon', code: 'ceylon' },
  { name: 'Clean', code: 'clean' },
  { name: 'Clojure', code: 'clojure' },
  { name: 'Clojure REPL', code: 'clojure-repl' },
  { name: 'CMake', code: 'cmake' },
  { name: 'CoffeeScript', code: 'coffeescript' },
  { name: 'Coq', code: 'coq' },
  { name: 'Csound', code: 'cos' },
  { name: 'crmsh', code: 'crmsh' },
  { name: 'Crystal', code: 'crystal' },
  { name: 'CSP', code: 'csp' },
  { name: 'D', code: 'd' },
  { name: 'Dart', code: 'dart' },
  { name: 'Delphi', code: 'delphi' },
  { name: 'Django', code: 'django' },
  { name: 'DNS Zone', code: 'dns' },
  { name: 'Dockerfile', code: 'dockerfile' },
  { name: 'DOS Batch', code: 'dos' },
  { name: 'DSConfig', code: 'dsconfig' },
  { name: 'DTS', code: 'dts' },
  { name: 'Dust', code: 'dust' },
  { name: 'EBNF', code: 'ebnf' },
  { name: 'Elixir', code: 'elixir' },
  { name: 'Elm', code: 'elm' },
  { name: 'ERB', code: 'erb' },
  { name: 'Erlang', code: 'erlang' },
  { name: 'Erlang REPL', code: 'erlang-repl' },
  { name: 'Excel', code: 'excel' },
  { name: 'FIX', code: 'fix' },
  { name: 'Flix', code: 'flix' },
  { name: 'Fortran', code: 'fortran' },
  { name: 'F#', code: 'fsharp' },
  { name: 'GAMS', code: 'gams' },
  { name: 'Gauss', code: 'gauss' },
  { name: 'G-code', code: 'gcode' },
  { name: 'Gherkin', code: 'gherkin' },
  { name: 'GLSL', code: 'glsl' },
  { name: 'GML', code: 'gml' },
  { name: 'Golo', code: 'golo' },
  { name: 'Gradle', code: 'gradle' },
  { name: 'Groovy', code: 'groovy' },
  { name: 'HAML', code: 'haml' },
  { name: 'Handlebars', code: 'handlebars' },
  { name: 'Haskell', code: 'haskell' },
  { name: 'Haxe', code: 'haxe' },
  { name: 'HSP', code: 'hsp' },
  { name: 'HTTP', code: 'http' },
  { name: 'Hy', code: 'hy' },
  { name: 'Inform 7', code: 'inform7' },
  { name: 'IRPF90', code: 'irpf90' },
  { name: 'ISBL', code: 'isbl' },
  { name: 'JBoss CLI', code: 'jboss-cli' },
  { name: 'Julia', code: 'julia' },
  { name: 'Julia REPL', code: 'julia-repl' },
  { name: 'Lasso', code: 'lasso' },
  { name: 'LaTeX', code: 'latex' },
  { name: 'LDIF', code: 'ldif' },
  { name: 'Leaf', code: 'leaf' },
  { name: 'Lisp', code: 'lisp' },
  { name: 'Livecode Server', code: 'livecodeserver' },
  { name: 'Livescript', code: 'livescript' },
  { name: 'LLVM', code: 'llvm' },
  { name: 'LSL', code: 'lsl' },
  { name: 'Mathematica', code: 'mathematica' },
  { name: 'MATLAB', code: 'matlab' },
  { name: 'Maxima', code: 'maxima' },
  { name: 'MEL', code: 'mel' },
  { name: 'Mercury', code: 'mercury' },
  { name: 'MIPS Assembly', code: 'mipsasm' },
  { name: 'Mizar', code: 'mizar' },
  { name: 'Mojolicious', code: 'mojolicious' },
  { name: 'Monkey', code: 'monkey' },
  { name: 'Moonscript', code: 'moonscript' },
  { name: 'N1QL', code: 'n1ql' },
  { name: 'NestedText', code: 'nestedtext' },
  { name: 'Nginx', code: 'nginx' },
  { name: 'Nim', code: 'nim' },
  { name: 'Nix', code: 'nix' },
  { name: 'Node REPL', code: 'node-repl' },
  { name: 'NSIS', code: 'nsis' },
  { name: 'OCaml', code: 'ocaml' },
  { name: 'OpenSCAD', code: 'openscad' },
  { name: 'Oxygene', code: 'oxygene' },
  { name: 'Parser3', code: 'parser3' },
  { name: 'PF', code: 'pf' },
  { name: 'PostgreSQL', code: 'pgsql' },
  { name: 'Pony', code: 'pony' },
  { name: 'PowerShell', code: 'powershell' },
  { name: 'Processing', code: 'processing' },
  { name: 'Profile', code: 'profile' },
  { name: 'Prolog', code: 'prolog' },
  { name: 'Properties', code: 'properties' },
  { name: 'Protocol Buffers', code: 'protobuf' },
  { name: 'Puppet', code: 'puppet' },
  { name: 'PureBasic', code: 'purebasic' },
  { name: 'Q', code: 'q' },
  { name: 'QML', code: 'qml' },
  { name: 'ReasonML', code: 'reasonml' },
  { name: 'RIB', code: 'rib' },
  { name: 'Roboconf', code: 'roboconf' },
  { name: 'RouterOS', code: 'routeros' },
  { name: 'RSL', code: 'rsl' },
  { name: 'Rules Language', code: 'ruleslanguage' },
  { name: 'SAS', code: 'sas' },
  { name: 'Scala', code: 'scala' },
  { name: 'Scheme', code: 'scheme' },
  { name: 'Scilab', code: 'scilab' },
  { name: 'Smali', code: 'smali' },
  { name: 'Smalltalk', code: 'smalltalk' },
  { name: 'SML', code: 'sml' },
  { name: 'SQF', code: 'sqf' },
  { name: 'Stan', code: 'stan' },
  { name: 'Stata', code: 'stata' },
  { name: 'STEP-21', code: 'step21' },
  { name: 'Stylus', code: 'stylus' },
  { name: 'Subunit', code: 'subunit' },
  { name: 'TaggerScript', code: 'taggerscript' },
  { name: 'TAP', code: 'tap' },
  { name: 'Tcl', code: 'tcl' },
  { name: 'Thrift', code: 'thrift' },
  { name: 'TP', code: 'tp' },
  { name: 'Twig', code: 'twig' },
  { name: 'Vala', code: 'vala' },
  { name: 'VBScript', code: 'vbscript' },
  { name: 'VBScript (HTML)', code: 'vbscript-html' },
  { name: 'Verilog', code: 'verilog' },
  { name: 'VHDL', code: 'vhdl' },
  { name: 'Vim Script', code: 'vim' },
  { name: 'Wren', code: 'wren' },
  { name: 'x86 Assembly', code: 'x86asm' },
  { name: 'XL', code: 'xl' },
  { name: 'XQuery', code: 'xquery' },
  { name: 'Zephir', code: 'zephir' },
];

const parseNodes = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: any[],
  className: string[] = []
): CodeHighlightNode[] => {
  return nodes
    .map((node) => {
      const classes = [
        ...className,
        ...(node.properties ? node.properties.className : []),
      ];

      if (node.children) {
        return parseNodes(node.children, classes);
      }

      return {
        text: node.value,
        classes,
      };
    })
    .flat();
};

export const highlightCode = (
  code: string,
  language?: string
): CodeHighlight | null => {
  try {
    const result =
      language && lowlightLanguages.includes(language)
        ? lowlight.highlight(language, code)
        : lowlight.highlightAuto(code);

    const nodes = parseNodes(result.children);
    return {
      language: result.data?.language,
      nodes,
    };
  } catch {
    return null;
  }
};
