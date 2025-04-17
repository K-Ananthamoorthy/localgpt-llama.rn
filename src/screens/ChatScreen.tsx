import React, { useRef, useEffect, useMemo, memo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  FlatList
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useChat, ChatMessage, ChatSession } from '../hooks/useChat';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install this package

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Chat Session Item Component
const ChatSessionItem = memo(({ 
  session, 
  isActive, 
  onPress, 
  colors 
}: { 
  session: ChatSession; 
  isActive: boolean; 
  onPress: () => void; 
  colors: any;
}) => {
  // Get the first user message to use as title, or use default
  const title = session.messages.find(m => m.role === 'user')?.content.slice(0, 25) || 'New Chat';
  const displayTitle = title.length > 25 ? `${title}...` : title;
  
  return (
    <TouchableOpacity
      style={[
        styles.sessionItem,
        isActive && { backgroundColor: colors.activeSession },
        { borderBottomColor: colors.border }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 18, color: colors.secondaryText, marginRight: 10 }}>💬</Text>
      <Text 
        style={[styles.sessionTitle, { color: colors.text }]} 
        numberOfLines={1}
      >
        {displayTitle}
      </Text>
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
});

// Memoized message bubble component for performance
const MessageBubble = memo(({ 
  message, 
  colors, 
  onLongPress 
}: { 
  message: ChatMessage; 
  colors: any; 
  onLongPress: (message: ChatMessage) => void;
}) => {
  // Determine message styling
  const isSystem = message.role === 'system' && !message.content.includes('🤖 Model loaded successfully');
  
  // Skip rendering system prompts that aren't meant to be displayed
  if (isSystem && !message.content.includes('⚠️') && !message.content.includes('🤖')) {
    return null;
  }
  
  const isUser = message.role === 'user';
  const isError = message.content.includes('⚠️');
  
  return (
    <Pressable
      style={[
        styles.messageBubble,
        isUser ? [styles.userBubble, { backgroundColor: colors.userBubble }] : 
                [styles.assistantBubble, { backgroundColor: colors.assistantBubble }],
        isSystem && [styles.systemBubble, { backgroundColor: colors.systemBubble }],
        isError && { backgroundColor: colors.error }
      ]}
      onLongPress={() => onLongPress(message)}
      delayLongPress={500}
    >
      <Text style={[
        styles.messageText,
        isUser ? [styles.userText, { color: colors.userText }] : 
               [styles.assistantText, { color: colors.assistantText }],
        isError && { color: '#FFFFFF' }
      ]}>
        {message.content}
      </Text>
      
      {(message.role === 'assistant' && message.responseTime) && (
        <Text style={[styles.metaText, { color: colors.secondaryText }]}>
          {(message.responseTime / 1000).toFixed(2)}s • {message.tokenCount || 0} tokens
        </Text>
      )}
    </Pressable>
  );
});

const ChatScreen = ({ route, navigation }: Props) => {
  const { colors } = useTheme();
  const { modelPath } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const {
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
    deleteSession
  } = useChat(modelPath);

  // Automatically scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100); // Small delay to ensure render completes
    
    return () => clearTimeout(timer);
  }, [messages]);

