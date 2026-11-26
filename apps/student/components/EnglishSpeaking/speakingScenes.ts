import { buildSpeakingPrompts, type SpeakingPrompt } from './speakingFollowUps';

export type SpeakingScene = {
  title: string;
  en: string;
  description: string;
  words: string[];
  prompts: SpeakingPrompt[];
};

const scene = (title: string, en: string, description: string, words: string[], question: string, translation: string, answer: string, answerTranslation: string, followUp?: SpeakingPrompt): SpeakingScene => ({
  title, en, description, words,
  prompts: buildSpeakingPrompts(en, [question, translation, answer, answerTranslation], followUp),
});

export const speakingScenes: SpeakingScene[][] = [
  [
    scene('课后运动', 'After-school sports', '聊聊放学后的运动和伙伴。', ['basketball', 'classmate', 'play'], 'Who do you play sports with after school?', '放学后你和谁一起运动？', 'I play basketball with my classmates after school.', '我放学后和同学们一起打篮球。', [
      'That sounds fun! Playing with friends is a great way to relax. Where do you usually play, at school or in a park?',
      '听起来很有趣！和朋友一起打球很放松。你们通常在学校还是公园打球？',
      'We usually play on the school playground.', '我们通常在学校操场上打球。',
    ]),
    scene('我的课表', 'My timetable', '介绍喜欢的课程和上课安排。', ['subject', 'lesson', 'Monday'], 'What is your favorite subject?', '你最喜欢什么学科？', 'My favorite subject is English.', '我最喜欢的学科是英语。'),
    scene('认识新同学', 'Meeting classmates', '介绍自己，认识一位新朋友。', ['name', 'class', 'friend'], 'Hi! What is your name?', '你好！你叫什么名字？', 'My name is Li Hua. Nice to meet you.', '我叫李华，很高兴认识你。'),
    scene('午餐时间', 'School lunch', '聊聊食堂里的午餐和口味。', ['lunch', 'rice', 'vegetables'], 'What do you usually eat for lunch?', '你午餐通常吃什么？', 'I usually eat rice and vegetables.', '我通常吃米饭和蔬菜。'),
    scene('社团招新', 'Joining a club', '选择社团，介绍自己的兴趣。', ['club', 'join', 'music'], 'Which school club would you like to join?', '你想加入哪个学校社团？', 'I would like to join the music club.', '我想加入音乐社团。'),
    scene('借阅图书', 'At the library', '向图书管理员借一本书。', ['library', 'borrow', 'book'], 'What kind of book would you like to borrow?', '你想借哪一类书？', 'I would like to borrow a science book.', '我想借一本科学书。'),
    scene('校园问路', 'Finding a classroom', '练习询问教室和校园位置。', ['classroom', 'floor', 'left'], 'Where is your classroom?', '你的教室在哪里？', 'My classroom is on the second floor.', '我的教室在二楼。'),
  ],
  [
    scene('音乐时光', 'Music time', '聊聊喜欢的音乐和乐器。', ['guitar', 'music', 'practice'], 'What instrument do you like playing?', '你喜欢演奏什么乐器？', 'I like playing the guitar.', '我喜欢弹吉他。'),
    scene('分享好书', 'Sharing books', '推荐一本喜欢的书。', ['read', 'story', 'favorite'], 'What kind of books do you enjoy?', '你喜欢什么类型的书？', 'I enjoy reading adventure stories.', '我喜欢读冒险故事。'),
    scene('电影之夜', 'Movie night', '介绍喜欢的电影类型。', ['movie', 'funny', 'watch'], 'What kind of movies do you like?', '你喜欢什么类型的电影？', 'I like funny movies.', '我喜欢有趣的电影。'),
    scene('画一幅画', 'Drawing pictures', '谈谈画画的内容和灵感。', ['draw', 'color', 'picture'], 'What do you like drawing?', '你喜欢画什么？', 'I like drawing animals.', '我喜欢画动物。'),
    scene('运动爱好', 'Favorite sports', '介绍喜欢的运动项目。', ['swim', 'sport', 'healthy'], 'What sport do you enjoy most?', '你最喜欢什么运动？', 'I enjoy swimming most.', '我最喜欢游泳。'),
    scene('我的收藏', 'My collection', '介绍自己珍藏的小物件。', ['collect', 'stamp', 'special'], 'What do you like collecting?', '你喜欢收藏什么？', 'I like collecting stamps.', '我喜欢集邮。'),
    scene('照顾宠物', 'My pet', '分享宠物的习惯和日常。', ['pet', 'feed', 'dog'], 'Do you have a pet?', '你有宠物吗？', 'Yes, I have a small dog.', '是的，我有一只小狗。'),
  ],
  [
    scene('公园散步', 'A walk in the park', '安排一场周末公园之行。', ['park', 'walk', 'weekend'], 'Where will you go this weekend?', '你这个周末要去哪里？', 'I will go to the park with my family.', '我要和家人一起去公园。'),
    scene('朋友邀约', 'Inviting a friend', '邀请朋友一起参加活动。', ['invite', 'Saturday', 'together'], 'What would you like to do with your friend?', '你想和朋友一起做什么？', 'I would like to ride bikes together.', '我想一起骑自行车。'),
    scene('参观博物馆', 'At the museum', '聊聊想看的展览。', ['museum', 'history', 'visit'], 'What would you like to see at the museum?', '你想在博物馆看什么？', 'I would like to see the dinosaur exhibition.', '我想看恐龙展览。'),
    scene('野餐准备', 'Planning a picnic', '准备野餐的食物和物品。', ['picnic', 'bring', 'sandwich'], 'What will you bring to the picnic?', '你会带什么去野餐？', 'I will bring sandwiches and juice.', '我会带三明治和果汁。'),
    scene('雨天安排', 'A rainy day', '为下雨的周末安排室内活动。', ['rain', 'indoors', 'plan'], 'What will you do if it rains?', '如果下雨你会做什么？', 'I will read a book at home.', '我会在家看书。'),
    scene('探望家人', 'Visiting family', '安排探望亲人的时间。', ['grandparents', 'visit', 'Sunday'], 'Who will you visit on Sunday?', '你星期天会去看望谁？', 'I will visit my grandparents.', '我会去看望爷爷奶奶。'),
    scene('周末回顾', 'My last weekend', '分享上个周末的经历。', ['yesterday', 'played', 'fun'], 'What did you do last weekend?', '上周末你做了什么？', 'I played football with my friends.', '我和朋友们一起踢了足球。'),
  ],
  [
    scene('咖啡馆点单', 'At a café', '选择饮品，表达自己的口味。', ['menu', 'order', 'drink'], 'What would you like to drink?', '你想喝什么？', 'I would like a cup of hot chocolate.', '我想要一杯热巧克力。'),
    scene('餐厅用餐', 'At a restaurant', '看菜单，点一份喜欢的食物。', ['menu', 'noodles', 'please'], 'What would you like to eat?', '你想吃什么？', 'I would like some noodles, please.', '我想要一些面条，谢谢。'),
    scene('超市购物', 'At the supermarket', '选购物品并询问价格。', ['buy', 'fruit', 'price'], 'What do you need to buy?', '你需要买什么？', 'I need to buy some apples.', '我需要买一些苹果。'),
    scene('公交出行', 'Taking a bus', '询问公交路线和目的地。', ['bus', 'stop', 'station'], 'Where would you like to go?', '你想去哪里？', 'I would like to go to the train station.', '我想去火车站。'),
    scene('天气闲聊', 'Talking about weather', '用天气开启轻松的聊天。', ['sunny', 'warm', 'weather'], 'What is the weather like today?', '今天天气怎么样？', 'It is sunny and warm today.', '今天晴朗又温暖。'),
    scene('问路指引', 'Asking for directions', '练习询问附近的地点。', ['where', 'near', 'street'], 'What place are you looking for?', '你在找什么地方？', 'I am looking for the nearest bookstore.', '我在找最近的书店。'),
    scene('生日聚会', 'A birthday party', '准备生日礼物和祝福。', ['birthday', 'gift', 'party'], 'What gift will you give your friend?', '你会送给朋友什么礼物？', 'I will give my friend a storybook.', '我会送朋友一本故事书。'),
  ],
];

