import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform, ToastAndroid, AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useModel } from './useModel';
import { Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  responseTime?: number; // in milliseconds
  tokensPerSecond?: number;
  tokenCount?: number; // Added token count field
};

export type ChatSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  title?: string;
};

// Generate a UUID for session IDs
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Storage key for chat sessions
const CHAT_SESSIONS_KEY = 'chat_sessions';

/**
 * Custom hook for managing chat functionality
 * @param modelPath Path to the LLM model file
 * @returns Chat state and functions
 */
export const useChat = (modelPath: string) => {
  const navigation = useNavigation();
  const { model, loadModel, loading, error, modelInfo, tokenizeText } = useModel();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // Define stop words for model completion
  const stopWords = useMemo(() => [
    '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', 
    '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
    '<|end_of_turn|>', '<|endoftext|>', 'User:', 'Assistant:'
  ], []);

  /**
   * Save all chat sessions
   */
  const saveAllSessions = useCallback(async (sessions: ChatSession[]) => {
    try {
      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
      console.log(`Saved ${sessions.length} sessions to AsyncStorage`);
    } catch (err) {
      console.error('Error saving all chat sessions:', err);
    }
  }, []);

  /**
   * Save current chat session
   */
  const saveCurrentSession = useCallback(async () => {
    if (!activeSessionId || messages.length === 0) return;
    
    try {
      // Check if the session exists already
      let existingSessionIndex = chatSessions.findIndex(s => s.id === activeSessionId);
      let updatedSessions;
      
      if (existingSessionIndex >= 0) {
        // Update existing session
        updatedSessions = [...chatSessions];
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          messages,
          updatedAt: Date.now()
        };
      } else {
        // Create a new session if it doesn't exist
        const newSession: ChatSession = {
          id: activeSessionId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages,
          title: messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'New Chat'
        };
        updatedSessions = [newSession, ...chatSessions];
      }
      
      setChatSessions(updatedSessions);
      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(updatedSessions));
      console.log('Chat session saved successfully', activeSessionId);
    } catch (err) {
      console.error('Error saving chat session:', err);
    }
  }, [activeSessionId, messages, chatSessions]);

  /**
   * Create a new chat session
   */
  const createNewChat = useCallback(() => {
    // Save current session first if it exists
    if (activeSessionId) {
      saveCurrentSession();
    }
    
    // Create a new session
    const newSessionId = generateId();
    console.log('Creating new chat session with ID:', newSessionId);
    
    const newSession: ChatSession = {
      id: newSessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful, accurate and concise assistant. Provide direct, focused answers to questions.'
        }
      ]
    };
    
    const newSessions = [newSession, ...chatSessions];
    setChatSessions(newSessions);
    setActiveSessionId(newSessionId);
    setMessages(newSession.messages);
    
    // Immediately save to AsyncStorage
    saveAllSessions(newSessions);
  }, [chatSessions, saveCurrentSession, saveAllSessions]);

  /**
   * Load saved chat sessions from AsyncStorage
   */
  const loadChatSessions = useCallback(async () => {
    try {
      const sessionsData = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
      console.log('Loading chat sessions from storage');
      
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as ChatSession[];
        console.log(`Found ${sessions.length} sessions in storage`);
        
        setChatSessions(sessions);
        
        // Set the most recent session as active if any exist
        if (sessions.length > 0) {
          const mostRecent = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          setActiveSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
          console.log('Set active session to:', mostRecent.id);
        } else {
          // Create a new session if none exist
          console.log('No existing sessions, creating new chat');
          createNewChat();
        }
      } else {
        // Create a new session if no data exists
        console.log('No sessions data in storage, creating new chat');
        createNewChat();
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      // Create a new session if loading fails
      createNewChat();
    }
  }, [createNewChat]);

  // Initialize model and load chat sessions when path changes
  useEffect(() => {
    if (modelPath) {
      loadChatSessions();
      initializeModel();
    }
    
    // Cleanup function to handle component unmounting
    return () => {
      console.log('Component unmounting, saving current session');
      if (activeSessionId && messages.length > 0) {
        saveCurrentSession();
      }
    };
  }, [modelPath]);

  // Add AppState listener to save sessions when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, saving chat session');
        saveCurrentSession();
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      appStateSubscription.remove();
    };
  }, [saveCurrentSession]);

  // Update messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      const session = chatSessions.find(session => session.id === activeSessionId);
      if (session) {
        setMessages(session.messages);
      }
    }
  }, [activeSessionId, chatSessions]);

  /**
   * Initialize the LLM model
   */
  const initializeModel = useCallback(async () => {
    try {
      // Only show loading message if we don't have an active session
      if (!activeSessionId) {
        setMessages([{
          role: 'system',
          content: '🤖 Loading model...'
        }]);
      }
      
      await loadModel(modelPath);
      
      // Only update messages if we don't have an active session
      if (!activeSessionId) {
        createNewChat();
      }
    } catch (err: any) {
      const errorMsg = err.message?.includes('initialize context') 
        ? 'Failed to load model. Your device might not have enough memory (minimum 3GB RAM required).'
        : err.message || 'Unknown error loading model';
      
      setMessages([{
        role: 'system',
        content: '⚠️ ' + errorMsg
      }]);
      
      Alert.alert(
        'Model Error',
        errorMsg,
        [
          { text: 'Try Again', onPress: initializeModel },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    }
  }, [modelPath, loadModel, navigation, createNewChat, activeSessionId]);

  /**
   * Switch to another chat session
   */
  const switchChatSession = useCallback((sessionId: string) => {
    // Save current session first
    if (activeSessionId) {
      saveCurrentSession();
    }
    
    // Switch to the selected session
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages(session.messages);
      console.log('Switched to session:', sessionId);
    }
  }, [chatSessions, saveCurrentSession, activeSessionId]);

  /**
   * Delete a chat session
   */
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
    setChatSessions(updatedSessions);
    saveAllSessions(updatedSessions);
    console.log('Deleted session:', sessionId);
    
    // If we deleted the active session, switch to another one or create a new one
    if (sessionId === activeSessionId) {
      if (updatedSessions.length > 0) {
        const nextSession = updatedSessions[0];
        setActiveSessionId(nextSession.id);
        setMessages(nextSession.messages);
      } else {
        createNewChat();
      }
    }
  }, [chatSessions, activeSessionId, saveAllSessions, createNewChat]);

  /**
   * Copy text to clipboard
   * @param text Text to copy
   */
  const copyToClipboard = useCallback((text: string) => {
    Clipboard.setString(text);
    
    // Show feedback based on platform
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    } else {
      // For iOS, we'll use the modal feedback
      Alert.alert('Copied', 'Message copied to clipboard');
    }
  }, []);

  /**
   * Handle long press on a message
   * @param message The message that was long-pressed
   */
  const handleMessageLongPress = useCallback((message: ChatMessage) => {
    setSelectedMessage(message);
    setModalVisible(true);
  }, []);

  /**
   * Send a message to the model and process the response
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || isThinking || !model) return;

    const userMessage = input.trim();
    setInput('');
    
    // If this is a new session with only system message, set a title
    const isNewChat = messages.length === 1 && messages[0].role === 'system';
    
    try {
      // Get token count for user message
      const userTokenCount = await tokenizeText(userMessage);
      
      // Add user message to messages array
      const updatedMessages: ChatMessage[] = [
        ...messages,
        { 
          role: 'user', 
          content: userMessage,
          timestamp: Date.now(),
          tokenCount: userTokenCount 
        }
      ];
      setMessages(updatedMessages);
      setIsThinking(true);

      const startTime = Date.now();
      
      // Get model response
      const response = await model.completion({
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        n_predict: 512,
        temperature: 0.7,
        stop: stopWords
      });

      const generatedText = response.content;
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Get token count for the response
      const finalTokenCount = await tokenizeText(generatedText);
      
      // Calculate tokens per second
      const tokensPerSecond = responseTime > 0 ? finalTokenCount / (responseTime / 1000) : 0;
      
      let finalMessages: ChatMessage[];
      
      if (generatedText.trim()) {
        // Add assistant response to messages with metrics
        finalMessages = [
          ...updatedMessages,
          { 
            role: 'assistant', 
            content: generatedText.trim(),
            timestamp: endTime,
            responseTime: responseTime,
            tokensPerSecond: tokensPerSecond,
            tokenCount: finalTokenCount
          }
        ];
      } else {
        // Handle empty response
        finalMessages = [
          ...updatedMessages,
          { 
            role: 'assistant', 
            content: "I couldn't generate a response. Please try again.",
            timestamp: endTime,
            responseTime: responseTime
          }
        ];
      }
      
      setMessages(finalMessages);
      
      // Update chat session with new messages
      const updatedSessions = chatSessions.map(session => {
        if (session.id === activeSessionId) {
          // If this is a new chat, set the title based on the first user message
          const title = isNewChat ? userMessage.slice(0, 50) : session.title;
          
          return {
            ...session,
            messages: finalMessages,
            updatedAt: Date.now(),
            title: title
          };
        }
        return session;
      });
      
      setChatSessions(updatedSessions);
      await saveAllSessions(updatedSessions); // Save immediately after sending a message
      
    } catch (err: any) {
      console.error('Generation error:', err);
      // Add error message
      const errorMessages: ChatMessage[] = [
        ...messages,
        { 
          role: 'assistant' as const, 
          content: `⚠️ Error: ${err.message || 'Failed to generate response'}`,
          timestamp: Date.now()
        }
      ];
      
      setMessages(errorMessages);
      
      // Update chat session with error message
      const updatedSessions = chatSessions.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: errorMessages,
            updatedAt: Date.now()
          };
        }
        return session;
      });
      
      setChatSessions(updatedSessions);
      await saveAllSessions(updatedSessions);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, model, messages, tokenizeText, stopWords, chatSessions, activeSessionId, saveAllSessions]);

  /**
   * Reset the chat - creates a new chat session
   */
  const resetChat = useCallback(() => {
    createNewChat();
  }, [createNewChat]);

  return {
    input,
    setInput,
    messages,
    isThinking,
    loading,
    selectedMessage,
    modalVisible,
    modelInfo,
    chatSessions,
    activeSessionId,
    handleSend,
    handleMessageLongPress,
    copyToClipboard,
    setModalVisible,
    createNewChat,
    switchChatSession,
    deleteSession,
    resetChat
  };
};