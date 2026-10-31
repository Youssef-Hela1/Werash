import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, Animated, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Dimensions, Alert, SafeAreaView, PanResponder,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialInboxConversations = [
  {
    id: 'conv_1',
    user: 'Samir Fahmy',
    handle: '@samir_f',
    avatar: require('../../assets/expert_samir.png'),
    avatarType: 'image',
    lastMessage: 'Hey! Thanks for visiting my profile. Feel free to ask about my car or parts!',
    time: '10:30 AM',
    unread: 1,
  },
  {
    id: 'conv_2',
    user: 'Sarah Jenkins',
    handle: '@sarah_j',
    avatar: require('../../assets/expert_sarah.png'),
    avatarType: 'image',
    lastMessage: 'The ceramic coating holds up for at least 3 years with proper washes.',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 'conv_3',
    user: 'Sherif Aly',
    handle: '@sherif_a',
    avatar: require('../../assets/expert_sherif.png'),
    avatarType: 'image',
    lastMessage: 'Are you coming to the car meet this weekend? 🤝🚗',
    time: '2d ago',
    unread: 0,
  },
  {
    id: 'conv_4',
    user: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    lastMessage: 'The carbon fiber hood weighs only 6.5 kg, great reduction.',
    time: '3d ago',
    unread: 0,
  },
  {
    id: 'conv_5',
    user: 'Ahmed Yassin',
    handle: '@ahmed_y',
    avatar: null,
    avatarType: 'icon',
    lastMessage: 'Is the BMW part still available?',
    time: '10:42 AM',
    unread: 0,
  },
];

const initialPosts = [
  {
    id: 'm1',
    author: 'Samir Fahmy',
    handle: '@samir_f',
    avatar: require('../../assets/expert_samir.png'),
    avatarType: 'image',
    time: '1h ago',
    content: "Finally finished swapping the gearbox on my e46 track car. Took all weekend but she shifts like butter now! 🏎️⚙️ Can't wait for the track day at Autodrome.",
    postImage: null,
    likes: 24,
    comments: 3,
    liked: false,
    vehicle: 'BMW E46',
    commentsList: [
      {
        id: 'c_m1_1',
        author: 'Sherif Aly',
        handle: '@sherif_a',
        avatar: require('../../assets/expert_sherif.png'),
        avatarType: 'image',
        time: '45m ago',
        content: 'Nothing beats a fresh gearbox on track day! Did you replace the flywheel too?',
        likes: 4,
        liked: false,
        replies: [
          {
            id: 'r_m1_1_1',
            author: 'Samir Fahmy',
            handle: '@samir_f',
            avatar: require('../../assets/expert_samir.png'),
            avatarType: 'image',
            time: '35m ago',
            content: 'Yes! Paired it with an ACT lightweight flywheel and heavy-duty pressure plate.',
            likes: 3,
            liked: false,
          }
        ],
      },
      {
        id: 'c_m1_2',
        author: 'Sarah Jenkins',
        handle: '@sarah_j',
        avatar: require('../../assets/expert_sarah.png'),
        avatarType: 'image',
        time: '30m ago',
        content: 'Solid work Samir! Which clutch setup did you go with?',
        likes: 2,
        liked: false,
        replies: [
          {
            id: 'r_m1_2_1',
            author: 'Samir Fahmy',
            handle: '@samir_f',
            avatar: require('../../assets/expert_samir.png'),
            avatarType: 'image',
            time: '20m ago',
            content: 'Sachs Performance 6-puck sprung disk. Shifting engagement is razor sharp!',
            likes: 2,
            liked: false,
          }
        ],
      },
      {
        id: 'c_m1_3',
        author: 'Elena Rostova',
        handle: '@elena',
        avatar: require('../../assets/expert_elena.png'),
        avatarType: 'image',
        time: '12m ago',
        content: 'See you at the Autodrome this Friday! 🏁 Bring extra brake pads.',
        likes: 5,
        liked: false,
      },
    ],
  },
  {
    id: 'm2',
    author: 'Sarah Jenkins',
    handle: '@sarah_j',
    avatar: require('../../assets/expert_sarah.png'),
    avatarType: 'image',
    time: '3h ago',
    content: "Just detailed this gorgeous classic Porsche 911 Carrera. Paint correction, ceramic coating, and deep interior cleaning. That guards red paint is absolutely popping! 🔴✨ #detailersofinstagram #porsche #911",
    postImage: require('../../assets/modern_workshop_banner.png'),
    likes: 56,
    comments: 3,
    liked: false,
    vehicle: 'Porsche 911',
    commentsList: [
      {
        id: 'c_m2_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '2h ago',
        content: 'Guards Red is such an iconic color. That depth of reflection is insane! 🔴✨',
        likes: 6,
        liked: false,
      },
      {
        id: 'c_m2_2',
        author: 'Michael Chang',
        handle: '@michael_c',
        avatar: require('../../assets/expert_michael.png'),
        avatarType: 'image',
        time: '1h ago',
        content: 'Which ceramic coating brand did you use on the single stage paint?',
        likes: 3,
        liked: false,
      },
      {
        id: 'c_m2_3',
        author: 'Sherif Aly',
        handle: '@sherif_a',
        avatar: require('../../assets/expert_sherif.png'),
        avatarType: 'image',
        time: '40m ago',
        content: 'Museum quality finish right there. Flawless work Sarah!',
        likes: 5,
        liked: false,
      },
    ],
  },
  {
    id: 'm3',
    author: 'Michael Chang',
    handle: '@michael_c',
    avatar: require('../../assets/expert_michael.png'),
    avatarType: 'image',
    time: '6h ago',
    content: "Quick oil change and spark plug replacement on my daily driver. Pro tip: always check spark plug gaps before installing them, even if they claim to be pre-gapped! 🔧🔌",
    postImage: null,
    likes: 12,
    comments: 1,
    liked: false,
    vehicle: 'Hyundai Coupe',
    commentsList: [
      {
        id: 'c_m3_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '4h ago',
        content: 'Crucial advice! Had one bent right out of the box last year and it caused misfires.',
        likes: 4,
        liked: false,
      },
    ],
  },
  {
    id: 'm4',
    author: 'Sherif Aly',
    handle: '@sherif_a',
    avatar: require('../../assets/expert_sherif.png'),
    avatarType: 'image',
    time: '12h ago',
    content: "Had a blast at the local car meet last night! So many amazing builds and great conversations. The car community here is truly unmatched. 🤝🚗 #carmeet #petrolheads",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 38,
    comments: 2,
    liked: false,
    vehicle: 'General',
    commentsList: [
      {
        id: 'c_m4_1',
        author: 'Elena Rostova',
        handle: '@elena',
        avatar: require('../../assets/expert_elena.png'),
        avatarType: 'image',
        time: '9h ago',
        content: 'Great turnout! That skyline R34 was stealing the whole show.',
        likes: 7,
        liked: false,
      },
      {
        id: 'c_m4_2',
        author: 'Sarah Jenkins',
        handle: '@sarah_j',
        avatar: require('../../assets/expert_sarah.png'),
        avatarType: 'image',
        time: '8h ago',
        content: 'Next meet let us organize a dedicated parking lineup by chassis!',
        likes: 3,
        liked: false,
      },
    ],
  },
  {
    id: 'm5',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Carbon fiber hood installed on a client's GR Yaris today. Not only does it look mean, but it saved 6.5 kg of weight off the front end! Weight reduction is the best modification. ⚖️🏁",
    postImage: null,
    likes: 47,
    comments: 2,
    liked: false,
    vehicle: 'Toyota GR Yaris',
    commentsList: [
      {
        id: 'c_m5_1',
        author: 'Michael Chang',
        handle: '@michael_c',
        avatar: require('../../assets/expert_michael.png'),
        avatarType: 'image',
        time: '18h ago',
        content: '6.5 kg off the front axle makes a noticeable difference in corner entry!',
        likes: 8,
        liked: false,
      },
      {
        id: 'c_m5_2',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '15h ago',
        content: 'Does it retain the factory hood latch or require hood pins?',
        likes: 2,
        liked: false,
      },
    ],
  },
  {
    id: '1',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '2h ago',
    content: "Just finalized the ECU calibration on a twin-turbo Golf R. The torque curve is absolutely linear now! 📈💻 Ready for track season. #ecu #tuning #golf-r",
    postImage: require('../../assets/modern_workshop_banner.png'),
    likes: 42,
    comments: 2,
    liked: false,
    vehicle: 'Golf R',
    commentsList: [
      {
        id: 'c_1_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '1h ago',
        content: 'Super smooth power band! What peak boost is it running on 95 octane?',
        likes: 4,
        liked: false,
      },
      {
        id: 'c_1_2',
        author: 'Kareem El-Sayed',
        handle: '@kareem',
        avatar: require('../../assets/expert_kareem.png'),
        avatarType: 'image',
        time: '35m ago',
        content: 'Clean tune Elena. Linear torque is so much better for corner exit on AWD.',
        likes: 3,
        liked: false,
      },
    ],
  },
  {
    id: '2',
    author: 'Kareem El-Sayed',
    handle: '@kareem',
    avatar: require('../../assets/expert_kareem.png'),
    avatarType: 'image',
    time: '4h ago',
    content: "Diagnosed a weird tapping sound in a customer's engine bay. Turned out to be a loose heat shield. Quick fix but saved them a major headache! 🛠️ Always double check the basics first.",
    postImage: null,
    likes: 18,
    comments: 1,
    liked: false,
    vehicle: 'General',
    commentsList: [
      {
        id: 'c_2_1',
        author: 'Tariq Mansour',
        handle: '@tariq',
        avatar: require('../../assets/expert_tariq.png'),
        avatarType: 'image',
        time: '2h ago',
        content: 'Heat shield rattles can drive anyone crazy! Good catch.',
        likes: 3,
        liked: false,
      },
    ],
  },
  {
    id: '3',
    author: 'Tariq Mansour',
    handle: '@tariq',
    avatar: require('../../assets/expert_tariq.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Brembo Big Brake Kit upgrade completed for a client's track car. Stop power is immense now! Don't skimp on safety. 🛑 #brakes #trackday #safetyfirst",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 29,
    comments: 1,
    liked: false,
    vehicle: 'Hyundai Coupe',
    commentsList: [
      {
        id: 'c_3_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '18h ago',
        content: 'Those calipers look huge behind the spokes. Huge stopping upgrade!',
        likes: 5,
        liked: false,
      },
    ],
  },
  {
    id: '4',
    author: 'Michael Chang',
    handle: '@michael_c',
    avatar: require('../../assets/expert_michael.png'),
    avatarType: 'image',
    time: '3h ago',
    content: "Selling my lightly used set of 18\" BBS LM Replica rims. Perfect fitment for Golf R or Audi S3. Zero curb rash, wrapped in Hankook Ventus V12 tires with 80% tread left. DM if interested! 🏎️💨",
    postImage: require('../../assets/car_side_profile.png'),
    likes: 15,
    comments: 2,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$1,200',
    location: 'New Cairo',
    commentsList: [
      {
        id: 'c_4_1',
        author: 'Kareem El-Sayed',
        handle: '@kareem',
        avatar: require('../../assets/expert_kareem.png'),
        avatarType: 'image',
        time: '2h ago',
        content: 'What is the offset (ET) on these wheels?',
        likes: 2,
        liked: false,
      },
      {
        id: 'c_4_2',
        author: 'Michael Chang',
        handle: '@michael_c',
        avatar: require('../../assets/expert_michael.png'),
        avatarType: 'image',
        time: '1h ago',
        content: 'ET45! Fits flush with zero fender rubbing.',
        likes: 4,
        liked: false,
      },
    ],
  },
  {
    id: '5',
    author: 'Sarah Jenkins',
    handle: '@sarah_j',
    avatar: require('../../assets/expert_sarah.png'),
    avatarType: 'image',
    time: '5h ago',
    content: "Looking to sell a brand new OMP Racing Steering Wheel. Leather grip, yellow centering stripe. Bought it for a project car but went a different direction. Box opened only for photos. 📦🏁",
    postImage: null,
    likes: 8,
    comments: 1,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$250',
    location: 'Maadi',
    commentsList: [
      {
        id: 'c_5_1',
        author: 'Tariq Mansour',
        handle: '@tariq',
        avatar: require('../../assets/expert_tariq.png'),
        avatarType: 'image',
        time: '3h ago',
        content: 'Does it come with the horn button and wiring harness?',
        likes: 1,
        liked: false,
      },
    ],
  },
  {
    id: '6',
    author: 'Sherif Aly',
    handle: '@sherif_a',
    avatar: require('../../assets/expert_sherif.png'),
    avatarType: 'image',
    time: '1d ago',
    content: "Mishimoto Performance Intercooler for Honda Civic Type R (FK8). Excellent condition, used for only 5,000 km. Fits 2017-2021 models. Selling because I upgraded to a full race setup. ❄️🚗",
    postImage: null,
    likes: 12,
    comments: 1,
    liked: false,
    vehicle: 'Honda Civic',
    isMarketplace: true,
    price: '$450',
    location: 'Heliopolis',
    commentsList: [
      {
        id: 'c_6_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '20h ago',
        content: 'Great price for a Mishimoto core. Intake air temps will drop significantly.',
        likes: 3,
        liked: false,
      },
    ],
  },
  {
    id: '7',
    author: 'Samir Fahmy',
    handle: '@samir_f',
    avatar: require('../../assets/expert_samir.png'),
    avatarType: 'image',
    time: '2d ago',
    content: "Selling a set of 4 Michelin Pilot Sport 4S tires (245/40/R18). 95% tread depth remaining, no punctures or sidewall repairs. Manufactured late 2024. Excellent track/street performance! 🛞💥",
    postImage: null,
    likes: 19,
    comments: 1,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$600',
    location: 'Sheikh Zayed',
    commentsList: [
      {
        id: 'c_7_1',
        author: 'Elena Rostova',
        handle: '@elena',
        avatar: require('../../assets/expert_elena.png'),
        avatarType: 'image',
        time: '1d ago',
        content: 'Best daily/track hybrid tire on the market hands down.',
        likes: 5,
        liked: false,
      },
    ],
  },
  {
    id: '8',
    author: 'Elena Rostova',
    handle: '@elena',
    avatar: require('../../assets/expert_elena.png'),
    avatarType: 'image',
    time: '3d ago',
    content: "Garrett GTX3071R Gen II Dual Ball Bearing Turbocharger. Brand new, in original packaging. Perfect for 350-650hp custom builds. Comes with T25 inlet flange and V-Band outlet. 🐌🔥",
    postImage: null,
    likes: 31,
    comments: 1,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$1,600',
    location: 'Maadi',
    commentsList: [
      {
        id: 'c_8_1',
        author: 'Samir Fahmy',
        handle: '@samir_f',
        avatar: require('../../assets/expert_samir.png'),
        avatarType: 'image',
        time: '2d ago',
        content: 'Spools remarkably fast for a 600hp capable turbo! Absolute unit.',
        likes: 6,
        liked: false,
      },
    ],
  },
  {
    id: '9',
    author: 'Tariq Mansour',
    handle: '@tariq',
    avatar: require('../../assets/expert_tariq.png'),
    avatarType: 'image',
    time: '3d ago',
    content: "Original carbon fiber trunk spoiler for BMW M3 (F80). Gloss finish, perfect weave, zero scratches. Easy double-sided tape install. Adds subtle aggression! 🏁💎",
    postImage: null,
    likes: 14,
    comments: 0,
    liked: false,
    vehicle: 'BMW M3',
    isMarketplace: true,
    price: '$350',
    location: 'New Cairo',
    commentsList: [],
  },
  {
    id: '10',
    author: 'Kareem El-Sayed',
    handle: '@kareem',
    avatar: require('../../assets/expert_kareem.png'),
    avatarType: 'image',
    time: '4d ago',
    content: "Recaro Pole Position fiberglass bucket seat in black velour. FIA approved until 2028. Minimal wear on bolster, shell is pristine. Side mounts included! 💺✊",
    postImage: null,
    likes: 22,
    comments: 1,
    liked: false,
    vehicle: 'General',
    isMarketplace: true,
    price: '$700',
    location: 'Sheikh Zayed',
    commentsList: [
      {
        id: 'c_10_1',
        author: 'Sherif Aly',
        handle: '@sherif_a',
        avatar: require('../../assets/expert_sherif.png'),
        avatarType: 'image',
        time: '3d ago',
        content: 'FIA valid until 2028 is a steal for this price.',
        likes: 4,
        liked: false,
      },
    ],
  }
];

const REPORT_REASONS = [
  { id: 'offensive', en: 'Inappropriate or offensive content', ar: 'محتوى غير لائق أو مسيء' },
  { id: 'spam', en: 'Spam, scam, or misleading information', ar: 'احتيال أو رسائل غير مرغوب فيها' },
  { id: 'harassment', en: 'Harassment or hate speech', ar: 'مضايقة أو خطاب كراهية' },
  { id: 'false_info', en: 'False car/parts description or pricing', ar: 'وصف أو سعر غير صحيح لسيارة/قطع غيار' },
  { id: 'other', en: 'Other community guideline violation', ar: 'مخالفة أخرى لإرشادات المجتمع' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.58);
const EXPANDED_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.94);

const getDefaultDmMessages = (authorName) => [
  {
    id: 'default-intro-1',
    sender: 'them',
    text: `Hey! Thanks for visiting my profile. Feel free to ask about my car or parts!`,
    textAr: `مرحباً! شكراً لزيارة صفحتي. يمكنك سؤالي عن سيارتي أو أي قطع غيار!`,
    time: '10:30 AM'
  }
];

export default function CommunityScreen({ currentUser, scrollToTopTrigger, selectedLanguage }) {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const COLORS = colors; // Keep JSX compatibility with dynamic themes
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets?.top || 0, Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24));
  const isRtl = selectedLanguage === 'Arabic';

  const handleDismissKeyboard = () => {
    if (!isRecordingVoiceRef.current) {
      Keyboard.dismiss();
    }
  };
  const [feedPosts, setFeedPosts] = useState(initialPosts);
  const [statusText, setStatusText] = useState('');
  const [selectedFeed, setSelectedFeed] = useState('active'); // 'overall', 'active', 'marketplace'
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [directMessageUser, setDirectMessageUser] = useState(null);
  const [openedFromMessagesPage, setOpenedFromMessagesPage] = useState(false);
  const [dmHistory, setDmHistory] = useState({});
  const [dmInputText, setDmInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState(null); // { type: 'image' | 'video', uri, duration }
  const [viewingMedia, setViewingMedia] = useState(null);
  const [inboxConversations, setInboxConversations] = useState(initialInboxConversations);
  const [inboxSearch, setInboxSearch] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [voiceTapTipVisible, setVoiceTapTipVisible] = useState(false);

  const recordingTimerRef = useRef(null);
  const audioPlaybackTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const isRecordingVoiceRef = useRef(false);
  const isRecordingLockedRef = useRef(false);
  const recordingDurationRef = useRef(0);
  const voiceDragY = useRef(new Animated.Value(0)).current;
  const voiceDragX = useRef(new Animated.Value(0)).current;
  const micScaleAnim = useRef(new Animated.Value(1)).current;

  // Fresh refs to prevent stale closures in PanResponder
  // Hydrate all stored DM messages so keyword search covers all chat histories
  useEffect(() => {
    const loadStoredDms = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const dmKeys = keys.filter(k => k.startsWith('@werash_dm_'));
        if (dmKeys.length > 0) {
          const pairs = await AsyncStorage.multiGet(dmKeys);
          const historyMap = {};
          pairs.forEach(([key, val]) => {
            if (val) {
              const author = key.replace('@werash_dm_', '');
              try {
                historyMap[author] = JSON.parse(val);
              } catch (_) {}
            }
          });
          setDmHistory(prev => ({ ...historyMap, ...prev }));
        }
      } catch (_) {}
    };
    loadStoredDms();
  }, [showMessagesPage]);

  // People matching search query across authors and users
  const matchedPeople = useMemo(() => {
    const q = communitySearch.toLowerCase().trim();
    if (!q) return [];
    const peopleMap = new Map();

    (feedPosts || []).forEach(p => {
      if (p && p.author && !peopleMap.has(p.author)) {
        peopleMap.set(p.author, {
          author: p.author,
          handle: p.handle || `@${p.author.toLowerCase().replace(/[\s\W]+/g, '')}`,
          avatar: p.avatar,
          avatarType: p.avatarType || (p.avatar ? 'image' : 'icon'),
          vehicle: p.vehicle || '',
        });
      }
    });

    (inboxConversations || []).forEach(c => {
      if (c && c.user && !peopleMap.has(c.user)) {
        peopleMap.set(c.user, {
          author: c.user,
          handle: c.handle || `@${c.user.toLowerCase().replace(/[\s\W]+/g, '')}`,
          avatar: c.avatar,
          avatarType: c.avatarType || (c.avatar ? 'image' : 'icon'),
          vehicle: '',
        });
      }
    });

    const results = [];
    peopleMap.forEach(person => {
      const nameMatch = (person.author || '').toLowerCase().includes(q);
      const handleMatch = Boolean(person.handle && person.handle.toLowerCase().includes(q));
      const vehicleMatch = Boolean(person.vehicle && person.vehicle.toLowerCase().includes(q));
      if (nameMatch || handleMatch || vehicleMatch) {
        results.push(person);
      }
    });
    return results;
  }, [communitySearch, feedPosts, inboxConversations]);

  // Comprehensive conversation search across usernames, handles, and all chat message contents
  const filteredConversations = useMemo(() => {
    const q = (inboxSearch || '').toLowerCase().trim();
    if (!q) {
      return inboxConversations || [];
    }

    // Combine inboxConversations with all users in dmHistory
    const allConversationsMap = new Map();
    (inboxConversations || []).forEach(c => {
      if (c && c.user) allConversationsMap.set(c.user, { ...c });
    });

    if (dmHistory && typeof dmHistory === 'object') {
      Object.keys(dmHistory).forEach(author => {
        if (author && !allConversationsMap.has(author)) {
          const msgs = Array.isArray(dmHistory[author]) ? dmHistory[author] : [];
          const lastMsg = msgs[msgs.length - 1];
          allConversationsMap.set(author, {
            id: 'conv_' + author,
            user: author,
            handle: '@' + author.toLowerCase().replace(/\s+/g, ''),
            avatar: null,
            avatarType: 'icon',
            lastMessage: lastMsg ? (lastMsg.text || (lastMsg.mediaType ? `[${lastMsg.mediaType}]` : '')) : '',
            time: lastMsg?.time || 'Recent',
            unread: 0,
          });
        }
      });
    }

    const results = [];
    allConversationsMap.forEach(conv => {
      if (!conv || !conv.user) return;
      const userMatch = (conv.user || '').toLowerCase().includes(q);
      const handleMatch = Boolean(conv.handle && conv.handle.toLowerCase().includes(q));
      const lastMsgMatch = Boolean(conv.lastMessage && conv.lastMessage.toLowerCase().includes(q));

      // Search all messages in this conversation
      const rawMessages = (dmHistory && dmHistory[conv.user]) ? dmHistory[conv.user] : getDefaultDmMessages(conv.user);
      const chatMessages = Array.isArray(rawMessages) ? rawMessages : [];
      const matchedChatMsg = chatMessages.slice().reverse().find(m => {
        if (!m) return false;
        const en = (m.text || '').toLowerCase();
        const ar = (m.textAr || '').toLowerCase();
        if (en.includes(q) || ar.includes(q)) return true;
        if (m.mediaType === 'audio' && (q.includes('voice') || q.includes('صوت') || q.includes('تسجيل') || q.includes('audio') || q.includes('mic'))) return true;
        if (m.mediaType === 'video' && (q.includes('video') || q.includes('فيديو') || q.includes('تسجيل'))) return true;
        if (m.mediaType === 'image' && (q.includes('image') || q.includes('photo') || q.includes('صورة'))) return true;
        return false;
      });

      if (userMatch || handleMatch || lastMsgMatch || matchedChatMsg) {
        let snippet = conv.lastMessage || '';
        let matchReason = null;

        if (matchedChatMsg) {
          const matchedText = isRtl
            ? (matchedChatMsg.textAr || matchedChatMsg.text)
            : (matchedChatMsg.text || matchedChatMsg.textAr);

          if (matchedText) {
            snippet = matchedText;
          } else if (matchedChatMsg.mediaType === 'audio') {
            snippet = isRtl ? '🎤 تسجيل صوتي' : '🎤 Voice message';
          } else if (matchedChatMsg.mediaType === 'video') {
            snippet = isRtl ? '🎥 تسجيل فيديو' : '🎥 Video recording';
          } else if (matchedChatMsg.mediaType === 'image') {
            snippet = isRtl ? '📷 صورة' : '📷 Image';
          }
          matchReason = isRtl ? 'رسالة مطابقة' : 'Matched message';
        }

        results.push({
          ...conv,
          displaySnippet: snippet,
          matchReason: !userMatch && !handleMatch ? matchReason : null,
          matchedSender: matchedChatMsg?.sender === 'user' ? (isRtl ? 'أنت' : 'You') : null,
        });
      }
    });

    return results;
  }, [inboxSearch, inboxConversations, dmHistory, isRtl]);

  const directMessageUserRef = useRef(directMessageUser);
  directMessageUserRef.current = directMessageUser;
  const dmHistoryRef = useRef(dmHistory);
  dmHistoryRef.current = dmHistory;
  const isRtlRef = useRef(isRtl);
  isRtlRef.current = isRtl;
  const handleStopAndSendVoiceRecordingRef = useRef(null);
  const handleCancelVoiceRecordingRef = useRef(null);

  const formatAudioDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const dmTimerRef = useRef(null);
  const dmScrollRef = useRef(null);
  
  // Interactive Comments state
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [commentInputText, setCommentInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, author }
  const commentsScrollRef = useRef(null);
  const commentInputRef = useRef(null);

  // Report post state
  const [reportModalPost, setReportModalPost] = useState(null);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [reportDetailText, setReportDetailText] = useState('');
  const [reportedPostIds, setReportedPostIds] = useState([]);

  const isCommentsExpandedRef = useRef(false);
  const commentsHeightAnim = useRef(new Animated.Value(DEFAULT_COMMENTS_HEIGHT)).current;
  const commentsSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeCommentsPost) {
      isCommentsExpandedRef.current = false;
      commentsHeightAnim.setValue(DEFAULT_COMMENTS_HEIGHT);
    }
  }, [activeCommentsPost]);

  const commentsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        commentsHeightAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const baseHeight = isCommentsExpandedRef.current ? EXPANDED_COMMENTS_HEIGHT : DEFAULT_COMMENTS_HEIGHT;
        const targetHeight = baseHeight - gestureState.dy;
        const clampedHeight = Math.max(140, Math.min(EXPANDED_COMMENTS_HEIGHT, targetHeight));
        commentsHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Tap to toggle full height
        if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
          const nextExpanded = !isCommentsExpandedRef.current;
          isCommentsExpandedRef.current = nextExpanded;
          Animated.spring(commentsHeightAnim, {
            toValue: nextExpanded ? EXPANDED_COMMENTS_HEIGHT : DEFAULT_COMMENTS_HEIGHT,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
          }).start();
          return;
        }

        const isExpanded = isCommentsExpandedRef.current;
        if (!isExpanded) {
          // If pulled UP (dy < -45 or upward flick vy < -0.35) -> pull up to full page
          if (gestureState.dy < -45 || gestureState.vy < -0.35) {
            isCommentsExpandedRef.current = true;
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else if (gestureState.dy > 80 || gestureState.vy > 0.6) {
            // Pulled down significantly -> dismiss
            Animated.timing(commentsHeightAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: false,
            }).start(() => setActiveCommentsPost(null));
          } else {
            // Rebound to default height
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        } else {
          // Currently at full expanded height
          // If pulled DOWN (dy > 50 or downward flick vy > 0.35) -> pull down to default height
          if (gestureState.dy > 50 || gestureState.vy > 0.35) {
            isCommentsExpandedRef.current = false;
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else {
            // Rebound to full height
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;


  const [expandedPostId, setExpandedPostId] = useState(null);
  
  const [showListingPage, setShowListingPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);
  const [listingImageUri, setListingImageUri] = useState(null);
  const [listingTitle, setListingTitle] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingLocation, setListingLocation] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [marketSearch, setMarketSearch] = useState('');

  // Facebook post composer states
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (scrollToTopTrigger > 0) {
      if (scrollViewRef.current) {
        if (typeof scrollViewRef.current.scrollTo === 'function') {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
          scrollViewRef.current.getNode().scrollTo({ y: 0, animated: true });
        }
      }
    }
  }, [scrollToTopTrigger]);

  useEffect(() => {
    if (scrollViewRef.current) {
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: 0, animated: false });
      }
    }
  }, [selectedFeed]);

  // In profile mode: header collapses on scroll by translating the whole header.
  // In feed mode: the collapsible header container stays static, and its children animate/compress.
  const headerTranslateY = showProfile
    ? scrollY.interpolate({
        inputRange: [0, 55],
        outputRange: [0, -55],
        extrapolate: 'clamp',
      })
    : new Animated.Value(0);

  const headerOpacity = showProfile
    ? scrollY.interpolate({
        inputRange: [0, 35],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : new Animated.Value(1);

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const shouldBeSticky = value > 22;
      if (shouldBeSticky !== isSticky) {
        setIsSticky(shouldBeSticky);
      }
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [isSticky]);

  // Child Translations and Opacities for Feed Mode
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });

  // Keep subtitle/title opacity connected to scroll
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const selectorTranslateY = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });

  const originalSelectorOpacity = scrollY.interpolate({
    inputRange: [0, 22],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const stickyBarOpacity = scrollY.interpolate({
    inputRange: [5, 25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Composer Section translation and fade out
  const composerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const composerOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleShowProfile = (val) => {
    setShowProfile(val);
    if (!val) {
      setSelectedUserProfile(null);
    }
    setExpandedPostId(null);
    scrollY.setValue(0);
    if (scrollViewRef.current) {
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: 0, animated: false });
      }
    }
  };

  const handleOpenUserProfile = (authorData) => {
    if (!authorData) return;
    const authorName = authorData.author || authorData.fullName || authorData.name;
    if (!authorName) return;

    const currentAuthor = currentUser ? currentUser.fullName : 'Guest User';
    const authorPosts = feedPosts.filter((p) => p.author === authorName);
    const primaryVehicle = authorData.vehicle || authorPosts.find((p) => p.vehicle && p.vehicle !== 'General')?.vehicle || (authorName === currentAuthor ? 'Hyundai Coupe (2005)' : 'BMW E46');
    const avatar = authorData.avatar || authorPosts.find((p) => p.avatar)?.avatar || null;
    const avatarType = authorData.avatarType || (avatar ? 'image' : 'icon');
    const handle = authorData.handle || `@${authorName.toLowerCase().replace(/[\s\W]+/g, '')}`;

    setSelectedUserProfile({
      author: authorName,
      handle,
      avatar,
      avatarType,
      vehicle: primaryVehicle,
      isSelf: authorName === currentAuthor,
    });
    setShowProfile(true);
    setExpandedPostId(null);
    scrollY.setValue(0);
    if (scrollViewRef.current) {
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: 0, animated: false });
      }
    }
  };