speakingScenes.push(
  [
    scene('介绍家人', 'Meet my family', '介绍家里的成员。', ['family', 'sister', 'parents'], 'Who lives with you?', '谁和你住在一起？', 'I live with my parents and my sister.', '我和父母、姐姐住在一起。'),
    scene('分担家务', 'Helping at home', '聊聊自己能做的家务。', ['help', 'clean', 'home'], 'How do you help at home?', '你在家怎样帮忙？', 'I help clean the table after dinner.', '晚饭后我帮忙擦桌子。'),
    scene('家庭晚餐', 'Family dinner', '分享和家人用餐的时刻。', ['dinner', 'together', 'talk'], 'What do you talk about at dinner?', '晚餐时你们聊些什么？', 'We talk about our day at school and work.', '我们聊在学校和工作中的一天。'),
  ],
  [
    scene('结交朋友', 'Making friends', '认识一位新朋友。', ['friend', 'meet', 'name'], 'What do you like doing with friends?', '你喜欢和朋友一起做什么？', 'I like playing games with my friends.', '我喜欢和朋友一起玩游戏。'),
    scene('互相帮助', 'Helping a friend', '练习关心和帮助朋友。', ['help', 'homework', 'together'], 'How can you help your friend?', '你能怎样帮助朋友？', 'I can help my friend with English homework.', '我可以帮朋友做英语作业。'),
    scene('和好如初', 'Making up', '练习向朋友表达歉意。', ['sorry', 'understand', 'listen'], 'What would you say to make up with a friend?', '你会怎样和朋友和好？', 'I am sorry. Let us talk about it.', '对不起，我们聊聊这件事吧。'),
  ],
  [
    scene('准备行李', 'Packing a bag', '为旅行准备随身物品。', ['bag', 'pack', 'clothes'], 'What will you pack for your trip?', '旅行时你会带什么？', 'I will pack clothes and a water bottle.', '我会带衣服和一个水瓶。'),
    scene('到达酒店', 'At a hotel', '练习办理入住。', ['room', 'hotel', 'night'], 'What kind of room would you like?', '你想要什么样的房间？', 'I would like a room with two beds.', '我想要一个有两张床的房间。'),
    scene('旅行分享', 'Travel memories', '分享旅行中印象深刻的地方。', ['trip', 'visit', 'city'], 'Where would you like to travel?', '你想去哪里旅行？', 'I would like to visit Beijing with my family.', '我想和家人一起去北京。'),
  ],
  [
    scene('喜欢的味道', 'Favorite flavors', '介绍最喜欢的食物。', ['food', 'taste', 'favorite'], 'What food do you like best?', '你最喜欢什么食物？', 'I like dumplings best.', '我最喜欢饺子。'),
    scene('做一份早餐', 'Making breakfast', '聊聊早餐的准备。', ['breakfast', 'egg', 'cook'], 'What can you make for breakfast?', '早餐你会做什么？', 'I can make eggs and toast.', '我会做鸡蛋和吐司。'),
    scene('健康饮食', 'Healthy eating', '分享日常的饮食习惯。', ['healthy', 'fruit', 'water'], 'What do you eat to stay healthy?', '你吃什么来保持健康？', 'I eat fruit and vegetables every day.', '我每天吃水果和蔬菜。'),
  ],
  [
    scene('认识动物', 'Amazing animals', '聊聊喜欢的动物。', ['animal', 'panda', 'bamboo'], 'What animal would you like to learn about?', '你想了解哪一种动物？', 'I would like to learn about pandas.', '我想了解熊猫。'),
    scene('四季变化', 'The four seasons', '描述喜欢的季节。', ['season', 'spring', 'flowers'], 'Which season do you like best?', '你最喜欢哪个季节？', 'I like spring because I can see flowers.', '我喜欢春天，因为可以看到花。'),
    scene('保护环境', 'Protecting nature', '分享保护环境的小行动。', ['save', 'water', 'nature'], 'What can you do to protect nature?', '你能做什么来保护自然？', 'I can save water and use less paper.', '我可以节约用水和减少用纸。'),
  ],
  [
    scene('长大以后', 'When I grow up', '聊聊向往的职业。', ['dream', 'job', 'future'], 'What would you like to be in the future?', '你将来想做什么？', 'I would like to be a teacher.', '我想成为一名老师。'),
    scene('学一项技能', 'Learning a skill', '选择一项想学的新技能。', ['learn', 'skill', 'practice'], 'What new skill would you like to learn?', '你想学习什么新技能？', 'I would like to learn how to swim.', '我想学游泳。'),
    scene('一个小目标', 'A small goal', '说说最近想实现的目标。', ['goal', 'plan', 'try'], 'What is your goal for this month?', '你这个月的目标是什么？', 'My goal is to read an English book.', '我的目标是读一本英文书。'),
  ],
);
