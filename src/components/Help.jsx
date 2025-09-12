import React, { useState, useRef, useEffect } from 'react';
import ccare from '../assests/customercare.webp'

const Help = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message, loading: false };
    setConversation(prevConversation => [...prevConversation, userMessage, { sender: 'bot', text: 'Typing...', loading: true }]);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const botResponse = await response.json();
      const botMessage = { sender: 'bot', text: botResponse.text, loading: false };

      // Update the conversation by removing the "Typing..." message and adding the bot's response
      setConversation(prevConversation => {
        const newConversation = prevConversation.slice(0, -1); // Remove the last item (Typing...)
        return [...newConversation, botMessage];
      });

    } catch (error) {
      console.error('Failed to get bot response:', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I am having trouble connecting right now. Please try again later.', loading: false };
      
      setConversation(prevConversation => {
        const newConversation = prevConversation.slice(0, -1); // Remove the last item (Typing...)
        return [...newConversation, errorMessage];
      });
    }
  };

  return (
    <>
      {/* Floating Help Icon with Customer Care Image */}
      <div
        className="fixed bottom-8 right-8 w-16 h-16 p-2 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 z-50"
        onClick={() => setIsOpen(true)}
      >
        <img src={ccare} alt="Help Logo" className="w-full h-full object-contain" />
      </div>

      {/* Full-Screen Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300">
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col h-[75vh] max-h-[600px] overflow-hidden transform transition-transform duration-300 scale-95 animate-modal-in"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">AI Support Center</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none transition-transform duration-200 hover:rotate-90"
              >
                &times;
              </button>
            </div>
            
            {/* Chat Conversation */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {conversation.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`p-4 rounded-xl max-w-[80%] shadow-md text-sm transition-all duration-300
                    ${msg.sender === 'user' ? 'bg-gradient-to-tr from-sky-400 to-blue-500 text-white animate-fade-in-right' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 animate-fade-in-left'}`}
                  >
                    {msg.loading ? (
                       <span className="animate-pulse">Typing...</span>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input and Contact Options */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                placeholder="Write your complaint or issue here..."
                rows="2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                onClick={handleSendMessage}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Send to Bot
              </button>
              
              <div className="flex flex-col md:flex-row justify-center items-center mt-5 text-sm text-gray-600 dark:text-gray-400">
                <p>Or connect with us:</p>
                <div className="flex space-x-4 mt-2 md:mt-0 md:ml-4">
                  <a href="chsachin00799@gmail.com" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                    Email
                  </a>
                  <a href="https://wa.me/+9779827240700" className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Help;