// Add header buttons
useEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <TouchableOpacity 
        onPress={() => setSidebarVisible(!sidebarVisible)}
        style={styles.headerButton}
      >
        <Text style={{ color: colors.primary, fontSize: 20 }}>☰</Text>
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity 
        onPress={createNewChat}
        style={styles.headerButton}
      >
        <Text style={{ color: colors.primary, fontSize: 20 }}>+</Text>
      </TouchableOpacity>
    ),
  });
}, [navigation, createNewChat, colors.primary, sidebarVisible]);

  // Memoize styles for message input to prevent unnecessary re-renders
  const inputStyles = useMemo(() => [
    styles.input, 
    { 
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      color: colors.text
    }
  ], [colors.border, colors.inputBackground, colors.text]);

  // Memoize styles for send button to prevent unnecessary re-renders
  const sendButtonStyles = useMemo(() => [
    styles.sendButton,
    { backgroundColor: colors.primary },
    (!input.trim() || isThinking || loading) && styles.disabledButton
  ], [colors.primary, input, isThinking, loading]);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Start a New Conversation
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
        Type a message below to begin chatting with the AI assistant.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Chat Sessions Sidebar */}
      {sidebarVisible && (
        <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
 <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
  <Text style={[styles.sidebarTitle, { color: colors.text }]}>Chat History</Text>
  <TouchableOpacity 
    style={styles.newChatButton}
    onPress={() => {
      createNewChat();
      setSidebarVisible(false);
    }}
  >
    <Text style={{ fontSize: 18, color: colors.primary, marginRight: 8 }}>+</Text>
    <Text style={[styles.newChatText, { color: colors.primary }]}>New Chat</Text>
  </TouchableOpacity>
</View>
          
          <FlatList
            data={chatSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatSessionItem 
                session={item}
                isActive={item.id === activeSessionId}
                onPress={() => {
                  switchChatSession(item.id);
                  setSidebarVisible(false);
                }}
                colors={colors}
              />
            )}
            ListEmptyComponent={
              <Text style={[styles.noSessionsText, { color: colors.secondaryText }]}>
                No chat sessions yet.
              </Text>
            }
          />
        </View>
      )}
      
      {/* Chat Main Area */}
      <View style={styles.mainContent}>
        {messages.length === 0 || (messages.length === 1 && messages[0].role === 'system') ? (
          renderEmptyState()
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatBox}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx}
                message={msg} 
                colors={colors}
                onLongPress={handleMessageLongPress}
              />
            ))}
            
            {isThinking && (
              <View style={[
                styles.messageBubble, 
                styles.assistantBubble, 
                styles.thinkingBubble,
                { backgroundColor: colors.assistantBubble }
              ]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.thinkingText, { color: colors.secondaryText }]}>Thinking...</Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={[styles.inputContainer, { 
          backgroundColor: colors.card,
          borderTopColor: colors.border 
        }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.secondaryText}
            style={inputStyles}
            editable={!isThinking && !loading}
            multiline
            maxLength={4000}
            returnKeyType="send"
            onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
          />
          <TouchableOpacity
            style={sendButtonStyles}
            onPress={handleSend}
            disabled={!input.trim() || isThinking || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Message Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Message Info</Text>
                
                {selectedMessage && (
                  <>
                    {selectedMessage.tokenCount !== undefined && (
                      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Token Count:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {selectedMessage.tokenCount}
                        </Text>
                      </View>
                    )}
                    
                    {selectedMessage.responseTime && (
                      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Response Time:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {(selectedMessage.responseTime / 1000).toFixed(2)}s
                        </Text>
                      </View>
                    )}
                    
                    {selectedMessage.tokensPerSecond && (
                      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Tokens/Second:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {selectedMessage.tokensPerSecond.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    
                    {selectedMessage.timestamp && (
                      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Time:</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {new Date(selectedMessage.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                    
                    {modelInfo && (
                      <>
                        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Model:</Text>
                          <Text style={[styles.infoValue, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
                            {modelInfo.name || 'Unknown'}
                          </Text>
                        </View>
                        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Context Size:</Text>
                          <Text style={[styles.infoValue, { color: colors.text }]}>
                            {modelInfo.n_ctx || 'Unknown'}
                          </Text>
                        </View>
                        {modelInfo.n_params && (
                          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Parameters:</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>
                              {(modelInfo.n_params / 1e9).toFixed(2)}B
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          copyToClipboard(selectedMessage.content);
                          setModalVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalButtonText}>Copy Text</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cancelButton }]}
                        onPress={() => setModalVisible(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Backdrop for sidebar on small screens */}
      {sidebarVisible && (
        <TouchableWithoutFeedback onPress={() => setSidebarVisible(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    zIndex: 10,
  },
  backdrop: {
    position: 'absolute',
    left: 280,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 5,
  },
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  newChatText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionTitle: {
    flex: 1,
    fontSize: 16,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noSessionsText: {
    padding: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainContent: {
    flex: 1,
  },
  chatBox: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  systemBubble: {
    alignSelf: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {},
  assistantText: {},
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  thinkingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  metaText: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 22,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {},
  cancelButtonText: {},
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
  }
});

export default ChatScreen;