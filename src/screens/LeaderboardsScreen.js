import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Switch,
    StatusBar,
    ActivityIndicator,
    Modal,
    Image,
    TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import UserProfileModal from '../components/UserProfileModal';
import FriendRequestsModal from '../components/FriendRequestsModal';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const SCOPE_FILTERS = ['Country', 'Global', 'Team'];
const SCOPE_MAP = { Country: 'country', Global: 'global', Team: 'team' };

const PERIOD_OPTIONS = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'All Time', value: 'alltime' },
];

const LeaderItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.leaderCard} onPress={() => onPress(item)} activeOpacity={0.8}>
        <View style={[styles.rankCircle, item.rank <= 3 && { borderColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32', borderWidth: 2 }]}>
            <Text style={[styles.rankText, item.rank <= 3 && { color: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>{item.rank}</Text>
        </View>
        <View style={styles.avatarSmall}>
            {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
                <Ionicons name="person" size={20} color="#7C83ED" />
            )}
        </View>
        <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{item.username}</Text>
            <Text style={styles.leaderTeam}>{item.totalCaptures || 0} captures</Text>
        </View>
        <View style={styles.leaderStats}>
            <View style={styles.leaderStatItem}>
                <MaterialCommunityIcons name="star" size={14} color="#E8A838" />
                <Text style={styles.leaderStatValue}>{(item.totalPoints || 0).toLocaleString()} pts</Text>
            </View>
            <View style={styles.leaderStatItem}>
                <MaterialCommunityIcons name="vector-polygon" size={14} color="#5B63D3" />
                <Text style={styles.leaderStatValue}>{((item.totalArea || 0) / 1000).toFixed(1)}k m²</Text>
            </View>
        </View>
    </TouchableOpacity>
);

// Search Modal Component
const SearchModal = ({ visible, onClose, onUserPress }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // localPending stores userIds we've already sent requests to (persisted across restarts)
    const [localPending, setLocalPending] = useState({});
    const { user } = useAuth();

    // Load persisted pending requests from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem('pendingFriendRequests').then(raw => {
            if (raw) setLocalPending(JSON.parse(raw));
        }).catch(() => { });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/search', { params: { q: query } });
            // Merge server relationship with local pending map
            const enriched = (res.data.users || []).map(u => {
                if (localPending[u._id] && u.relationship === 'none') {
                    return { ...u, relationship: 'pending_sent' };
                }
                return u;
            });
            setResults(enriched);
        } catch (e) {
            console.log('Search error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (friendId) => {
        try {
            await api.post('/friends/request', { friendId });
            // Persist the pending state locally
            const updated = { ...localPending, [friendId]: true };
            setLocalPending(updated);
            await AsyncStorage.setItem('pendingFriendRequests', JSON.stringify(updated));
            // Update UI immediately
            setResults(prev => prev.map(u =>
                u._id === friendId ? { ...u, relationship: 'pending_sent' } : u
            ));
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to send request');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Find Players</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search username..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />

                    {loading && <ActivityIndicator size="small" color="#5B63D3" style={{ marginVertical: 10 }} />}

                    <FlatList
                        data={results}
                        keyExtractor={item => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.leaderCard} onPress={() => onUserPress(item)}>
                                <View style={styles.avatarSmall}>
                                    {item.profileImage ? (
                                        <Image source={{ uri: item.profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                                    ) : (
                                        <Ionicons name="person" size={20} color="#7C83ED" />
                                    )}
                                </View>
                                <View style={styles.leaderInfo}>
                                    <Text style={styles.leaderName}>{item.username}</Text>
                                    <Text style={styles.leaderTeam}>{item.friendsCount || 0} friends</Text>
                                </View>
                                <View style={styles.leaderStats}>
                                    <View style={styles.leaderStatItem}>
                                        <MaterialCommunityIcons name="star" size={14} color="#E8A838" />
                                        <Text style={styles.leaderStatValue}>{(item.totalPoints || 0).toLocaleString()} pts</Text>
                                    </View>
                                    {item._id !== user?._id && (
                                        <TouchableOpacity
                                            style={[
                                                { marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                                                item.relationship === 'friends' ? { backgroundColor: '#4CAF50' }
                                                    : item.relationship === 'pending_sent' ? { backgroundColor: '#E8A838' }
                                                        : item.relationship === 'pending_received' ? { backgroundColor: '#E8A838' }
                                                            : { backgroundColor: '#5B63D3' }
                                            ]}
                                            onPress={() => item.relationship === 'none' && handleAddFriend(item._id)}
                                            disabled={item.relationship !== 'none'}
                                        >
                                            <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                                                {item.relationship === 'friends' ? 'FRIENDS'
                                                    : item.relationship === 'pending_sent' ? 'PENDING'
                                                        : item.relationship === 'pending_received' ? 'ACCEPT'
                                                            : 'ADD'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            query.length >= 2 && !loading ? <Text style={styles.emptyText}>No users found</Text> : null
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

export default function LeaderboardsScreen() {
    const [activeScope, setActiveScope] = useState('Global');
    const [activePeriod, setActivePeriod] = useState('alltime');
    const [periodLabel, setPeriodLabel] = useState('All Time');
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);
    const [friendsOnly, setFriendsOnly] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    // Search State
    const [showSearchModal, setShowSearchModal] = useState(false);

    // User profile modal
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Friend Requests modal
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const { unreadCount } = useNotifications();
    const { user } = useAuth();

    // ... existing listRef and fetchLeaderboard ...
    // Note: Re-declaring refs and callbacks to ensure context is kept if I'm replacing the whole component body or significant parts.
    // However, since I am replacing the whole export, I must include everything.

    const listRef = useRef(null);
    useScrollToTop(listRef);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaderboards', {
                params: {
                    scope: SCOPE_MAP[activeScope] || 'global',
                    period: activePeriod,
                    limit: 20,
                    friendsOnly: friendsOnly ? 'true' : 'false',
                },
            });
            setLeaderboard(res.data.leaderboard || []);
            setUserRank(res.data.userRank);
        } catch (e) {
            console.log('Leaderboard fetch error:', e.message);
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    }, [activeScope, activePeriod, friendsOnly]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handleUserPress = (item) => {
        // Handle press from Leaderboard OR Search
        const uid = item.userId || item._id; // Search returns _id, Leaderboard returns userId
        if (uid && user && uid !== user._id) {
            setSelectedUserId(uid);
            setShowProfileModal(true);
        }
    };

    const handlePeriodSelect = (option) => {
        setActivePeriod(option.value);
        setPeriodLabel(option.label);
        setShowPeriodPicker(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leaderboards</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => setShowSearchModal(true)} style={styles.iconBtn}>
                        <Ionicons name="search" size={22} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.requestIconBtn}
                        onPress={() => setShowRequestsModal(true)}
                    >
                        <Ionicons name="mail-outline" size={24} color="#ccc" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {userRank && (
                            <Text style={{ color: '#E8A838', fontWeight: '700', fontSize: 14 }}>
                                #{userRank}
                            </Text>
                        )}
                        <Ionicons name="trophy-outline" size={22} color="#E8A838" />
                    </View>
                </View>
            </View>

            {/* Scope Filter Pills */}
            <View style={styles.filterRow}>
                {SCOPE_FILTERS.map((scope) => (
                    <TouchableOpacity
                        key={scope}
                        style={[styles.scopePill, activeScope === scope && styles.scopePillActive]}
                        onPress={() => setActiveScope(scope)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.scopeText, activeScope === scope && styles.scopeTextActive]}>
                            {scope}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Controls row */}
            <View style={styles.controlsRow}>
                <TouchableOpacity
                    style={styles.timeWindow}
                    onPress={() => setShowPeriodPicker(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="time-outline" size={16} color="#7C83ED" />
                    <Text style={styles.timeWindowText}>{periodLabel}</Text>
                    <Ionicons name="chevron-down" size={14} color="#888" />
                </TouchableOpacity>
                <View style={styles.friendsToggle}>
                    <Text style={styles.friendsText}>Friends Only</Text>
                    <Switch
                        value={friendsOnly}
                        onValueChange={setFriendsOnly}
                        trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                        thumbColor="#fff"
                    />
                </View>
            </View>


            {/* Leaderboard List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#5B63D3" />
                </View>
            ) : leaderboard.length > 0 ? (
                <FlatList
                    ref={listRef}
                    data={leaderboard}
                    keyExtractor={(item, index) => (item.userId || index).toString()}
                    renderItem={({ item }) => <LeaderItem item={item} onPress={handleUserPress} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="trophy-outline" size={50} color="rgba(91,99,211,0.3)" />
                    <Text style={{ color: '#666', marginTop: 12, fontSize: 14 }}>
                        No leaderboard data yet. Start capturing!
                    </Text>
                </View>
            )}

            {/* Period Picker Modal */}
            <Modal visible={showPeriodPicker} transparent animationType="fade" onRequestClose={() => setShowPeriodPicker(false)}>
                <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPeriodPicker(false)}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerTitle}>Select Time Period</Text>
                        {PERIOD_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.pickerOption, activePeriod === opt.value && styles.pickerOptionActive]}
                                onPress={() => handlePeriodSelect(opt)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.pickerOptionText, activePeriod === opt.value && styles.pickerOptionTextActive]}>
                                    {opt.label}
                                </Text>
                                {activePeriod === opt.value && (
                                    <Ionicons name="checkmark" size={18} color="#5B63D3" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <SearchModal
                visible={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onUserPress={(item) => {
                    setShowSearchModal(false);
                    handleUserPress(item);
                }}
            />

            {/* User Profile Modal */}
            <UserProfileModal
                visible={showProfileModal}
                userId={selectedUserId}
                onClose={() => setShowProfileModal(false)}
            />

            {/* Friend Requests Modal */}
            <FriendRequestsModal
                visible={showRequestsModal}
                onClose={() => setShowRequestsModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 14,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    requestIconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    badge: {
        position: 'absolute', top: -2, right: -2,
        minWidth: 18, height: 18, borderRadius: 9,
        backgroundColor: '#ff4444',
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 4, borderWidth: 2, borderColor: '#0a0e1a',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    filterRow: {
        flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14,
    },
    scopePill: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#111528', borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
    },
    scopePillActive: { backgroundColor: '#5B63D3', borderColor: '#5B63D3' },
    scopeText: { fontSize: 13, fontWeight: '600', color: '#888' },
    scopeTextActive: { color: '#fff' },
    controlsRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 14,
    },
    timeWindow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#111528', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
    },
    timeWindowText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
    friendsToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    friendsText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
    actionRow: {
        flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 14,
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, backgroundColor: '#5B63D3', borderRadius: 12, paddingVertical: 12,
    },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    leaderCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#111528', borderRadius: 14, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    rankCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(91,99,211,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    rankText: { fontSize: 14, fontWeight: '800', color: '#ccc' },
    avatarSmall: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(91,99,211,0.1)',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    leaderInfo: { flex: 1 },
    leaderName: { fontSize: 14, fontWeight: '700', color: '#fff' },
    leaderTeam: { fontSize: 11, color: '#888daf' },
    leaderStats: { alignItems: 'flex-end' },
    leaderStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    leaderStatValue: { fontSize: 12, fontWeight: '600', color: '#ccc' },
    // Period Picker
    pickerOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 40,
    },
    pickerContainer: {
        width: '100%', maxWidth: 300, backgroundColor: '#111528',
        borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.2)',
    },
    pickerTitle: {
        fontSize: 16, fontWeight: '700', color: '#fff',
        textAlign: 'center', marginBottom: 16,
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4,
    },
    pickerOptionActive: { backgroundColor: 'rgba(91,99,211,0.12)' },
    pickerOptionText: { fontSize: 15, fontWeight: '600', color: '#ccc' },
    pickerOptionTextActive: { color: '#5B63D3' },

    // Search Modal Styles
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1A2035', borderRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    searchInput: { backgroundColor: '#111528', borderRadius: 12, padding: 14, color: '#fff', borderWidth: 1, borderColor: '#333' },
    searchItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
    searchAvatar: { width: 40, height: 40, borderRadius: 20 },
    searchName: { flex: 1, color: '#fff', fontWeight: 'bold' },
    emptyText: { color: '#666', textAlign: 'center', marginTop: 20 },
});
