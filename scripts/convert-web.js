const fs = require('fs');
const path = require('path');

function convertIllustration() {
  const src = fs.readFileSync(
    path.join(__dirname, '../../misery-index/src/components/Illustration.tsx'),
    'utf8'
  );

  const body = src
    .replace(/^[\s\S]*?switch \(type\) \{/, '')
    .replace(/\n  \}\n\}$/, '');

  const header = `import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

function parseSize(className = 'w-24 h-24') {
  const w = className.match(/w-(\\d+)/);
  const h = className.match(/h-(\\d+)/);
  return { width: w ? Number(w[1]) * 4 : 96, height: h ? Number(h[1]) * 4 : 96 };
}

export default function Illustration({ type, className = 'w-24 h-24' }: { type: string; className?: string }) {
  const { width, height } = parseSize(className);
  switch (type) {
`;

  let converted = body
    .replace(/<svg viewBox="0 0 100 100" className=\{className\} fill="none" stroke="currentColor" strokeWidth="2.5">/g,
      '<Svg width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>')
    .replace(/<circle /g, '<Circle ')
    .replace(/<\/circle>/g, '')
    .replace(/<path /g, '<Path ')
    .replace(/<line /g, '<Line ')
    .replace(/<rect /g, '<Rect ')
    .replace(/<ellipse /g, '<Ellipse ')
    .replace(/<polygon /g, '<Polygon ')
    .replace(/<text /g, '<SvgText ')
    .replace(/<\/text>/g, '</SvgText>')
    .replace(/<\/svg>/g, '</Svg>');

  fs.writeFileSync(
    path.join(__dirname, '../components/Illustration.tsx'),
    header + converted + '\n  }\n}\n'
  );
}

function convertComponent(name, extraReplacements = []) {
  const srcPath = path.join(__dirname, `../misery-index/src/components/${name}.tsx`);
  if (!fs.existsSync(srcPath)) return;
  let src = fs.readFileSync(srcPath, 'utf8');

  const replacements = [
    ["from 'react'", "from 'react-native'"],
    ["from 'react';", "from 'react-native';"],
    ["from '../types'", "from '@/types'"],
    ["from '../data/cards'", "from '@/data/cards'"],
    ["from './CardItem'", "from '@/components/CardItem'"],
    ["from './Illustration'", "from '@/components/Illustration'"],
    ["from 'lucide-react'", "from 'lucide-react-native'"],
    ["from 'motion'", "// motion removed"],
    ['className={`', 'className={`'],
    ['onClick=', 'onPress='],
    ['<div', '<View'],
    ['</div>', '</View>'],
    ['<button', '<Pressable'],
    ['</button>', '</Pressable>'],
    ['<input', '<TextInput'],
    ['<header', '<View'],
    ['</header>', '</View>'],
    ['<footer', '<View'],
    ['</footer>', '</View>'],
    ['<h1', '<Text'],
    ['</h1>', '</Text>'],
    ['<h2', '<Text'],
    ['</h2>', '</Text>'],
    ['<h3', '<Text'],
    ['</h3>', '</Text>'],
    ['<h4', '<Text'],
    ['</h4>', '</Text>'],
    ['<p', '<Text'],
    ['</p>', '</Text>'],
    ['<label', '<Text'],
    ['</label>', '</Text>'],
    ['<span', '<Text'],
    ['</span>', '</Text>'],
    ['type="button"', ''],
    ['type="text"', ''],
    ['navigator.clipboard.writeText', 'require("expo-clipboard").setStringAsync'],
    ...extraReplacements,
  ];

  for (const [from, to] of replacements) {
    src = src.split(from).join(to);
  }

  if (!src.includes("from 'react-native'")) {
    src = "import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';\n" + src;
  }

  fs.writeFileSync(path.join(__dirname, `components/${name}.tsx`), src);
}

convertIllustration();
console.log('Illustration converted');
