export type BoardLineStyle = 'title' | 'normal' | 'formula' | 'emphasis' | 'answer';



export interface BoardLine {

  text: string;

  style?: BoardLineStyle;

}



export interface TutorBeat {

  id: string;

  startTime: number;

  endTime: number;

  speech: string;

  boardLines: BoardLine[];

}



export const TUTOR_SESSION_DURATION = 30;



export const TUTOR_TEACHING_SCRIPT: TutorBeat[] = [

  {

    id: 'b1',

    startTime: 0,

    endTime: 5,

    speech: '这是一道粉刷墙面的应用题，我们先从图里把数据读出来。',

    boardLines: [

      { text: '【读题】粉刷墙面', style: 'title' },

      { text: '墙面：长 8m，宽 6m', style: 'normal' },

      { text: '窗户：长 2m，高 1.2m', style: 'normal' },

    ],

  },

  {

    id: 'b2',

    startTime: 5,

    endTime: 10,

    speech: '粉刷面积要减去窗户，先算一面墙可刷的面积。',

    boardLines: [

      { text: '【单面墙面积】', style: 'title' },

      { text: 'S墙 = 8 × 6 = 48（m²）', style: 'formula' },

      { text: 'S窗 = 2 × 1.2 = 2.4（m²）', style: 'formula' },

      { text: 'S刷 = 48 − 2.4 = 45.6（m²）', style: 'emphasis' },

    ],

  },

  {

    id: 'b3',

    startTime: 10,

    endTime: 16,

    speech: '40 面墙都要刷，先算总粉刷面积，再算涂料用量。',

    boardLines: [

      { text: '【40 面墙】', style: 'title' },

      { text: 'S总 = 45.6 × 40 = 1824（m²）', style: 'formula' },

      { text: '涂料：0.4 kg/m²', style: 'normal' },

      { text: 'M = 1824 × 0.4 = 729.6（kg）', style: 'emphasis' },

    ],

  },

  {

    id: 'b4',

    startTime: 16,

    endTime: 22,

    speech: '每千克涂料 10 元，用总用量乘以单价就得到总费用。',

    boardLines: [

      { text: '【求总费用】', style: 'title' },

      { text: '单价：10 元/kg', style: 'normal' },

      { text: '费用 = 729.6 × 10', style: 'formula' },

      { text: '     = 7296（元）', style: 'emphasis' },

    ],

  },

  {

    id: 'b5',

    startTime: 22,

    endTime: 30,

    speech: '所以粉刷 40 面墙（除去窗户）共需 7296 元，你学会了吗？',

    boardLines: [

      { text: '【答】共需 7296 元', style: 'answer' },

    ],

  },

];



export const TUTOR_REPLY_BEAT: TutorBeat = {

  id: 'reply',

  startTime: 0,

  endTime: 5,

  speech: '窗户不需要粉刷，所以要从墙面总面积里减去窗户面积哦。',

  boardLines: [

    { text: '补充说明：', style: 'title' },

    { text: '可刷面积 = 墙面面积 − 窗户面积', style: 'emphasis' },

    { text: 'S刷 = S墙 − S窗', style: 'formula' },

  ],

};



export interface ResolvedBoardLine extends BoardLine {

  id: string;

  revealed: number;

  isComplete: boolean;

}



export function resolveBoardAtTime(

  beats: TutorBeat[],

  time: number,

): { lines: ResolvedBoardLine[]; activeBeat: TutorBeat | null; speechProgress: number } {

  const lines: ResolvedBoardLine[] = [];

  let activeBeat: TutorBeat | null = null;

  let speechProgress = 0;



  for (const beat of beats) {

    if (time >= beat.endTime) {

      beat.boardLines.forEach((line, i) => {

        lines.push({

          ...line,

          id: `${beat.id}-${i}`,

          revealed: line.text.length,

          isComplete: true,

        });

      });

      continue;

    }



    if (time >= beat.startTime) {

      activeBeat = beat;

      const duration = beat.endTime - beat.startTime;

      speechProgress = duration > 0 ? (time - beat.startTime) / duration : 1;

      const totalChars = beat.boardLines.reduce((sum, l) => sum + l.text.length, 0);

      let budget = Math.floor(speechProgress * totalChars);



      beat.boardLines.forEach((line, i) => {

        const id = `${beat.id}-${i}`;

        if (budget >= line.text.length) {

          lines.push({ ...line, id, revealed: line.text.length, isComplete: true });

          budget -= line.text.length;

        } else if (budget > 0) {

          lines.push({ ...line, id, revealed: budget, isComplete: false });

          budget = 0;

        } else {

          lines.push({ ...line, id, revealed: 0, isComplete: false });

        }

      });

      break;

    }



    break;

  }



  return { lines, activeBeat, speechProgress };

}



export function getSpeechAtTime(beats: TutorBeat[], time: number): { text: string; progress: number } | null {

  for (const beat of beats) {

    if (time >= beat.startTime && time < beat.endTime) {

      const duration = beat.endTime - beat.startTime;

      const progress = duration > 0 ? (time - beat.startTime) / duration : 1;

      const chars = Math.max(1, Math.floor(beat.speech.length * progress));

      return { text: beat.speech.slice(0, chars), progress };

    }

  }

  return null;

}


