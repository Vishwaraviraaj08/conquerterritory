import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    TextInput,
    Modal,
    Platform,
    Image,
    FlatList,
    Animated,
    Easing
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop, useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

// Custom Animated Empty State
const AnimatedEmptyState = () => {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
            <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View style={{ position: 'absolute', transform: [{ rotate: spin }] }}>
                    <Svg width={80} height={80} viewBox="0 0 100 100">
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#5B63D3" stopOpacity="1" />
                                <Stop offset="1" stopColor="#7C83ED" stopOpacity="0.5" />
                            </LinearGradient>
                        </Defs>
                        <Circle cx="50" cy="50" r="45" stroke="url(#grad)" strokeWidth="4" fill="none" strokeDasharray="20, 10" />
                        <Circle cx="50" cy="50" r="30" fill="#1F243A" opacity="0.5" />
                    </Svg>
                </Animated.View>
                <Ionicons name="people" size={32} color="#fff" />
            </View>
            <Text style={{ color: '#888', marginTop: 15, fontSize: 14, fontWeight: '600' }}>No teams found yet.</Text>
        </View>
    );
};

// Custom Status Modal (Replaces Alert)
const StatusModal = ({ visible, type, title, message, onClose }) => {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBg}>
                <View style={[styles.customModal, { alignItems: 'center' }]}>
                    <View style={[styles.statusIcon, type === 'error' ? { backgroundColor: '#FF4444' } : { backgroundColor: '#4CAF50' }]}>
                        <Ionicons
                            name={type === 'error' ? "alert" : "checkmark"}
                            size={32}
                            color="#fff"
                        />
                    </View>
                    <Text style={styles.modalHeading}>{title}</Text>
                    <Text style={[styles.modalSub, { textAlign: 'center', marginTop: 5 }]}>{message}</Text>

                    <TouchableOpacity onPress={onClose} style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 15 }]}>
                        <Text style={styles.modalPrimaryText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default function CommunityScreen({ navigation }) {
    const scrollRef = useRef(null);
    useScrollToTop(scrollRef);
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [challenges, setChallenges] = useState([]);
    const [socialFeed, setSocialFeed] = useState([]);

    // Team State
    const [activeTeamPill, setActiveTeamPill] = useState('all'); // 'all', 'created', 'joined'
    const [allTeams, setAllTeams] = useState([]); // Combined sorted by lastActive
    const [myTeams, setMyTeams] = useState({ created: [], joined: [] });

    // Modals State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [teamCodeInput, setTeamCodeInput] = useState('');
    const [teamNameInput, setTeamNameInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Status Modal State
    const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

    // Social Post & Search State
    const [isPosting, setIsPosting] = useState(false);
    const [postContent, setPostContent] = useState('');

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchCommunityData();
        }, [])
    );

    // Search Debounce with updated filters
    useEffect(() => {
        if (!searchModalVisible) return;
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery || searchDate || searchTag) {
                performSearch(searchQuery, searchDate, searchTag);
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchDate, searchTag, searchModalVisible]);

    const showStatus = (type, title, message) => {
        setStatusModal({ visible: true, type, title, message });
    };

    const closeStatusModal = () => {
        setStatusModal(prev => ({ ...prev, visible: false }));
    };

    const fetchCommunityData = async () => {
        try {
            const [challengesRes, feedRes, relatedTeamsRes] = await Promise.allSettled([
                api.get('/users/challenges'),
                api.get('/social'),
                api.get('/teams/user-related')
            ]);

            if (challengesRes.status === 'fulfilled' && challengesRes.value.data.challenges) {
                setChallenges(challengesRes.value.data.challenges);
            } else {
                setChallenges(getDefaultChallenges());
            }

            if (feedRes.status === 'fulfilled' && feedRes.value.data.feed) {
                setSocialFeed(feedRes.value.data.feed);
            }

            if (relatedTeamsRes.status === 'fulfilled') {
                const { created, joined } = relatedTeamsRes.value.data;
                setMyTeams({ created, joined });

                // Merge and sort by lastActive for "All" view
                const all = [...created, ...joined].sort((a, b) => {
                    const dateA = new Date(a.lastActive || a.updatedAt);
                    const dateB = new Date(b.lastActive || b.updatedAt);
                    return dateB - dateA; // Descending
                });
                setAllTeams(all);
            }
        } catch (e) {
            console.log('Fetch error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCommunityData();
    };

    const performSearch = async (query, date, tag) => {
        setIsSearching(true);
        try {
            const params = {};
            if (query) params.search = query;
            if (date) params.date = date; // Expecting YYYY-MM-DD
            if (tag) params.tag = tag;
            const res = await api.get('/social', { params });
            setSearchResults(res.data.feed);
        } catch (e) {
            console.log('Search error', e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamNameInput.trim()) return showStatus('error', 'Error', 'Enter team name');
        setActionLoading(true);
        try {
            await api.post('/teams', { name: teamNameInput });
            setShowCreateModal(false);
            setTeamNameInput('');
            fetchCommunityData();
            showStatus('success', 'Success', 'Team created successfully!');
        } catch (e) {
            showStatus('error', 'Error', e.response?.data?.message || 'Failed to create team');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCodeInput.trim() || teamCodeInput.length !== 7) return showStatus('error', 'Error', 'Enter 7-digit code');
        setActionLoading(true);
        try {
            await api.post('/teams/join', { code: teamCodeInput });
            setShowJoinModal(false);
            setTeamCodeInput('');
            fetchCommunityData();
            showStatus('success', 'Success', 'Joined team successfully!');
        } catch (e) {
            showStatus('error', 'Error', e.response?.data?.message || 'Failed to join');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopyCode = async (code) => {
        const message = `Join my team on Geoconquest with code: ${code}`;
        await Clipboard.setStringAsync(message);
        showStatus('success', 'Copied!', 'Invite code copied.');
    };

    const handlePostFeed = async () => {
        if (!postContent.trim()) return;
        setActionLoading(true);
        try {
            await api.post('/social', { content: postContent, type: 'status' });
            setPostContent('');
            setIsPosting(false);
            fetchCommunityData();
        } catch (e) {
            showStatus('error', 'Error', 'Failed to post');
        } finally {
            setActionLoading(false);
        }
    };

    const navigateToChat = (teamId) => {
        navigation.navigate('TeamChat', { teamId });
    };

    const getDefaultChallenges = () => [
        { id: '1', title: 'Weekend Warrior', desc: 'Capture 5 territories', reward: '500 pts', icon: 'sword-cross', progress: 0 },
        { id: '2', title: 'Marathon Runner', desc: 'Cover 42km', reward: '1000 pts', icon: 'run-fast', progress: 0 },
    ];

    const renderTeamCard = (item) => (
        <View key={item._id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
                <View style={styles.initialsBg}>
                    <Text style={styles.initialsText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{item.name}</Text>
                    <Text style={styles.teamTimestamp}>
                        Active: {item.lastActive ? new Date(item.lastActive).toLocaleDateString() : 'New'}
                    </Text>
                    <View style={styles.codePill}>
                        <Text style={styles.codeText}>{item.code}</Text>
                        <TouchableOpacity onPress={() => handleCopyCode(item.code)}>
                            <Ionicons name="copy-outline" size={14} color="#7C83ED" style={{ marginLeft: 5 }} />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.chatBtn} onPress={() => navigateToChat(item._id)}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTags = (tags) => {
        if (!tags || tags.length === 0) return null;
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {tags.map((tag, idx) => (
                    <Text key={idx} style={styles.tagText}>#{tag}</Text>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B63D3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Community</Text>
                    <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Team Actions at Top */}
                <View style={styles.topActions}>
                    <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowCreateModal(true)}>
                        <Ionicons name="add-circle-outline" size={18} color="#5B63D3" />
                        <Text style={styles.actionBtnText}>Create Team</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowJoinModal(true)}>
                        <Ionicons name="enter-outline" size={18} color="#5B63D3" />
                        <Text style={styles.actionBtnText}>Join Team</Text>
                    </TouchableOpacity>
                </View>

                {/* Team Hub Section */}
                <Text style={styles.sectionTitle}>My Teams</Text>

                {/* Pills */}
                <View style={styles.pillsContainer}>
                    {['all', 'created', 'joined'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.pill, activeTeamPill === type && styles.activePill]}
                            onPress={() => setActiveTeamPill(type)}
                        >
                            <Text style={[styles.pillText, activeTeamPill === type && styles.activePillText]}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Team List Area */}
                <View style={styles.teamContentArea}>
                    {activeTeamPill === 'all' && (
                        allTeams.length > 0 ? allTeams.map(renderTeamCard) : <AnimatedEmptyState />
                    )}
                    {activeTeamPill === 'created' && (
                        myTeams.created.length > 0 ? myTeams.created.map(renderTeamCard) : <AnimatedEmptyState />
                    )}
                    {activeTeamPill === 'joined' && (
                        myTeams.joined.length > 0 ? myTeams.joined.map(renderTeamCard) : <AnimatedEmptyState />
                    )}
                </View>

                {/* Challenges */}
                <Text style={styles.sectionTitle}>Challenges</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.challengeScroll}>
                    {challenges.map((ch) => (
                        <View key={ch.id} style={styles.challengeCard}>
                            <MaterialCommunityIcons name={ch.icon || 'star'} size={24} color="#5B63D3" style={{ marginBottom: 8 }} />
                            <Text style={styles.challengeTitle}>{ch.title}</Text>
                            <Text style={styles.challengeDesc}>{ch.desc}</Text>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressText}>{ch.current || 0} / {ch.target}</Text>
                                <Text style={styles.challengeReward}>{ch.reward}</Text>
                            </View>
                            {/* Simple Progress Bar */}
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${ch.progress || 0}%` }]} />
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Social Feed */}
                <View style={styles.feedHeaderRow}>
                    <Text style={styles.sectionTitle}>Social Feed</Text>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity onPress={handleRefresh}>
                            {refreshing ? <ActivityIndicator size="small" color="#5B63D3" /> : <Ionicons name="refresh" size={22} color="#5B63D3" />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
                            <Ionicons name="search" size={24} color="#5B63D3" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsPosting(!isPosting)}>
                            <Ionicons name={isPosting ? "close-circle" : "add-circle"} size={26} color="#5B63D3" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isPosting && (
                    <View style={styles.postInputContainer}>
                        <TextInput
                            style={styles.postInput}
                            placeholder="What's happening? #tags"
                            placeholderTextColor="#888"
                            multiline
                            value={postContent}
                            onChangeText={setPostContent}
                        />
                        <TouchableOpacity style={styles.postBtn} onPress={handlePostFeed} disabled={!postContent.trim()}>
                            {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {socialFeed.length > 0 ? socialFeed.map((post) => (
                    <View key={post._id} style={styles.feedCard}>
                        <View style={styles.feedHeader}>
                            {post.user?.profileImage ? (
                                <Image source={{ uri: post.user.profileImage }} style={styles.feedAvatarImg} />
                            ) : (
                                <View style={styles.feedAvatar}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{post.username?.charAt(0) || '?'}</Text>
                                </View>
                            )}
                            <View style={styles.feedUserInfo}>
                                <Text style={styles.feedUsername}>{post.username || 'User'}</Text>
                                <Text style={styles.feedTime}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <Text style={styles.feedText}>{post.content}</Text>
                        {post.tags && renderTags(post.tags)}
                    </View>
                )) : (
                    <Text style={styles.emptyText}>No posts yet.</Text>
                )}

            </ScrollView>

            {/* Custom Create Team Modal */}
            <Modal transparent visible={showCreateModal} animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.customModal}>
                        <Text style={styles.modalHeading}>Create New Team</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter Team Name"
                            placeholderTextColor="#666"
                            value={teamNameInput}
                            onChangeText={setTeamNameInput}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalDestructiveBtn}>
                                <Text style={styles.modalDestructiveText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateTeam} style={styles.modalPrimaryOutlineBtn}>
                                {actionLoading ? <ActivityIndicator color="#5B63D3" /> : <Text style={styles.modalPrimaryOutlineText}>Create</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Join Team Modal */}
            <Modal transparent visible={showJoinModal} animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.customModal}>
                        <Text style={styles.modalHeading}>Join Team</Text>
                        <Text style={styles.modalSub}>Enter the 7-digit invite code.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 1234567"
                            placeholderTextColor="#666"
                            keyboardType="number-pad"
                            maxLength={7}
                            value={teamCodeInput}
                            onChangeText={setTeamCodeInput}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)} style={styles.modalDestructiveBtn}>
                                <Text style={styles.modalDestructiveText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleJoinTeam} style={styles.modalPrimaryOutlineBtn}>
                                {actionLoading ? <ActivityIndicator color="#5B63D3" /> : <Text style={styles.modalPrimaryOutlineText}>Join</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Status Modal */}
            <StatusModal
                visible={statusModal.visible}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onClose={closeStatusModal}
            />

            {/* Search Modal */}
            <Modal animationType="slide" transparent={true} visible={searchModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Fixed Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Search Feed</Text>
                            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchInputs}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search keywords..."
                                placeholderTextColor="#666"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TextInput
                                    style={[styles.searchInput, { flex: 1 }]}
                                    placeholder="#Tag (e.g. run)"
                                    placeholderTextColor="#666"
                                    value={searchTag}
                                    onChangeText={setSearchTag}
                                />
                                <TextInput
                                    style={[styles.searchInput, { flex: 1 }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#666"
                                    value={searchDate}
                                    onChangeText={setSearchDate}
                                />
                            </View>
                        </View>

                        {isSearching && <ActivityIndicator size="small" color="#5B63D3" style={{ marginVertical: 10 }} />}

                        {/* Scrollable Results */}
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item._id}
                            style={{ flex: 1 }}
                            renderItem={({ item }) => (
                                <View style={styles.resultItem}>
                                    <Text style={styles.resultUser}>{item.username || 'Unknown'}</Text>
                                    <Text style={styles.resultText} numberOfLines={2}>{item.content}</Text>
                                    {renderTags(item.tags)}
                                    <Text style={styles.resultDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                            )}
                            ListEmptyComponent={
                                (searchQuery || searchTag || searchDate) && !isSearching ? <Text style={styles.emptyListText}>No matches found</Text> : null
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 100, paddingHorizontal: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    headerIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#111528', justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },

    // Top Actions
    topActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#5B63D3' },
    actionBtnText: { color: '#5B63D3', fontWeight: 'bold', fontSize: 14 },

    // Pills
    pillsContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    pill: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#111528', borderWidth: 1, borderColor: '#222' },
    activePill: { backgroundColor: '#5B63D3', borderColor: '#5B63D3' },
    pillText: { color: '#888', fontWeight: '600' },
    activePillText: { color: '#fff' },

    teamContentArea: { minHeight: 100, marginBottom: 25 },
    teamCard: { flexDirection: 'row', backgroundColor: '#111528', padding: 14, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)' },
    teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    initialsBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1F243A', justifyContent: 'center', alignItems: 'center' },
    initialsText: { color: '#5B63D3', fontWeight: 'bold', fontSize: 18 },
    teamName: { color: '#fff', fontSize: 16, fontWeight: '600' },
    teamTimestamp: { color: '#666', fontSize: 11 },
    codePill: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
    codeText: { color: '#7C83ED', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', letterSpacing: 1 },
    chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' },

    // Feed
    feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    feedCard: { backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
    feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    feedAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' },
    feedAvatarImg: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#333' },
    feedUsername: { fontSize: 14, fontWeight: '600', color: '#fff' },
    feedTime: { fontSize: 10, color: '#666' },
    feedText: { color: '#e0e0e0', lineHeight: 21 },
    tagText: { color: '#7C83ED', fontSize: 12 },
    emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },

    // Post Input
    postInputContainer: { marginBottom: 20 },
    postInput: { backgroundColor: '#111528', borderRadius: 14, padding: 14, color: '#fff', minHeight: 60, marginBottom: 10, textAlignVertical: 'top' },
    postBtn: { backgroundColor: '#5B63D3', alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    postBtnText: { color: '#fff', fontWeight: 'bold' },

    // Modals
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    customModal: { backgroundColor: '#1A2035', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#5B63D3' },
    modalHeading: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
    modalSub: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 20 },
    modalInput: { backgroundColor: '#0f131f', borderRadius: 10, padding: 14, color: '#fff', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 10 },

    // Updated Destructive/Outline Buttons
    modalDestructiveBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF4444' },
    modalDestructiveText: { color: '#FF4444', fontWeight: '600' },
    modalPrimaryOutlineBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5B63D3' },
    modalPrimaryOutlineText: { color: '#5B63D3', fontWeight: 'bold' },

    // Status Modal
    statusIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalPrimaryBtn: { padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#5B63D3' },
    modalPrimaryText: { color: '#fff', fontWeight: 'bold' },

    // Search Modal
    modalOverlay: { flex: 1, backgroundColor: '#0a0e1a', paddingTop: 50 },
    modalContent: { flex: 1, paddingHorizontal: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    searchInputs: { marginBottom: 10 },
    searchInput: { backgroundColor: '#111528', borderRadius: 12, padding: 14, color: '#fff', borderWidth: 1, borderColor: '#333' },
    resultItem: { backgroundColor: '#151a2e', padding: 14, borderRadius: 12, marginBottom: 10 },
    resultUser: { color: '#7C83ED', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
    resultText: { color: '#ddd' },
    resultDate: { color: '#666', fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
    emptyListText: { color: '#666', textAlign: 'center', marginTop: 30 },

    // Challenges
    challengeScroll: { marginBottom: 25 },
    challengeCard: { width: 170, backgroundColor: '#111528', borderRadius: 16, padding: 16, marginRight: 12, borderWidth: 1, borderColor: '#222' },
    challengeTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
    challengeDesc: { fontSize: 11, color: '#888', marginBottom: 8 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    progressText: { color: '#7C83ED', fontSize: 10, fontWeight: 'bold' },
    challengeReward: { fontSize: 10, fontWeight: '700', color: '#E8A838' },
    progressBarBg: { height: 4, backgroundColor: '#222', borderRadius: 2 },
    progressBarFill: { height: 4, backgroundColor: '#5B63D3', borderRadius: 2 },
});
