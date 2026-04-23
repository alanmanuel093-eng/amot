import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Send, 
  Instagram, 
  Twitter, 
  Facebook, 
  MessageCircle,
  LayoutDashboard,
  BrainCircuit,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Languages,
  Zap,
  MoreVertical,
  Activity,
  LogOut,
  LogIn,
  Link,
  ShieldCheck,
  Smartphone,
  Save,
  Loader2,
  ExternalLink,
  Sparkles,
  Search,
  Camera,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generateAutoResponse } from './services/gemini';
import { SocialMessage, AIConfig, Platform, PlatformStatus } from './types.ts';
import { auth, db, googleProvider, handleFirestoreError } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp,
  orderBy
} from 'firebase/firestore';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

const INITIAL_CONFIG: AIConfig = {
  personality: 'Profesional, amable y resolutivo',
  language: 'Español',
  theme: 'light',
  autoReplyEnabled: true,
  ignoredKeywords: ['spam', 'oferta', 'viagra']
};

const TRANSLATIONS = {
  Español: {
    dashboard: 'Tablero',
    inbox: 'Bandeja',
    config: 'Cerebro IA',
    connections: 'Canales',
    settings: 'Ajustes',
    sync: 'Datos en la Nube Sincronizados',
    simulate: 'Simular',
    operator: 'Operador AMOT',
    identity: 'Identidad Corporativa AMOT',
    profile: 'Perfil de Usuario',
    saveProfile: 'Guardar Perfil',
    savedProfile: 'Identidad Guardada',
    securityTitle: 'Seguridad de Identidad Digital',
    securityDesc: 'Tus datos de sesión están protegidos bajo protocolos de encriptación industriales.',
    personalityTitle: 'Personalidad IA',
    workLanguage: 'Idioma de Trabajo',
    theme: 'Esquema de Color',
    lightMode: 'Claro',
    darkMode: 'Oscuro',
    autoReply: 'Auto-Reply Experto',
    autoReplyDesc: 'Activa el piloto automático',
    saveSettings: 'Guardar Ajustes',
    savedSettings: 'Personalidad Guardada',
    testLab: 'AMOT Test Lab',
    testLabDesc: 'Validación cognitiva en tiempo real',
    testLabTitle: 'AMOT Test Lab',
    previewIA: 'Previsualización IA',
    scanning: 'Escaneando Neuronas Digitales...',
    testInputLabel: 'Mensaje de Prueba',
    testInputPlaceholder: 'Ej: ¿Hay stock de este producto?',
    presets: 'Presets de Alto Impacto',
    totalImpact: 'Total Impacto',
    efficiency: 'Eficiencia IA',
    responseLevel: 'Nivel de Respuesta',
    activeAccounts: 'Cuentas Activas',
    messagesToday: 'Mensajes Hoy',
    platforms: 'Plataformas',
    recentActivity: 'Actividad Reciente',
    viewAll: 'Ver Todo',
    noActivity: 'Sin interacciones registradas',
    systemScanning: 'EL SISTEMA AMOT ESTÁ ESCANEANDO LA RED EN BUSCA DE ACTIVIDAD...',
    processedIA: 'Procesado IA',
    pending: 'Pendiente',
    executeIA: 'Ejecutar Respuesta IA',
    cognitiveResponse: 'Respuesta Cognitiva AMOT',
    operatorName: 'Nombre de Operador',
    avatarSeed: 'Semilla de Avatar',
    quickGallery: 'Galería de Selección Rápida',
    logout: 'Cerrar Sesión',
    loading: 'Sincronizando con la Nube',
    loadingDesc: 'Estamos preparando tu entorno inteligente. Por favor espera un momento...',
    reload: 'Rehacer Carga',
    welcome: 'Tu asistente de social media inteligente te espera.',
    loginGoogle: 'Iniciar Sesión con Google',
    exit: 'Salir',
    analytics: 'Analíticas',
    meliTitle: 'Mercado Libre Sync',
    meliDesc: 'Conecta tu inventario real',
    meliUser: 'ID de Usuario Meli',
    meliSync: 'Sincronizar Productos',
    meliAuto: 'Auto-Respuesta Preguntas',
    meliActive: 'Vendedor Conectado',
    meliLink: 'Vincular Mercado Libre',
    traffic: 'Tráfico de Mensajería',
    last7days: 'ÚLTIMOS 7 DÍAS DE ACTIVIDAD',
    vsYesterday: 'vs ayer',
    savingWeek: 'Ahorro: 4.2h / sem',
    autoActions: 'Acciones automáticas',
    channelShare: 'Share de Canales',
    channels: 'Canales',
    activityFeed: 'Feed de Actividad en Tiempo Real',
    monitoring: 'AMOT monitorea cada interacción. La IA procesa y responde siguiendo la personalidad',
    listening: 'ESCUCHANDO EVENTOS...',
    inboxTitle: 'Bandeja de Entrada',
    unifiedMgt: 'Gestión Unificada de Mensajería',
    filterClient: 'Filtrar por cliente...',
    all: 'Todo',
    enterTest: 'Ingresa un mensaje para validar la lógica de respuesta',
    corporate: 'Corporativo',
    sales: 'Ventas+',
    friendly: 'Amigable',
    direct: 'Directo',
    corporateDesc: 'Empresarial, puntual y altamente profesional',
    salesDesc: 'Agresivo, persuasivo y enfocado a conversión',
    friendlyDesc: 'Cercano, cálido y lleno de emojis positivos',
    directDesc: 'Respuestas cortas de una sola línea',
    highAvailability: 'Canal de Alta Disponibilidad',
    directConnectivity: 'Conectividad directa protocolo oficial',
    webhookDesc: 'Webhook Callback URL',
    verifyToken: 'Token de verificación',
    publicMsgNumber: 'Número Público de WhatsApp',
    phoneNumberId: 'Phone Number ID (Meta API)',
    synced: 'Sincronizado',
    personalityDesc: 'Define cómo quieres que la IA interactúe con tus clientes.',
    accessToken: 'Access Token Permanente',
    active: 'Activo',
    activateChannel: 'Activar Canal',
    errorCredentials: 'Error de credenciales. Revisa el portal.',
    realTimeSync: 'Sincronización de Datos en Tiempo Real',
    instagramPro: 'Instagram PRO',
    advInteractions: 'Gestión avanzada de interacciones',
    linkedSuccess: 'Vinculado con Éxito',
    linkInstagram: 'Vincular Instagram',
    techManual: 'Manual de Integración Tecnológica',
    metaPortal: 'Acceder al portal de gestión de infraestructura corporativa en',
    metaStep2: 'En Arquitectura → Gestión de Canal, registrar el identificador "Phone Number ID".',
    metaStep3: 'Implementar las Credenciales de Acceso Permanente con protocolos de mensajería activos.',
    securityInfo: 'Tu información está protegida bajo estándares de encriptación AES-256.',
    troubleTitle: '¿Problemas con el registro?',
    troubleSave: 'No se guardan los datos:',
    troubleSaveDesc: 'Asegúrate de presionar el botón azul "Activar Canal" después de escribir.',
    troubleToken: 'Token no válido:',
    troubleTokenDesc: 'Los tokens caducan cada 60 días. Recomendamos generar uno Permanente.'
  },
  'Inglés': {
    dashboard: 'Dashboard',
    inbox: 'Inbox',
    config: 'AI Brain',
    connections: 'Channels',
    settings: 'Settings',
    sync: 'Cloud Data Synchronized',
    simulate: 'Simulate',
    operator: 'AMOT Operator',
    identity: 'AMOT Corporate Identity',
    profile: 'User Profile',
    saveProfile: 'Save Profile',
    savedProfile: 'Identity Saved',
    securityTitle: 'Digital Identity Security',
    securityDesc: 'Your session data is protected under industrial encryption protocols.',
    personalityTitle: 'AI Personality',
    workLanguage: 'Working Language',
    theme: 'Color Scheme',
    lightMode: 'Light',
    darkMode: 'Dark',
    autoReply: 'Expert Auto-Reply',
    autoReplyDesc: 'Activate autopilot',
    saveSettings: 'Save Settings',
    savedSettings: 'Personality Saved',
    testLab: 'AMOT Test Lab',
    testLabDesc: 'Real-time cognitive validation',
    testLabTitle: 'AMOT Test Lab',
    previewIA: 'AI Preview',
    scanning: 'Scanning Digital Neurons...',
    testInputLabel: 'Test Message',
    testInputPlaceholder: 'Ex: Is this product in stock?',
    presets: 'High Impact Presets',
    totalImpact: 'Total Impact',
    efficiency: 'AI Efficiency',
    responseLevel: 'Response Level',
    activeAccounts: 'Active Accounts',
    messagesToday: 'Messages Today',
    platforms: 'Platforms',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    noActivity: 'No interactions recorded',
    systemScanning: 'AMOT SYSTEM IS SCANNING THE NETWORK FOR ACTIVITY...',
    processedIA: 'AI Processed',
    pending: 'Pending',
    executeIA: 'Execute AI Response',
    cognitiveResponse: 'AMOT Cognitive Response',
    operatorName: 'Operator Name',
    avatarSeed: 'Avatar Seed',
    quickGallery: 'Quick Selection Gallery',
    logout: 'Logout',
    loading: 'Synchronizing with Cloud',
    loadingDesc: 'Preparing your smart environment. Please wait a moment...',
    reload: 'Reload Page',
    welcome: 'Your smart social media assistant awaits you.',
    loginGoogle: 'Sign In with Google',
    exit: 'Exit',
    analytics: 'Analytics',
    traffic: 'Messaging Traffic',
    last7days: 'LAST 7 DAYS OF ACTIVITY',
    vsYesterday: 'vs yesterday',
    savingWeek: 'Savings: 4.2h / week',
    autoActions: 'Automated actions',
    channelShare: 'Channel Share',
    channels: 'Channels',
    activityFeed: 'Real-Time Activity Feed',
    monitoring: 'AMOT monitors interaction. AI processes and responds following the personality',
    listening: 'LISTENING TO EVENTS...',
    inboxTitle: 'Inbox',
    unifiedMgt: 'Unified Messaging Management',
    filterClient: 'Filter by client...',
    all: 'All',
    enterTest: 'Enter a message to validate the response logic',
    corporate: 'Corporate',
    sales: 'Sales+',
    friendly: 'Friendly',
    direct: 'Direct',
    corporateDesc: 'Business-like, punctual, and highly professional',
    salesDesc: 'Aggressive, persuasive, and conversion-focused',
    friendlyDesc: 'Close, warm, and full of positive emojis',
    directDesc: 'Short one-line responses',
    highAvailability: 'High Availability Channel',
    directConnectivity: 'Direct official protocol connectivity',
    webhookDesc: 'Webhook Callback URL',
    verifyToken: 'Verification Token',
    publicMsgNumber: 'Public WhatsApp Number',
    phoneNumberId: 'Phone Number ID (Meta API)',
    synced: 'Synced',
    personalityDesc: 'Define how you want the AI to interact with your customers.',
    accessToken: 'Permanent Access Token',
    active: 'Active',
    activateChannel: 'Activate Channel',
    errorCredentials: 'Credential error. Check the portal.',
    realTimeSync: 'Real-Time Data Synchronization',
    instagramPro: 'Instagram PRO',
    advInteractions: 'Advanced interaction management',
    linkedSuccess: 'Successfully Linked',
    linkInstagram: 'Link Instagram',
    techManual: 'Technical Integration Manual',
    metaPortal: 'Access the corporate infrastructure management portal at',
    metaStep2: 'In Architecture → Channel Management, register the "Phone Number ID".',
    metaStep3: 'Implement Permanent Access Credentials with active messaging protocols.',
    securityInfo: 'Your information is protected under AES-256 encryption standards.',
    troubleTitle: 'Registration issues?',
    troubleSave: 'Data not saving:',
    troubleSaveDesc: 'Make sure you press the blue "Activate Channel" button after typing.',
    troubleToken: 'Invalid token:',
    troubleTokenDesc: 'Tokens expire every 60 days. We recommend generating a Permanent one.'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [config, setConfig] = useState<AIConfig>(INITIAL_CONFIG);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [localConfig, setLocalConfig] = useState<AIConfig>(INITIAL_CONFIG);
  const [products, setProducts] = useState<any[]>([]);
  const [isSyncingMeli, setIsSyncingMeli] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All');

  const t = useMemo(() => {
    return TRANSLATIONS[config.language as keyof typeof TRANSLATIONS] || TRANSLATIONS.Español;
  }, [config.language]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return {
        date: format(d, 'dd MMM'),
        fullDate: startOfDay(d),
        count: 0
      };
    }).reverse();

    messages.forEach(msg => {
      const msgDate = startOfDay(msg.timestamp);
      const day = last7Days.find(d => d.fullDate.getTime() === msgDate.getTime());
      if (day) day.count++;
    });

    return last7Days;
  }, [messages]);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = { WhatsApp: 0, Instagram: 0, Twitter: 1, Facebook: 0 };
    messages.forEach(m => {
      if (counts[m.platform] !== undefined) counts[m.platform]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [messages]);

  const COLORS = ['#10b981', '#ec4899', '#0ea5e9', '#f59e0b'];

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchesSearch = m.sender.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = filterPlatform === 'All' || m.platform === filterPlatform;
      return matchesSearch && matchesPlatform;
    });
  }, [messages, searchQuery, filterPlatform]);

  // Auth Effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth check timed out, showing login screen.");
        setIsLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      setCurrentUser(user);
      setIsLoading(false);
    }, (error) => {
      console.error("Auth Exception:", error);
      setAuthError(error.message);
      setIsLoading(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [isLoading]);

  // Firestore Messages Effect
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'messages'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          let ts: Date;
          if (data.timestamp?.toDate) {
            ts = data.timestamp.toDate();
          } else if (data.timestamp?.seconds) {
             ts = new Date(data.timestamp.seconds * 1000);
          } else {
            ts = new Date();
          }

          return {
            ...data,
            id: doc.id,
            timestamp: ts
          };
        }) as SocialMessage[];
        setMessages(msgs);
      }, (error) => {
        console.error("Firestore Message Stream Error:", error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Query buildup error:", e);
    }
  }, [currentUser]);

  // Firestore Config Effect
  useEffect(() => {
    if (!currentUser) return;

    const configRef = doc(db, 'configs', currentUser.uid);
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AIConfig;
        setConfig(data);
        setLocalConfig(data);
      } else {
        // Init default config if none exists
        setDoc(configRef, { ...INITIAL_CONFIG, userId: currentUser.uid });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Firestore Products Effect
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    const q = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Products Stream Error:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const syncMeliInventory = async () => {
     if(!currentUser) return;
     setIsSyncingMeli(true);
     // Simulate API sync with a few products if empty
     try {
        if (products.length === 0) {
           const mockProducts = [
              { title: 'Smartphone Pro Max x15', price: 1200, stock: 8, thumbnail: '📱', userId: currentUser.uid },
              { title: 'Consola Gaming Z', price: 499, stock: 25, thumbnail: '🎮', userId: currentUser.uid },
              { title: 'Auriculares Noise Cancel', price: 150, stock: 50, thumbnail: '🎧', userId: currentUser.uid }
           ];
           for (const p of mockProducts) {
              await addDoc(collection(db, 'products'), p);
           }
        }
        alert("Sincronización exitosa con Mercado Libre. Base de datos actualizada.");
     } catch (err) {
        console.error("Sync Error:", err);
     } finally {
        setIsSyncingMeli(false);
     }
  };

  // Theme application effect
  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.theme]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'Twitter': return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'Facebook': return <Facebook className="w-4 h-4 text-blue-400" />;
      case 'WhatsApp': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleAutoReply = async (message: SocialMessage) => {
    if (isResponding || !currentUser) return;
    setIsResponding(message.id);

    try {
      const aiResponse = await generateAutoResponse({
        platform: message.platform,
        sender: message.sender,
        message: message.message,
        personality: config.personality,
        language: config.language
      });

      await updateDoc(doc(db, 'messages', message.id), {
        status: 'responded',
        aiResponse,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `messages/${message.id}`);
    } finally {
      setIsResponding(null);
    }
  };

  const updateAIConfig = async (newConfig: Partial<AIConfig>) => {
    if (!currentUser) return;
    
    // Optimistic Update: Reflect changes immediately in UI
    const optimisticConfig = { ...config, ...newConfig };
    setConfig(optimisticConfig);
    setLocalConfig(optimisticConfig);
    
    setSaveStatus('saving');
    const configRef = doc(db, 'configs', currentUser.uid);
    try {
      await setDoc(configRef, { ...newConfig }, { merge: true });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      handleFirestoreError(error, 'update', `configs/${currentUser.uid}`);
      // Revert if error
      setConfig(config);
      setLocalConfig(config);
      setSaveStatus('idle');
    }
  };

  const addMockMessage = async () => {
    if (!currentUser) return;
    const platforms: Platform[] = ['Instagram', 'WhatsApp', 'Twitter', 'Facebook'];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    
    try {
      await addDoc(collection(db, 'messages'), {
        sender: 'Usuario Simulado',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        message: '¿Hola, me podrían dar más información sobre sus servicios?',
        platform: randomPlatform,
        timestamp: Timestamp.now(),
        status: 'pending',
        userId: currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, 'create', 'messages');
    }
  };

  const navLinks = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "inbox", label: t.inbox, icon: MessageSquare },
    { id: "config", label: t.config, icon: BrainCircuit },
    { id: "inventory", label: "Inventario", icon: Hash },
    { id: "connections", label: t.connections, icon: Link },
    { id: "analytics", label: t.analytics, icon: BarChart3 }
  ];

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <Zap className="w-12 h-12 text-[#007AFF] animate-pulse mb-6" fill="currentColor" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.loading}</h2>
        <p className="text-zinc-500 dark:text-[#EBEBF5]/60 text-sm max-w-xs mb-8">{t.loadingDesc}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="border-black/5 dark:border-white/10 text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-white rounded-xl"> {t.reload} </Button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 md:p-8 text-center space-y-6 shadow-2xl shadow-black-[.02] border border-black/5 dark:border-white/5">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 dark:bg-zinc-800 rounded-[20px] flex items-center justify-center mx-auto shadow-sm shadow-black/5 dark:shadow-none">
              <Zap fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-white" />
           </div>
           <div>
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50">AMOT AI</h2>
              <p className="text-zinc-500 dark:text-[#EBEBF5]/60 mt-2 text-xs md:sm italic">{t.welcome}</p>
           </div>
           <Button onClick={handleLogin} className="w-full bg-zinc-900 dark:bg-zinc-800 text-white font-bold rounded-2xl h-12 gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
              <LogIn size={20} className="text-white" />
              {t.loginGoogle}
           </Button>
           <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest font-mono">Powered by Google Gemini & Firebase</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans selection:bg-[#007AFF]/10 selection:text-zinc-900 dark:text-zinc-50 overflow-hidden">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-64 bg-zinc-50 dark:bg-zinc-950 p-6 flex-col gap-8 border-r border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-800 rounded-[14px] flex items-center justify-center shadow-sm shadow-black/5 dark:shadow-none">
            <Zap fill="currentColor" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">AMOT <span className="text-[#007AFF] block text-[9px] font-black uppercase tracking-[0.4em] opacity-80 pt-0.5">CORE ENGINE</span></h1>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 relative group ${
                  activeTab === link.id ? 'bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-50 font-bold' : 'hover:bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <Icon size={18} className={activeTab === link.id ? 'text-[#007AFF] animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                <span className="hidden md:block text-sm">{link.label}</span>
                {activeTab === link.id && (
                  <motion.div layoutId="desktopActivePill" className="absolute left-1 w-1 h-6 bg-[#007AFF] rounded-full" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="pt-6 border-t border-black/5 dark:border-white/10 space-y-2">
           <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl transition-all text-red-400 hover:bg-red-500/10 active:scale-95 group">
              <LogOut size={20} />
              <span>{t.exit}</span>
           </button>
           <button 
             onClick={() => setActiveTab('settings')}
             className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 relative group ${
               activeTab === 'settings' ? 'bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-50 font-bold' : 'hover:bg-black/5 dark:bg-white/5 text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-800 dark:text-zinc-200'
             }`}
           >
              <Settings size={18} className={activeTab === 'settings' ? 'text-[#007AFF] animate-pulse' : 'group-hover:scale-110 transition-transform'} />
              <span className="hidden md:block text-sm">{t.settings}</span>
              {activeTab === 'settings' && (
                 <motion.div layoutId="desktopActivePill" className="absolute left-1 w-1 h-6 bg-[#007AFF] rounded-full" />
              )}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 md:p-6 md:mb-0">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="md:hidden w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center shadow-lg shadow-sm shadow-black/5 dark:shadow-none">
               <Zap fill="currentColor" className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-50 capitalize tracking-tight">{t[activeTab as keyof typeof t] || activeTab}</h2>
            <div className="hidden sm:flex bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 rounded-full px-3 py-1.5 border border-black/5 dark:border-white/5">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {t.sync}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
             <Button variant="outline" onClick={addMockMessage} className="flex-1 md:flex-none bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 h-9 md:h-8 text-[10px] uppercase font-bold text-[#007AFF] gap-2 rounded-xl">
                <Activity size={12} /> <span className="md:inline">{t.simulate}</span>
             </Button>
             <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-[20px]">
                <div className="text-right hidden lg:block leading-tight">
                   <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">{config.userName || currentUser.displayName || t.operator}</p>
                   <p className="text-[8px] font-mono text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest">{currentUser.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 overflow-hidden shadow-sm bg-zinc-50 dark:bg-zinc-950">
                  <img 
                    src={config.userAvatar ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${config.userAvatar}` : currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} 
                    alt="Profile" 
                  />
                </div>
                <button onClick={handleLogout} className="md:hidden text-red-400 p-1">
                   <LogOut size={16} />
                </button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
          <div className="pb-32 md:pb-16 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-8 pb-12">
                   <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-[#007AFF] rounded-[20px] flex items-center justify-center">
                         <User className="text-[#007AFF]" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">{t.profile.split(' ')[0]} de <span className="text-[#007AFF]">{t.profile.split(' ')[2]}</span></h3>
                         <p className="text-zinc-500 dark:text-[#EBEBF5]/60 text-xs font-mono uppercase tracking-widest">{t.identity}</p>
                      </div>
                   </div>

                   <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] overflow-hidden shadow-2xl shadow-black-[.02] border border-black/5 dark:border-white/5 relative border-opacity-50">
                      <div className="h-40 bg-gradient-to-tr from-gray-100 via-gray-50 to-gray-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 relative">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                         <div className="absolute -bottom-14 left-8 p-1.5 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 rounded-[2rem] border-[6px] border-white dark:border-zinc-800 shadow-2xl shadow-black-[.02] overflow-hidden">
                            <div className="relative group">
                               <img 
                                 src={localConfig.userAvatar ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${localConfig.userAvatar}` : currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
                                 className="w-28 h-28 rounded-[20px] object-cover transition-transform group-hover:scale-105" 
                                 alt="Avatar" 
                               />
                               <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity rounded-[20px] flex items-center justify-center cursor-pointer">
                                  <Camera size={28} className="text-zinc-900 dark:text-zinc-50 animate-bounce" />
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="pt-20 p-8 md:p-12 space-y-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-[0.2em] ml-1">{t.operatorName}</Label>
                               <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                                  <Input 
                                    placeholder={t.operatorName}
                                    value={localConfig.userName || currentUser?.displayName || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, userName: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && updateAIConfig({ userName: localConfig.userName })}
                                    className="bg-gray-50 dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 h-14 pl-12 rounded-[20px] text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-[#007AFF] transition-all font-bold text-sm"
                                  />
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between items-center ml-1">
                                  <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-[0.2em]">{t.avatarSeed}</Label>
                                  <Badge className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-[#EBEBF5]/60 text-[8px] h-4">DICEBEAR ENGINE</Badge>
                               </div>
                               <div className="relative group">
                                  <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                                  <Input 
                                    placeholder="Ej: operator-alpha"
                                    value={localConfig.userAvatar || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, userAvatar: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && updateAIConfig({ userAvatar: localConfig.userAvatar })}
                                    className="bg-gray-50 dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 h-14 pl-12 rounded-[20px] text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-[#007AFF] transition-all font-mono text-xs"
                                  />
                               </div>
                               <p className="text-[9px] text-zinc-400 dark:text-zinc-500 px-2 italic font-medium">{t.systemScanning}</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-[0.2em] ml-1">{t.quickGallery}</Label>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                               {['Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Zeta', 'Epsilon'].map((seed) => (
                                  <button
                                     key={seed}
                                     onClick={() => {
                                        setLocalConfig({...localConfig, userAvatar: seed});
                                        updateAIConfig({ userAvatar: seed });
                                     }}
                                     className={`relative group rounded-[20px] p-1 transition-all border-2 ${localConfig.userAvatar === seed ? 'border-[#007AFF]/20 bg-[#007AFF]/5' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10'}`}
                                  >
                                     <img 
                                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} 
                                       className="w-full aspect-square rounded-xl object-cover" 
                                       alt={seed} 
                                     />
                                     {localConfig.userAvatar === seed && (
                                        <div className="absolute -top-1 -right-1 bg-[#007AFF]/10 rounded-full p-0.5 shadow-lg">
                                           <CheckCircle2 size={10} className="text-zinc-900 dark:text-zinc-50" />
                                        </div>
                                     )}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div className="pt-6 border-t border-black/5 dark:border-white/10 flex flex-col items-center">
                            <Button 
                               onClick={() => updateAIConfig({ 
                                  userName: localConfig.userName, 
                                  userAvatar: localConfig.userAvatar 
                               })}
                               disabled={saveStatus === 'saving'}
                               className={`w-full md:w-72 h-14 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-black-[.02] border border-black/5 dark:border-white/5 hover:scale-[1.02] active:scale-95 ${
                                  saveStatus === 'saved' ? 'bg-emerald-500 shadow-sm' : 'bg-[#007AFF] shadow-sm hover:bg-[#0062cc]'
                               }`}
                            >
                               {saveStatus === 'saving' ? <Loader2 className="animate-spin mr-3" size={20} /> : saveStatus === 'saved' ? <CheckCircle2 className="mr-3" size={20} /> : <Save className="mr-3" size={20} />}
                               {saveStatus === 'saved' ? t.savedProfile : t.saveProfile}
                            </Button>
                            
                            <div className="mt-10 p-5 bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-[1.5rem] flex items-center gap-5 w-full">
                               <div className="w-12 h-12 bg-[#007AFF]/5 rounded-[20px] flex items-center justify-center flex-shrink-0">
                                  <ShieldCheck size={24} className="text-[#007AFF]" />
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">{t.securityTitle}</p>
                                   <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 leading-relaxed truncate">{t.securityDesc}</p>
                                </div>
                            </div>
                         </div>
                      </div>
                   </Card>
                </motion.div>
               )}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8">
                  {/* Hero Stats */}
                  <div className="md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <Card className="bg-[#007AFF] border-none rounded-[20px] p-6 shadow-xl shadow-black/5 dark:shadow-none relative overflow-hidden group">
                        <div className="relative z-10">
                           <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">{t.totalImpact}</p>
                           <h3 className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{messages.length}</h3>
                           <p className="text-indigo-200 text-[9px] mt-2 flex items-center gap-1">
                              <Activity size={10} /> +12% {t.vsYesterday}
                           </p>
                        </div>
                        <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-zinc-900 dark:text-zinc-50/10 group-hover:rotate-12 transition-transform" />
                     </Card>
                     <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 relative overflow-hidden group">
                        <p className="text-zinc-500 dark:text-[#EBEBF5]/60 text-[10px] font-bold uppercase tracking-widest mb-1">Eficiencia IA</p>
                        <h3 className="text-4xl font-black text-emerald-400">{Math.round((messages.filter(m => m.status === 'responded').length / (messages.length || 1)) * 100)}%</h3>
                        <p className="text-zinc-400 dark:text-zinc-500 text-[9px] mt-2 italic">Ahorro: 4.2h / sem</p>
                        <Bot className="absolute -bottom-4 -right-4 w-20 h-20 text-zinc-300/10" />
                     </Card>
                     <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 relative overflow-hidden group">
                        <p className="text-zinc-500 dark:text-[#EBEBF5]/60 text-[10px] font-bold uppercase tracking-widest mb-1">Nivel de Respuesta</p>
                        <h3 className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{messages.filter(m => m.status === 'responded').length}</h3>
                        <p className="text-zinc-400 dark:text-zinc-500 text-[9px] mt-2">Acciones automáticas</p>
                        <CheckCircle2 className="absolute -bottom-4 -right-4 w-20 h-20 text-zinc-300/10" />
                     </Card>
                  </div>

                  <Card className="md:col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 md:p-8 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Tráfico de Mensajería</h3>
                          <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60 font-mono tracking-tighter">ÚLTIMOS 7 DÍAS DE ACTIVIDAD</p>
                       </div>
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20" />
                       </div>
                    </div>
                    <div className="h-[240px] w-full min-h-[240px]">
                       <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#818cf8" stopOpacity={0.9}/>
                                   <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                             <XAxis 
                                dataKey="date" 
                                stroke="#f8fafc" 
                                fontSize={11} 
                                fontWeight="bold"
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                             />
                             <YAxis 
                                stroke="#f8fafc" 
                                fontSize={11} 
                                fontWeight="bold"
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => Math.floor(val).toString()}
                             />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #6366f1', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}
                                itemStyle={{ color: '#818cf8' }}
                                cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                             />
                             <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" animationDuration={2500} activeDot={{ r: 8, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="md:col-span-12 lg:col-span-4 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 md:p-8 flex flex-col">
                    <h3 className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase mb-6 tracking-widest">Share de Canales</h3>
                    <div className="flex-1 min-h-[240px] flex items-center justify-center relative">
                       <ResponsiveContainer width="100%" height={240} minWidth={0}>
                          <PieChart>
                             <Pie
                                data={platformData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                             >
                                {platformData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                             </Pie>
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }}
                             />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{platformData.reduce((a,b) => a + b.value, 0)}</span>
                          <span className="text-[9px] text-[#007AFF] font-bold uppercase tracking-[0.2em]">{t.channels}</span>
                       </div>
                    </div>
                    <div className="mt-6 space-y-3">
                       {platformData.map((p, i) => (
                         <div key={p.name} className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                               <span className="text-zinc-600 dark:text-zinc-300 font-medium">{p.name}</span>
                            </div>
                            <span className="text-zinc-500 dark:text-[#EBEBF5]/60 font-mono">{p.value}</span>
                         </div>
                       ))}
                    </div>
                  </Card>

                  <Card className="md:col-span-12 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-6 md:p-8 relative overflow-hidden">
                     <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1">
                           <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Feed de Actividad en Tiempo Real</h3>
                           <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60 max-w-md">AMOT monitorea cada interacción. La IA procesa y responde siguiendo la personalidad <span className="text-[#007AFF] font-bold">{config.personality}</span>.</p>
                        </div>
                        <div className="flex-1 space-y-3">
                           {messages.length === 0 ? (
                             <div className="text-center py-6 text-zinc-300 font-mono text-[10px] animate-pulse italic">ESCUCHANDO EVENTOS...</div>
                           ) : (
                             messages.slice(0, 2).map(msg => (
                               <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={msg.id} className="flex gap-4 p-3 rounded-[20px] bg-gray-50 dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 backdrop-blur-md">
                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between mb-1">
                                        <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">{msg.platform}</span>
                                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500">{msg.timestamp.toLocaleTimeString()}</span>
                                     </div>
                                     <p className="text-xs text-zinc-800 dark:text-zinc-200 truncate">{msg.message}</p>
                                  </div>
                               </motion.div>
                             ))
                           )}
                        </div>
                     </div>
                     <Activity size={120} className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none text-[#007AFF]" />
                  </Card>
                </motion.div>
              )}

              {activeTab === 'inbox' && (
                <motion.div key="inbox" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t.inboxTitle.split(' ')[0]} de <span className="text-[#007AFF]">{t.inboxTitle.split(' ')[2]}</span></h3>
                      <p className="text-zinc-500 dark:text-[#EBEBF5]/60 text-xs font-mono uppercase tracking-[0.3em] mt-1">{t.unifiedMgt}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                       <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
                          <Input 
                             placeholder="Filtrar por cliente..." 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] h-10 w-full pl-9 text-xs focus:ring-[#007AFF]/50"
                          />
                       </div>
                       <div className="flex gap-1 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 p-1 rounded-[20px] border border-black/5 dark:border-white/5">
                          {['All', 'WhatsApp', 'Instagram'].map((p) => (
                             <button
                                key={p}
                                onClick={() => setFilterPlatform(p as any)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                   filterPlatform === p ? 'bg-[#007AFF] text-white shadow-lg' : 'text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-600 dark:text-zinc-300'
                                }`}
                             >
                                {p === 'All' ? 'Global' : p}
                             </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredMessages.map((msg, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={msg.id}
                      >
                        <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 overflow-hidden hover:border-[#007AFF]/20 transition-all group backdrop-blur-sm">
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                               <div className={`w-1.5 sm:w-2 ${
                                  msg.platform === 'WhatsApp' ? 'bg-emerald-500' : 
                                  msg.platform === 'Instagram' ? 'bg-pink-500' : 'bg-sky-500'
                               }`} />
                               <div className="p-5 md:p-6 flex-1 flex gap-4 md:gap-6">
                                  <div className="relative flex-shrink-0">
                                     <img src={msg.avatar} className="w-14 h-14 rounded-[20px] border-2 border-black/5 dark:border-white/10 shadow-xl shadow-black/5" alt="Avatar" />
                                     <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 rounded-lg border border-black/5 dark:border-white/5">
                                        {getPlatformIcon(msg.platform)}
                                     </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start mb-3">
                                        <div>
                                           <h4 className="font-black text-zinc-900 dark:text-zinc-50 text-base tracking-tight">{msg.sender}</h4>
                                           <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 uppercase font-mono tracking-widest">{msg.platform} Enterprise ID: {msg.id.slice(0,8)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                           <span className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 font-mono">{msg.timestamp.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                           <Badge className={`${
                                              msg.status === 'responded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                           } text-[8px] uppercase px-2 py-0`}>
                                              {msg.status === 'responded' ? t.processedIA : t.pending}
                                           </Badge>
                                        </div>
                                     </div>

                                     <div className="bg-gray-50 dark:bg-[#1C1C1E] p-4 rounded-[20px] border border-black/5 dark:border-white/5 mb-4 group-hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">
                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 italic leading-relaxed">"{msg.message}"</p>
                                     </div>

                                     {msg.aiResponse ? (
                                       <div className="bg-[#007AFF] border border-[#007AFF]/20 p-4 rounded-[20px] relative">
                                          <div className="flex items-center gap-2 mb-2">
                                             <Sparkles size={10} className="text-[#007AFF]" />
                                             <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">{t.cognitiveResponse}</span>
                                          </div>
                                          <p className="text-xs text-zinc-700 leading-relaxed">{msg.aiResponse}</p>
                                       </div>
                                     ) : (
                                       <div className="flex justify-end pt-2">
                                          <Button 
                                             onClick={() => handleAutoReply(msg)} 
                                             disabled={isResponding === msg.id} 
                                             className="bg-[#007AFF] hover:bg-[#007AFF]/10 text-white rounded-xl gap-2 font-bold px-8 h-11 shadow-lg shadow-sm shadow-black/5 dark:shadow-none active:scale-95 transition-all"
                                          >
                                             <Zap size={14} fill="currentColor" /> <span>{t.executeIA}</span>
                                          </Button>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    
                    {filteredMessages.length === 0 && (
                       <div className="flex flex-col items-center justify-center py-32 text-center">
                          <div className="w-20 h-20 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border border-black/5 dark:border-white/5 rounded-full flex items-center justify-center mb-6">
                             <MessageSquare className="text-zinc-300" size={32} />
                          </div>
                          <h4 className="text-xl font-bold text-zinc-500 dark:text-[#EBEBF5]/60">{t.noActivity}</h4>
                          <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mt-2 italic font-mono uppercase tracking-tighter">{t.systemScanning}</p>
                       </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'config' && (
                <motion.div key="config" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-8">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-6 uppercase tracking-tight">{t.personalityTitle}</h3>
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest">{t.personalityDesc}</Label>
                            <Input 
                               value={localConfig.personality} 
                               onChange={(e) => setLocalConfig({ ...localConfig, personality: e.target.value })}
                               onKeyDown={(e) => e.key === 'Enter' && updateAIConfig({ personality: localConfig.personality })}
                               className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 h-14 rounded-[20px] text-zinc-900 dark:text-zinc-50"
                            />
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest">{t.workLanguage}</Label>
                               <div className="flex gap-2">
                                  <Button 
                                    variant={localConfig.language === 'Español' ? 'default' : 'outline'} 
                                    onClick={() => {
                                      setLocalConfig({ ...localConfig, language: 'Español' });
                                      updateAIConfig({ language: 'Español' });
                                    }} 
                                    className="flex-1 rounded-xl h-12"
                                  >
                                    Español
                                  </Button>
                                  <Button 
                                    variant={localConfig.language === 'Inglés' ? 'default' : 'outline'} 
                                    onClick={() => {
                                      setLocalConfig({ ...localConfig, language: 'Inglés' });
                                      updateAIConfig({ language: 'Inglés' });
                                    }} 
                                    className="flex-1 rounded-xl h-12"
                                  >
                                    English
                                  </Button>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest">{t.theme}</Label>
                               <div className="flex gap-2">
                                  <Button 
                                    variant={localConfig.theme !== 'dark' ? 'default' : 'outline'} 
                                    onClick={() => {
                                      setLocalConfig({ ...localConfig, theme: 'light' });
                                      updateAIConfig({ theme: 'light' });
                                    }} 
                                    className="flex-1 rounded-xl h-12"
                                  >
                                    {t.lightMode}
                                  </Button>
                                  <Button 
                                    variant={localConfig.theme === 'dark' ? 'default' : 'outline'} 
                                    onClick={() => {
                                      setLocalConfig({ ...localConfig, theme: 'dark' });
                                      updateAIConfig({ theme: 'dark' });
                                    }} 
                                    className="flex-1 rounded-xl h-12"
                                  >
                                    {t.darkMode}
                                  </Button>
                               </div>
                            </div>
                         </div>
                         <div className="p-6 bg-[#007AFF] border border-[#007AFF]/20 rounded-[20px] flex items-center justify-between">
                            <div>
                               <p className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{t.autoReply}</p>
                               <span className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-zinc-600 dark:text-zinc-300 transition-colors uppercase tracking-widest">{t.autoReplyDesc}</span>
                            </div>
                            <Switch 
                              checked={localConfig.autoReplyEnabled} 
                              onCheckedChange={(v) => {
                                setLocalConfig({ ...localConfig, autoReplyEnabled: v });
                                updateAIConfig({ autoReplyEnabled: v });
                              }} 
                            />
                         </div>

                         <div className="pt-4">
                             <Button 
                               onClick={() => updateAIConfig(localConfig)}
                               disabled={saveStatus === 'saving'}
                               className={`w-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-[#007AFF]'} text-white rounded-xl h-12 font-bold gap-2 transition-all`}
                             >
                               {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={18} /> : saveStatus === 'saved' ? <CheckCircle2 size={18} /> : <Save size={18} />}
                               {saveStatus === 'saved' ? t.savedSettings : t.saveSettings}
                             </Button>
                          </div>
                      </div>
                    </Card>

                    <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 rounded-[20px] p-8 flex flex-col h-full relative overflow-hidden ring-1 ring-slate-800 hover:ring-[#007AFF]/50 transition-all shadow-2xl shadow-black-[.02] border border-black/5 dark:border-white/5">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#007AFF]/5 rounded-full blur-3xl opacity-50" />
                       <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-tight">AMOT <span className="text-[#007AFF]">Test Lab</span></h3>
                       <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60 mb-6 font-medium">{t.testLabDesc}</p>
                       
                       <div className="flex-1 space-y-4">
                          <div className="bg-gray-50 dark:bg-[#1C1C1E] p-5 rounded-[20px] border border-black/5 dark:border-white/5 min-h-[160px] flex flex-col shadow-none backdrop-blur-sm relative">
                             <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#007AFF]/10 rounded-full animate-ping" />
                             <p className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                                <Activity size={10} className="text-[#007AFF]" /> {t.previewIA}
                             </p>
                             {isTesting ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#007AFF] animate-pulse">
                                   <Loader2 className="animate-spin" size={20} />
                                   <span className="text-[9px] font-mono tracking-widest uppercase">{t.scanning}</span>
                                </div>
                             ) : testResponse ? (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                                   <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-[#007AFF]/10 rounded-full" />
                                   <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic px-2">"{testResponse}"</p>
                                </motion.div>
                             ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                                   <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                                      <Bot size={18} className="text-zinc-400 dark:text-zinc-500" />
                                   </div>
                                   <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[180px] leading-relaxed uppercase tracking-tighter">{t.enterTest}</p>
                                </div>
                             )}
                          </div>
                          
                          <div className="space-y-3">
                             <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase tracking-widest flex justify-between">
                                {t.testInputLabel} <span>AMOT-X1</span>
                             </Label>
                             <div className="flex gap-3">
                                <Input 
                                   placeholder="Ej: ¿Hay stock de este producto?" 
                                   value={testInput}
                                   onChange={(e) => setTestInput(e.target.value)}
                                   onKeyDown={(e) => {
                                      if (e.key === 'Enter' && testInput && !isTesting) {
                                         // Trigger logic
                                      }
                                   }}
                                   className="bg-gray-50 dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 h-14 rounded-[20px] text-zinc-900 dark:text-zinc-50 focus:ring-1 focus:ring-[#007AFF] transition-all border-opacity-50"
                                />
                                <Button 
                                   onClick={async () => {
                                      if (!testInput) return;
                                      setIsTesting(true);
                                      try {
                                         const res = await generateAutoResponse({
                                            platform: 'WhatsApp',
                                            sender: 'Lead Cualificado',
                                            message: testInput,
                                            personality: localConfig.personality,
                                            language: localConfig.language
                                         });
                                         setTestResponse(res);
                                      } finally {
                                         setIsTesting(false);
                                      }
                                   }}
                                   disabled={isTesting || !testInput}
                                   className="bg-[#007AFF] hover:bg-[#0062cc] h-14 w-14 rounded-[20px] shadow-sm group transition-all text-white"
                                >
                                   <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Button>
                             </div>
                          </div>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                          <p className="text-[9px] text-zinc-500 dark:text-[#EBEBF5]/60 uppercase font-bold mb-3 tracking-[0.1em]">{t.presets}:</p>
                          <div className="grid grid-cols-2 gap-2">
                             {[
                                {name: t.corporate, val: t.corporateDesc},
                                {name: t.sales, val: t.salesDesc},
                                {name: t.friendly, val: t.friendlyDesc},
                                {name: t.direct, val: t.directDesc},
                             ].map(preset => (
                                <button 
                                   key={preset.name}
                                   onClick={() => {
                                     setLocalConfig({...localConfig, personality: preset.val});
                                     updateAIConfig({ personality: preset.val });
                                   }}
                                   className="text-left px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-[9px] text-zinc-500 dark:text-[#EBEBF5]/60 hover:text-[#007AFF]/80 hover:bg-[#007AFF]/5 transition-all border border-black/5 dark:border-white/5"
                                >
                                   <span className="font-black block text-[#007AFF]/70">{preset.name}</span>
                                   <span className="truncate block opacity-50">{preset.val}</span>
                                </button>
                             ))}
                          </div>
                       </div>
                    </Card>
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border border-black/5 dark:border-white/5 p-6 rounded-[30px] gap-4">
                      <div>
                         <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Base de Datos Mercado Libre</h3>
                         <p className="text-sm text-zinc-500 dark:text-[#EBEBF5]/60 mt-1">Inventario sincronizado para el cerebro IA</p>
                      </div>
                      <Button onClick={syncMeliInventory} disabled={isSyncingMeli} className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl h-12 px-8 gap-2 active:scale-95 transition-all">
                         {isSyncingMeli ? <Loader2 className="animate-spin" size={18} /> : <Activity size={18} />} {products.length > 0 ? "Actualizar Inventario" : "Sincronizar Ahora"}
                      </Button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map(prod => (
                         <Card key={prod.id} className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border border-black/5 dark:border-white/10 p-6 rounded-[25px] group hover:border-[#007AFF]/30 transition-all">
                            <div className="flex gap-4 items-center">
                               <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{prod.thumbnail || '📦'}</div>
                               <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                     <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm truncate max-w-[120px]">{prod.title}</h4>
                                     <Badge className={`${prod.stock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border-0 text-[8px]`}>
                                        {prod.stock > 0 ? 'En Stock' : 'Sin Stock'}
                                     </Badge>
                                  </div>
                                  <p className="text-xs text-[#007AFF] font-black mt-1">${prod.price}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                     <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full ${prod.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(prod.stock * 2, 100)}%` }} />
                                     </div>
                                     <span className="text-[10px] text-zinc-500 font-mono">{prod.stock} u</span>
                                  </div>
                               </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                               <Button variant="outline" className="flex-1 text-[10px] uppercase font-bold h-9 rounded-xl border-black/5" onClick={() => alert("Abriendo link...")}>Ver Link</Button>
                               <Button variant="outline" className="flex-1 text-[10px] uppercase font-bold h-9 rounded-xl border-black/5">Editar IA</Button>
                            </div>
                         </Card>
                      ))}
                      {products.length === 0 && !isSyncingMeli && (
                         <div className="col-span-full py-20 text-center text-zinc-500 italic">No hay productos sincronizados. Pulsa el botón superior para cargar el catálogo.</div>
                      )}
                      <Card className="bg-zinc-100/50 dark:bg-zinc-800/10 border-2 border-dashed border-black/5 dark:border-white/5 p-6 rounded-[25px] flex flex-col items-center justify-center text-center py-12">
                         <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><Hash size={24} className="text-zinc-400" /></div>
                         <p className="text-xs text-zinc-400 uppercase font-black">Agregar Producto Manual</p>
                      </Card>
                   </div>
                </motion.div>
              )}

              {activeTab === 'connections' && (
                <motion.div key="connections" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 p-6 md:p-8 rounded-[20px] relative overflow-hidden">
                      <div className="absolute top-4 right-4">
                         <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[8px] px-2 py-0.5">E-Commerce</Badge>
                      </div>
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 bg-yellow-500/20 rounded-[20px] flex items-center justify-center">
                            <Activity className="text-yellow-500" />
                         </div>
                         <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Mercado Libre</h3>
                            <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60">Sincronización de Ventas</p>
                         </div>
                      </div>
                      
                      <div className="space-y-6">
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">Meli User ID</Label>
                               <Input 
                                 placeholder="Ej: 12345678" 
                                 value={localConfig.meliUserId || ''} 
                                 onChange={(e) => setLocalConfig({...localConfig, meliUserId: e.target.value})}
                                 className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                               />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">Auto-Sincronización</Label>
                               <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-black/5">
                                  <span className="text-[10px] text-zinc-500">Actualizar Stock cada hora</span>
                                  <Switch 
                                    checked={localConfig.meliSyncEnabled || false}
                                    onCheckedChange={(checked) => setLocalConfig({...localConfig, meliSyncEnabled: checked})}
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="pt-4">
                            <Button 
                              onClick={() => updateAIConfig({ meliUserId: localConfig.meliUserId, meliSyncEnabled: localConfig.meliSyncEnabled })}
                              className={`w-full bg-yellow-500 text-black rounded-xl h-12 font-bold gap-2 transition-all active:scale-95`}
                            >
                               <Zap size={18} /> {t.meliLink}
                            </Button>
                         </div>
                      </div>
                   </Card>
                   
                   <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 p-6 md:p-8 rounded-[20px] relative overflow-hidden">
                         <div className="absolute top-4 right-4">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] px-2 py-0.5">{t.highAvailability}</Badge>
                         </div>
                         <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-[20px] flex items-center justify-center">
                               <MessageCircle className="text-emerald-500" />
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">WhatsApp Enterprise</h3>
                               <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60">{t.directConnectivity}</p>
                            </div>
                         </div>
                         
                         <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-[20px] border border-black/5 dark:border-white/5">
                               <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-2">Webhook Callback URL</p>
                               <div className="flex items-center justify-between gap-2">
                                  <code className="text-[9px] text-[#007AFF] break-all font-mono">
                                     {window.location.origin}/api/webhook/whatsapp
                                  </code>
                               </div>
                               <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60 mt-2">{t.verifyToken}: <span className="text-[#007AFF]/80 font-mono">amot_token_secure</span></p>
                            </div>

                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">{t.publicMsgNumber}</Label>
                                  <Input 
                                    placeholder="Ej: 0000000000" 
                                    value={localConfig.displayPhoneNumber || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, displayPhoneNumber: e.target.value})}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                     <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">{t.phoneNumberId}</Label>
                                     {saveStatus === 'saved' && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[8px] h-4">Sincronizado</Badge>}
                                  </div>
                                  <Input 
                                    placeholder="Ej: 100000000000000" 
                                    value={localConfig.whatsappPhoneId || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, whatsappPhoneId: e.target.value})}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">{t.accessToken}</Label>
                                  <Input 
                                    type="password"
                                    placeholder="EAAB..." 
                                    value={localConfig.whatsappAccessToken || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, whatsappAccessToken: e.target.value})}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                                  />
                               </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                               <Button 
                                 onClick={() => updateAIConfig({ 
                                    whatsappPhoneId: localConfig.whatsappPhoneId, 
                                    whatsappAccessToken: localConfig.whatsappAccessToken,
                                    displayPhoneNumber: localConfig.displayPhoneNumber 
                                 })}
                                 disabled={!localConfig.whatsappAccessToken || !localConfig.whatsappPhoneId || saveStatus === 'saving'} 
                                 className={`flex-1 ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-emerald-600'} text-white rounded-xl h-12 font-bold gap-2 transition-all active:scale-95`}
                               >
                                  {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={18} /> : saveStatus === 'saved' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                                  {saveStatus === 'saved' ? t.active : t.activateChannel}
                               </Button>
                               <Button variant="outline" className="w-12 h-12 border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 rounded-xl" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}>
                                  <ExternalLink size={18} className="text-zinc-500 dark:text-[#EBEBF5]/60" />
                               </Button>
                            </div>
                            {saveStatus === 'error' && <p className="text-[10px] text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2">Error de credenciales. Revisa el portal.</p>}
                         </div>
                      </Card>

                      <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 p-6 md:p-8 rounded-[20px] relative overflow-hidden">
                         <div className="absolute top-4 right-4">
                            <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 text-[8px] px-2 py-0.5">{t.realTimeSync}</Badge>
                         </div>
                         <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-[20px] flex items-center justify-center">
                               <Instagram className="text-pink-500" />
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Instagram PRO</h3>
                               <p className="text-xs text-zinc-500 dark:text-[#EBEBF5]/60">{t.advInteractions}</p>
                            </div>
                         </div>
                         
                         <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-[20px] border border-black/5 dark:border-white/5">
                               <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-2">Webhook Callback URL</p>
                               <div className="flex items-center justify-between gap-2">
                                  <code className="text-[9px] text-[#007AFF] break-all font-mono">
                                     {window.location.origin}/api/webhook/instagram
                                  </code>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">Instagram Account ID</Label>
                                  <Input 
                                    placeholder="ID de tu cuenta profesional" 
                                    value={localConfig.instagramAccountId || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, instagramAccountId: e.target.value})}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-zinc-500 dark:text-[#EBEBF5]/60 uppercase">Access Token</Label>
                                  <Input 
                                    type="password"
                                    placeholder="EAAB..." 
                                    value={localConfig.instagramAccessToken || ''} 
                                    onChange={(e) => setLocalConfig({...localConfig, instagramAccessToken: e.target.value})}
                                    className="bg-zinc-100 dark:bg-zinc-800/50 border-black/5 dark:border-white/10 font-mono text-xs text-zinc-800 dark:text-zinc-200" 
                                  />
                               </div>
                            </div>

                            <div className="pt-4">
                               <Button 
                                 onClick={() => updateAIConfig({ instagramAccountId: localConfig.instagramAccountId, instagramAccessToken: localConfig.instagramAccessToken })}
                                 disabled={!localConfig.instagramAccessToken || !localConfig.instagramAccountId || saveStatus === 'saving'} 
                                 className={`w-full ${saveStatus === 'saved' ? 'bg-pink-500' : 'bg-pink-600'} text-white rounded-xl h-12 font-bold gap-2 transition-all`}
                               >
                                  {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={18} /> : saveStatus === 'saved' ? <CheckCircle2 size={18} /> : <Instagram size={18} />}
                                  {saveStatus === 'saved' ? t.linkedSuccess : t.linkInstagram}
                               </Button>
                            </div>
                         </div>
                      </Card>
                   </div>

                   <Card className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl dark:border-white/5 border-black/5 dark:border-white/10 p-6 rounded-[20px] border-dashed">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#007AFF]" /> {t.techManual}
                      </h4>
                      <div className="space-y-4">
                         <div className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] flex items-center justify-center font-bold flex-shrink-0">1</div>
                            <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60">{t.metaPortal} <a href="https://developers.facebook.com" target="_blank" className="text-[#007AFF] underline">Meta Enterprise</a>.</p>
                         </div>
                         <div className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] flex items-center justify-center font-bold flex-shrink-0">2</div>
                            <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60">{t.metaStep2}</p>
                         </div>
                         <div className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] flex items-center justify-center font-bold flex-shrink-0">3</div>
                            <p className="text-[10px] text-zinc-500 dark:text-[#EBEBF5]/60">{t.metaStep3}</p>
                         </div>
                         <div className="mt-4 p-4 bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-[20px]">
                            <h5 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50 mb-2 uppercase">¿Problemas con el registro?</h5>
                            <p className="text-[9px] text-zinc-500 dark:text-[#EBEBF5]/60 leading-relaxed">
                               Si el proceso de Meta resulta complejo para tu cliente, puedes optar por la <b>Vinculación Directa vía QR</b>. Nota: Este método requiere un servidor dedicado secundario y es menos estable que el protocolo Enterprise actual.
                            </p>
                            <Button variant="link" className="text-[9px] p-0 h-auto text-[#007AFF] mt-2" onClick={() => alert("Contacta con soporte para activar el módulo de Escaneo QR Legacy.")}>Solicitar activación de QR →</Button>
                         </div>
                         <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-[20px]">
                            <h5 className="text-[10px] font-bold text-red-400 mb-2 uppercase">Centro de Diagnóstico (AMOT Debug)</h5>
                            <ul className="space-y-2 text-[9px] text-zinc-500 dark:text-[#EBEBF5]/60">
                               <li className="flex gap-2"><span>❌</span> <b>Error 403 en Meta:</b> El "Verify Token" en Facebook debe ser exactamente <code className="text-zinc-900 dark:text-zinc-50">amot_token_secure</code>.</li>
                               <li className="flex gap-2"><span>❌</span> <b>No se guardan los datos:</b> Asegúrate de presionar el botón azul "Activar Canal" después de escribir.</li>
                               <li className="flex gap-2"><span>❌</span> <b>La IA no responde:</b> Tu número debe estar en "Modo Desarrollo" o tener un método de pago válido en Meta (aunque sea gratuito los primeros 1000 chats).</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                               <Button variant="outline" className="w-full text-[9px] h-8 border-black/5 dark:border-white/10 font-bold text-[#007AFF]" onClick={() => alert("Sistema AMOT en línea. El servidor está listo para recibir mensajes.")}>Ejecutar Test de Sistema</Button>
                            </div>
                         </div>

                         <div className="mt-2 p-3 bg-zinc-200 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-xl">
                            <p className="text-[9px] text-zinc-500 dark:text-[#EBEBF5]/60 leading-relaxed">
                               🛡️ <b>Seguridad de Datos:</b> Conectividad cifrada mediante protocolos industriales de alta seguridad para la protección de la información del cliente.
                            </p>
                         </div>
                      </div>
                   </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-zinc-50 dark:bg-zinc-950 border-t border-black/5 dark:border-white/10 p-3 flex justify-around items-center w-full z-50 bg-opacity-95 backdrop-blur-sm">
           {navLinks.slice(0, 4).map((link) => {
             const Icon = link.icon;
             return (
               <button
                 key={link.id}
                 onClick={() => setActiveTab(link.id)}
                 className={`relative p-3 rounded-[20px] transition-all ${
                   activeTab === link.id ? 'text-[#007AFF]' : 'text-zinc-500 dark:text-[#EBEBF5]/60'
                 }`}
               >
                 <Icon size={24} />
                 {activeTab === link.id && (
                   <motion.div layoutId="mobileActivePill" className="absolute inset-0 bg-[#007AFF]/10 rounded-[20px] -z-10" />
                 )}
               </button>
             );
          })}
        </nav>

        <footer className="mt-4 hidden md:flex justify-between items-center text-[9px] text-zinc-400 dark:text-zinc-500 border-t border-black/5 dark:border-white/10 pt-4 px-4 font-mono font-medium uppercase tracking-widest">
           <div>© 2026 AMOT PRO. Todos los derechos reservados.</div>
           <div className="flex gap-6">
              <span>Licencia Corporativa Activa</span>
              <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sincronización de Sistemas
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}
