export interface Flashcard {
  id: string;
  title: string;
  language: 'zh' | 'nl';
  pronunciation?: string;
}

const pairs = [
  ['水', 'shuǐ', 'water'], ['你好', 'nǐ hǎo', 'hallo'],
  ['谢谢', 'xièxie', 'dank je'], ['书', 'shū', 'boek'],
  ['朋友', 'péngyou', 'vriend'], ['家', 'jiā', 'thuis'],
  ['太阳', 'tàiyáng', 'zon'], ['月亮', 'yuèliang', 'maan'],
  ['蓝色', 'lánsè', 'blauw'], ['学习', 'xuéxí', 'leren'],
];

export const FLASHCARDS: Flashcard[] = pairs.flatMap(([chinese, pronunciation, dutch], index) => [
  { id: `${index}-zh`, title: chinese, language: 'zh', pronunciation },
  { id: `${index}-nl`, title: dutch, language: 'nl' },
]);
