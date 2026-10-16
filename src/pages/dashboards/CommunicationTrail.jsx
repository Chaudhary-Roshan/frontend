import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { MessageSquare, Send } from 'lucide-react';

const CommunicationTrail = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await api.get('messages/');
      setMessages(res.data.filter(m => m.society === user.society));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.society) fetchMessages();
  }, [user?.society]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post('messages/', { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><MessageSquare size={28} /></div>
          Communication Trail
        </h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="h-96 overflow-y-auto mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 flex flex-col">
            {messages.length === 0 ? (
              <p className="text-slate-400 m-auto">No messages in the trail.</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === user.id ? 'bg-blue-600 text-white self-end rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-bl-sm shadow-sm'}`}>
                  <p className={`text-xs font-bold mb-1 ${msg.sender === user.id ? 'text-blue-200' : 'text-slate-400'}`}>{msg.sender_name}</p>
                  <p className="text-sm font-medium">{msg.content}</p>
                  <p className={`text-[10px] mt-2 font-bold uppercase ${msg.sender === user.id ? 'text-blue-300' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              type="text" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message to your cabinet..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
              Send <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunicationTrail;