// (getDefaultDmMessages defined at module level)

  const handleOpenDirectMessage = async (user, fromInbox = false) => {
    if (!user) return;
    setOpenedFromMessagesPage(Boolean(fromInbox));
    setDirectMessageUser(user);
    setShowMessagesPage(true);
    try {
      const stored = await AsyncStorage.getItem(`@werash_dm_${user.author}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDmHistory(prev => ({ ...prev, [user.author]: parsed }));
          return;
        }
      }
    } catch (_) {}
    if (!dmHistory[user.author]) {
      setDmHistory(prev => ({ ...prev, [user.author]: getDefaultDmMessages(user.author) }));
    }
  };

  const handleCloseDirectMessage = () => {
    setDirectMessageUser(null);
    if (!openedFromMessagesPage) {
      setShowMessagesPage(false);
    }
  };

  const updateInboxConversation = (authorName, lastMsgText, time) => {
    setInboxConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.user === authorName);
      if (existingIdx !== -1) {
        const updatedItem = {
          ...prev[existingIdx],
          lastMessage: lastMsgText,
          time: time || 'Just now',
          unread: 0,
        };
        const rest = prev.filter((_, idx) => idx !== existingIdx);
        return [updatedItem, ...rest];
      } else {
        const newConv = {
          id: 'conv_' + Date.now(),
          user: authorName,
          handle: directMessageUser?.handle || ('@' + authorName.toLowerCase().replace(/\s+/g, '')),
          avatar: directMessageUser?.avatar || null,
          avatarType: directMessageUser?.avatar ? 'image' : 'icon',
          lastMessage: lastMsgText,
          time: time || 'Just now',
          unread: 0,
        };
        return [newConv, ...prev];
      }
    });
  };

  const handlePickChatImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'الإذن مطلوب' : 'Permission Required',
          isRtl ? 'يرجى منح إذن الوصول إلى الصور لإرسالها.' : 'Please allow photo library access to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedMedia({
          type: 'image',
          uri: result.assets[0].uri,
        });
      }
    } catch (err) {
      console.warn('Error picking chat image:', err);
    }
  };

  const handleSelectVideoOption = () => {
    Alert.alert(
      isRtl ? 'إرسال تسجيل فيديو' : 'Send Video Recording',
      isRtl ? 'اختر طريقة تسجيل أو إرفاق الفيديو:' : 'Choose how to record or select your video:',
      [
        {
          text: isRtl ? 'تسجيل فيديو بالكاميرا' : 'Record Video with Camera',
          onPress: handleRecordVideoWithCamera,
        },
        {
          text: isRtl ? 'اختيار من المعرض' : 'Choose Video from Library',
          onPress: handlePickVideoFromLibrary,
        },
        {
          text: isRtl ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRecordVideoWithCamera = async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPerm.status !== 'granted') {
        Alert.alert(
          isRtl ? 'إذن الكاميرا مطلوب' : 'Camera Permission Required',
          isRtl ? 'يرجى السماح بالوصول إلى الكاميرا لتسجيل الفيديو.' : 'Please allow camera access to record video.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedMedia({
          type: 'video',
          uri: result.assets[0].uri,
          duration: result.assets[0].duration ? Math.round(result.assets[0].duration / 1000) : null,
        });
      }
    } catch (err) {
      console.warn('Error recording video:', err);
    }
  };

  const handlePickVideoFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'الإذن مطلوب' : 'Permission Required',
          isRtl ? 'يرجى منح إذن الوصول إلى الوسائط لإرسال الفيديو.' : 'Please allow media library access to send videos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedMedia({
          type: 'video',
          uri: result.assets[0].uri,
          duration: result.assets[0].duration ? Math.round(result.assets[0].duration / 1000) : null,
        });
      }
    } catch (err) {
      console.warn('Error picking video from library:', err);
    }
  };

  const handleSendDirectMessage = async () => {
    if ((!dmInputText.trim() && !attachedMedia) || !directMessageUser) return;
    const authorName = directMessageUser.author;
    const sentMedia = attachedMedia;
    
    const newMsg = {
      id: 'dm-' + Date.now(),
      sender: 'user',
      text: dmInputText.trim(),
      textAr: dmInputText.trim(),
      mediaType: sentMedia ? sentMedia.type : null,
      mediaUri: sentMedia ? sentMedia.uri : null,
      mediaDuration: sentMedia ? sentMedia.duration : null,
      time: 'Just now'
    };

    const currentList = dmHistory[authorName] || getDefaultDmMessages(authorName);
    const updatedList = [...currentList, newMsg];
    
    setDmHistory(prev => ({ ...prev, [authorName]: updatedList }));
    setDmInputText('');
    setAttachedMedia(null);

    const summaryText = newMsg.text || (sentMedia?.type === 'video' ? (isRtl ? '🎥 تسجيل فيديو' : '🎥 Video recording') : (isRtl ? '📷 صورة' : '📷 Image'));
    updateInboxConversation(authorName, summaryText, 'Just now');

    try {
      await AsyncStorage.setItem('@werash_dm_' + authorName, JSON.stringify(updatedList));
    } catch (_) {}

    // Simulated contextual reply from author
    setTimeout(async () => {
      let replyText = 'Got your message! Great connecting with you on Werash.';
      let replyTextAr = 'وصلتني رسالتك! يسعدني التواصل معك على وِرَش.';

      if (sentMedia?.type === 'video') {
        replyText = 'Awesome video recording! That engine note sounds unbelievable! 🏎️💨';
        replyTextAr = 'تسجيل فيديو رائع! صوت المحرك رهيب وخيالي ما شاء الله! 🏎️💨';
      } else if (sentMedia?.type === 'image') {
        replyText = 'That looks super clean! Where did you get that build done? 🔥';
        replyTextAr = 'شكلها نظيف وممتاز جداً! أين قمت بهذا التعديل؟ 🔥';
      }

      const replyMsg = {
        id: 'reply-' + Date.now(),
        sender: 'them',
        text: replyText,
        textAr: replyTextAr,
        time: 'Just now'
      };
      setDmHistory(prev => {
        const cur = prev[authorName] || updatedList;
        const next = [...cur, replyMsg];
        AsyncStorage.setItem('@werash_dm_' + authorName, JSON.stringify(next)).catch(() => {});
        return { ...prev, [authorName]: next };
      });
      updateInboxConversation(authorName, isRtl ? replyTextAr : replyText, 'Just now');
    }, 1500);
  };
  const handleCancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    isRecordingVoiceRef.current = false;
    isRecordingLockedRef.current = false;
    recordingDurationRef.current = 0;
    setIsRecordingVoice(false);
    setIsRecordingLocked(false);
    setRecordingDuration(0);
    voiceDragY.setValue(0);
    Animated.spring(voiceDragX, {
      toValue: 0,
      friction: 5,
      useNativeDriver: true,
    }).start();
    Animated.spring(micScaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleStopAndSendVoiceRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const finalSecs = recordingDurationRef.current > 0 ? recordingDurationRef.current : 1;

    isRecordingVoiceRef.current = false;
    isRecordingLockedRef.current = false;
    recordingDurationRef.current = 0;
    setIsRecordingVoice(false);
    setIsRecordingLocked(false);
    setRecordingDuration(0);
    voiceDragY.setValue(0);
    voiceDragX.setValue(0);
    Animated.spring(micScaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    const targetUser = directMessageUserRef.current || directMessageUser;
    if (!targetUser) return;
    const authorName = targetUser.author;
    const durationLabel = formatAudioDuration(finalSecs);

    const newMsg = {
      id: 'dm-' + Date.now(),
      sender: 'user',
      mediaType: 'audio',
      audioDuration: durationLabel,
      text: '',
      textAr: '',
      time: 'Just now'
    };

    const curHist = dmHistoryRef.current || dmHistory;
    const currentList = curHist[authorName] || getDefaultDmMessages(authorName);
    const updatedList = [...currentList, newMsg];

    setDmHistory(prev => ({ ...prev, [authorName]: updatedList }));
    const rtlActive = isRtlRef.current;
    const summaryText = rtlActive ? (`🎤 تسجيل صوتي (${durationLabel})`) : (`🎤 Voice message (${durationLabel})`);
    updateInboxConversation(authorName, summaryText, 'Just now');

    try {
      await AsyncStorage.setItem('@werash_dm_' + authorName, JSON.stringify(updatedList));
    } catch (_) {}

    setTimeout(async () => {
      const replyMsg = {
        id: 'reply-' + Date.now(),
        sender: 'them',
        text: 'Heard your voice note! Loud and clear 👍',
        textAr: 'استمعت إلى رسالتك الصوتية! واضحة وممتازة 👍',
        time: 'Just now'
      };
      setDmHistory(prev => {
        const cur = prev[authorName] || updatedList;
        const next = [...cur, replyMsg];
        AsyncStorage.setItem('@werash_dm_' + authorName, JSON.stringify(next)).catch(() => {});
        return { ...prev, [authorName]: next };
      });
      updateInboxConversation(authorName, rtlActive ? replyMsg.textAr : replyMsg.text, 'Just now');
    }, 1500);
  };

  handleStopAndSendVoiceRecordingRef.current = handleStopAndSendVoiceRecording;
  handleCancelVoiceRecordingRef.current = handleCancelVoiceRecording;

  const voicePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (isRecordingVoiceRef.current && isRecordingLockedRef.current) return;

        recordingStartTimeRef.current = Date.now();
        isRecordingVoiceRef.current = true;
        isRecordingLockedRef.current = false;
        recordingDurationRef.current = 0;

        setIsRecordingVoice(true);
        setIsRecordingLocked(false);
        setRecordingDuration(0);

        // Noticeable expansion in size (1.7x)
        Animated.spring(micScaleAnim, {
          toValue: 1.7,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }).start();

        voiceDragY.setValue(0);
        voiceDragX.setValue(0);

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          recordingDurationRef.current += 1;
          setRecordingDuration(recordingDurationRef.current);
        }, 1000);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isRecordingVoiceRef.current || isRecordingLockedRef.current) return;

        // 1. Drag up to lock: dy < -45
        if (gestureState.dy < -45) {
          isRecordingLockedRef.current = true;
          setIsRecordingLocked(true);
          Animated.spring(voiceDragY, {
            toValue: -60,
            useNativeDriver: true,
          }).start();
          Animated.spring(voiceDragX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
          Animated.spring(micScaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Live visual drag toward lock bubble
        if (gestureState.dy < 0 && gestureState.dy >= -45) {
          voiceDragY.setValue(gestureState.dy);
        } else if (gestureState.dy >= 0) {
          voiceDragY.setValue(0);
        }

        // 2. Drag mic horizontally to cancel
        const rtlActive = isRtlRef.current;
        const slideDistance = rtlActive ? gestureState.dx : -gestureState.dx;

        if (rtlActive) {
          // Slide to the right (positive dx)
          voiceDragX.setValue(Math.max(0, Math.min(gestureState.dx, 150)));
        } else {
          // Slide to the left (negative dx)
          voiceDragX.setValue(Math.min(0, Math.max(gestureState.dx, -150)));
        }

        // If dragged all the way past 115px, trigger cancel
        if (slideDistance > 115) {
          if (handleCancelVoiceRecordingRef.current) {
            handleCancelVoiceRecordingRef.current();
          } else {
            handleCancelVoiceRecording();
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isRecordingVoiceRef.current) return;

        // If locked hands-free, releasing finger should NOT stop or send
        if (isRecordingLockedRef.current) {
          return;
        }

        // If released while dragged into cancel zone (> 65px), cancel
        const rtlActive = isRtlRef.current;
        const slideDistance = rtlActive ? gestureState.dx : -gestureState.dx;
        if (slideDistance > 65) {
          if (handleCancelVoiceRecordingRef.current) {
            handleCancelVoiceRecordingRef.current();
          } else {
            handleCancelVoiceRecording();
          }
          return;
        }

        // Release immediately sends voice note automatically!
        if (handleStopAndSendVoiceRecordingRef.current) {
          handleStopAndSendVoiceRecordingRef.current();
        } else {
          handleStopAndSendVoiceRecording();
        }
      },
      onPanResponderTerminate: () => {
        if (!isRecordingVoiceRef.current) return;
        if (!isRecordingLockedRef.current) {
          if (handleStopAndSendVoiceRecordingRef.current) {
            handleStopAndSendVoiceRecordingRef.current();
          } else {
            handleStopAndSendVoiceRecording();
          }
        }
      },
    })
  ).current;

  const handleTogglePlayAudio = (msgId) => {
    if (playingAudioId === msgId) {
      if (audioPlaybackTimerRef.current) clearTimeout(audioPlaybackTimerRef.current);
      setPlayingAudioId(null);
    } else {
      if (audioPlaybackTimerRef.current) clearTimeout(audioPlaybackTimerRef.current);
      setPlayingAudioId(msgId);
      audioPlaybackTimerRef.current = setTimeout(() => {
        setPlayingAudioId(null);
      }, 3500);
    }
  };

  const pickPostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isRtl ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
        isRtl ? 'نحتاج إلى إذن للوصول إلى الصور لإرفاقها بالمنشور.' : 'We need permission to access your gallery to attach photos.'
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = () => {
    if (!statusText.trim() && !selectedImage) return;
    const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
    const currentHandle = currentUser ? `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '')}` : '@guest';
    const currentVehicle = currentUser && currentUser.carBrand ? `${currentUser.carBrand} ${currentUser.carModel}` : 'Hyundai Coupe';

    const newPost = {
      id: Date.now().toString(),
      author: currentAuthorName,
      handle: currentHandle,
      avatarType: 'icon',
      time: 'Just now',
      content: statusText.trim(),
      likes: 0,
      comments: 0,
      commentsList: [],
      liked: false,
      postImage: selectedImage,
      vehicle: currentVehicle,
      isMarketplace: selectedFeed === 'marketplace',
      price: selectedFeed === 'marketplace' ? 'Ask Price' : null,
      location: selectedFeed === 'marketplace' ? 'Cairo' : null,
    };
    setFeedPosts([newPost, ...feedPosts]);
    setStatusText('');
    setSelectedImage(null);
    setCreatePostModalVisible(false);
  };

  const handlePublishListing = () => {
    if (!listingTitle.trim() || !listingPrice.trim()) return;
    const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
    const currentHandle = currentUser ? `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '')}` : '@guest';
    const currentVehicle = currentUser && currentUser.carBrand ? `${currentUser.carBrand} ${currentUser.carModel}` : 'Hyundai Coupe';

    const newPost = {
      id: Date.now().toString(),
      author: currentAuthorName,
      handle: currentHandle,
      avatarType: 'icon',
      time: 'Just now',
      content: `${listingTitle.trim()}\n\n${listingDesc.trim()}`,
      likes: 0,
      comments: 0,
      commentsList: [],
      liked: false,
      postImage: listingImageUri ? { uri: listingImageUri } : null,
      vehicle: currentVehicle,
      isMarketplace: true,
      price: listingPrice.trim(),
      location: listingLocation.trim() || 'Cairo',
    };
    setFeedPosts([newPost, ...feedPosts]);
    setListingTitle('');
    setListingPrice('');
    setListingLocation('');
    setListingDesc('');
    setListingImageUri(null);
    setShowListingPage(false);
  };

  const handlePickListingImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library to upload a product image.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setListingImageUri(result.assets[0].uri);
    }
  };


  const handleOpenReportModal = (post) => {
    setReportModalPost(post);
    setSelectedReportReason(null);
    setReportDetailText('');
  };

  const handleSubmitReport = () => {
    if (!reportModalPost || !selectedReportReason) return;
    const reportedId = reportModalPost.id;
    setReportedPostIds((prev) => [...prev, reportedId]);
    setReportModalPost(null);
    setSelectedReportReason(null);
    setReportDetailText('');

    Alert.alert(
      isRtl ? 'تم إرسال البلاغ' : 'Report Submitted',
      isRtl
        ? 'شكراً لإبلاغنا. سيقوم فريق الإشراف بمراجعة هذا المنشور، وتم إخفاؤه من خلاصتك.'
        : 'Thank you for letting us know. Our moderation team will review this post, and it has been hidden from your feed.'
    );
  };

  const handleOpenComments = (post) => {
    // Find the latest version of post from feedPosts to ensure commentsList is fresh
    const freshPost = feedPosts.find(p => p.id === post.id) || post;
    commentsSlideAnim.setValue(500);
    isCommentsExpandedRef.current = false;
    commentsHeightAnim.setValue(DEFAULT_COMMENTS_HEIGHT);
    setActiveCommentsPost(freshPost);
    setCommentInputText('');
    setReplyingTo(null);
    Animated.spring(commentsSlideAnim, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  };

  const handleStartReply = (comment, specificAuthor) => {
    const authorToReply = specificAuthor || comment.author;
    setReplyingTo({
      commentId: comment.id,
      author: authorToReply,
    });
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  const handleSubmitComment = () => {
    if (!commentInputText.trim() || !activeCommentsPost) return;

    const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
    const currentHandle = currentUser ? `@${currentUser.fullName.toLowerCase().replace(/\s+/g, '')}` : '@guest';

    if (replyingTo) {
      // It's a reply to an existing comment
      const newReply = {
        id: `r_${Date.now()}`,
        author: currentAuthorName,
        handle: currentHandle,
        avatar: currentUser?.avatar || null,
        avatarType: currentUser?.avatar ? 'image' : 'icon',
        time: isRtl ? 'الآن' : 'Just now',
        content: commentInputText.trim(),
        likes: 0,
        liked: false,
      };

      const updateRepliesOnPost = (p) => {
        if (p.id !== activeCommentsPost.id) return p;
        const updatedComments = (p.commentsList || []).map((c) => {
          if (c.id === replyingTo.commentId) {
            const currentReplies = c.replies || [];
            return {
              ...c,
              replies: [...currentReplies, newReply],
            };
          }
          return c;
        });

        const totalCount = updatedComments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);
        return {
          ...p,
          commentsList: updatedComments,
          comments: totalCount,
        };
      };

      setFeedPosts((prev) => prev.map(updateRepliesOnPost));
      setActiveCommentsPost((prev) => (prev ? updateRepliesOnPost(prev) : null));
      setReplyingTo(null);
      setCommentInputText('');
      return;
    }

    // Top-level comment
    const newComment = {
      id: `c_${Date.now()}`,
      author: currentAuthorName,
      handle: currentHandle,
      avatar: currentUser?.avatar || null,
      avatarType: currentUser?.avatar ? 'image' : 'icon',
      time: isRtl ? 'الآن' : 'Just now',
      content: commentInputText.trim(),
      likes: 0,
      liked: false,
      replies: [],
    };

    const updateCommentsOnPost = (p) => {
      if (p.id !== activeCommentsPost.id) return p;
      const updatedComments = [...(p.commentsList || []), newComment];
      const totalCount = updatedComments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);
      return {
        ...p,
        commentsList: updatedComments,
        comments: totalCount,
      };
    };

    setFeedPosts((prev) => prev.map(updateCommentsOnPost));
    setActiveCommentsPost((prev) => (prev ? updateCommentsOnPost(prev) : null));
    setCommentInputText('');

    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollToEnd({ animated: true });
      }
    }, 120);
  };

  const handleToggleReplyLike = (postId, commentId, replyId) => {
    const updatePost = (p) => {
      if (p.id !== postId) return p;
      const updatedComments = (p.commentsList || []).map((c) => {
        if (c.id === commentId) {
          const updatedReplies = (c.replies || []).map((r) => {
            if (r.id === replyId) {
              const isLiked = !r.liked;
              return {
                ...r,
                liked: isLiked,
                likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 1) - 1),
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      });
      return { ...p, commentsList: updatedComments };
    };

    setFeedPosts((prev) => prev.map(updatePost));
    setActiveCommentsPost((prev) => (prev ? updatePost(prev) : null));
  };

  const handleToggleCommentLike = (postId, commentId) => {
    const updatePostComments = (p) => {
      if (p.id !== postId) return p;
      const updatedList = (p.commentsList || []).map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.liked;
          return {
            ...c,
            liked: isLiked,
            likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 1) - 1),
          };
        }
        return c;
      });
      return { ...p, commentsList: updatedList };
    };

    setFeedPosts((prev) => prev.map(updatePostComments));
    setActiveCommentsPost((prev) => (prev ? updatePostComments(prev) : null));
  };

  const handleLike = (id) => {
    setFeedPosts(feedPosts.map((post) => {
      if (post.id === id) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  // Filter posts based on view state
  // Filter posts based on view state
  const filteredPosts = feedPosts.filter((post) => {
    if (reportedPostIds.includes(post.id)) {
      return false;
    }
    if (showProfile) {
      const targetAuthor = selectedUserProfile?.author || currentAuthorName;
      return post.author === targetAuthor;
    }

    // Community Search Query Matching
    if (communitySearch.trim()) {
      const q = communitySearch.toLowerCase().trim();
      const contentMatches = Boolean(post.content && post.content.toLowerCase().includes(q));
      const authorMatches = Boolean(post.author && post.author.toLowerCase().includes(q));
      const handleMatches = Boolean(post.handle && post.handle.toLowerCase().includes(q));
      const vehicleMatches = Boolean(post.vehicle && post.vehicle.toLowerCase().includes(q));
      const locationMatches = Boolean(post.location && post.location.toLowerCase().includes(q));
      return contentMatches || authorMatches || handleMatches || vehicleMatches || locationMatches;
    }
    if (selectedFeed === 'messages') {
      return false;
    }
    if (selectedFeed === 'marketplace') {
      const isMarket = post.isMarketplace === true;
      if (!isMarket) return false;
      if (!marketSearch.trim()) return true;
      const query = marketSearch.toLowerCase().trim();
      const titleMatches = post.content && post.content.toLowerCase().includes(query);
      const authorMatches = post.author && post.author.toLowerCase().includes(query);
      const locationMatches = post.location && post.location.toLowerCase().includes(query);
      return titleMatches || authorMatches || locationMatches;
    }
    // Exclude marketplace items from standard feeds
    if (post.isMarketplace) return false;
    
    if (selectedFeed === 'overall') return true;
    return post.vehicle === 'Hyundai Coupe' || post.vehicle === 'General' || post.author === 'Guest User';
  });

  // Calculate active user stats for profile card
  const currentAuthorName = currentUser ? currentUser.fullName : 'Guest User';
  const activeProfileUser = selectedUserProfile || {
    author: currentAuthorName,
    handle: `@${currentAuthorName.toLowerCase().replace(/[\s\W]+/g, '')}`,
    avatar: null,
    avatarType: 'icon',
    vehicle: 'Hyundai Coupe (2005)',
    isSelf: true,
  };
  const isViewingSelf = activeProfileUser.isSelf || activeProfileUser.author === currentAuthorName;
  const targetUserPosts = feedPosts.filter(p => p.author === activeProfileUser.author);
  const profilePostsCount = targetUserPosts.length;
  const profileTotalLikes = targetUserPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const expandedPost = feedPosts.find((p) => p.id === expandedPostId);

  const renderGradientOverlay = () => {
    const lines = [];
    
    // 1. Solid off-white block covering the top region behind the persistent header (y = 0 to y = 20)
    lines.push(
      <View
        key="top-solid-block"
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 20, // Shifted up
          backgroundColor: COLORS.bgCreamy,
          zIndex: 3,
        }}
      />
    );

    // 2. 20 thin overlapping gradient lines from y = 20 to y = 30
    const numLines = 20;
    const startY = 20; // Shifted up
    const endY = 30; // Shifted up
    const step = (endY - startY) / numLines; // 0.5px steps
    
    for (let i = 0; i < numLines; i++) {
      const y = startY + i * step;
      const opacity = 1.0 - (i / numLines);
      lines.push(
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: step + 0.5,
            backgroundColor: COLORS.bgCreamy,
            opacity: opacity,
            zIndex: 3,
          }}
        />
      );
    }
    return lines;
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
      <View style={styles.mainLayout}>
        <View style={styles.contentBlock}>
          {/* Top Fade Gradient Overlay */}
          {renderGradientOverlay()}

          {/* Feed Post List */}
          <Animated.ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: showProfile ? topInset + 55 : topInset + 225 }
            ]}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          >
            {/* User Profile Summary Card */}
            {showProfile && (
              <View style={styles.profileSummaryCard}>
                {/* Banner Wallpaper behind avatar */}
                <View style={styles.profileBannerContainer}>
                  <Image
                    source={require('../../assets/Banner wallpaper.png')}
                    style={styles.profileBannerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.profileBannerOverlay} />
                </View>

                {/* Centered Profile Header Section (Overlapping the banner) */}
                <View style={styles.profileHeaderCenter}>
                  {/* Centered Avatar Wrapper */}
                  <View style={styles.profileAvatarWrapper}>
                    {activeProfileUser.avatar ? (
                      <Image
                        source={activeProfileUser.avatar}
                        style={styles.profileAvatarCenteredImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.profileAvatarCenteredIcon}>
                        <Ionicons name="person" size={40} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* Centered Name */}
                  <Text style={[styles.profileSummaryName, isRtl && styles.arabicBoldText]}>
                    {activeProfileUser.author}
                  </Text>

                  {/* Centered Handle */}
                  <Text style={styles.profileSummaryHandle}>
                    {activeProfileUser.handle}
                  </Text>

                  {/* Centered Action Button (Message) */}
                  <View style={styles.profileActionAreaCenter}>
                    {isViewingSelf ? (
                      <View style={[styles.selfBadge, isRtl && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="person-circle-outline" size={14} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                        <Text style={[styles.selfBadgeText, isRtl && styles.arabicBoldText]}>
                          {isRtl ? 'حسابك الشخصي' : 'Your Profile'}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.82}
                        style={[styles.profileMessageBtn, isRtl && { flexDirection: 'row-reverse' }]}
                        onPress={() => handleOpenDirectMessage(activeProfileUser)}
                      >
                        <Ionicons 
                          name="chatbubble-ellipses" 
                          size={16} 
                          color="#FFFFFF" 
                          style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} 
                        />
                        <Text 
                          numberOfLines={1}
                          style={[styles.profileMessageBtnText, isRtl && styles.arabicBoldText]}
                        >
                          {isRtl ? 'محادثة' : 'Message'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{profilePostsCount}</Text>
                    <Text style={[styles.statLabel, isRtl && styles.arabicBoldText]}>
                      {isRtl ? 'منشورات' : 'POSTS'}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{profileTotalLikes}</Text>
                    <Text style={[styles.statLabel, isRtl && styles.arabicBoldText]}>
                      {isRtl ? 'إعجابات' : 'LIKES'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Profile Feed Header Divider */}
            {showProfile && filteredPosts.length > 0 && (
              <View style={[styles.profileFeedHeaderRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="newspaper-outline" size={14} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
                  <Text style={[styles.profileFeedHeaderText, isRtl && styles.arabicBoldText]}>
                    {isRtl ? `منشورات ${activeProfileUser.author}` : `Posts by ${activeProfileUser.author}`}
                  </Text>
                </View>
                <View style={styles.profileFeedCountBadge}>
                  <Text style={styles.profileFeedCountBadgeText}>{filteredPosts.length}</Text>
                </View>
              </View>
            )}

            {/* Community Search People Section */}
            {Boolean(communitySearch.trim()) && matchedPeople.length > 0 && (
              <View style={[styles.peopleSectionContainer, isRtl && { alignItems: 'flex-end' }]}>
                <View style={[styles.peopleSectionHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="people" size={16} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
                  <Text style={[styles.peopleSectionTitle, isRtl && styles.arabicBoldText]}>
                    {isRtl ? 'الأشخاص' : 'People'}
                  </Text>
                  <View style={styles.peopleCountBadge}>
                    <Text style={styles.peopleCountBadgeText}>{matchedPeople.length}</Text>
                  </View>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.peopleScrollContent, isRtl && { flexDirection: 'row-reverse' }]}
                >
                  {matchedPeople.map((person, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.personCard}
                      activeOpacity={0.85}
                      onPress={() => handleOpenUserProfile(person)}
                    >
                      <View style={styles.personCardAvatarBox}>
                        {person.avatar ? (
                          <Image source={person.avatar} style={styles.personCardAvatar} resizeMode="cover" />
                        ) : (
                          <View style={styles.personCardAvatarPlaceholder}>
                            <Ionicons name="person" size={18} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.personCardName, isRtl && styles.arabicBoldText]} numberOfLines={1}>
                        {person.author}
                      </Text>
                      <Text style={styles.personCardHandle} numberOfLines={1}>
                        {person.handle}
                      </Text>
                      {Boolean(person.vehicle) && (
                        <Text style={styles.personCardVehicle} numberOfLines={1}>
                          🚗 {person.vehicle}
                        </Text>
                      )}
                      <View style={styles.personCardViewBtn}>
                        <Text style={[styles.personCardViewBtnText, isRtl && styles.arabicBoldText]}>
                          {isRtl ? 'عرض الصفحة' : 'View Profile'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Posts search status indicator */}
            {Boolean(communitySearch.trim()) && (
              <View style={[styles.communitySearchStatusRow, isRtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="newspaper-outline" size={14} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }} />
                <Text style={[styles.communitySearchStatusText, isRtl && styles.arabicBoldText]}>
                  {isRtl 
                    ? `المنشورات (${filteredPosts.length})` 
                    : `Posts (${filteredPosts.length})`}
                </Text>
              </View>
            )}

            {Boolean(communitySearch.trim()) && matchedPeople.length === 0 && filteredPosts.length === 0 ? (
              <View style={styles.communitySearchEmptyBox}>
                <View style={styles.communitySearchEmptyIcon}>
                  <Ionicons name="search" size={32} color={COLORS.bgBrand} />
                </View>
                <Text style={[styles.communitySearchEmptyTitle, isRtl && styles.arabicBoldText]}>
                  {isRtl ? 'لم يتم العثور على نتائج' : 'No people or posts found'}
                </Text>
                <Text style={[styles.communitySearchEmptySubtitle, isRtl && styles.arabicRegularText]}>
                  {isRtl 
                    ? `لا توجد نتائج تطابق "${communitySearch}". جرب البحث باسم أو كلمة أخرى.` 
                    : `No results matching "${communitySearch}". Try searching for another name or keyword.`}
                </Text>
                <TouchableOpacity
                  style={styles.communitySearchClearBtn}
                  onPress={() => setCommunitySearch('')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.communitySearchClearBtnText, isRtl && styles.arabicBoldText]}>
                    {isRtl ? 'مسح البحث' : 'Clear Search'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredPosts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color="rgba(77, 110, 79, 0.18)" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>
                  {showProfile 
                    ? "You haven't posted anything yet. Share your first status update on the feed!" 
                    : "No posts found in this feed."}
                </Text>
                {showProfile && (
                  <TouchableOpacity 
                    style={styles.emptyButton} 
                    onPress={() => handleShowProfile(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyButtonText}>Back to Feed</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : selectedFeed === 'marketplace' && !showProfile ? (
              // 2x2 Grid Layout for Marketplace (structured like Mechanics Screen)
              <View style={styles.gridContainer}>
                {filteredPosts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.marketGridCard} 
                    activeOpacity={0.85}
                    onPress={() => setExpandedPostId(post.id)}
                  >
                    {/* Cover Image fallback */}
                    <Image 
                      source={post.postImage || require('../../assets/modern_workshop_banner.png')} 
                      style={styles.marketGridCover} 
                    />

                    {/* Card Content Area */}
                    <View style={styles.marketGridDetails}>
                      {/* Top Info Area */}
                      <View>
                        {/* Seller & Badge */}
                        <View style={[styles.marketGridAuthorRow, isRtl && { flexDirection: 'row-reverse' }]}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={(e) => {
                              if (e && e.stopPropagation) e.stopPropagation();
                              handleOpenUserProfile(post);
                            }}
                            style={{ flexShrink: 1, marginRight: isRtl ? 0 : 6, marginLeft: isRtl ? 6 : 0 }}
                          >
                            <Text style={[styles.marketGridAuthor, isRtl && styles.arabicBoldText]} numberOfLines={1}>{post.author}</Text>
                          </TouchableOpacity>
                          <View style={styles.marketGridBadge}>
                            <Text style={styles.marketGridBadgeText}>FOR SALE</Text>
                          </View>
                        </View>

                        {/* Title (content truncated) */}
                        <Text style={styles.marketGridTitle} numberOfLines={2}>{post.content}</Text>

                        {/* Location */}
                        <View style={styles.marketGridLocationRow}>
                          <Ionicons name="location-sharp" size={11} color={COLORS.textMuted} style={{ marginRight: 2 }} />
                          <Text style={styles.marketGridLocation} numberOfLines={1}>{post.location || 'Cairo'}</Text>
                        </View>
                      </View>

                      {/* Bottom Info Area */}
                      <View>
                        <View style={styles.marketGridDivider} />
                        <View style={styles.marketGridPriceRow}>
                          <Text style={styles.marketGridPrice}>{post.price || 'Ask Price'}</Text>
                          <View style={styles.marketGridContactPill}>
                            <Ionicons name="chatbubble-ellipses" size={10} color="#FFFFFF" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Standard Post list (Feed or Profile Mode)
              filteredPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>


                  {/* Author Info */}
                  <View style={[styles.authorRow, isRtl && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity 
                      style={[styles.authorLeft, isRtl && { flexDirection: 'row-reverse' }]}
                      activeOpacity={0.7}
                      onPress={() => handleOpenUserProfile(post)}
                    >
                      {post.avatarType === 'image' && post.avatar ? (
                        <Image source={post.avatar} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatarIcon}>
                          <Ionicons name="person" size={16} color="#FFFFFF" />
                        </View>
                      )}
                      <View style={[styles.authorDetails, isRtl ? { marginRight: 10, marginLeft: 0, alignItems: 'flex-end' } : { marginLeft: 10 }]}>
                        <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                          <Text style={[styles.authorName, isRtl && styles.arabicBoldText]}>{post.author}</Text>
                          {post.isMarketplace && (
                            <View style={styles.saleBadge}>
                              <Text style={styles.saleBadgeText}>FOR SALE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.authorHandle}>
                          {post.handle} • {post.time}
                          {post.location && ` • 📍 ${post.location}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {post.isMarketplace ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>{post.price}</Text>
                        </View>
                        <TouchableOpacity 
                          activeOpacity={0.6}
                          onPress={() => handleOpenReportModal(post)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={isRtl ? { marginRight: 8 } : { marginLeft: 8 }}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        activeOpacity={0.6}
                        onPress={() => handleOpenReportModal(post)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Content text */}
                  <Text style={styles.postText}>{post.content}</Text>

                  {/* Optional Image */}
                  {post.postImage && (
                    <Image source={post.postImage} style={styles.postCardImage} resizeMode="cover" />
                  )}

                  {/* Actions Row */}
                  <View style={styles.actionDivider} />
                  <View style={[styles.actionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.actionsLeftGroup, isRtl && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                        onPress={() => handleLike(post.id)}
                      >
                        <Ionicons 
                          name={post.liked ? "heart" : "heart-outline"} 
                          size={20} 
                          color={post.liked ? COLORS.accentRed : COLORS.textMuted} 
                        />
                        <Text style={[
                          styles.actionText,
                          post.liked && { color: COLORS.accentRed, fontWeight: '700' }
                        ]}>
                          {post.likes}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionButton, isRtl ? { marginRight: 20 } : { marginLeft: 20 }]}
                        activeOpacity={0.7}
                        onPress={() => handleOpenComments(post)}
                      >
                        <Ionicons name="chatbubble-outline" size={19} color={COLORS.textMuted} />
                        <Text style={styles.actionText}>{post.comments || (post.commentsList ? post.commentsList.length : 0)}</Text>
                      </TouchableOpacity>
                    </View>

                    {post.isMarketplace && (
                      <TouchableOpacity style={styles.contactSellerButton} activeOpacity={0.8}>
                        <Ionicons name="chatbubble-ellipses" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.contactSellerText}>Message Seller</Text>
                      </TouchableOpacity>
                    )}
                  </View>


                </View>
              ))
            )}
          </Animated.ScrollView>

          {/* Persistent Community Header (Search + Messages + Tabs) */}
          <View 
            style={[
              styles.persistentCommunityHeader,
              {
                paddingTop: topInset + 6,
                backgroundColor: COLORS.bgCreamy,
              }
            ]}
          >
            {showProfile ? (
              // Profile Mode Header
              <TouchableOpacity 
                onPress={() => handleShowProfile(false)} 
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              >
                <Ionicons name={isRtl ? "arrow-forward-outline" : "arrow-back-outline"} size={14} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                <Text style={[styles.backButtonText, isRtl && styles.arabicBoldText]}>{isRtl ? 'العودة للمجتمع' : 'Back to Feed'}</Text>
              </TouchableOpacity>
            ) : (
              // Feed Mode Header: Search Bar + Messages on top, then My Car / Feed / Souq below
              <View style={{ width: '100%' }}>
                {/* Top Search Bar & Messages Row */}
                <View style={[styles.topSearchHeaderRow, isRtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.communitySearchBar, isRtl ? { marginLeft: 10 } : { marginRight: 10 }, isRtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="search" size={17} color={COLORS.textMuted} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                    <TextInput
                      style={[styles.communitySearchInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                      placeholder={isRtl ? "ابحث عن أشخاص أو منشورات..." : "Search people or posts..."}
                      placeholderTextColor="#A0A0A0"
                      value={communitySearch}
                      onChangeText={setCommunitySearch}
                      returnKeyType="search"
                    />
                    {Boolean(communitySearch) && (
                      <TouchableOpacity onPress={() => setCommunitySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Messages Icon */}
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setShowMessagesPage(true)}
                    style={styles.messagesHeaderIcon}
                  >
                    <Ionicons name="chatbox-ellipses-outline" size={22} color={COLORS.bgBrand} />
                  </TouchableOpacity>
                </View>

                {/* Feed Segmented Selector Row (My Car, Feed, Souq) */}
                <View style={[styles.selectorContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('active'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[styles.selectorTab, selectedFeed === 'active' && styles.selectorTabActive]}
                  >
                    <Ionicons 
                      name={selectedFeed === 'active' ? 'car' : 'car-outline'} 
                      size={15} 
                      color={selectedFeed === 'active' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                      style={{ marginBottom: 3 }}
                    />
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'active' ? styles.selectorTextSelected : styles.selectorTextUnselected,
                      isRtl && styles.arabicBoldText
                    ]}>
                      {isRtl ? 'سيارتي' : 'My Car'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('overall'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[styles.selectorTab, selectedFeed === 'overall' && styles.selectorTabActive]}
                  >
                    <Ionicons 
                      name={selectedFeed === 'overall' ? 'chatbubbles' : 'chatbubbles-outline'} 
                      size={15} 
                      color={selectedFeed === 'overall' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                      style={{ marginBottom: 3 }}
                    />
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'overall' ? styles.selectorTextSelected : styles.selectorTextUnselected,
                      isRtl && styles.arabicBoldText
                    ]}>
                      {isRtl ? 'المنشورات' : 'Feed'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedFeed('marketplace'); setExpandedPostId(null); setMarketSearch(''); }}
                    style={[styles.selectorTab, selectedFeed === 'marketplace' && styles.selectorTabActive]}
                  >
                    <Ionicons 
                      name={selectedFeed === 'marketplace' ? 'pricetag' : 'pricetag-outline'} 
                      size={15} 
                      color={selectedFeed === 'marketplace' ? COLORS.bgBrand : 'rgba(77, 110, 79, 0.55)'} 
                      style={{ marginBottom: 3 }}
                    />
                    <Text style={[
                      styles.selectorText,
                      selectedFeed === 'marketplace' ? styles.selectorTextSelected : styles.selectorTextUnselected,
                      isRtl && styles.arabicBoldText
                    ]}>
                      {isRtl ? 'سوق' : 'Souq'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Premium Post Composition Box / List Item Trigger */}
            {!showProfile && (
              <Animated.View style={{
                opacity: composerOpacity,
                transform: [{ translateY: composerTranslateY }],
                width: '100%',
              }}>
                {selectedFeed === 'marketplace' ? (
                  <View style={styles.marketControlsContainer}>
                    <View style={styles.marketSearchEntity}>
                      <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.marketSearchInput}
                        placeholder="Search items, location, sellers..."
                        placeholderTextColor="#ADADAD"
                        value={marketSearch}
                        onChangeText={setMarketSearch}
                      />
                      {marketSearch.trim().length > 0 && (
                        <TouchableOpacity onPress={() => setMarketSearch('')}>
                          <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      style={styles.marketListEntityBtn}
                      onPress={() => setShowListingPage(true)}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.marketListEntityText}>LIST A NEW ITEM</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    <View style={styles.composerContainer}>
                      <View style={[styles.composerRow, isRtl && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => handleOpenUserProfile({ author: currentAuthorName, isSelf: true })}
                          style={styles.composerAvatar}
                        >
                          <Ionicons name="person" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.postComposer}>

                          {/* Top Part: Input Area wrapped in Touchable to open Modal */}
                          <View style={[styles.composerTopRow, { position: 'relative' }]}>
                            <TextInput
                              style={[styles.composerInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                              placeholder={isRtl ? "شارك تحديث سيارتك الجديد..." : "Share your latest car update..."}
                              placeholderTextColor="#ADADAD"
                              value=""
                              editable={false}
                              multiline={true}
                            />
                            <TouchableOpacity 
                              activeOpacity={0.9}
                              onPress={() => setCreatePostModalVisible(true)}
                              style={StyleSheet.absoluteFill}
                            />
                          </View>
                          
                          {/* Bottom Part: Media attachments & POST button */}
                          <View style={[styles.composerBottomRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            {/* Attachment Icons */}
                            <View style={[styles.composerIconsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="videocam-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => {
                                  setCreatePostModalVisible(true);
                                  pickPostImage();
                                }}
                              >
                                <Ionicons name="image-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="link-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.composerIconButton} 
                                activeOpacity={0.7}
                                onPress={() => setCreatePostModalVisible(true)}
                              >
                                <Ionicons name="location-outline" size={20} color={COLORS.bgBrand} />
                              </TouchableOpacity>
                            </View>

                            {/* Post Action */}
                            <TouchableOpacity 
                              style={styles.postButton} 
                              onPress={() => setCreatePostModalVisible(true)} 
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.postButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                                {isRtl ? 'نشر' : 'POST'}
                              </Text>
                            </TouchableOpacity>
                          </View>


                        </View>
                      </View>
                    </View>

                    {/* Facebook-style Create Post Modal */}
                    <Modal
                      visible={createPostModalVisible}
                      animationType="slide"
                      transparent={false}
                      onRequestClose={() => {
                        setCreatePostModalVisible(false);
                        setSelectedImage(null);
                        setStatusText('');
                      }}
                    >
                      <SafeAreaView style={[styles.fbModalContainer, { backgroundColor: COLORS.white }]}>
                        <KeyboardAvoidingView
                          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                          style={{ flex: 1 }}
                        >
                          {/* Header */}
                          <View style={[styles.fbModalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                              onPress={() => {
                                setCreatePostModalVisible(false);
                                setSelectedImage(null);
                                setStatusText('');
                              }}
                              style={styles.fbModalCloseBtn}
                            >
                              <Ionicons name="close" size={24} color={COLORS.bgBrand} />
                            </TouchableOpacity>
                            <Text style={[styles.fbModalTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                              {isRtl ? 'إنشاء منشور' : 'Create Post'}
                            </Text>
                            <TouchableOpacity
                              onPress={handleCreatePost}
                              disabled={!statusText.trim() && !selectedImage}
                              style={[
                                styles.fbModalPostBtn,
                                (!statusText.trim() && !selectedImage) && { backgroundColor: '#E0E0E0' }
                              ]}
                            >
                              <Text style={[
                                styles.fbModalPostBtnText,
                                (!statusText.trim() && !selectedImage) && { color: '#ADADAD' },
                                isRtl && { fontFamily: 'AlkhalilArabic-Bold' }
                              ]}>
                                {isRtl ? 'نشر' : 'Post'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* User Profile Info */}
                          <View style={[styles.fbModalUserInfoRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <View style={styles.fbComposerAvatarLarge}>
                              <Ionicons name="person" size={24} color="#FFFFFF" />
                            </View>
                            <View style={[styles.fbModalUserMeta, isRtl ? { alignItems: 'flex-end', marginRight: 12 } : { alignItems: 'flex-start', marginLeft: 12 }]}>
                              <Text style={[styles.fbModalUserName, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                                {currentUser ? currentUser.fullName : (isRtl ? 'مستخدم زائر' : 'Guest User')}
                              </Text>
                              <View style={[styles.fbModalPrivacyBadge, isRtl && { flexDirection: 'row-reverse' }]}>
                                <Ionicons name="globe-outline" size={11} color={COLORS.textMuted} />
                                <Text style={[styles.fbModalPrivacyText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', marginLeft: 0, marginRight: 4 }]}>
                                  {isRtl ? 'عام' : 'Public'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Input Box */}
                          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
                            <TextInput
                              style={[
                                styles.fbModalInput,
                                isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 17 }
                              ]}
                              placeholder={isRtl ? 'ماذا يدور في ذهنك؟' : "What's on your mind?"}
                              placeholderTextColor="#ADADAD"
                              value={statusText}
                              onChangeText={setStatusText}
                              multiline={true}
                              autoFocus={true}
                            />

                            {/* Preview Attached Image */}
                            {selectedImage && (
                              <View style={styles.fbImagePreviewContainer}>
                                <Image source={{ uri: selectedImage }} style={styles.fbImagePreview} />
                                <TouchableOpacity
                                  onPress={() => setSelectedImage(null)}
                                  style={styles.fbImagePreviewRemove}
                                >
                                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </ScrollView>

                          {/* Bottom Actions Row */}
                          <View style={[styles.fbModalBottomBar, isRtl && { flexDirection: 'row-reverse' }]}>
                            <Text style={[styles.fbAddPostText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>
                              {isRtl ? 'إضافة إلى منشورك' : 'Add to your post'}
                            </Text>
                            <View style={[styles.fbModalToolbarIcons, isRtl && { flexDirection: 'row-reverse' }]}>
                              <TouchableOpacity
                                onPress={pickPostImage}
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="image" size={24} color="#4CAF50" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert(isRtl ? 'الموقع' : 'Location', isRtl ? 'ميزة تحديد الموقع ستتوفر قريباً!' : 'Location tagging coming soon!')}
                              >
                                <Ionicons name="location" size={24} color="#FF5722" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.fbToolbarIconButton}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert(isRtl ? 'إشارة' : 'Tag', isRtl ? 'ميزة الإشارة إلى المستخدمين ستتوفر قريباً!' : 'User tagging coming soon!')}
                              >
                                <Ionicons name="person-add" size={24} color="#1877F2" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </KeyboardAvoidingView>
                      </SafeAreaView>
                    </Modal>
                  </View>
                )}
              </Animated.View>
            )}

          {/* Expanded Post Overlay (styled like Mechanics details) */}
          {expandedPost && (
            <Animated.View style={styles.overlayContainer}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bgCreamy }]}>
                <View style={styles.overlayCardContainer}>
                  <View style={styles.expandedCard}>
                    {/* Close Button X */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.closeButton}
                      onPress={() => setExpandedPostId(null)}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Cover Image */}
                    <Image 
                      source={expandedPost.postImage || require('../../assets/modern_workshop_banner.png')} 
                      style={styles.expandedCover} 
                    />

                    {/* Price Tag Badge */}
                    <View style={styles.expandedPriceBadge}>
                      <Text style={styles.expandedPriceBadgeText}>{expandedPost.price || 'Ask Price'}</Text>
                    </View>

                    {/* Content Area */}
                    <View style={styles.expandedDetails}>
                      {/* Seller Info */}
                      <TouchableOpacity 
                        style={[styles.expandedSellerHeader, isRtl && { flexDirection: 'row-reverse' }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setExpandedPostId(null);
                          handleOpenUserProfile(expandedPost);
                        }}
                      >
                        {expandedPost.avatarType === 'image' && expandedPost.avatar ? (
                          <Image source={expandedPost.avatar} style={styles.avatarLargeImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.avatarLarge}>
                            <Ionicons name="person" size={24} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={[isRtl ? { marginRight: 12, alignItems: 'flex-end' } : { marginLeft: 12 }]}>
                          <Text style={[styles.expandedSellerName, isRtl && styles.arabicBoldText]}>{expandedPost.author}</Text>
                          <Text style={styles.expandedSellerHandle}>
                            {expandedPost.handle} • {expandedPost.time}
                            {expandedPost.location && ` • 📍 ${expandedPost.location}`}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isRtl ? "chevron-back" : "chevron-forward"} 
                          size={18} 
                          color={COLORS.textMuted} 
                          style={isRtl ? { marginRight: 'auto' } : { marginLeft: 'auto' }} 
                        />
                      </TouchableOpacity>

                      {/* Description */}
                      <Text style={styles.expandedPostDescription}>
                        {expandedPost.content}
                      </Text>

                      {/* Bottom Section */}
                      <View style={styles.expandedBottomContainer}>
                        <View style={styles.cardDivider} />
                        
                        {/* Actions Row */}
                        <View style={styles.expandedActionsRow}>
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            style={styles.expandedActionButtonOutline}
                            onPress={() => handleLike(expandedPost.id)}
                          >
                            <Ionicons 
                              name={expandedPost.liked ? "heart" : "heart-outline"} 
                              size={20} 
                              color={expandedPost.liked ? COLORS.accentRed : COLORS.bgBrand} 
                            />
                            <Text style={[styles.actionButtonLabel, expandedPost.liked && { color: COLORS.accentRed }]}>
                              {expandedPost.liked ? 'Saved' : 'Save'} ({expandedPost.likes})
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            activeOpacity={0.7} 
                            style={styles.expandedActionButtonSolid}
                            onPress={() => console.log('Message seller for ' + expandedPost.id)}
                          >
                            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                            <Text style={styles.actionButtonLabelSolid}>Message Seller</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
          <Modal
            visible={showListingPage}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={() => setShowListingPage(false)}
          >
            <View style={[styles.newPageContainer, { backgroundColor: COLORS.bgCreamy }]}>
              <StatusBar barStyle="light-content" backgroundColor={COLORS.bgBrand} />
              <View style={styles.newPageHeader}>
                <TouchableOpacity 
                  style={styles.newPageBackButton} 
                  onPress={() => setShowListingPage(false)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                >
                  <Ionicons name="chevron-back" size={18} color={COLORS.bgBrand} style={{ marginRight: 2 }} />
                  <Text style={styles.newPageBackButtonText}>Souq</Text>
                </TouchableOpacity>
                <Text style={styles.newPageHeaderTitle}>List an Item</Text>
                <View style={{ width: 110 }} />
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.newPageFormContent}
                >
                  <View style={styles.newPageFormCard}>
                    <Text style={styles.newPageLabel}>Item Title</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. BBS LM rims, exhaust system..."
                      placeholderTextColor="#ADADAD"
                      value={listingTitle}
                      onChangeText={setListingTitle}
                    />

                    <Text style={styles.newPageLabel}>Price</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. $1,200 or EGP 15,000"
                      placeholderTextColor="#ADADAD"
                      value={listingPrice}
                      onChangeText={setListingPrice}
                    />

                    <Text style={styles.newPageLabel}>Location</Text>
                    <TextInput
                      style={styles.newPageInput}
                      placeholder="e.g. Heliopolis, Maadi"
                      placeholderTextColor="#ADADAD"
                      value={listingLocation}
                      onChangeText={setListingLocation}
                    />

                    <Text style={styles.newPageLabel}>Item Image</Text>
                    <TouchableOpacity 
                      style={styles.imagePickerBtn}
                      onPress={handlePickListingImage}
                      activeOpacity={0.8}
                    >
                      {listingImageUri ? (
                        <View style={{ position: 'relative', width: '100%', height: 180, borderRadius: 10, overflow: 'hidden' }}>
                          <Image source={{ uri: listingImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          <TouchableOpacity 
                            style={styles.removeImagePill}
                            onPress={() => setListingImageUri(null)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.imagePickerPlaceholder}>
                          <Ionicons name="camera-outline" size={28} color={COLORS.bgBrand} />
                          <Text style={styles.imagePickerPlaceholderText}>Upload Product Image</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.newPageLabel}>Description</Text>
                    <TextInput
                      style={[styles.newPageInput, { height: 120, textAlignVertical: 'top', paddingVertical: 12 }]}
                      placeholder="Describe fitment, condition, age, defects, etc..."
                      placeholderTextColor="#ADADAD"
                      multiline={true}
                      numberOfLines={5}
                      value={listingDesc}
                      onChangeText={setListingDesc}
                    />

                    <TouchableOpacity 
                      style={styles.newPagePublishBtn} 
                      activeOpacity={0.8}
                      onPress={handlePublishListing}
                    >
                      <Text style={styles.newPagePublishBtnText}>Publish Listing</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </Modal>


          {/* Messages & Chat Modal */}
          <Modal
            visible={showMessagesPage}
            transparent={false}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={directMessageUser ? handleCloseDirectMessage : () => setShowMessagesPage(false)}
          >
            <SafeAreaView style={[styles.newPageContainer, { backgroundColor: COLORS.bgCreamy }]}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={COLORS.bgCreamy} />

              {directMessageUser ? (
                // --- CHAT CONVERSATION VIEW (Inside Messages Page) ---
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                  {/* DM Header */}
                  <View style={[styles.dmHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity 
                      style={[styles.dmBackButton, isRtl && { flexDirection: 'row-reverse' }]} 
                      onPress={handleCloseDirectMessage}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons 
                        name={isRtl ? "chevron-forward" : "chevron-back"} 
                        size={22} 
                        color={COLORS.bgBrand} 
                      />
                      {openedFromMessagesPage && (
                        <Text style={[styles.dmBackBtnText, isRtl ? { marginRight: 3 } : { marginLeft: 3 }]}>
                          {isRtl ? 'الرسائل' : 'Inbox'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* User Identity in Header */}
                    <View style={[styles.dmUserHeaderInfo, isRtl && { flexDirection: 'row-reverse' }]}>
                      {directMessageUser?.avatar ? (
                        <Image source={directMessageUser.avatar} style={styles.dmAvatarSmall} resizeMode="cover" />
                      ) : (
                        <View style={styles.dmAvatarSmallIcon}>
                          <Ionicons name="person" size={15} color="#FFFFFF" />
                        </View>
                      )}
                      <View style={[isRtl ? { marginRight: 8, alignItems: 'flex-end' } : { marginLeft: 8 }]}>
                        <Text style={[styles.dmUserName, isRtl && styles.arabicBoldText]}>
                          {directMessageUser?.author}
                        </Text>
                        <View style={[styles.dmOnlineRow, isRtl && { flexDirection: 'row-reverse' }]}>
                          <View style={styles.dmOnlineDot} />
                          <Text style={styles.dmOnlineText}>
                            {isRtl ? 'متصل الآن' : 'Active now'}
                          </Text>
                        </View>
                      </View>
                    </View>


                  </View>

                  {/* Messages Scroll View */}
                  <ScrollView
                    ref={dmScrollRef}
                    style={styles.dmMessagesScroll}
                    contentContainerStyle={styles.dmMessagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    onTouchStart={handleDismissKeyboard}
                    onContentSizeChange={() => dmScrollRef.current?.scrollToEnd({ animated: true })}
                  >
                    {/* Profile Intro Banner inside Chat */}
                    <View style={styles.dmIntroCard}>
                      {directMessageUser?.avatar ? (
                        <Image source={directMessageUser.avatar} style={styles.dmIntroAvatar} resizeMode="cover" />
                      ) : (
                        <View style={styles.dmIntroAvatarIcon}>
                          <Ionicons name="person" size={26} color="#FFFFFF" />
                        </View>
                      )}
                      <Text style={[styles.dmIntroName, isRtl && styles.arabicBoldText]}>
                        {directMessageUser?.author}
                      </Text>
                      <Text style={styles.dmIntroHandle}>{directMessageUser?.handle}</Text>
                      <Text style={[styles.dmIntroText, isRtl && styles.arabicRegularText]}>
                        {isRtl
                          ? `هذه بداية محادثتك المباشرة مع ${directMessageUser?.author}. تبادلا الخبرات واستفسرا عن التعديلات وقطع الغيار.`
                          : `This is the start of your direct conversation with ${directMessageUser?.author}. Connect, ask about car builds, or trade parts.`}
                      </Text>
                    </View>

                    {/* Chat Messages */}
                    {((directMessageUser && dmHistory[directMessageUser.author]) || []).map((msg) => {
                      const isMe = msg.sender === 'user';
                      return (
                        <View
                          key={msg.id}
                          style={[
                            styles.dmMessageRow,
                            isMe ? styles.dmMessageRowMe : styles.dmMessageRowThem,
                            isRtl && { flexDirection: isMe ? 'row-reverse' : 'row' }
                          ]}
                        >
                          <View
                            style={[
                              styles.dmBubble,
                              isMe ? styles.dmBubbleMe : styles.dmBubbleThem,
                            ]}
                          >
                            {/* Attached Image inside bubble */}
                            {msg.mediaType === 'image' && msg.mediaUri && (
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setViewingMedia({ type: 'image', uri: msg.mediaUri })}
                                style={styles.dmBubbleMediaWrapper}
                              >
                                <Image source={{ uri: msg.mediaUri }} style={styles.dmBubbleImage} resizeMode="cover" />
                                <View style={styles.dmExpandMediaIcon}>
                                  <Ionicons name="expand" size={14} color="#FFFFFF" />
                                </View>
                              </TouchableOpacity>
                            )}

                            {/* Attached Video inside bubble */}
                            {msg.mediaType === 'video' && msg.mediaUri && (
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setViewingMedia({ type: 'video', uri: msg.mediaUri, duration: msg.mediaDuration })}
                                style={styles.dmBubbleVideoCard}
                              >
                                <View style={styles.dmBubbleVideoThumbnail}>
                                  <View style={styles.dmVideoPlayBtnCircle}>
                                    <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginLeft: 3 }} />
                                  </View>
                                  <View style={styles.dmVideoBadgeRow}>
                                    <View style={styles.dmVideoTypeBadge}>
                                      <Ionicons name="videocam" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                                      <Text style={styles.dmVideoBadgeText}>VIDEO</Text>
                                    </View>
                                    {msg.mediaDuration ? (
                                      <View style={styles.dmVideoDurationBadge}>
                                        <Text style={styles.dmVideoBadgeText}>{'0:' + (msg.mediaDuration < 10 ? '0' : '') + msg.mediaDuration}</Text>
                                      </View>
                                    ) : null}
                                  </View>
                                </View>
                                <View style={styles.dmVideoCardFooter}>
                                  <Text style={[styles.dmVideoCardLabel, isMe ? styles.dmVideoCardLabelMe : styles.dmVideoCardLabelThem]}>
                                    {isRtl ? 'تسجيل فيديو • انقر للعرض' : 'Video recording • Tap to view'}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}

                            {/* Voice Note / Audio Message */}
                            {msg.mediaType === 'audio' && (
                              <TouchableOpacity
                                style={[
                                  styles.dmAudioCard,
                                  isMe ? styles.dmAudioCardMe : styles.dmAudioCardThem,
                                  isRtl && { flexDirection: 'row-reverse' }
                                ]}
                                onPress={() => handleTogglePlayAudio(msg.id)}
                                activeOpacity={0.8}
                              >
                                <View style={[
                                  styles.dmAudioPlayBtn,
                                  isMe ? styles.dmAudioPlayBtnMe : styles.dmAudioPlayBtnThem
                                ]}>
                                  <Ionicons
                                    name={playingAudioId === msg.id ? "pause" : "play"}
                                    size={15}
                                    color={isMe ? "#FFFFFF" : "#FFFFFF"}
                                    style={playingAudioId === msg.id ? {} : { marginLeft: 2 }}
                                  />
                                </View>
                                <View style={styles.dmAudioWaveCol}>
                                  <View style={[styles.dmAudioWaveformRow, isRtl && { flexDirection: 'row-reverse' }]}>
                                    {[10, 18, 8, 16, 22, 13, 20, 9, 17, 24, 14, 19, 11, 16].map((barH, barIdx) => {
                                      const isPlayed = playingAudioId === msg.id;
                                      return (
                                        <View
                                          key={barIdx}
                                          style={[
                                            styles.dmAudioWaveBar,
                                            { height: barH },
                                            isMe ? styles.dmAudioWaveBarMe : styles.dmAudioWaveBarThem,
                                            isPlayed && styles.dmAudioWaveBarActive
                                          ]}
                                        />
                                      );
                                    })}
                                  </View>
                                  <View style={[styles.dmAudioMetaRow, isRtl && { flexDirection: 'row-reverse' }]}>
                                    <Text style={[styles.dmAudioDurationText, isMe ? styles.dmAudioDurationMe : styles.dmAudioDurationThem]}>
                                      {msg.audioDuration || '0:03'}
                                    </Text>
                                    <Text style={[styles.dmAudioBadgeText, isMe ? styles.dmAudioDurationMe : styles.dmAudioDurationThem]}>
                                      {isRtl ? 'تسجيل صوتي' : 'Voice note'}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            )}

                            {/* Message Text */}
                            {Boolean(msg.text) && (
                              <Text style={[
                                styles.dmBubbleText,
                                isMe ? styles.dmBubbleTextMe : styles.dmBubbleTextThem,
                                isRtl && { textAlign: 'right' },
                                isRtl && styles.arabicRegularText
                              ]}>
                                {isRtl ? (msg.textAr || msg.text) : msg.text}
                              </Text>
                            )}

                            <Text style={[
                              styles.dmBubbleTime,
                              isMe ? styles.dmBubbleTimeMe : styles.dmBubbleTimeThem,
                            ]}>
                              {msg.time}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  {/* Staged Attachment Preview Bar */}
                  {attachedMedia && (
                    <View style={[styles.dmAttachedPreviewBar, isRtl && { flexDirection: 'row-reverse' }]}>
                      <View style={styles.dmAttachedThumbnailBox}>
                        {attachedMedia.type === 'image' ? (
                          <Image source={{ uri: attachedMedia.uri }} style={styles.dmAttachedThumbnailImg} />
                        ) : (
                          <View style={styles.dmAttachedVideoThumbnail}>
                            <Ionicons name="videocam" size={20} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={styles.dmAttachedTypePill}>
                          <Text style={styles.dmAttachedTypePillText}>
                            {attachedMedia.type === 'video' ? (isRtl ? 'فيديو' : 'Video') : (isRtl ? 'صورة' : 'Photo')}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.dmAttachedInfo, isRtl ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10 }]}>
                        <Text style={[styles.dmAttachedTitle, isRtl && styles.arabicBoldText]}>
                          {attachedMedia.type === 'video' ? (isRtl ? 'تسجيل فيديو مرفق' : 'Video recording attached') : (isRtl ? 'صورة مرفقة' : 'Image attached')}
                        </Text>
                        <Text style={styles.dmAttachedSubtitle}>
                          {isRtl ? 'أضف تعليقاً أو اضغط إرسال' : 'Add an optional caption or send'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.dmAttachedRemoveBtn}
                        onPress={() => setAttachedMedia(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={22} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Bottom Composer */}
                  {isRecordingVoice && isRecordingLocked ? (
                    /* Locked hands-free recording bar */
                    <View style={[styles.dmRecordingBar, isRtl && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity
                        style={[styles.dmRecordingCancelBtn, isRtl && { flexDirection: 'row-reverse' }]}
                        onPress={handleCancelVoiceRecording}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#E53935" />
                        <Text style={[styles.dmRecordingCancelText, isRtl && styles.arabicRegularText]}>
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </Text>
                      </TouchableOpacity>

                      <View style={[styles.dmRecordingStatus, isRtl && { flexDirection: 'row-reverse' }]}>
                        <View style={styles.dmRecordingDot} />
                        <Text style={styles.dmRecordingTimer}>
                          {formatAudioDuration(recordingDuration)}
                        </Text>
                        <View style={[styles.dmRecordingWaveBars, isRtl && { flexDirection: 'row-reverse' }]}>
                          {[10, 16, 22, 14, 20, 24, 13, 19].map((h, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.dmRecordingWaveBar,
                                { height: recordingDuration % 2 === 0 ? h : (26 - h / 2) }
                              ]}
                            />
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.dmRecordingSendBtn}
                        onPress={handleStopAndSendVoiceRecording}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="send"
                          size={16}
                          color="#FFFFFF"
                          style={isRtl ? { transform: [{ rotate: '180deg' }] } : { marginLeft: 2 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Unified Composer: Keeps the Mic Button Mounted without interrupting touch */
                    <View style={[styles.dmComposerContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                      {/* Holding overlay: shown only during active hold */}
                      {isRecordingVoice && !isRecordingLocked ? (
                        <View style={[styles.dmHoldingOverlay, isRtl && { flexDirection: 'row-reverse' }]} pointerEvents="none">
                          <View style={[styles.dmHoldingTimerRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <View style={styles.dmRecordingDot} />
                            <Text style={styles.dmRecordingTimer}>
                              {formatAudioDuration(recordingDuration)}
                            </Text>
                          </View>

                          <View style={[styles.dmSlideToCancelRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <Ionicons
                              name={isRtl ? "chevron-forward" : "chevron-back"}
                              size={16}
                              color={COLORS.textMuted}
                            />
                            <Text style={[styles.dmSlideToCancelText, isRtl && styles.arabicRegularText]}>
                              {isRtl ? "اسحب للإلغاء" : "Slide to cancel"}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={[styles.dmMediaActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                              style={styles.dmMediaActionBtn}
                              onPress={handlePickChatImage}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="image-outline" size={20} color={COLORS.bgBrand} />
                            </TouchableOpacity>
                          </View>

                          <TextInput
                            style={[
                              styles.dmInput,
                              isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }
                            ]}
                            placeholder={
                              attachedMedia
                                ? (isRtl ? "أضف تعليقاً على الوسائط..." : "Add a caption...")
                                : (isRtl ? "اكتب رسالة..." : "Type a message...")
                            }
                            placeholderTextColor="#A0A0A0"
                            value={dmInputText}
                            onChangeText={setDmInputText}
                            multiline
                          />
                        </>
                      )}

                      {Boolean(dmInputText.trim() || attachedMedia) ? (
                        <TouchableOpacity
                          style={styles.dmSendButton}
                          onPress={handleSendDirectMessage}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="send"
                            size={15}
                            color="#FFFFFF"
                            style={isRtl ? { transform: [{ rotate: '180deg' }] } : { marginLeft: 2 }}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={{ position: 'relative', alignItems: 'center' }}>
                          {/* Floating Lock indicator: ONLY VISIBLE WHILE ACTIVELY RECORDING (HOLDING) */}
                          {isRecordingVoice && !isRecordingLocked && (
                            <Animated.View
                              style={[
                                styles.dmLockIndicatorContainer,
                                { transform: [{ translateY: voiceDragY }] }
                              ]}
                              pointerEvents="none"
                            >
                              <View style={styles.dmLockBubble}>
                                <Ionicons name="lock-closed" size={16} color="#25D366" />
                                <Ionicons name="chevron-up" size={13} color="#888888" style={{ marginTop: 2 }} />
                              </View>
                            </Animated.View>
                          )}

                          {/* The ONE and ONLY Mic Button with panHandlers */}
                          <Animated.View
                            {...voicePanResponder.panHandlers}
                            style={[
                              styles.dmMicButton,
                              isRecordingVoice && styles.dmMicButtonActive,
                              {
                                transform: [
                                  { scale: micScaleAnim },
                                  { translateX: voiceDragX },
                                ]
                              }
                            ]}
                          >
                            <Ionicons
                              name="mic"
                              size={isRecordingVoice ? 22 : 18}
                              color="#FFFFFF"
                            />
                          </Animated.View>
                        </View>
                      )}
                    </View>
                  )}
                </KeyboardAvoidingView>
              ) : (
                // --- INBOX CONVERSATIONS LIST VIEW ---
                <TouchableWithoutFeedback onPress={handleDismissKeyboard} accessible={false}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.inboxHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity 
                        style={[styles.newPageBackButton, isRtl && { flexDirection: 'row-reverse' }]} 
                        onPress={() => {
                          setShowMessagesPage(false);
                          setDirectMessageUser(null);
                        }}
                        activeOpacity={0.8}
                        hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                      >
                        <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={18} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 2 } : { marginRight: 2 }} />
                        <Text style={[styles.newPageBackButtonText, isRtl && styles.arabicBoldText]}>{isRtl ? 'المجتمع' : 'Community'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Search Inbox */}
                    <View style={[styles.inboxSearchBar, isRtl && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="search" size={17} color={COLORS.textMuted} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                      <TextInput
                        style={[styles.inboxSearchInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                        placeholder={isRtl ? "بحث في المحادثات..." : "Search conversations..."}
                        placeholderTextColor="#A0A0A0"
                        value={inboxSearch}
                        onChangeText={setInboxSearch}
                      />
                      {Boolean(inboxSearch) && (
                        <TouchableOpacity onPress={() => setInboxSearch('')}>
                          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <ScrollView 
                      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}
                      keyboardDismissMode="on-drag"
                      keyboardShouldPersistTaps="handled"
                      onTouchStart={handleDismissKeyboard}
                    >
                    {Boolean(inboxSearch.trim()) && (
                      <View style={[styles.inboxSearchStatusRow, isRtl && { flexDirection: 'row-reverse' }]}>
                        <Text style={[styles.inboxSearchStatusText, isRtl && styles.arabicRegularText]}>
                          {isRtl
                            ? `${filteredConversations.length} محادثة مطابقة`
                            : `${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'} found`}
                        </Text>
                      </View>
                    )}

                    {filteredConversations.length === 0 ? (
                      <View style={styles.inboxEmptyContainer}>
                        <View style={styles.inboxEmptyIconBox}>
                          <Ionicons name="search" size={28} color={COLORS.bgBrand} />
                        </View>
                        <Text style={[styles.inboxEmptyTitle, isRtl && styles.arabicBoldText]}>
                          {isRtl ? 'لم يتم العثور على رسائل' : 'No messages or chats found'}
                        </Text>
                        <Text style={[styles.inboxEmptySubtitle, isRtl && styles.arabicRegularText]}>
                          {isRtl
                            ? `لا توجد محادثات أو رسائل تطابق "${inboxSearch}"`
                            : `No conversations or messages matching "${inboxSearch}"`}
                        </Text>
                        <TouchableOpacity
                          style={styles.inboxClearSearchBtn}
                          onPress={() => setInboxSearch('')}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.inboxClearSearchBtnText, isRtl && styles.arabicBoldText]}>
                            {isRtl ? 'مسح البحث' : 'Clear Search'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      filteredConversations.map(msg => (
                        <TouchableOpacity 
                          key={msg.id} 
                          style={[styles.messageRow, isRtl && { flexDirection: 'row-reverse' }]} 
                          activeOpacity={0.8}
                          onPress={() => {
                            handleOpenDirectMessage({
                              author: msg.user,
                              handle: msg.handle || ('@' + msg.user.toLowerCase().replace(/\s+/g, '')),
                              avatar: msg.avatar,
                              avatarType: msg.avatar ? 'image' : 'icon',
                            }, true);
                          }}
                        >
                          {msg.avatarType === 'image' && msg.avatar ? (
                            <Image source={msg.avatar} style={[styles.messageAvatar, { backgroundColor: 'transparent' }]} />
                          ) : (
                            <View style={styles.messageAvatar}>
                              <Ionicons name="person" size={20} color="#FFFFFF" />
                            </View>
                          )}
                          <View style={[styles.messageContent, isRtl ? { marginRight: 14 } : { marginLeft: 0 }]}>
                            <View style={[styles.messageHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                              <Text style={[styles.messageUser, isRtl && styles.arabicBoldText]}>{msg.user}</Text>
                              <Text style={styles.messageTime}>{msg.time}</Text>
                            </View>

                            {/* Matched message indicator tag */}
                            {Boolean(msg.matchReason) && (
                              <View style={[styles.inboxMatchedTag, isRtl && { alignSelf: 'flex-end' }]}>
                                <Ionicons name="chatbubble-ellipses-outline" size={11} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 3 } : { marginRight: 3 }} />
                                <Text style={[styles.inboxMatchedTagText, isRtl && styles.arabicRegularText]}>
                                  {msg.matchedSender ? `${msg.matchedSender}: ` : ''}{msg.matchReason}
                                </Text>
                              </View>
                            )}

                            <Text style={[styles.messageSnippet, msg.unread > 0 && styles.messageSnippetUnread, isRtl && { textAlign: 'right' }]} numberOfLines={1}>
                              {msg.displaySnippet || msg.lastMessage}
                            </Text>
                          </View>
                          {msg.unread > 0 && (
                            <View style={[styles.messageBadge, isRtl && { marginLeft: 0, marginRight: 12 }]}>
                              <Text style={styles.messageBadgeText}>{msg.unread}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </SafeAreaView>
          </Modal>

          {/* Interactive Comments Modal / Bottom Sheet */}
          <Modal
            visible={Boolean(activeCommentsPost)}
            animationType="none"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={() => setActiveCommentsPost(null)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.commentsBackdrop}
            >
              <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                activeOpacity={1} 
                onPress={() => setActiveCommentsPost(null)}
              />

              <Animated.View 
                style={[
                  styles.commentsSheetContainer, 
                  { 
                    backgroundColor: COLORS.bgCreamy, 
                    height: commentsHeightAnim,
                    transform: [{ translateY: commentsSlideAnim }]
                  }
                ]}
              >
                {/* Draggable Handle Bar Area */}
                <View 
                  style={styles.commentsHandleArea}
                  {...commentsPanResponder.panHandlers}
                >
                  <View style={styles.commentsHandleBar} />
                </View>

                {/* Header */}
                <View style={[styles.commentsHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.commentsHeaderTitle, isRtl && styles.arabicBoldText]}>
                      {isRtl ? 'التعليقات' : 'Comments'}
                    </Text>
                    <View style={[styles.commentsCountBadge, isRtl && { marginLeft: 0, marginRight: 8 }]}>
                      <Text style={styles.commentsCountBadgeText}>
                        {(activeCommentsPost?.commentsList || []).length}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.commentsCloseBtn} 
                    onPress={() => setActiveCommentsPost(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>



                {/* Comments List Scroll */}
                <ScrollView 
                  ref={commentsScrollRef}
                  style={styles.commentsListScroll}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {(activeCommentsPost?.commentsList || []).length === 0 ? (
                    <View style={styles.emptyCommentsBox}>
                      <Ionicons name="chatbubbles-outline" size={40} color="rgba(55, 99, 59, 0.25)" />
                      <Text style={[styles.emptyCommentsTitle, isRtl && styles.arabicBoldText]}>
                        {isRtl ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                      </Text>
                      <Text style={styles.emptyCommentsSubtitle}>
                        {isRtl ? 'كن أول من يشارك برأيه حول هذا المنشور!' : 'Be the first to share your thoughts on this post!'}
                      </Text>
                    </View>
                  ) : (
                    (activeCommentsPost?.commentsList || []).map((c) => (
                      <View key={c.id} style={[styles.commentItemRow, isRtl && { flexDirection: 'row-reverse' }]}>
                        {/* Avatar */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveCommentsPost(null);
                            handleOpenUserProfile(c);
                          }}
                        >
                          {c.avatarType === 'image' && c.avatar ? (
                            <Image source={c.avatar} style={styles.commentAvatar} />
                          ) : (
                            <View style={styles.commentAvatarIcon}>
                              <Ionicons name="person" size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Comment Bubble & Meta */}
                        <View style={[styles.commentBubbleContainer, isRtl ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10 }]}>
                          <View style={styles.commentBubble}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setActiveCommentsPost(null);
                                handleOpenUserProfile(c);
                              }}
                            >
                              <Text style={[styles.commentAuthorName, isRtl && styles.arabicBoldText]}>
                                {c.author}
                              </Text>
                            </TouchableOpacity>
                            <Text style={styles.commentBodyText}>{c.content}</Text>
                          </View>

                          {/* Time & Like toggle & Reply */}
                          <View style={[styles.commentMetaRow, isRtl && { flexDirection: 'row-reverse' }]}>
                            <Text style={styles.commentTimeText}>{c.time}</Text>
                            <TouchableOpacity
                              style={styles.commentReplyBtn}
                              activeOpacity={0.7}
                              onPress={() => handleStartReply(c)}
                            >
                              <Text style={[styles.commentReplyBtnText, isRtl && styles.arabicBoldText]}>
                                {isRtl ? 'رد' : 'Reply'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.commentLikeBtn, isRtl && { flexDirection: 'row-reverse' }]}
                              activeOpacity={0.7}
                              onPress={() => handleToggleCommentLike(activeCommentsPost.id, c.id)}
                            >
                              <Ionicons
                                name={c.liked ? "heart" : "heart-outline"}
                                size={13}
                                color={c.liked ? COLORS.accentRed : COLORS.textMuted}
                              />
                              {(c.likes > 0) && (
                                <Text style={[styles.commentLikeCount, c.liked && { color: COLORS.accentRed }]}>
                                  {c.likes}
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>

                          {/* Nested Replies */}
                          {c.replies && c.replies.length > 0 && (
                            <View style={[
                              styles.repliesListContainer, 
                              isRtl && { borderLeftWidth: 0, borderRightWidth: 1.5, paddingLeft: 0, paddingRight: 10, marginLeft: 0, marginRight: 6 }
                            ]}>
                              {c.replies.map((reply) => (
                                <View key={reply.id} style={[styles.replyItemRow, isRtl && { flexDirection: 'row-reverse' }]}>
                                  <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => {
                                      setActiveCommentsPost(null);
                                      handleOpenUserProfile(reply);
                                    }}
                                  >
                                    {reply.avatarType === 'image' && reply.avatar ? (
                                      <Image source={reply.avatar} style={styles.replyAvatar} />
                                    ) : (
                                      <View style={styles.replyAvatarIcon}>
                                        <Ionicons name="person" size={11} color="#FFFFFF" />
                                      </View>
                                    )}
                                  </TouchableOpacity>

                                  <View style={[styles.replyBubbleContainer, isRtl ? { marginRight: 8, alignItems: 'flex-end' } : { marginLeft: 8 }]}>
                                    <View style={styles.replyBubble}>
                                      <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => {
                                          setActiveCommentsPost(null);
                                          handleOpenUserProfile(reply);
                                        }}
                                      >
                                        <Text style={[styles.replyAuthorName, isRtl && styles.arabicBoldText]}>
                                          {reply.author}
                                        </Text>
                                      </TouchableOpacity>
                                      <Text style={styles.replyBodyText}>{reply.content}</Text>
                                    </View>

                                    <View style={[styles.commentMetaRow, isRtl && { flexDirection: 'row-reverse' }]}>
                                      <Text style={styles.commentTimeText}>{reply.time}</Text>
                                      <TouchableOpacity
                                        style={styles.commentReplyBtn}
                                        activeOpacity={0.7}
                                        onPress={() => handleStartReply(c, reply.author)}
                                      >
                                        <Text style={[styles.commentReplyBtnText, isRtl && styles.arabicBoldText]}>
                                          {isRtl ? 'رد' : 'Reply'}
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.commentLikeBtn, isRtl && { flexDirection: 'row-reverse' }]}
                                        activeOpacity={0.7}
                                        onPress={() => handleToggleReplyLike(activeCommentsPost.id, c.id, reply.id)}
                                      >
                                        <Ionicons
                                          name={reply.liked ? "heart" : "heart-outline"}
                                          size={12}
                                          color={reply.liked ? COLORS.accentRed : COLORS.textMuted}
                                        />
                                        {(reply.likes > 0) && (
                                          <Text style={[styles.commentLikeCount, reply.liked && { color: COLORS.accentRed }]}>
                                            {reply.likes}
                                          </Text>
                                        )}
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Replying To Banner */}
                {replyingTo && (
                  <View style={[styles.replyingToBanner, isRtl && { flexDirection: 'row-reverse' }]}>
                    <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="arrow-undo-outline" size={13} color={COLORS.bgBrand} style={isRtl ? { marginLeft: 4 } : { marginRight: 4 }} />
                      <Text style={[styles.replyingToText, isRtl && styles.arabicBoldText]}>
                        {isRtl ? `الرد على ${replyingTo.author}` : `Replying to ${replyingTo.author}`}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setReplyingTo(null)} 
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.cancelReplyBtn}
                    >
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Comment Input Footer */}
                <View style={[
                  styles.commentInputContainer, 
                  { paddingBottom: Math.max(insets?.bottom || 0, Platform.OS === 'ios' ? 16 : 10) },
                  isRtl && { flexDirection: 'row-reverse' }
                ]}>
                  {/* Current User Avatar */}
                  <View style={styles.commentInputUserAvatar}>
                    <Ionicons name="person" size={14} color="#FFFFFF" />
                  </View>

                  <View style={[styles.commentInputWrapper, isRtl && { flexDirection: 'row-reverse', marginLeft: 0, marginRight: 8 }]}>
                    <TextInput
                      ref={commentInputRef}
                      style={[styles.commentTextInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                      placeholder={
                        replyingTo 
                          ? (isRtl ? `رد على ${replyingTo.author}...` : `Reply to ${replyingTo.author}...`)
                          : (isRtl ? 'اكتب تعليقاً...' : 'Add a comment...')
                      }
                      placeholderTextColor="#8C9B8D"
                      value={commentInputText}
                      onChangeText={setCommentInputText}
                      multiline={true}
                      maxLength={300}
                    />

                    <TouchableOpacity
                      style={[
                        styles.commentSendBtn,
                        !commentInputText.trim() && styles.commentSendBtnDisabled,
                        isRtl && { marginLeft: 0, marginRight: 6 }
                      ]}
                      disabled={!commentInputText.trim()}
                      activeOpacity={0.8}
                      onPress={handleSubmitComment}
                    >
                      <Ionicons
                        name="send"
                        size={14}
                        color={commentInputText.trim() ? '#FFFFFF' : '#A0AFA2'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Report Post Modal */}
          <Modal
            visible={Boolean(reportModalPost)}
            animationType="fade"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={() => setReportModalPost(null)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.reportModalBackdrop}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setReportModalPost(null)}
              />

              <View style={[styles.reportModalContainer, { backgroundColor: COLORS.bgCreamy }]}>
                {/* Header */}
                <View style={[styles.reportModalHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center' }, isRtl && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.reportIconCircle}>
                      <Ionicons name="flag" size={16} color="#E53935" />
                    </View>
                    <Text style={[styles.reportModalTitle, isRtl && styles.arabicBoldText, isRtl ? { marginRight: 8 } : { marginLeft: 8 }]}>
                      {isRtl ? 'الإبلاغ عن المنشور' : 'Report Post'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.commentsCloseBtn}
                    onPress={() => setReportModalPost(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>

                {/* Subtitle */}
                <Text style={[styles.reportModalSubtitle, isRtl && styles.arabicBoldText, isRtl && { textAlign: 'right' }]}>
                  {isRtl
                    ? `لماذا تبلغ عن منشور ${reportModalPost?.author || ''}؟`
                    : `Why are you reporting this post by ${reportModalPost?.author || ''}?`}
                </Text>

                {/* Reasons Radio List */}
                <ScrollView style={styles.reportReasonsList} showsVerticalScrollIndicator={false}>
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReportReason === reason.id;
                    return (
                      <TouchableOpacity
                        key={reason.id}
                        activeOpacity={0.75}
                        style={[
                          styles.reportReasonItem,
                          isSelected && styles.reportReasonItemSelected,
                          isRtl && { flexDirection: 'row-reverse' }
                        ]}
                        onPress={() => setSelectedReportReason(reason.id)}
                      >
                        <View style={[styles.reportRadioCircle, isSelected && styles.reportRadioCircleSelected]}>
                          {isSelected && <View style={styles.reportRadioDot} />}
                        </View>
                        <Text style={[
                          styles.reportReasonText,
                          isSelected && styles.reportReasonTextSelected,
                          isRtl && styles.arabicBoldText,
                          isRtl ? { marginRight: 10 } : { marginLeft: 10 }
                        ]}>
                          {isRtl ? reason.ar : reason.en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Optional extra notes */}
                  <TextInput
                    style={[styles.reportDetailInput, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold' }]}
                    placeholder={isRtl ? 'تفاصيل إضافية (اختياري)...' : 'Additional details (optional)...'}
                    placeholderTextColor="#8C9B8D"
                    value={reportDetailText}
                    onChangeText={setReportDetailText}
                    multiline={true}
                    maxLength={200}
                  />
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.reportActionsRow, isRtl && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={styles.reportCancelButton}
                    onPress={() => setReportModalPost(null)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.reportCancelButtonText, isRtl && styles.arabicBoldText]}>
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.reportSubmitButton,
                      !selectedReportReason && styles.reportSubmitButtonDisabled
                    ]}
                    disabled={!selectedReportReason}
                    onPress={handleSubmitReport}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }} />
                    <Text style={[styles.reportSubmitButtonText, isRtl && styles.arabicBoldText]}>
                      {isRtl ? 'إرسال البلاغ' : 'Submit Report'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Media Fullscreen Preview Modal */}
          <Modal
            visible={Boolean(viewingMedia)}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setViewingMedia(null)}
          >
            <View style={styles.mediaViewerBackdrop}>
              <SafeAreaView style={styles.mediaViewerContainer}>
                <View style={[styles.mediaViewerHeader, isRtl && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={styles.mediaViewerCloseBtn}
                    onPress={() => setViewingMedia(null)}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.mediaViewerTitle}>
                    {viewingMedia?.type === 'video' ? (isRtl ? 'تسجيل فيديو' : 'Video Recording') : (isRtl ? 'عرض الصورة' : 'Image Preview')}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.mediaViewerContent}>
                  {viewingMedia?.type === 'image' ? (
                    <Image source={{ uri: viewingMedia.uri }} style={styles.mediaViewerFullImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.mediaViewerVideoBox}>
                      <View style={styles.mediaViewerVideoPreview}>
                        <View style={styles.mediaViewerLargePlayBtn}>
                          <Ionicons name="play" size={44} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </View>
                        <Text style={styles.mediaViewerVideoText}>
                          {isRtl ? 'تسجيل الفيديو جاهز للعرض' : 'Video Recording Ready'}
                        </Text>
                        <Text style={styles.mediaViewerVideoSubtext}>
                          {viewingMedia?.duration ? ('0:' + (viewingMedia.duration < 10 ? '0' : '') + viewingMedia.duration) : '0:15'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  mainLayout: {
    flex: 1,
  },
  contentBlock: {
    flex: 1,
  },
  collapsibleHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 245,
    backgroundColor: 'transparent',
    zIndex: 4,
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 20,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.bgBrand,
    letterSpacing: 0.3,
  },
  headerTitleContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
  },
  titleText: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 28,
    color: colors.bgBrand,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  persistentCommunityHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCreamy,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
    paddingBottom: 10,
    zIndex: 10,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 3,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    height: 46,
  },
  topSearchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 2,
    zIndex: 5,
  },
  communitySearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  communitySearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    paddingVertical: 2,
  },
  /* People Search Results Section */
  peopleSectionContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  peopleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  peopleSectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textDark,
    fontWeight: '700',
  },
  peopleCountBadge: {
    backgroundColor: 'rgba(55, 99, 59, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  peopleCountBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.bgBrand,
  },
  peopleScrollContent: {
    paddingLeft: 4,
    paddingRight: 16,
    gap: 10,
  },
  personCard: {
    width: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personCardAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    marginBottom: 8,
  },
  personCardAvatar: {
    width: '100%',
    height: '100%',
  },
  personCardAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCardName: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  personCardHandle: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  personCardVehicle: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.bgBrand,
    textAlign: 'center',
    marginBottom: 8,
  },
  personCardViewBtn: {
    backgroundColor: colors.bgBrand,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  personCardViewBtnText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  /* Community search post status row */
  communitySearchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  communitySearchStatusText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.bgBrand,
    fontWeight: '700',
  },
  communitySearchEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  communitySearchEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  communitySearchEmptyTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  communitySearchEmptySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  communitySearchClearBtn: {
    backgroundColor: colors.bgBrand,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  communitySearchClearBtnText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 2,
    zIndex: 5,
  },
  selectorRow: {
    flex: 1,
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    height: 48,
    position: 'relative',
    marginRight: 10,
  },
  messagesHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTabActive: {
    backgroundColor: colors.white,
    shadowColor: '#1E2D1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderRadius: 12,
  },
  selectorTab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectorText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  selectorTextSelected: {
    color: colors.bgBrand,
  },
  selectorTextUnselected: {
    color: colors.textMuted,
  },
  composerContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    width: '100%',
  },
  composerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 6,
  },
  postComposer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 88,
    justifyContent: 'space-between',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  composerTopRow: {
    flex: 1,
    width: '100%',
  },
  composerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1.2,
    borderTopColor: colors.borderGreen,
    paddingTop: 6,
  },
  composerInput: {
    width: '100%',
    height: '100%',
    color: colors.textDark,
    fontSize: 12.5,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.bgBrand,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  composerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  composerIconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 187,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  arabicBoldText: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  avatarLargeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderGreen,
  },
  profileActionArea: {
    marginLeft: 'auto',
    justifyContent: 'center',
  },
  selfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  selfBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  profileActionAreaCenter: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMessageBtn: {
    height: 40,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  profileMessageBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  /* Comments Bottom Sheet & Component Styles */
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    justifyContent: 'flex-end',
  },
  commentsSheetContainer: {
    width: '100%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 16,
    overflow: 'hidden',
  },
  commentsHandleArea: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  commentsHeaderTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    color: colors.textDark,
  },
  commentsCountBadge: {
    backgroundColor: colors.bgBrandLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  commentsCountBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  commentsCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 99, 59, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  commentsPostPreviewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  commentsPostPreviewAvatarIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsPostPreviewBody: {
    flex: 1,
  },
  commentsPostPreviewAuthor: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.textDark,
  },
  commentsPostPreviewText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  commentsDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    opacity: 0.6,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  commentsListScroll: {
    flex: 1,
  },
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCommentsTitle: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 12,
  },
  emptyCommentsSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  commentItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  commentAvatarIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubbleContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: colors.bgBrandLight,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: '94%',
    borderWidth: 1,
    borderColor: 'rgba(55, 99, 59, 0.1)',
  },
  commentAuthorName: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 2,
  },
  commentBodyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textDark,
    lineHeight: 18,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    gap: 12,
  },
  commentTimeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textMuted,
  },
  commentReplyBtn: {
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  commentReplyBtnText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  repliesListContainer: {
    marginTop: 8,
    marginLeft: 6,
    paddingLeft: 10,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.borderGreen,
  },
  replyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  replyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  replyAvatarIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBubbleContainer: {
    flex: 1,
  },
  replyBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
    maxWidth: '96%',
    borderWidth: 1,
    borderColor: 'rgba(55, 99, 59, 0.12)',
  },
  replyAuthorName: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 2,
  },
  replyBodyText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textDark,
    lineHeight: 16,
  },
  replyingToBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgBrandLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
  },
  replyingToText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  cancelReplyBtn: {
    padding: 2,
  },
  /* Report Modal Styles */
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  reportModalContainer: {
    width: '100%',
    maxHeight: '75%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 20,
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    color: colors.textDark,
  },
  reportModalSubtitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  reportReasonsList: {
    maxHeight: 280,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 99, 59, 0.12)',
  },
  reportReasonItemSelected: {
    borderColor: colors.bgBrand,
    backgroundColor: colors.bgBrandLight,
  },
  reportRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportRadioCircleSelected: {
    borderColor: colors.bgBrand,
  },
  reportRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgBrand,
  },
  reportReasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textDark,
  },
  reportReasonTextSelected: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  reportDetailInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: colors.textDark,
    minHeight: 50,
    marginTop: 4,
    marginBottom: 10,
  },
  reportActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  reportCancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCancelButtonText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.textDark,
  },
  reportSubmitButton: {
    flex: 1.5,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  reportSubmitButtonDisabled: {
    backgroundColor: 'rgba(229, 57, 53, 0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  reportSubmitButtonText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* Direct Message Chat Styles */
  dmModalContainer: {
    flex: 1,
  },
  dmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
  },
  dmBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginRight: 4,
  },
  dmBackBtnText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  dmUserHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dmAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  dmAvatarSmallIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmUserName: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    color: colors.textDark,
  },
  dmOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dmOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  dmOnlineText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
  },
  dmMessagesScroll: {
    flex: 1,
  },
  dmMessagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dmIntroCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
  },
  dmIntroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
  },
  dmIntroAvatarIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dmIntroName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  dmIntroHandle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    marginBottom: 8,
  },
  dmIntroText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  dmMessageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dmMessageRowMe: {
    justifyContent: 'flex-end',
  },
  dmMessageRowThem: {
    justifyContent: 'flex-start',
  },
  dmBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dmBubbleMe: {
    backgroundColor: colors.bgBrand,
    borderBottomRightRadius: 4,
  },
  dmBubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  dmBubbleText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 19,
  },
  dmBubbleTextMe: {
    color: '#F7F5F0',
  },
  dmBubbleTextThem: {
    color: colors.textDark,
  },
  dmBubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  dmBubbleTimeMe: {
    color: 'rgba(247, 245, 240, 0.7)',
  },
  dmBubbleTimeThem: {
    color: colors.textMuted,
  },
  dmBubbleMediaWrapper: {
    width: 220,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
    backgroundColor: '#1B261D',
  },
  dmBubbleImage: {
    width: '100%',
    height: '100%',
  },
  dmExpandMediaIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmBubbleVideoCard: {
    width: 230,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E2D20',
    marginBottom: 6,
  },
  dmBubbleVideoThumbnail: {
    width: '100%',
    height: 135,
    backgroundColor: '#141E15',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dmVideoPlayBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(55, 99, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmVideoBadgeRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dmVideoTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dmVideoDurationBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dmVideoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  dmVideoCardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dmVideoCardLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  dmVideoCardLabelMe: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dmVideoCardLabelThem: {
    color: colors.textDark,
  },
  dmAttachedPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dmAttachedThumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E2D20',
  },
  dmAttachedThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  dmAttachedVideoThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
  },
  dmAttachedTypePill: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    alignItems: 'center',
  },
  dmAttachedTypePillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  dmAttachedInfo: {
    flex: 1,
  },
  dmAttachedTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  dmAttachedSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
  },
  dmAttachedRemoveBtn: {
    padding: 4,
  },
  dmComposerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.bgCreamy,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
  },
  dmMediaActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  dmMediaActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  dmInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    fontSize: 13.5,
    maxHeight: 90,
    color: colors.textDark,
  },
  dmSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dmSendButtonDisabled: {
    backgroundColor: 'rgba(55, 99, 59, 0.25)',
  },
  dmMicButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  dmMicButtonActive: {
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  /* Holding overlay inside composer */
  dmHoldingOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  dmHoldingTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  /* WhatsApp-style Floating Lock Track */
  dmLockIndicatorContainer: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    zIndex: 9999,
  },
  dmLockBubble: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#25D366',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
    width: 38,
  },
  /* Slide to cancel row */
  dmSlideToCancelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dmSlideToCancelText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textMuted,
    marginHorizontal: 3,
  },
  /* Tap hint bubble */
  dmTapTipBubble: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: 'rgba(28, 42, 33, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    zIndex: 9999,
    width: 210,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  dmTapTipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    textAlign: 'center',
  },
  /* Voice recording in-progress bar */
  dmRecordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.bgCreamy,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
  },
  dmRecordingCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dmRecordingCancelText: {
    fontSize: 13,
    color: '#E53935',
    marginLeft: 4,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  dmRecordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dmRecordingDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E53935',
    marginRight: 6,
  },
  dmRecordingTimer: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textDark,
    marginRight: 10,
  },
  dmRecordingWaveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    gap: 3,
  },
  dmRecordingWaveBar: {
    width: 3,
    backgroundColor: colors.bgBrand,
    borderRadius: 1.5,
  },
  dmRecordingSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  /* Audio Card in Chat */
  dmAudioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 190,
    marginBottom: 4,
  },
  dmAudioCardMe: {
    backgroundColor: colors.bgBrandDark || '#1C3A27',
  },
  dmAudioCardThem: {
    backgroundColor: colors.bgBrandLight,
  },
  dmAudioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dmAudioPlayBtnMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dmAudioPlayBtnThem: {
    backgroundColor: colors.bgBrand,
  },
  dmAudioWaveCol: {
    flex: 1,
  },
  dmAudioWaveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    gap: 3,
    marginBottom: 4,
  },
  dmAudioWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  dmAudioWaveBarMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dmAudioWaveBarThem: {
    backgroundColor: colors.borderGreen,
  },
  dmAudioWaveBarActive: {
    backgroundColor: '#4CAF50',
  },
  dmAudioMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dmAudioDurationText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  dmAudioDurationMe: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dmAudioDurationThem: {
    color: colors.textMuted,
  },
  dmAudioBadgeText: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  /* Fullscreen Media Viewer */
  mediaViewerBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaViewerContainer: {
    flex: 1,
  },
  mediaViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mediaViewerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mediaViewerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  mediaViewerFullImage: {
    width: '100%',
    height: '100%',
  },
  mediaViewerVideoBox: {
    width: '100%',
    height: '70%',
    backgroundColor: '#121C13',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  mediaViewerVideoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mediaViewerLargePlayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.bgBrand,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mediaViewerVideoText: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  mediaViewerVideoSubtext: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 8,
    backgroundColor: colors.bgCreamy,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
  },
  inboxSearchStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 6,
  },
  inboxSearchStatusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.textMuted,
  },
  inboxMatchedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 99, 59, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  inboxMatchedTagText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.bgBrand,
  },
  inboxEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 24,
  },
  inboxEmptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inboxEmptyTitle: {
    fontSize: 15.5,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  inboxEmptySubtitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  inboxClearSearchBtn: {
    backgroundColor: colors.bgBrand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inboxClearSearchBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  inboxSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
  },
  commentInputUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 7 : 3,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    marginLeft: 8,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    maxHeight: 75,
    paddingVertical: 2,
  },
  commentSendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  commentSendBtnDisabled: {
    backgroundColor: 'rgba(55, 99, 59, 0.22)',
  },
  profileFeedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  profileFeedHeaderText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '800',
    color: colors.textDark,
  },
  profileFeedCountBadge: {
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  profileFeedCountBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: colors.bgBrand,
  },
  profileSummaryCard: {
    backgroundColor: colors.bgBrandLight,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  profileBannerContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#243C27',
  },
  profileBannerImage: {
    width: '100%',
    height: '100%',
  },
  profileBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 35, 22, 0.22)',
  },
  profileHeaderCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -44,
    paddingBottom: 12,
  },
  profileAvatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgCreamy,
    padding: 3.5,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarCenteredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  profileAvatarCenteredIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryDetails: {
    marginLeft: 12,
  },
  profileSummaryName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  profileSummaryHandle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  carBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.75)' : colors.bgCreamy,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    marginTop: 7,
    alignSelf: 'center',
  },
  carText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    paddingTop: 10,
    paddingBottom: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderGreen,
  },
  postCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.18)' : 'rgba(93, 130, 96, 0.22)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: colors.white === '#FFFFFF' ? 0.08 : 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrandLight,
  },
  avatarIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorDetails: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  authorHandle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  postText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 12,
  },
  postCardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.bgBrandLight,
    marginBottom: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  actionsLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  messagesListContainer: {
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    padding: 16,
    marginBottom: 12,
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 15,
    fontFamily: 'AlkhalilArabic-Bold',
    color: colors.textDark,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  messageSnippet: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  messageSnippetUnread: {
    color: colors.textDark,
    fontWeight: '600',
  },
  messageBadge: {
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    padding: 28,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: colors.bgBrand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceContainer: {
    backgroundColor: colors.bgBrandLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: colors.bgBrand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  saleBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 8,
  },
  saleBadgeText: {
    color: '#B57A3D',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  contactSellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  contactSellerText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  marketGridCard: {
    width: '48.2%',
    height: 240,
    backgroundColor: colors.bgBrandLight,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  marketGridCover: {
    width: '100%',
    height: 100,
  },
  marketGridDetails: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  marketGridAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  marketGridAuthor: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    flex: 1,
    marginRight: 4,
  },
  marketGridBadge: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  marketGridBadgeText: {
    color: '#B57A3D',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  marketGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
    lineHeight: 16,
    marginBottom: 6,
  },
  marketGridLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketGridLocation: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  marketGridDivider: {
    height: 1,
    backgroundColor: colors.borderGreen,
    marginBottom: 8,
  },
  marketGridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketGridPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  marketGridContactPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  overlayCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 45, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  expandedCover: {
    width: '100%',
    height: 160,
  },
  expandedPriceBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 45, 31, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    zIndex: 8,
  },
  expandedPriceBadgeText: {
    color: colors.bgCreamy,
    fontSize: 11,
    fontWeight: '800',
  },
  expandedDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  expandedSellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedSellerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textDark,
  },
  expandedSellerHandle: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  expandedPostDescription: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    marginBottom: 10,
    fontWeight: '500',
  },
  expandedBottomContainer: {
    marginTop: 8,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  expandedActionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.bgBrand,
    backgroundColor: 'transparent',
    gap: 6,
  },
  expandedActionButtonSolid: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    gap: 6,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  actionButtonLabelSolid: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  marketControlsContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    width: '100%',
    gap: 10,
  },
  marketSearchEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    paddingHorizontal: 12,
    height: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  marketSearchInput: {
    flex: 1,
    height: '100%',
    color: colors.textDark,
    fontSize: 12.5,
    fontWeight: '500',
  },
  marketListEntityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgBrand,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  marketListEntityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBrand,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    width: '100%',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  newPageContainer: {
    flex: 1,
  },
  newPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.bgCreamy,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  newPageBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  newPageBackButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  newPageHeaderTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 24,
    color: colors.bgBrand,
    textAlign: 'center',
  },
  newPageFormContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  newPageFormCard: {
    backgroundColor: colors.bgCreamy,
    borderColor: colors.borderGreen,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  newPageLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.bgBrand,
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  newPageInput: {
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13.5,
    color: colors.textDark,
  },
  newPagePublishBtn: {
    backgroundColor: colors.bgBrand,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  newPagePublishBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imagePickerBtn: {
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 180,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: 4,
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerPlaceholderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.bgBrand,
  },
  removeImagePill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(181, 77, 79, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: colors.bgCreamy,
    zIndex: 10,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
  },
  stickyProfileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: colors.borderGreen,
    backgroundColor: colors.bgBrandLight,
  },
  stickyTab: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTabSelected: {
    backgroundColor: colors.bgBrand,
  },
  stickyTabUnselected: {
    backgroundColor: 'transparent',
  },
  stickyDivider: {
    width: 1.2,
    height: '100%',
    backgroundColor: colors.borderGreen,
  },
  fbComposerContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    shadowColor: colors.bgBrand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  fbComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fbComposerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbFakeInput: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgBrandLight,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fbFakeInputText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  fbPhotoIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  fbModalContainer: {
    flex: 1,
  },
  fbModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGreen,
  },
  fbModalCloseBtn: {
    padding: 4,
  },
  fbModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalPostBtn: {
    backgroundColor: colors.bgBrand,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  fbModalPostBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  fbModalUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fbComposerAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbModalUserMeta: {
    marginLeft: 12,
  },
  fbModalUserName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalPrivacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 3,
    borderWidth: 0.5,
    borderColor: colors.borderGreen,
  },
  fbModalPrivacyText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 4,
  },
  fbModalInput: {
    fontSize: 16.5,
    fontWeight: '500',
    color: colors.bgBrand,
    lineHeight: 24,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  fbImagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  fbImagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  fbImagePreviewRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 1,
  },
  fbModalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderGreen,
    backgroundColor: colors.bgBrandLight,
  },
  fbAddPostText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.bgBrand,
  },
  fbModalToolbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fbToolbarIconButton: {
    padding: 6,
    marginLeft: 12,
  },
});
