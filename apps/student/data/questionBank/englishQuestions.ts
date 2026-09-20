import { QuestionItem } from './types';

// 英语题库（示例，可扩充）
export const englishQuestions: QuestionItem[] = [
  // 听读专项
  {
    id: 'en-lis-001',
    subject: 'english',
    type: 'listening_choice',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['Unit 1 Great people'],
    tags: ['听读专项'],
    content: {
      stem: 'Listen and choose the correct answer.',
      options: ['A. Library', 'B. Canteen', 'C. Playground', 'D. Classroom'],
      audioUrl: 'https://file-examples.com/storage/fe2c2f79a73c9a3e46562d1d/2017/11/file_example_MP3_700KB.mp3',
      transcript: 'Welcome to our school library. You can find many interesting books here.',
      examRules: {
        allowSeek: false,
        maxReplays: 2,
        subtitlesAllowed: false,
      },
    },
    result: { correctAnswer: 'A', explanation: '音频定位到 library。' },
    cognitiveState: 'GAP',
  },
  // 听力多小题（组题）
  {
    id: 'en-lis-icefest-001',
    subject: 'english',
    type: 'listening_choice',
    difficulty: 2,
    category: 'typical',
    knowledgePoints: ['Listening-Scene-IceFestival'],
    tags: ['听读专项', '多小题听力'],
    content: {
      stem: '听材料，回答小题。',
      audioUrl: 'https://your.cdn/audio/ice-festival.mp3',
      transcript: `Hello, Kate. I'm here at the Harbin Snow and Ice Festival. This is the coldest place I have ever been to. Look! Here are two small snowmen and a big snowman. The two small ones are like a lion and a pig, and the big one is a bear. You must see! I'm always wearing a scarf. Yeah, it's very important because there is strong wind here. Like many other people, I also tried riding bikes on the ice. It is very exciting. If you come here, don't miss out on this. You can also see lots of girls taking pictures everywhere. It seems that their cameras are quite expensive. I'm here for around two hours, and I feel a little tired. I need to find a warm area and take a break.`,
      subQuestions: [
        {
          question: 'What does the big snowman look like?',
          options: ['A. A lion.', 'B. A bear.', 'C. A pig.'],
          answer: 'B',
        },
        {
          question: 'How is the weather?',
          options: ['A. Snowy.', 'B. Cloudy.', 'C. Windy.'],
          answer: 'C',
        },
        {
          question: 'How does the speaker like riding bikes on the ice?',
          options: ['A. Exciting.', 'B. Tiring.', 'C. Dangerous.'],
          answer: 'A',
        },
        {
          question: 'What are the girls doing?',
          options: ['A. Taking pictures.', 'B. Fixing their cameras.', 'C. Making a snowman.'],
          answer: 'A',
        },
        {
          question: 'What will the speaker do next?',
          options: ['A. Have a rest.', 'B. Clean the area.', 'C. Drink some water.'],
          answer: 'A',
        },
      ],
    },
    result: { correctAnswer: ['B', 'C', 'A', 'A', 'A'], explanation: '听力原文对应逐句可定位答案。' },
    cognitiveState: 'GAP',
  },
  {
    id: 'en-lis-002',
    subject: 'english',
    type: 'listening_blank',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['Unit2-Listening'],
    tags: ['听读专项'],
    content: {
      stem: 'Listen and fill in the blank: The boy is ____ a book.',
      options: ['reading', 'writing', 'drawing', 'closing'],
      audioUrl: 'https://file-examples.com/storage/fe2c2f79a73c9a3e46562d1d/2017/11/file_example_MP3_700KB.mp3',
      transcript: 'In the quiet room, the boy is reading a book happily.',
      examRules: {
        allowSeek: true,
        maxReplays: null,
        subtitlesAllowed: true,
      },
    },
    result: { correctAnswer: 'reading', explanation: '音频中出现 reading。' },
    cognitiveState: 'FADED',
  },
  {
    id: 'en-lis-fill-001',
    subject: 'english',
    type: 'listening_blank',
    difficulty: 2,
    category: 'typical',
    knowledgePoints: ['Listening-Fill-Completion'],
    tags: ['听读专项', '听力填空'],
    content: {
      stem: '本题你将听到一段独白，读两遍。请根据独白内容，用所听到的信息完成下列各题。(每空不超过三个单词。)',
      audioUrl: 'https://your.cdn/audio/beach-trip.mp3', // TODO: 替换为真实音频地址
      transcript: `Dear Alice,
How is it going? We will have a trip to the beach next Saturday. One of my classmates organized it. I really want to take the trip, but I have some problems. You know, I have to look after my younger brother on the weekend. If I take the trip, nobody will look after him. Mom may not be happy. I need 20 dollars for the trip, but I don’t have enough money and I don’t want to ask Mom for it either. And if I go to the beach, I also need a beach umbrella, but I don’t have one. What should I do? Can you give me some advice?
Yours,
Helen.`,
      subQuestions: [
        {
          question: 'Helen wants to take the trip to the beach ______.',
          options: [],
          answer: 'next Saturday',
        },
        {
          question: 'One of Helen’s ______ organized the trip.',
          options: [],
          answer: 'classmates',
        },
        {
          question: 'Helen usually looks after her ______ on the weekend.',
          options: [],
          answer: 'younger brother',
        },
        {
          question: 'Helen has to pay ______ dollars for the trip.',
          options: [],
          answer: '20',
        },
        {
          question: 'Helen needs a beach ______ for the trip.',
          options: [],
          answer: 'umbrella',
        },
      ],
    },
    result: {
      correctAnswer: ['next Saturday', 'classmates', 'younger brother', '20', 'umbrella'],
      explanation: '听力原文对应逐句可定位答案。',
    },
    cognitiveState: 'GAP',
  },
  // 拼写语法
  {
    id: 'en-spell-001',
    subject: 'english',
    type: 'spelling',
    difficulty: 2,
    category: 'synchronous',
    knowledgePoints: ['Spelling-Basic'],
    tags: ['拼写语法'],
    content: {
      stem: '拼写下列单词： “图书馆” 英文为 _____.',
      options: ['library'],
    },
    result: { correctAnswer: 'library', explanation: '首字母小写，双写 r。' },
    cognitiveState: 'GAP',
  },
  {
    id: 'en-gram-001',
    subject: 'english',
    type: 'grammar_choice',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['时态-一般现在时'],
    tags: ['拼写语法'],
    content: {
      stem: 'She ____ to school by bike every day.',
      options: ['A. go', 'B. goes', 'C. went', 'D. going'],
    },
    result: { correctAnswer: 'B', explanation: '主语三单，一般现在时动词需加 -s。' },
    cognitiveState: 'MASTERED',
  },
  // 词句运用
  {
    id: 'en-word-001',
    subject: 'english',
    type: 'word_choice',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['词汇-日常活动'],
    tags: ['词句运用'],
    content: {
      stem: '选择最佳选项完成句子：I usually ____ breakfast at 7:00.',
      options: ['have', 'has', 'having', 'had'],
    },
    result: { correctAnswer: 'have', explanation: '主语 I 用原形 have。' },
    cognitiveState: 'GAP',
  },
  {
    id: 'en-cloze-001',
    subject: 'english',
    type: 'cloze_choice',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['完形填空-基本'],
    tags: ['词句运用'],
    content: {
      stem: '选词填空：Tom ____ to the park yesterday and ____ many friends.',
      options: ['go; see', 'went; saw', 'goes; sees', 'going; seeing'],
    },
    result: { correctAnswer: 'went; saw', explanation: '一般过去时态 went / saw 搭配 yesterday。' },
    cognitiveState: 'FADED',
  },
  // 阅读专项
  {
    id: 'en-read-001',
    subject: 'english',
    type: 'reading_comp',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['Reading-Detail'],
    tags: ['阅读专项'],
    content: {
      stem: 'Read the passage and choose the best answer.',
      options: ['A', 'B', 'C', 'D'],
    },
    result: { correctAnswer: 'C', explanation: '细节定位在第二段。' },
    cognitiveState: 'FADED',
  },
  {
    id: 'en-read-002',
    subject: 'english',
    type: 'reading_comp',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['Reading-Narrative-Festival'],
    tags: ['阅读理解', '节日'],
    content: {
      stem: `If you are really interested in music festivals, then you have probably heard of the Music Festival. It takes place every September on the Isle of Wight, the UK. As it is at the end of summer, people think it's their last chance to go to a festival and have fun before going back to boring work.
The dream begins as soon as you start traveling to the island. In order to get to the campsites of the festival, you have to take the ferry (渡轮). The ferry is full of happy festival lovers who are ready to take part in the fantastic music party. After you arrive at the campsite, you can put your tent up. There people talk with each other openly. They are not as cold as those you meet in your everyday life.
The festival lasts for four days. During that time you forget all your worries and problems, just like living in a dream. And it is really hard for you to come back to “reality” after that.
It seems that it is this kind of music event that makes people gather together. It gives people a real sense of unity. I took part in the festival with my friends the year before last. It was so exciting and we all lost ourselves in the beautiful music. The song We Are Family sung by Sister Sledge was my favorite. I'm really looking forward to joining in it for a second time.`,
      subQuestions: [
        {
          question: 'When is the Music Festival held?',
          options: ['In September.', 'At the end of the year.', 'In August.', 'At the beginning of summer.'],
          answer: 'A',
        },
        {
          question: 'Where do people enjoy the music party at the festival?',
          options: ['On the island.', 'On the ferry.', 'In the hotel.', 'On the sea.'],
          answer: 'A',
        },
        {
          question: 'What does the writer think of the people at the festival?',
          options: ['Crazy.', 'Friendly.', 'Cold.', 'Patient.'],
          answer: 'B',
        },
        {
          question: 'Why does the writer say being at the festival is a dream?',
          options: [
            'Because people can enjoy music there.',
            'Because people can get away from work.',
            'Because people can play music there.',
            'Because people can forget all their problems and worries.',
          ],
          answer: 'D',
        },
      ],
    },
    result: {
      correctAnswer: ['A', 'A', 'B', 'D'],
      explanation:
        '音乐节在九月举办，地点在岛上；现场氛围友好；在四天里能忘掉烦恼宛如梦境，对应四个小题的答案为 A/A/B/D。',
    },
    cognitiveState: 'GAP',
  },
  {
    id: 'en-dialog-001',
    subject: 'english',
    type: 'dialogue_fill',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['对话-补全'],
    tags: ['阅读专项'],
    content: {
      stem: '选择合适的句子补全对话。',
      options: ['Yes, I am.', 'No, thanks.', 'See you.', 'I like it.'],
    },
    result: { correctAnswer: 'Yes, I am.', explanation: '上下文问句为 “Are you ready?”' },
    cognitiveState: 'GAP',
  },
  // 翻译与改错
  {
    id: 'en-trans-001',
    subject: 'english',
    type: 'translation',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['Translation-Basic'],
    tags: ['翻译和改错'],
    content: {
      stem: '翻译：请把这本书借给我两天。',
    },
    result: { correctAnswer: 'Please lend me this book for two days.', explanation: 'lend sb. sth. 结构。' },
    cognitiveState: 'GAP',
  },
  {
    id: 'en-corr-001',
    subject: 'english',
    type: 'correction',
    difficulty: 4,
    category: 'finale',
    knowledgePoints: ['Error-Correction'],
    tags: ['翻译和改错'],
    content: {
      stem: '改错：He enjoy play basketball after school.',
    },
    result: { correctAnswer: 'He enjoys playing basketball after school.', explanation: '主谓一致 enjoys；enjoy doing。' },
    cognitiveState: 'GAP',
  },
];
