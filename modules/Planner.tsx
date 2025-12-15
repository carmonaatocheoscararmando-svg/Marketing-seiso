import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Send, Bot, User, CheckCircle, Clock } from 'lucide-react';
import { ChatMessage, CalendarEvent } from '../types';
import { chatWithGenius } from '../services/mockAiService';
import { getDatabase, savePlannerEvent, saveChatHistory } from '../services/persistence';

const Planner: React.FC = () => {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar datos "del archivo JSON" (Persistence)
    const db = getDatabase();
    
    // Si la BD está vacía de eventos, ponemos algunos de ejemplo
    if (db.planner.length === 0) {
       const initialEvents: CalendarEvent[] = [
        { id: '1', title: 'Ad Zapatillas X', date: today, status: 'published', type: 'ads' },
        { id: '2', title: 'Carrusel Limpieza', date: new Date(new Date().setDate(today.getDate() + 2)), status: 'scheduled', type: 'carousel' },
       ];
       initialEvents.forEach(e => savePlannerEvent(e));
       setEvents(initialEvents);
    } else {
        setEvents(db.planner);
    }

    setMessages(db.chatHistory);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim()) return;
    
    const newMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputMsg, timestamp: new Date() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    
    setInputMsg('');
    setIsTyping(true);

    const reply = await chatWithGenius(updatedMessages, inputMsg);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: reply, timestamp: new Date() };
    const finalMessages = [...updatedMessages, aiMsg];
    setMessages(finalMessages);
    saveChatHistory(finalMessages);
    setIsTyping(false);

    // Simular que la IA agenda algo si detecta intención (Demo)
    if(inputMsg.toLowerCase().includes('agendar') || inputMsg.toLowerCase().includes('calendario')) {
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: 'Nueva Idea Estratégica',
            date: new Date(new Date().setDate(today.getDate() + 3)),
            status: 'idea',
            type: 'planner'
        };
        savePlannerEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* CALENDAR AREA */}
        <div className="flex-1 p-8 overflow-y-auto">
             <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Planner Estratégico</h2>
                <p className="text-slate-500">Organización inteligente de tus campañas.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CalendarIcon className="text-orange-500" /> Esta Semana
                </h3>
                
                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day, idx) => {
                         const dayEvents = events.filter(e => e.date.toDateString() === day.toDateString());
                         const isToday = day.toDateString() === today.toDateString();

                         return (
                            <div key={idx} className={`min-h-[150px] border rounded-xl p-3 ${isToday ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-sm font-bold mb-2 ${isToday ? 'text-orange-600' : 'text-slate-500'}`}>
                                    {day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                                </div>
                                <div className="space-y-2">
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} className="bg-white p-2 rounded shadow-sm border border-slate-100 text-xs">
                                            <div className={`w-2 h-2 rounded-full mb-1 ${ev.status === 'published' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <p className="font-medium truncate">{ev.title}</p>
                                            <p className="text-slate-400 capitalize">{ev.status}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-lg mb-4">Tareas & Borradores</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">Analizar métricas de video "Taladro"</span>
                        </div>
                        <button className="text-xs text-orange-600 font-bold">Hacer ahora</button>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-sm font-medium text-slate-400 line-through">Subir carrusel de bienvenida</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* GENIUS CHAT SIDEBAR */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Genius Marketing</h3>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                            msg.sender === 'user' 
                                ? 'bg-orange-500 text-white rounded-tr-none' 
                                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                        }`}>
                            <p>{msg.text}</p>
                            <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'user' ? 'text-orange-100' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Escribe tu idea..."
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Planner;