/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Mic, 
  Smile, 
  PlusCircle, 
  Search,
  Folder, 
  Image as ImageIcon, 
  Star, 
  BarChart2, 
  MessageCircle,
  Hash,
  Filter,
  ArrowRight,
  Trophy,
  TrendingUp,
  Flame,
  ChevronRight,
  ChevronDown,
  Compass,
  LayoutGrid,
  X,
  Sparkles,
  Loader2,
  Users,
  Send,
  User as UserIcon,
  BookOpen,
  Gift,
  History,
  SendHorizontal,
  Calendar,
  Share2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { toPng } from 'html-to-image';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  id: string;
  user: {
    name: string;
    avatar: string;
    isAI?: boolean;
  };
  content: string;
  type: 'text' | 'image';
  image?: {
    url: string;
    caption?: string;
    subText?: string;
  };
  timestamp: string;
}

interface Sticker {
  id: string;
  url: string;
  name: string;
}

interface GroupChat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

interface MemeInfo {
  meme: string;
  count: number;
  description: string;
  examples: Array<{ userName: string; text: string }>;
}

interface TopicInfo {
  title: string;
  description: string;
  entryPoint: string;
}

interface TopicRoom {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  position?: { x: number, y: number };
}

interface SocialBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface DiaryRecord {
  id: string;
  type: 'active' | 'passive';
  content: string;
  originalMessage: string;
  timestamp: string;
}

interface SocialDiary {
  summary: string;
  records: DiaryRecord[];
  badges: SocialBadge[];
}

interface CalendarDayEmoji {
  date: string; // YYYY-MM-DD
  emoji: string;
  summary?: string;
}

interface LobsterChatMessage {
  role: 'user' | 'lobster';
  content: string;
}

interface AiInsight {
  summary: string;
  recommendations: string[];
  memeRanking: MemeInfo[];
  recentTopics: TopicInfo[];
}

const RECENT_STICKERS: Sticker[] = [
  { id: 'st-1', url: 'https://images.weserv.nl/?url=https://tse1.mm.bing.net/th/id/OIP.YF0_8bvrnsO6qD9Oda3fZQAAAA?rs=1&pid=ImgDetMain&o=7&rm=3', name: '马露希尔-紧张' },
  { id: 'st-2', url: 'https://images.weserv.nl/?url=https://tse3.mm.bing.net/th/id/OIP.0AAe8IP5YopNvxRvFRCaHQHaF7?rs=1&pid=ImgDetMain&o=7&rm=3', name: '马露希尔-呐喊' },
  { id: 'st-3', url: 'https://images.weserv.nl/?url=https://c-ssl.dtstatic.com/uploads/blog/202402/18/ZOSDeVW8imVO1gZ.thumb.400_0.jpg', name: '莞苞-嫌弃' },
];

const MOCK_GROUPS: GroupChat[] = [
  {
    id: 'acg-1',
    name: 'ACG 深夜食堂 (2000)',
    avatar: 'https://picsum.photos/seed/acg/100/100',
    lastMessage: '咸鱼翻身: 羡慕能去现场的，外地社畜只能在屏幕前酸了呜呜呜。',
    timestamp: '22:42',
    unreadCount: 5,
  },
  {
    id: 'food-1',
    name: '和山山宇宙专区-拼谷群',
    avatar: 'https://picsum.photos/seed/hss/100/100',
    lastMessage: '张三: 还有人拼日谷吗',
    timestamp: '15:20',
  },
  {
    id: 'game-1',
    name: '游戏开黑组',
    avatar: 'https://picsum.photos/seed/game/100/100',
    lastMessage: '李四: 晚上 8 点上号，不见不散！',
    timestamp: '12:05',
    unreadCount: 12,
  },
  {
    id: 'dinner-1',
    name: '周末聚餐计划',
    avatar: 'https://picsum.photos/seed/dinner/100/100',
    lastMessage: '王五: 那就定在那家日料店吧。',
    timestamp: '昨天',
  },
];

