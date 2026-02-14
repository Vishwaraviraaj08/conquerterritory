import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function TeamChatScreen({ navigation, route }) {
    const { user } = useAuth();
    const { teamId } = route.params || {};

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const flatListRef = useRef(null);
    const pollingInterval = useRef(null);

    useEffect(() => {
        fetchMessages();
        pollingInterval.current = setInterval(fetchMessagesSilent, 3000);
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [teamId]);

    const fetchMessages = async () => {
        try {
            const params = teamId ? { teamId } : {};
            const res = await api.get('/messages', { params });
            setMessages(res.data.messages);
        } catch (e) {
            console.log('Error fetching messages:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchMessagesSilent = async () => {
        try {
            const params = teamId ? { teamId } : {};
            const res = await api.get('/messages', { params });
            // Compare IDs to avoid unnecessary re-renders if needed, but for now simple set
            if (res.data.messages.length !== messages.length || res.data.messages[0]?._id !== messages[0]?._id) {
                setMessages(res.data.messages);
            }
        } catch (e) {
            // silent fail
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        setSending(true);
        try {
            const payload = { text: inputText };
            if (teamId) payload.teamId = teamId;

            await api.post('/messages', payload);
            setInputText('');
            // Don't dismiss keyboard
            // Keyboard.dismiss(); 
            await fetchMessagesSilent();
        } catch (e) {
            console.log('Error sending message:', e.message);
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMessages();
    };

    // Helper to format date header
    const getDateHeader = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString();
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.sender?._id === user?._id || item.sender === user?.id;
        const senderName = item.sender?.username || item.senderName || 'User';
        const profileImage = item.sender?.profileImage;

        // Date Separator Logic (Reverse Order: Next item is older)
        // Since list is inverted, the "previous" message in time is actually index + 1
        const nextItem = messages[index + 1];
        let showDateHeader = false;
        let dateHeaderLabel = '';

        const currentDate = new Date(item.createdAt);

        if (nextItem) {
            const nextDate = new Date(nextItem.createdAt);
            if (currentDate.toDateString() !== nextDate.toDateString()) {
                showDateHeader = true;
                dateHeaderLabel = getDateHeader(currentDate);
            }
        } else {
            // Last item in list (oldest message)
            showDateHeader = true;
            dateHeaderLabel = getDateHeader(currentDate);
        }

        return (
            <View>
                {/* INVERTED LIST: Header appears "below" the message visually if we simply render it, 
                    but in inverted list, "Footer" is top. 
                    Actually for inverted list, we render the header "after" the item so it appears above it.
                    Wait, if inverted, index+1 is visually "above" index? No.
                    Inverted: [0] is bottom-most. [1] is above it.
                    So if I want date between [0] and [1], I attach it to [0].
                    
                    If [0] is Today, [1] is Yesterday. 
                    I want "Today" above [0].
                    So I should render "Today" 'at the end' of [0]?
                    
                    Let's use a simpler approach: Standard separate View if needed.
                    Actually, in Inverted FlatList:
                    Header Component is at Bottom. Footer is at Top.
                    Item 0 (Newest) is at Bottom.
                    
                    If I render <View><Header/><Message/></View> for Item 0:
                    Visually: 
                    [Message 0]
                    [Header] 
                    
                    We want:
                    [Header]
                    [Message 0]
                    
                    So in inverted mode, we render:
                    <View>
                        <Message />
                        <Header /> 
                    </View>
                */}

                {showDateHeader && (
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateSeparatorText}>{dateHeaderLabel}</Text>
                    </View>
                )}

                <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
                    {!isMe && (
                        <View style={styles.avatarContainer}>
                            {profileImage && profileImage !== 'default' ? (
                                <Image source={{ uri: profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{senderName.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                        {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.timeText}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    {isMe && (
                        <View style={styles.avatarContainerMe}>
                            {user?.profileImage && user.profileImage !== 'default' && user.profileImage !== '' ? (
                                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholderMe}>
                                    <Text style={styles.avatarText}>{user?.username?.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B63D3" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0a0e1a' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Team Chat {teamId && '(Active)'}</Text>

                <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
                    {refreshing ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh" size={22} color="#fff" />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item._id}
                    inverted
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.disabledBtn]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    loadingContainer: { flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15, backgroundColor: '#111528', borderBottomWidth: 1, borderBottomColor: '#222', zIndex: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    backBtn: { padding: 5 },

    listContent: { paddingHorizontal: 16, paddingBottom: 10 },

    dateSeparator: { alignSelf: 'center', marginVertical: 15, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
    dateSeparatorText: { color: '#bbb', fontSize: 12, fontWeight: '600' },

    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15, gap: 8 },
    myRow: { justifyContent: 'flex-end' },
    theirRow: { justifyContent: 'flex-start' },

    avatarContainer: { width: 32, height: 32, borderRadius: 16, marginBottom: 0 },
    avatarContainerMe: { width: 32, height: 32, borderRadius: 16, marginBottom: 0 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' },
    avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' },
    avatarPlaceholderMe: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7C83ED', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
    myBubble: { backgroundColor: '#5B63D3', borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: '#1F243A', borderBottomLeftRadius: 4 },

    senderName: { fontSize: 11, color: '#7C83ED', marginBottom: 4, fontWeight: '600' },
    messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
    timeText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },

    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#111528', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#222' },
    input: { flex: 1, backgroundColor: '#0a0e1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { backgroundColor: '#333', opacity: 0.7 },
});