const MOCK_MESSAGES_ACG: Message[] = [
  {
    id: 'acg-1-1',
    user: { name: '冬日火花', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
    content: '有人看了昨晚更新的《芙莉莲》吗？那个魔法特效真的绝了！',
    type: 'text',
    timestamp: '22:30',
  },
  {
    id: 'acg-1-2',
    user: { name: '中二病晚期', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
    content: '那段战斗场面我也来回看了三遍，经费在燃烧啊🔥',
    type: 'text',
    timestamp: '22:31',
  },
  {
    id: 'acg-1-4',
    user: { name: '画饼大师', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
    content: '分享一下刚画好的同人图，大家给点建议~',
    type: 'image',
    image: {
      url: 'https://picsum.photos/seed/anime_art/600/800',
      caption: 'New original character design...',
      subText: 'Pixiv Daily #1234',
    },
    timestamp: '22:35',
  },
  {
    id: 'acg-1-6',
    user: { name: '展会苦力', avatar: 'https://picsum.photos/seed/avatar6/100/100' },
    content: '说起来，下个月的CP展有人去吗？我打算出个《迷宫饭》的COS。',
    type: 'text',
    timestamp: '22:38',
  },
  {
    id: 'acg-1-7',
    user: { name: '深夜饿魔', avatar: 'https://picsum.photos/seed/food1/100/100' },
    content: '想出莱欧斯还是先西？感觉马露西尔的颜艺更具挑战性哈哈，那个“不要啊”的表情包我能看一百遍。',
    type: 'text',
    timestamp: '22:40',
  },
  {
    id: 'acg-1-8',
    user: { name: '萌新路过', avatar: 'https://picsum.photos/seed/avatar7/100/100' },
    content: '如果是莱欧斯，那一定要带上那个“走路菇”的烤串模型，简直是整出戏的灵魂所在！',
    type: 'text',
    timestamp: '22:42',
  },
  {
    id: 'acg-1-9',
    user: { name: '咸鱼翻身', avatar: 'https://picsum.photos/seed/avatar8/100/100' },
    content: '给你们看看我珍藏的《迷宫饭》官方食谱，里面真的详细教了怎么做曼德拉草排，虽然材料只能找现实替代。',
    type: 'image',
    image: {
      url: 'https://picsum.photos/seed/manga_cookbook/600/800',
      caption: 'Official Dungeon Meal Cookbook',
      subText: 'Delicious in Dungeon Recipes!',
    },
    timestamp: '22:45',
  },
  {
    id: 'acg-1-10',
    user: { name: '手办杀手', avatar: 'https://picsum.photos/seed/avatar9/100/100' },
    content: '这个食谱我也有！上次试着用鸡肉代替走路菇，配上秘制酱料，味道居然意外地还原。',
    type: 'text',
    timestamp: '22:50',
  },
  {
    id: 'acg-1-11',
    user: { name: '中二病晚期', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
    content: '提到九井老师的画风，细节真的无敌，每一格背景的魔物生态甚至内脏结构都有考据，太硬核了。',
    type: 'text',
    timestamp: '22:52',
  },
  {
    id: 'acg-1-12',
    user: { name: '冬日火花', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
    content: '刚才看动画回顾，希尔查克开锁的那一段真的专业，那种老练盗贼的魅力完全展现出来了。',
    type: 'text',
    timestamp: '22:55',
  },
  {
    id: 'acg-1-13',
    user: { name: '番剧挖掘机', avatar: 'https://picsum.photos/seed/avatar5/100/100' },
    content: '大家觉得最后那道“炎龙排”看起来最好吃吗？还是那个巨蝎巨型蝙蝠锅更带感？',
    type: 'text',
    timestamp: '22:58',
  },
  {
    id: 'acg-1-14',
    user: { name: '老二次元', avatar: 'https://picsum.photos/seed/avatar10/100/100' },
    content: '绝对是宝箱怪配饭！看起来脆脆的，想到希尔查克对宝箱怪的阴影就觉得好笑。',
    type: 'text',
    timestamp: '23:00',
  },
  {
    id: 'acg-1-15',
    user: { name: '画饼大师', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
    content: '分享一张我刚画好的玛露西尔同人，正在被强制喂食史莱姆的动态图。',
    type: 'image',
    image: {
      url: 'https://picsum.photos/seed/marcille_art/600/800',
      caption: 'Delicious in Marcilles Face!',
      subText: 'Fanart by BreadMaster',
    },
    timestamp: '23:02',
  },
  {
    id: 'acg-1-16',
    user: { name: '深夜饿魔', avatar: 'https://picsum.photos/seed/food1/100/100' },
    content: '楼上画得太传神了！我看这番最大的动力就是等玛露希尔表情崩坏。',
    type: 'text',
    timestamp: '23:10',
  },
  {
    id: 'acg-1-17',
    user: { name: '全机种制霸', avatar: 'https://picsum.photos/seed/avatar11/100/100' },
    content: '如果能出一款《迷宫饭》的 Roguelike 战棋游戏，收集素材然后烹饪加数值，我绝对首发！',
    type: 'text',
    timestamp: '23:15',
  },
  {
    id: 'acg-1-18',
    user: { name: '萌新路过', avatar: 'https://picsum.photos/seed/avatar7/100/100' },
    content: '我也想！每天研究怎么把半兽人种的蔬菜和深层魔物混合烹饪，想想就杀时间。',
    type: 'text',
    timestamp: '23:18',
  },
  {
    id: 'acg-1-19',
    user: { name: '冬日火花', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
    content: '快 12 点了，我也要去整个“迷宫风”夜宵——其实就是把剩菜乱炖，假装是魔物套餐。',
    type: 'text',
    timestamp: '23:25',
  },
  {
    id: 'acg-1-20',
    user: { name: '深夜饿魔', avatar: 'https://picsum.photos/seed/food1/100/100' },
    content: '最后一口乱炖吞掉。期待明天的迷宫探索（希望上班别碰到红龙级甲方）。',
    type: 'text',
    timestamp: '23:30',
  },
];

const MOCK_MESSAGES_GAME: Message[] = [
  {
    id: 'game-1-1',
    user: { name: '野区萧瑟', avatar: 'https://picsum.photos/seed/gamer1/100/100' },
    content: '晚上 8 点准时集合，有人要打排位吗？最近那个新版本打野刀削弱太狠了，我得练练新套路。',
    type: 'text',
    timestamp: '11:45',
  },
  {
    id: 'game-1-2',
    user: { name: '辅助不辅助', avatar: 'https://picsum.photos/seed/gamer2/100/100' },
    content: '我可以！但我只会保排辅助，别让我玩开团。',
    type: 'text',
    timestamp: '11:48',
  },
  {
    id: 'game-1-3',
    user: { name: '绝地求生者', avatar: 'https://picsum.photos/seed/gamer3/100/100' },
    content: '分享一波我刚才这局的骚操作，极限锁血反杀，帅不帅？',
    type: 'image',
    image: {
      url: 'https://picsum.photos/seed/gaming_win/800/600',
      caption: 'Pentakill achieved!',
      subText: 'Ranked Diamond Match',
    },
    timestamp: '11:55',
  },
  {
    id: 'game-1-4',
    user: { name: '李四', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
    content: '晚上 8 点上号，不见不散！',
    type: 'text',
    timestamp: '12:05',
  },
  {
    id: 'game-1-5',
    user: { name: '硬件宅', avatar: 'https://picsum.photos/seed/gamer4/100/100' },
    content: '大伙们，新出的那个 4090 D 有人入手没？散热压得住吗？',
    type: 'text',
    timestamp: '12:15',
  },
];

const MOCK_MESSAGES_FOOD: Message[] = [
  {
    id: 'food-1-1',
    user: { name: '和山山厨', avatar: 'https://picsum.photos/seed/hss1/100/100' },
    content: '新出的这套吧唧有人拼团吗？我想要隐藏款，普通款可以分给大家。',
    type: 'text',
    timestamp: '15:10',
  },
  {
    id: 'food-1-2',
    user: { name: '拼谷小能手', avatar: 'https://picsum.photos/seed/hss2/100/100' },
    content: '我想要 A 款和 C 款！这套立牌真的太好看了，必须全款拿下。',
    type: 'text',
    timestamp: '15:15',
  },
  {
    id: 'food-1-3',
    user: { name: '吃土少年', avatar: 'https://picsum.photos/seed/hss3/100/100' },
    content: '求拼运费！官方直邮运费太贵了，有人一起凑个包邮吗？',
    type: 'text',
    timestamp: '15:20',
  },
];

const MOCK_MESSAGES_MAP: Record<string, Message[]> = {
  'acg-1': MOCK_MESSAGES_ACG,
  'game-1': MOCK_MESSAGES_GAME,
  'food-1': MOCK_MESSAGES_FOOD,
};

const USER_AVATAR_MAP: Record<string, string> = {
  '冬日火花': 'https://picsum.photos/seed/avatar1/100/100',
  '中二病晚期': 'https://picsum.photos/seed/avatar2/100/100',
  '画饼大师': 'https://picsum.photos/seed/avatar4/100/100',
  '展会苦力': 'https://picsum.photos/seed/avatar6/100/100',
  '野区萧瑟': 'https://picsum.photos/seed/gamer1/100/100',
  '辅助不辅助': 'https://picsum.photos/seed/gamer2/100/100',
  '绝地求生者': 'https://picsum.photos/seed/gamer3/100/100',
  '李四': 'https://picsum.photos/seed/avatar4/100/100',
  '硬件宅': 'https://picsum.photos/seed/gamer4/100/100',
  '张三': 'https://picsum.photos/seed/avatar3/100/100',
  '和山山厨': 'https://picsum.photos/seed/hss1/100/100',
  '拼谷小能手': 'https://picsum.photos/seed/hss2/100/100',
  '吃土少年': 'https://picsum.photos/seed/hss3/100/100',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'list' | 'chat'>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'memes' | 'topics' | 'diary'>('summary');
  const [expandedMeme, setExpandedMeme] = useState<string | null>(null);
  const [personalizedPrompt, setPersonalizedPrompt] = useState('');
  const [personalizedResult, setPersonalizedResult] = useState<string | null>(null);
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [interests, setInterests] = useState<{label: string, type: 'topic' | 'user'}[]>([
    { label: '迷宫饭', type: 'topic' },
    { label: '4090D', type: 'topic' },
    { label: '硬件宅', type: 'user' },
    { label: 'COS', type: 'topic' }
  ]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [interestInputMode, setInterestInputMode] = useState<'topic' | 'user'>('topic');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Social Diary State
  const [socialDiary, setSocialDiary] = useState<SocialDiary | null>(null);
  const [isDiaryLoading, setIsDiaryLoading] = useState(false);
  const [lobsterChat, setLobsterChat] = useState<LobsterChatMessage[]>([
    { role: 'lobster', content: '你好呀！我是 Landing 虾，关于群聊里的那些事儿，问我就对了！你要查谁的黑历史，还是想知道最近大家在背着你聊什么？' }
  ]);
  const [lobsterInput, setLobsterInput] = useState('');
  const [isLobsterTalking, setIsLobsterTalking] = useState(false);
  const [isLobsterChatExpanded, setIsLobsterChatExpanded] = useState(false);
  const [diaryCalendar, setDiaryCalendar] = useState<CalendarDayEmoji[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [myStickers, setMyStickers] = useState<Sticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Sticker URL Migration Effect
  useEffect(() => {
    setMyStickers(prev => prev.map(sticker => {
      const updated = RECENT_STICKERS.find(s => s.id === sticker.id);
      return updated ? { ...sticker, url: updated.url } : sticker;
    }));
    
    // Also migrate existing messages in chat
    setMessages(prev => prev.map(msg => {
      if (msg.type === 'image' && msg.image?.url) {
        // Check if it's one of our stickers by looking at the old pattern or name
        const match = RECENT_STICKERS.find(s => msg.content === '[图片]' && msg.image?.subText === '来自我的表情包' && (msg.image.url.includes('input_file') || true));
        // We match by ID if we had stored it, but we didn't. So we match by subText and if it's one of the known names.
        // Actually, just updating all matching subText images to use the first found URL for now or if we can identify them.
        return msg; // Simplified for now, the new stickers will definitely work.
      }
      return msg;
    }));
  }, []);
  const lobsterChatEndRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Topic Rooms State
  const [topicRooms, setTopicRooms] = useState<TopicRoom[]>([]);
  const [viewingTopicRoomId, setViewingTopicRoomId] = useState<string | null>(null);
  const [topicRoomInput, setTopicRoomInput] = useState('');

  const addTopicRoom = () => {
    if (!topicRoomInput.trim()) return;
    const newRoom: TopicRoom = {
      id: `topic-${Date.now()}`,
      name: topicRoomInput.trim(),
      messages: [],
      createdAt: Date.now(),
      position: { 
        x: 10 + Math.random() * 70, 
        y: 20 + Math.random() * 50 
      }
    };
    setTopicRooms(prev => [...prev, newRoom]);
    setTopicRoomInput('');
    setActiveTab('topics');
  };

  useEffect(() => {
    if (currentPage === 'chat' && !hasSeenWelcome && messages.length > 0) {
      let welcomeContent = '';
      
      // Look for matches in interests
      const matchedInterest = interests.find(interest => 
        messages.some(msg => 
          msg.content.toLowerCase().includes(interest.label.toLowerCase()) || 
          msg.user.name.toLowerCase() === interest.label.toLowerCase()
        )
      );

      if (matchedInterest) {
        if (matchedInterest.type === 'user') {
          welcomeContent = `你关心的用户“${matchedInterest.label}”正在群里活跃`;
        } else {
          welcomeContent = `大家正在聊你感兴趣的话题：${matchedInterest.label}`;
        }
      }

      if (welcomeContent) {
        setHasSeenWelcome(true);
        const welcomeMsg: Message = {
          id: `welcome-ai-${selectedGroupId}-${Date.now()}`,
          user: { name: 'Landing虾助手', avatar: '🦞' },
          content: welcomeContent,
          type: 'text',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, welcomeMsg]);
      }
    }
  }, [currentPage, selectedGroupId, hasSeenWelcome, messages, interests]);

  useEffect(() => {
    if (selectedGroupId && MOCK_MESSAGES_MAP[selectedGroupId]) {
      setMessages(MOCK_MESSAGES_MAP[selectedGroupId]);
      setHasSeenWelcome(false); 
    } else {
      setMessages([]);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (scrollRef.current && currentPage === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentPage]);

  useEffect(() => {
    lobsterChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobsterChat]);

  const fetchAiInsight = async () => {
    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      const historyText = messages.map(m => `${m.user.name}: ${m.content}`).join('\n');
      const groupName = MOCK_GROUPS.find(g => g.id === selectedGroupId)?.name || 'Community';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `群组 "${groupName}" 的聊天历史：\n${historyText}`,
        config: {
          systemInstruction: `你是一个名为 "${groupName}" 群聊的得力助手。
          你的任务是：
          1. 简要总结对话，重点关注群组的特定主题（例如，如果是游戏群，关注比赛、策略或硬件）。
          2. 建议3个符合群组氛围的机智回复。
          3. 识别聊天中使用的“梗”或“社区黑话”。
          4. 为这些梗创建一个排名。
          5. 识别正在讨论的3个最新话题。为每个话题提供标题、简要描述和“社交切入口”——关于用户如何加入讨论的建议。
          **所有输出必须使用中文。**
          以 JSON 格式输出。`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              memeRanking: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    meme: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          userName: { type: Type.STRING },
                          text: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  required: ["meme", "count", "description", "examples"]
                }
              },
              recentTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    entryPoint: { type: Type.STRING }
                  },
                  required: ["title", "description", "entryPoint"]
                }
              }
            },
            required: ["summary", "recommendations", "memeRanking", "recentTopics"]
          }
        }
      });
      const data = JSON.parse(response.text || '{}') as AiInsight;
      setAiInsight(data);
    } catch (error) {
      console.error("AI Error:", error);
      setAiInsight({
        summary: "无法获取总结。",
        recommendations: ["大家都在聊啥？", "我也想参与！", "给大佬递茶"],
        memeRanking: [],
        recentTopics: [],
        topicCards: []
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchPersonalizedSummary = async () => {
    if (!personalizedPrompt.trim()) return;
    setIsPersonalizing(true);
    try {
      const historyText = messages.map(m => `${m.user.name}: ${m.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `聊天历史：\n${historyText}\n\n用户关注点：${personalizedPrompt}`,
        config: {
          systemInstruction: `执行“个性化信息降噪”。
          仅总结聊天历史中与用户关注点相关的部分。
          如果不存在相关内容，请礼貌地表示没有找到相关信息。
          **必须仅使用中文回答。**
          言简意赅。`,
        }
      });
      setPersonalizedResult(response.text || "没找到相关的内容。");
    } catch (error) {
      console.error("Personalized Error:", error);
      setPersonalizedResult("分析出错了，请稍后再试。");
    } finally {
      setIsPersonalizing(false);
    }
  };

  const fetchSocialDiary = async () => {
    setIsDiaryLoading(true);
    setActiveTab('diary');
    try {
      const historyStr = messages.map(m => `${m.user.name}: ${m.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `你是一个名为"Landing虾助手"的社交AI。
        基于以下群聊记录，为用户"我"生成本周的"社交日记"。
        **所有输出内容必须使用中文。**
        
        历史记录：
        ${historyStr}

        请生成 JSON：
        1. summary: 一句话总结用户活跃度。
        2. records: 列表，每个包含 id, type ("active"|"passive"), content, originalMessage, timestamp。
        3. badges: 列表，每个包含 id, name, icon (emoji), color (tailwind bg class), description。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              records: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    content: { type: Type.STRING },
                    originalMessage: { type: Type.STRING },
                    timestamp: { type: Type.STRING }
                  },
                  required: ["id", "type", "content", "originalMessage", "timestamp"]
                }
              },
              badges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    color: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "name", "icon", "color", "description"]
                }
              }
            },
            required: ["summary", "records", "badges"]
          }
        }
      });
      
      setSocialDiary(response.text ? JSON.parse(response.text) : null);
    } catch (error) {
      console.error("Diary error:", error);
    } finally {
      setIsDiaryLoading(false);
    }
  };

  const fetchDiaryCalendar = async () => {
    setIsCalendarLoading(true);
    setShowCalendarView(true);
    try {
      const historyStr = messages.slice(-50).map(m => `${m.user.name}: ${m.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `你是一个名为"Landing虾助手"的社交AI。
        基于以下群聊记录，为用户"我"生成本月（2026年4月）每一天的"日历情绪摘要"。
        如果某些日期没有记录，请根据群聊氛围编造一些合理的、有趣的、充满生活气息的假想记录。
        
        群聊历史背景：
        ${historyStr}

        请生成包含 30 个日期（2026-04-01 到 2026-04-30）的 JSON 列表。
        **所有 summary 字段必须使用中文编写。**
        每个对象包含: date (YYYY-MM-DD), emoji (一个代表那天情绪/事件的emoji), summary (简短概括)。
        特别注意：如果记录里提到了"磕cp"，一定要用一对人亲亲的emoji。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                emoji: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["date", "emoji", "summary"]
            }
          }
        }
      });
      
      setDiaryCalendar(response.text ? JSON.parse(response.text) : []);
    } catch (error) {
      console.error("Calendar error:", error);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const shareDiaryPoster = async () => {
    if (!calendarRef.current || isGeneratingPoster) return;
    
    setIsGeneratingPoster(true);
    try {
      // Small delay to ensure any hover states or UI glitches settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(calendarRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0px',
        }
      });
      
      // Post to group chat
      const shareMsg: Message = {
        id: `share-${Date.now()}`,
        user: { name: '我', avatar: 'https://picsum.photos/seed/me/100/100' },
        content: '分享一下我的本月社交情绪历 🦞✨',
        type: 'image',
        image: {
          url: dataUrl,
          caption: socialDiary?.summary || '这是我的社交日记总结',
          subText: '来自 Landing 虾助手的分享'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, shareMsg]);
      setShowAiModal(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error("Poster error:", error);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handleLobsterConsult = async () => {
    if (!lobsterInput.trim() || isLobsterTalking) return;

    const userMsg: LobsterChatMessage = { role: 'user', content: lobsterInput };
    setLobsterChat(prev => [...prev, userMsg]);
    setLobsterInput('');
    setIsLobsterTalking(true);

    try {
      const historyStr = messages.map(m => `${m.user.name}: ${m.content}`).join('\n');
      const chatHistoryStr = lobsterChat.map(m => `${m.role === 'user' ? '用户' : 'Landing虾'}: ${m.content}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `用户提问：${lobsterInput}`,
        config: {
          systemInstruction: `你是一个名为"Landing虾助手"的社交AI助手，性格活泼幽默。对群聊了如指掌。
          **请务必坚持使用中文回答。**
          群聊历史：\n${historyStr}
          对话历史：\n${chatHistoryStr}
          请基于背景简短有趣地回答。`,
        }
      });

      setLobsterChat(prev => [...prev, { role: 'lobster', content: response.text || '哎呀，虾脑宕机了...' }]);
    } catch (e) {
      setLobsterChat(prev => [...prev, { role: 'lobster', content: '哎呀，虾脑宕机了...' }]);
    } finally {
      setIsLobsterTalking(false);
    }
  };

  const handleSendMessage = async (textOverride?: string, imagePayload?: { url: string, caption?: string }) => {
    const textToSend = textOverride || (imagePayload ? '[图片]' : inputValue);
    if (!textToSend.trim() && !imagePayload) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      user: { name: '我', avatar: 'https://picsum.photos/seed/me/100/100' },
      content: textToSend,
      type: imagePayload ? 'image' : 'text',
      image: imagePayload ? { ...imagePayload, subText: '来自我的表情包' } : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let updatedMessages = [...messages];
    if (viewingTopicRoomId) {
      setTopicRooms(prev => prev.map(room => 
        room.id === viewingTopicRoomId 
          ? { ...room, messages: [...room.messages, newMessage] }
          : room
      ));
    } else {
      updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
    }

    if (!textOverride && !imagePayload) setInputValue('');
    if (showAiModal && !imagePayload) setShowAiModal(false);
    if (showStickerPicker) setShowStickerPicker(false);

    // AI Persona Auto-Responder
    if (!viewingTopicRoomId) {
      setTimeout(async () => {
        try {
          const isGamingGroup = selectedGroupId === 'game-1';
          const personaName = isGamingGroup ? '小龙虾' : '这产品你就磕吧';
          const personaAvatar = isGamingGroup ? '🦞' : 'https://picsum.photos/seed/cp/100/100';
          
          const systemInstruction = isGamingGroup 
            ? `你是一个名为"小龙虾"的群友，活跃在游戏开黑群。
              个人特征：
              1. 游戏发烧友，对各类3A大作、竞技游戏了如指掌。
              2. 语言风格：硬核、直爽，偶尔会用一些游戏黑话（如：GG, 666, 带飞, 落地成盒）。
              3. 语气：像个经常陪群友开黑到深夜的游戏宅男，比较客观理性但很有激情。`
            : `你是一个名为"这产品你就磕吧"的群友。
              个人特征：
              1. 资深同好/发烧友，虽然名字叫"你就磕吧"，但你的兴趣很广。
              2. 语言风格：随性、真诚、毒舌或赞美都很直接。
              3. 特别要求：不要强行把话题引回"磕CP"上，针对内容自然回复。
              4. 语气：像个经常混迹ACG或硬件圈的老油条。`;

          const historyText = updatedMessages.slice(-5).map(m => `${m.user.name}: ${m.content}`).join('\n');
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `当前群聊背景：\n${historyText}\n\n请作为"${personaName}"回复上一条消息（我: ${textToSend}）。\n要求：回复要精准、简短（不超过25字），重点在于回应内容。`,
            config: {
              systemInstruction: systemInstruction + '\n你是一个真实的群友，你的回复应该像真人一样有针对性，不要复读。请务必使用中文回答。'
            }
          });

          const aiReply: Message = {
            id: `ai-reply-${Date.now()}`,
            user: { name: personaName, avatar: personaAvatar, isAI: isGamingGroup },
            content: response.text || (isGamingGroup ? '走起走起！今天必上分！' : '磕到了磕到了！份份子钱我先出了！！'),
            type: 'text',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, aiReply]);
          
          // Auto scroll
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 100);
        } catch (error) {
          console.error("Persona error:", error);
        }
      }, 1500);
    }
  };

  const addInterest = () => {
    if (newInterestInput.trim() && !interests.some(i => i.label === newInterestInput.trim())) {
      setInterests([...interests, { label: newInterestInput.trim(), type: interestInputMode }]);
      setNewInterestInput('');
    }
  };

  const removeInterest = (label: string) => {
    setInterests(interests.filter(i => i.label !== label));
  };

  if (currentPage === 'list') {
    return (
      <div className="flex flex-col h-screen max-w-screen-md mx-auto bg-white overflow-hidden relative font-sans">
        <header className="px-5 pt-10 pb-4 bg-white sticky top-0 z-10 border-b border-black/5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">消息</h1>
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-on-surface-variant cursor-pointer" />
              <PlusCircle className="w-5 h-5 text-on-surface-variant cursor-pointer" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto hide-scrollbar">
          {MOCK_GROUPS.map((group) => (
            <div 
              key={group.id}
              onClick={() => { 
                setSelectedGroupId(group.id); 
                setCurrentPage('chat'); 
              }}
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-black/5 transition-colors cursor-pointer border-b border-black/[0.03]"
            >
              <div className="relative shrink-0">
                <img src={group.avatar} alt={group.name} className="w-12 h-12 rounded-lg object-cover bg-surface-container" referrerPolicy="no-referrer" />
                {group.unreadCount && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                    {group.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-[15px] text-on-surface truncate">{group.name}</h3>
                  <span className="text-[10px] text-on-surface-variant/50">{group.timestamp}</span>
                </div>
                <p className="text-xs text-on-surface-variant truncate pr-4">{group.lastMessage}</p>
              </div>
            </div>
          ))}
        </main>

        <footer className="h-20 bg-white flex items-center justify-around border-t border-black/5 pb-2">
          <NavButton icon={<MessageCircle className="w-6 h-6" />} label="消息" active />
          <NavButton icon={<Users className="w-6 h-6" />} label="联系人" />
          <NavButton icon={<Compass className="w-6 h-6" />} label="发现" />
          <NavButton icon={<UserIcon className="w-6 h-6" />} label="我" />
        </footer>
      </div>
    );
  }

  const currentGroup = MOCK_GROUPS.find(g => g.id === selectedGroupId) || MOCK_GROUPS[0];

  return (
    <div className="flex flex-col h-screen max-w-screen-md mx-auto bg-background overflow-hidden relative">
      <button onClick={fetchAiInsight} className="fixed right-6 bottom-44 z-50 w-14 h-14 bg-white shadow-xl rounded-full flex items-center justify-center border border-black/5 hover:scale-110 active:scale-95 transition-all group">
        <div className="text-3xl group-hover:rotate-12 transition-transform">🦞</div>
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">AI</div>
      </button>

      <AnimatePresence>
        {showInterestsModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInterestsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-low w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface leading-tight">关注配置</h2>
                    <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-mono">Lobster Watchlist</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInterestsModal(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 hide-scrollbar">
                {/* Users Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest font-mono px-1">
                    <Users className="w-3 h-3" />
                    关注用户
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] content-start">
                    <AnimatePresence>
                      {interests.filter(i => i.type === 'user').map((item) => {
                        const avatar = USER_AVATAR_MAP[item.label] || `https://picsum.photos/seed/${item.label}/100/100`;
                        return (
                          <motion.div 
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 bg-surface-container-high pl-1.5 pr-3 py-1.5 rounded-full border border-black/5 group hover:border-brand-blue/30 transition-colors"
                          >
                            <img src={avatar} className="w-6 h-6 rounded-full object-cover" alt={item.label} referrerPolicy="no-referrer" />
                            <span className="text-sm font-medium text-on-surface">{item.label}</span>
                            <button 
                              onClick={() => removeInterest(item.label)}
                              className="hover:text-error transition-colors ml-1"
                            >
                              <X className="w-3 h-3 text-on-surface-variant/40 group-hover:text-on-surface-variant" />
                            </button>
                          </motion.div>
                        );
                      })}
                      {interests.filter(i => i.type === 'user').length === 0 && (
                        <p className="text-[11px] text-on-surface-variant/30 italic px-1">暂无关注用户</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Topics Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest font-mono px-1">
                    <Hash className="w-3 h-3" />
                    关注话题
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] content-start">
                    <AnimatePresence>
                      {interests.filter(i => i.type === 'topic').map((item) => (
                        <motion.div 
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2 bg-surface-container-high pl-1.5 pr-3 py-1.5 rounded-full border border-black/5 group hover:border-brand-blue/30 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center">
                            <Hash className="w-3 h-3 text-brand-blue/60" />
                          </div>
                          <span className="text-sm font-medium text-on-surface">{item.label}</span>
                          <button 
                            onClick={() => removeInterest(item.label)}
                            className="hover:text-error transition-colors ml-1"
                          >
                            <X className="w-3 h-3 text-on-surface-variant/40 group-hover:text-on-surface-variant" />
                          </button>
                        </motion.div>
                      ))}
                      {interests.filter(i => i.type === 'topic').length === 0 && (
                        <p className="text-[11px] text-on-surface-variant/30 italic px-1">暂无关注话题</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex bg-surface-container-high p-1 rounded-xl">
                    <button 
                      onClick={() => setInterestInputMode('topic')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${interestInputMode === 'topic' ? 'bg-white shadow-sm text-brand-blue' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    >
                      <Hash className="w-3.5 h-3.5" />
                      关键词/话题
                    </button>
                    <button 
                      onClick={() => setInterestInputMode('user')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${interestInputMode === 'user' ? 'bg-white shadow-sm text-brand-blue' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      关注特定用户
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={interestInputMode === 'topic' ? "添加监控关键词..." : "输入用户群名..."} 
                      value={newInterestInput}
                      onChange={(e) => setNewInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                      className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-brand-blue/20 placeholder:text-on-surface-variant/30"
                    />
                    <button 
                      onClick={addInterest}
                      disabled={!newInterestInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10">
                  <p className="text-[10px] text-brand-blue/60 leading-relaxed font-medium">
                    Landing虾助手将持续监测以上内容。当群友讨论到这些关键词，或特定用户发言时，我将在你进群的第一时间为你同步。
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAiModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              <div className="p-6 pb-2 border-b border-black/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🦞</div>
                    <h2 className="font-headline text-lg font-bold text-on-surface">Landing虾助手</h2>
                  </div>
                  <X className="w-5 h-5 cursor-pointer text-on-surface-variant hover:text-on-surface" onClick={() => setShowAiModal(false)} />
                </div>
                
                <div className="flex gap-4 mb-2 overflow-x-auto hide-scrollbar whitespace-nowrap px-1">
                  <button 
                    onClick={() => setActiveTab('summary')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 shrink-0 ${activeTab === 'summary' ? 'text-brand-blue border-brand-blue' : 'text-on-surface-variant/40 border-transparent'}`}
                  >
                    实时总结
                  </button>
                  <button 
                    onClick={() => setActiveTab('memes')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 shrink-0 ${activeTab === 'memes' ? 'text-brand-blue border-brand-blue' : 'text-on-surface-variant/40 border-transparent'}`}
                  >
                    群热梗榜
                  </button>
                  <button 
                    onClick={() => setActiveTab('topics')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 shrink-0 ${activeTab === 'topics' ? 'text-brand-blue border-brand-blue' : 'text-on-surface-variant/40 border-transparent'}`}
                  >
                    话题房间
                  </button>
                  <button 
                    onClick={fetchSocialDiary}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 shrink-0 ${activeTab === 'diary' ? 'text-brand-blue border-brand-blue' : 'text-on-surface-variant/40 border-transparent'}`}
                  >
                    社交日记
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0 scroll-smooth hide-scrollbar bg-surface-container-lowest">
                {isAiLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
                    <p className="text-sm text-on-surface-variant animate-pulse">正在梳理群内情报...</p>
                  </div>
                ) : (
                  activeTab === 'summary' ? (
                    <div className="p-6 space-y-6">
                      {/* Personalized Section Moved to Summary Top */}
                      <div className="space-y-4 pb-6 border-b border-black/5">
                        <div className="flex items-center gap-2 text-brand-blue">
                          <Filter className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">个性化降噪</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={personalizedPrompt}
                            onChange={(e) => setPersonalizedPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchPersonalizedSummary()}
                            placeholder="搜索你关心的内容（如：显卡、拼团）"
                            className="w-full bg-surface-container-low border border-black/5 rounded-2xl py-3 px-4 text-sm focus:ring-1 focus:ring-brand-blue"
                          />
                          <button 
                            onClick={fetchPersonalizedSummary}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-blue text-white rounded-xl shadow-sm active:scale-95 transition-all"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {isPersonalizing ? (
                            <motion.div 
                              key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="py-4 flex flex-col items-center gap-2"
                            >
                              <Loader2 className="w-5 h-5 text-brand-blue animate-spin" />
                              <p className="text-[10px] text-on-surface-variant italic">正在过滤杂讯...</p>
                            </motion.div>
                          ) : personalizedResult && (
                            <motion.div 
                              key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                              className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10"
                            >
                              <p className="text-sm text-on-surface leading-relaxed font-medium">
                                {personalizedResult}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                        <div className="flex items-center gap-2 mb-2 text-brand-blue">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">聊天总结</span>
                        </div>
                        <p className="text-sm text-on-surface italic leading-relaxed">"{aiInsight?.summary}"</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">最近在聊话题</span>
                        </div>
                        <div className="space-y-2">
                          {aiInsight?.recentTopics.map((topic, i) => (
                            <div key={i} className="bg-surface-container-lowest p-3 rounded-xl border border-black/5 hover:border-brand-blue/20 transition-all group">
                              <div className="flex items-center gap-2 mb-1">
                                <Hash className="w-3 h-3 text-brand-blue" />
                                <span className="text-xs font-bold text-on-surface">{topic.title}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant mb-2">{topic.description}</p>
                              <div className="bg-brand-blue/5 p-2 rounded-lg flex items-center justify-between">
                                <span className="text-[10px] text-brand-blue font-medium">切入口: {topic.entryPoint}</span>
                                <ArrowRight className="w-3 h-3 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <LayoutGrid className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">快捷发言推荐</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {aiInsight?.recommendations.map((rec, i) => (
                            <button key={i} onClick={() => handleSendMessage(rec)} className="text-left p-3 text-sm bg-surface-container-lowest border border-black/5 hover:border-brand-blue/30 hover:bg-brand-blue/5 rounded-xl transition-all active:scale-[0.98]">
                              {rec}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'memes' ? (
                    <div className="p-6 space-y-8 pb-32 overflow-y-auto h-full hide-scrollbar">
                      {/* Recent Stickers Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-blue">
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-sm font-bold uppercase tracking-wider">最近流行表情包</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {RECENT_STICKERS.map((sticker) => {
                            const isAdded = myStickers.some(s => s.id === sticker.id);
                            return (
                              <div key={sticker.id} className="bg-surface-container-low p-2 rounded-2xl border border-black/5 flex flex-col gap-2 group">
                                <div className="aspect-square rounded-xl overflow-hidden bg-white border border-black/5">
                                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                                </div>
                                <button 
                                  onClick={() => {
                                    if (isAdded) {
                                      setMyStickers(prev => prev.filter(s => s.id !== sticker.id));
                                    } else {
                                      setMyStickers(prev => [...prev, sticker]);
                                    }
                                  }}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${isAdded ? 'bg-green-500 text-white' : 'bg-brand-blue text-white'}`}
                                >
                                  {isAdded ? (
                                    <>已添加</>
                                  ) : (
                                    <>
                                      <PlusCircle className="w-3 h-3" />
                                      一键添加
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Trophy className="w-5 h-5" />
                          <span className="text-sm font-bold uppercase tracking-wider">最近 1000 条消息热梗排行</span>
                        </div>
                        
                        <div className="space-y-3">
                        {aiInsight?.memeRanking.map((item, idx) => (
                          <div key={idx} className="bg-surface-container-low rounded-2xl border border-black/5 overflow-hidden transition-all">
                            <button 
                              onClick={() => setExpandedMeme(expandedMeme === item.meme ? null : item.meme)}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold ${idx < 3 ? 'bg-orange-500 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                  {idx + 1}
                                </span>
                                <div className="text-left">
                                  <div className="text-sm font-bold text-on-surface flex items-center gap-1">
                                    {item.meme}
                                    {idx < 2 && <Flame className="w-3 h-3 text-red-500" />}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant/60">使用次数: {item.count}</div>
                                </div>
                              </div>
                              {expandedMeme === item.meme ? <ChevronDown className="w-4 h-4 text-on-surface-variant" /> : <ChevronRight className="w-4 h-4 text-on-surface-variant" />}
                            </button>
                            
                            <AnimatePresence>
                              {expandedMeme === item.meme && (
                                <motion.div 
                                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                  className="px-4 pb-4 overflow-hidden"
                                >
                                  <div className="pt-2 border-t border-black/5">
                                    <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                                      {item.description}
                                    </p>
                                    <div className="space-y-2">
                                      <div className="text-[10px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        最近引用
                                      </div>
                                      {item.examples.map((ex, exIdx) => (
                                        <div key={exIdx} className="bg-white/50 p-2 rounded-lg border border-black/5">
                                          <div className="text-[10px] font-bold text-on-surface mb-0.5">{ex.userName}</div>
                                          <div className="text-[11px] text-on-surface-variant italic">"{ex.text}"</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'diary' ? (
                    <div className="flex flex-col h-full bg-surface-container-lowest overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                        {/* Weekly Summary Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-brand-blue">
                              <Calendar className="w-5 h-5" />
                              <span className="text-sm font-bold uppercase tracking-wider whitespace-nowrap">本周社交摘要</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={fetchDiaryCalendar}
                                className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-black/5 rounded-full text-[10px] font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all active:scale-95 whitespace-nowrap"
                              >
                                <Compass className="w-3 h-3" />
                                日历视图
                              </button>
                              <span className="text-[10px] text-on-surface-variant/40 font-mono">2026.04.12 - 04.18</span>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {showCalendarView && (
                              <motion.div 
                                ref={calendarRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-white rounded-3xl border border-black/5 p-5 shadow-sm space-y-4"
                              >
                                <div className="flex items-center justify-between px-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-on-surface font-mono">2026.04</span>
                                    <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest italic">Mood Calendar</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={shareDiaryPoster} 
                                      disabled={isGeneratingPoster}
                                      className="p-1.5 hover:bg-brand-blue/10 rounded-full transition-colors group relative"
                                      title="生成海报并分享到群"
                                    >
                                      {isGeneratingPoster ? (
                                        <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                                      ) : (
                                        <Share2 className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform" />
                                      )}
                                    </button>
                                    <button onClick={() => setShowCalendarView(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                                      <X className="w-4 h-4 text-on-surface-variant" />
                                    </button>
                                  </div>
                                </div>

                                {isCalendarLoading ? (
                                  <div className="py-20 flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                                    <p className="text-[10px] text-on-surface-variant tracking-widest font-bold uppercase">Generating Timeline...</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="grid grid-cols-7 gap-1">
                                      {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                        <div key={d} className="text-[9px] font-bold text-on-surface-variant/40 text-center py-1">{d}</div>
                                      ))}
                                      {/* Mock leading empty cells for April 2026 (Starts on Wed) */}
                                      {[null, null, null].map((_, i) => (
                                        <div key={`empty-${i}`} />
                                      ))}
                                      {diaryCalendar.map((day, i) => (
                                        <motion.div 
                                          key={day.date}
                                          whileHover={{ scale: 1.1 }}
                                          className="aspect-square flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest border border-black/5 hover:border-brand-blue/30 cursor-help group relative"
                                        >
                                          <span className="text-[8px] font-mono text-on-surface-variant/30 absolute top-1 left-1.5">{i + 1}</span>
                                          <span className="text-lg">{day.emoji}</span>
                                          
                                          {/* Tooltip */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block z-30 pointer-events-none">
                                            <div className="bg-brand-blue text-white text-[9px] p-2 rounded-lg shadow-xl text-center">
                                              {day.summary}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand-blue" />
                                            </div>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                    
                                    {/* Poster Summary Quote - Only visible in poster if we use the same ref */}
                                    <div className="pt-4 border-t border-dashed border-black/5">
                                      <p className="text-[10px] text-brand-blue font-bold italic line-clamp-2 leading-relaxed opacity-80">
                                        "{socialDiary?.summary || '正在开启本月的社交探索之旅...'}"
                                      </p>
                                      <div className="mt-2 flex items-center justify-end gap-1 opacity-20">
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Powered by Landing Lobster</span>
                                        <Sparkles className="w-2 h-2" />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {isDiaryLoading ? (
                            <div className="py-12 bg-surface-container-low rounded-3xl border border-black/5 flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                              <p className="text-xs text-on-surface-variant italic">正在翻阅社交小本本...</p>
                            </div>
                          ) : socialDiary ? (
                            <div className="space-y-6">
                              <div className="bg-brand-blue p-5 rounded-3xl text-white shadow-lg shadow-brand-blue/20 relative overflow-hidden group">
                                <Sparkles className="absolute -top-1 -right-1 w-12 h-12 text-white/10 group-hover:scale-125 transition-transform" />
                                <p className="text-sm font-medium leading-relaxed relative z-10 italic">
                                  "{socialDiary.summary}"
                                </p>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-2">
                                {socialDiary.badges.map((badge, i) => (
                                  <div key={i} className={`${badge.color}/10 border border-black/5 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                                    <span className="text-sm">{badge.icon}</span>
                                    <span className="text-[11px] font-bold text-[#585858]">{badge.name}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Record Book */}
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 text-on-surface-variant px-1">
                                  <BookOpen className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">社交记录册 / RECORDS</span>
                                </div>
                                <div className="space-y-3">
                                  {socialDiary.records.map((record, i) => (
                                    <div key={record.id} className="bg-white p-4 rounded-2xl border border-black/5 hover:border-brand-blue/20 transition-all group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                      <div className="flex items-start gap-3 mb-2">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${record.type === 'active' ? 'bg-green-500' : 'bg-brand-blue'} shadow-sm`} />
                                        <p className="text-xs font-bold text-on-surface leading-snug">{record.content}</p>
                                      </div>
                                      <div className="bg-surface-container-lowest p-2 rounded-lg border-l-2 border-brand-blue/20">
                                        <p className="text-[10px] text-on-surface-variant italic line-clamp-2">"{record.originalMessage}"</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={fetchSocialDiary}
                              className="w-full py-12 bg-surface-container-low rounded-3xl border-2 border-dashed border-black/5 flex flex-col items-center gap-3 group hover:border-brand-blue/20 transition-all"
                            >
                              <History className="w-8 h-8 text-on-surface-variant/40 group-hover:text-brand-blue transition-colors" />
                              <p className="text-xs text-on-surface-variant font-medium">点击生成本周社交结案陈词</p>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lobster Chat sub-interface */}
                      <motion.div 
                        initial={false}
                        animate={{ height: isLobsterChatExpanded ? 'auto' : '84px' }}
                        className="absolute bottom-0 left-0 right-0 bg-white border-t border-black/5 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-20 flex flex-col overflow-hidden"
                      >
                        {/* Toggle Handle */}
                        <div 
                          onClick={() => setIsLobsterChatExpanded(!isLobsterChatExpanded)}
                          className="h-6 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors group"
                        >
                          <div className="w-10 h-1 bg-black/5 rounded-full group-hover:bg-brand-blue/30 transition-colors" />
                        </div>

                        <div className="p-4 pt-0">
                          <AnimatePresence>
                            {isLobsterChatExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="max-h-48 overflow-y-auto mb-4 space-y-3 hide-scrollbar pb-2">
                                  {lobsterChat.map((chat, i) => (
                                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed shadow-sm ${chat.role === 'user' ? 'bg-brand-blue text-white rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'}`}>
                                        {chat.content}
                                      </div>
                                    </div>
                                  ))}
                                  {isLobsterTalking && (
                                    <div className="flex justify-start">
                                      <div className="bg-surface-container-low px-3 py-2 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-brand-blue/40 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-brand-blue/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-brand-blue/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                      </div>
                                    </div>
                                  )}
                                  <div ref={lobsterChatEndRef} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-2">
                             <div className="flex-1 bg-surface-container-low rounded-xl px-4 py-2 flex items-center border border-black/5 focus-within:border-brand-blue/30 transition-all">
                              <input 
                                value={lobsterInput}
                                onChange={(e) => setLobsterInput(e.target.value)}
                                onFocus={() => !isLobsterChatExpanded && setIsLobsterChatExpanded(true)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLobsterConsult()}
                                className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface placeholder:text-on-surface-variant/30"
                                placeholder="咨询 Landing 虾关于群友的事..."
                              />
                             </div>
                             <button 
                               onClick={handleLobsterConsult}
                               className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20 active:scale-90 transition-all disabled:opacity-50"
                               disabled={!lobsterInput.trim() || isLobsterTalking}
                             >
                               <SendHorizontal className="w-5 h-5" />
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ) : activeTab === 'topics' ? (
                    <div className="p-6 space-y-6">
                      <div className="flex items-center gap-2 mb-2 text-brand-blue">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">发起话题房间</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={topicRoomInput}
                          onChange={(e) => setTopicRoomInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTopicRoom()}
                          placeholder="输入话题（如：4090 D 显存测试）"
                          className="w-full bg-surface-container-low border border-black/5 rounded-2xl py-3 px-4 text-sm focus:ring-1 focus:ring-brand-blue"
                        />
                        <button 
                          onClick={addTopicRoom}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-blue text-white rounded-xl shadow-sm active:scale-95 transition-all"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-on-surface-variant px-1">
                          <LayoutGrid className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">已开启的分支房间</span>
                        </div>
                        {topicRooms.length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-black/5 rounded-2xl">
                            <p className="text-xs text-on-surface-variant/40">暂无话题房间，去发起一个吧</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {topicRooms.map(room => (
                              <div key={room.id} className="bg-surface-container-low p-4 rounded-2xl border border-black/5 flex items-center justify-between group hover:border-brand-blue/30 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                                    <Hash className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-on-surface">{room.name}</div>
                                    <div className="text-[10px] text-on-surface-variant/60">{room.messages.length} 条互动消息</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => { setViewingTopicRoomId(room.id); setShowAiModal(false); }}
                                  className="p-2 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-xs text-on-surface-variant/40">选择上方菜单开启全新体验</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 w-full max-w-screen-md z-50 bg-white/95 backdrop-blur-md h-16 flex items-center justify-between px-4 border-b border-black/5">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (viewingTopicRoomId) {
                setViewingTopicRoomId(null);
              } else {
                setCurrentPage('list');
              }
            }} 
            className="p-1 hover:bg-black/5 active:scale-95 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-on-surface truncate max-w-[200px]">
              {viewingTopicRoomId 
                ? topicRooms.find(r => r.id === viewingTopicRoomId)?.name 
                : currentGroup.name
              }
            </h1>
            {viewingTopicRoomId && (
              <span className="text-[10px] text-brand-blue font-bold uppercase tracking-wider">分支讨论房</span>
            )}
          </div>
        </div>
        <MoreHorizontal className="w-6 h-6 text-on-surface-variant cursor-pointer" />
      </header>

      <main ref={scrollRef} className="relative flex-1 overflow-y-auto pt-20 pb-28 px-4 bg-[#f5f5f5] hide-scrollbar scroll-smooth">
        <div className="space-y-8 min-h-full">
          <AnimatePresence initial={false}>
            {(viewingTopicRoomId 
              ? topicRooms.find(r => r.id === viewingTopicRoomId)?.messages || []
              : messages
            ).map((msg) => {
            const isMe = msg.user.name === '我';
            const isLobster = msg.user.name === 'Landing虾助手';
            
            if (isLobster) {
              return (
                <div key={msg.id} className="py-6 mb-6 flex justify-center">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform group"
                    onClick={() => {
                      const targetId = messages.find(m => m.content.includes('迷宫饭') && m.content.includes('COS'))?.id;
                      if (targetId) {
                        const el = document.getElementById(`msg-${targetId}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight effect
                          el.classList.add('ring-2', 'ring-brand-blue', 'ring-offset-4', 'transition-all');
                          setTimeout(() => el.classList.remove('ring-2', 'ring-brand-blue', 'ring-offset-4'), 2000);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 bg-gradient-to-r from-brand-blue/10 to-brand-blue/20 border border-brand-blue/30 px-5 py-2 rounded-full shadow-lg shadow-brand-blue/5 hover:shadow-brand-blue/10 transition-all duration-300">
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="text-xl"
                      >
                        🦞
                      </motion.span>
                      <p className="text-brand-blue text-[13px] font-bold">{msg.content}</p>
                      <ChevronRight className="w-4 h-4 text-brand-blue" />
                    </div>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInterestsModal(true);
                      }}
                      className="text-[9px] text-brand-blue/40 font-mono tracking-widest uppercase italic bg-white px-2 py-0.5 rounded-full border border-brand-blue/5 shadow-sm hover:bg-brand-blue/5 transition-colors"
                    >
                      点击配置关注内容
                    </span>
                  </motion.div>
                </div>
              );
            }

            return (
              <motion.div 
                key={msg.id} 
                id={`msg-${msg.id}`}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="shrink-0 relative">
                  {msg.user.avatar.startsWith('http') ? (
                    <img alt={msg.user.name} className="w-11 h-11 rounded-full object-cover shadow-sm bg-white" src={msg.user.avatar} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-xl shadow-sm">
                      {msg.user.avatar}
                    </div>
                  )}
                  {msg.user.isAI && (
                    <div className="absolute -bottom-1 -right-1 bg-brand-blue text-white text-[8px] px-1 rounded-sm font-bold border border-white">
                      AI
                    </div>
                  )}
                </div>

                <div className={`flex flex-col gap-1.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant font-medium">{msg.user.name}</span>
                      {/* Optional Owner/Admin Tag */}
                      {(msg.user.name === '和山山厨' || msg.user.name === '野区萧瑟') && (
                      <div className="bg-[#ffb92d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                        群主
                      </div>
                      )}
                    </div>
                  )}

                  {msg.type === 'text' ? (
                    <div className={`
                      px-4 py-2.5 rounded-[1.25rem] text-[0.95rem] leading-snug break-words shadow-sm
                      ${isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-on-surface rounded-tl-none border border-black/5'
                      }
                    `}>
                      <p>{msg.content}</p>
                    </div>
                  ) : (
                    <div className={`
                      rounded-[1.25rem] overflow-hidden shadow-sm border border-black/5
                      ${isMe ? 'rounded-tr-none' : 'rounded-tl-none bg-white'}
                    `}>
                      <div className="p-2">
                        {msg.image?.subText && <span className="text-[10px] text-on-surface-variant/60 block mb-1 px-1">{msg.image.subText}</span>}
                        <img alt="Shared content" className="max-w-full rounded-lg object-contain bg-white" src={msg.image?.url} referrerPolicy="no-referrer" />
                      </div>
                      {msg.image?.caption && (
                        <div className="pb-3 px-3">
                           <p className="text-[0.8rem] text-on-surface-variant/80 border-t border-black/5 pt-2">{msg.image.caption}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Components & Topic Bubbles Layer */}
      <div className="fixed bottom-64 right-4 z-40 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {!viewingTopicRoomId && topicRooms.map((room, idx) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              onClick={(e) => { e.stopPropagation(); setViewingTopicRoomId(room.id); }}
              className="pointer-events-auto cursor-pointer bg-white/90 backdrop-blur-md border border-brand-blue/30 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 group active:scale-95 transition-all max-w-[140px]"
            >
              <div className="shrink-0 w-6 h-6 rounded-lg bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-on-surface truncate">{room.name}</span>
                <span className="text-[7px] text-brand-blue font-bold uppercase tracking-tighter">话题空间</span>
              </div>
              {room.messages.length > 0 && (
                <div className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {room.messages.length}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }}
        className="fixed bottom-24 right-4 z-40 bg-white/90 backdrop-blur shadow-lg border border-black/5 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant active:scale-95 transition-all"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <footer className="fixed bottom-0 w-full max-w-screen-md z-50 bg-[#f8f8f8] border-t border-black/5 pb-8 pt-3">
        {/* Compact Tool Bar if needed, but let's stick to the simple screenshot style for now */}
        <div className="flex items-center gap-3 px-4 h-12">
          <Mic className="w-6 h-6 text-on-surface-variant cursor-pointer hover:text-primary transition-colors shrink-0" />
          <div className="flex-1 bg-white rounded-xl h-10 px-4 flex items-center border border-black/5 shadow-sm">
            <input 
              className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-[15px] text-on-surface placeholder:text-on-surface-variant/40" 
              placeholder={selectedGroupId === 'game-1' ? '组队开黑...' : (selectedGroupId === 'acg-1' ? '聊聊新番...' : (selectedGroupId === 'food-1' ? '求拼谷交流...' : '输入消息...'))} 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
            />
          </div>
          <div className="relative">
            <Smile 
              className={`w-6 h-6 cursor-pointer transition-colors shrink-0 ${showStickerPicker ? 'text-brand-blue' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => setShowStickerPicker(!showStickerPicker)} 
            />
            
            <AnimatePresence>
              {showStickerPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 min-w-[240px] z-[60]"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">我的表情包 ({myStickers.length})</span>
                    <button onClick={() => setShowAiModal(true)} className="text-[10px] text-brand-blue font-bold hover:underline">去获取更多</button>
                  </div>
                  
                  {myStickers.length === 0 ? (
                    <div className="py-8 flex flex-col items-center gap-2 opacity-30">
                      <ImageIcon className="w-8 h-8" />
                      <p className="text-[10px] font-medium italic">还没有收藏的表情包鸭~</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto hide-scrollbar">
                      {myStickers.map((sticker) => (
                        <button 
                          key={sticker.id}
                          onClick={() => handleSendMessage(undefined, { url: sticker.url })}
                          className="aspect-square rounded-lg overflow-hidden bg-surface-container-low hover:ring-2 hover:ring-brand-blue active:scale-90 transition-all p-1"
                        >
                          <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="absolute top-full right-4 border-8 border-transparent border-t-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <PlusCircle className="w-6 h-6 text-on-surface-variant cursor-pointer hover:text-primary transition-colors shrink-0" onClick={() => handleSendMessage()} />
        </div>
      </footer>
    </div>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary scale-110' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function QuickAction({ icon, label, highlighted = false }: { icon: React.ReactNode, label: string, highlighted?: boolean }) {
  return (
    <button 
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm border border-black/5 
        active:scale-95 transition-all duration-150
        ${highlighted 
          ? 'bg-white text-brand-blue border-brand-blue/20' 
          : 'bg-surface-container-lowest text-on-surface-variant'
        }
      `}
    >
      <span className={highlighted ? 'text-brand-blue' : 'text-on-surface-variant'}>
        {icon}
      </span>
      <span className={`text-xs whitespace-nowrap ${highlighted ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </button>
  );
}
