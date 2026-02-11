import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Switch,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';

const SCOPE_FILTERS = ['Local', 'State', 'Country', 'Global', 'Team'];
const SCOPE_MAP = { Local: 'local', State: 'state', Country: 'country', Global: 'global', Team: 'team' };

const LeaderItem = ({ item }) => (
    <View style={styles.leaderCard}>
        <View style={[styles.rankCircle, item.rank <= 3 && { borderColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32', borderWidth: 2 }]}>
            <Text style={[styles.rankText, item.rank <= 3 && { color: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>{item.rank}</Text>
        </View>
        <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#7C83ED" />
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
    </View>
);

export default function LeaderboardsScreen() {
    const [activeScope, setActiveScope] = useState('Global');
    const [friendsOnly, setFriendsOnly] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaderboards', {
                params: {
                    scope: SCOPE_MAP[activeScope] || 'global',
                    period: 'alltime',
                    limit: 20,
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
    }, [activeScope]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leaderboards</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {userRank && (
                        <Text style={{ color: '#E8A838', fontWeight: '700', fontSize: 14 }}>
                            #{userRank}
                        </Text>
                    )}
                    <Ionicons name="trophy-outline" size={22} color="#E8A838" />
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
                <View style={styles.timeWindow}>
                    <Ionicons name="time-outline" size={16} color="#7C83ED" />
                    <Text style={styles.timeWindowText}>All Time</Text>
                    <Ionicons name="chevron-down" size={14} color="#888" />
                </View>
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

            {/* Action buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                    <Ionicons name="flag-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Challenge Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                    <Ionicons name="people-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Join Team Event</Text>
                </TouchableOpacity>
            </View>

            {/* Leaderboard List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#5B63D3" />
                </View>
            ) : leaderboard.length > 0 ? (
                <FlatList
                    data={leaderboard}
                    keyExtractor={(item, index) => (item.userId || index).toString()}
                    renderItem={({ item }) => <LeaderItem item={item} />}
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
        justifyContent: 'center', alignItems: 'center',
    },
    leaderInfo: { flex: 1 },
    leaderName: { fontSize: 14, fontWeight: '700', color: '#fff' },
    leaderTeam: { fontSize: 11, color: '#888daf' },
    leaderStats: { alignItems: 'flex-end' },
    leaderStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    leaderStatValue: { fontSize: 12, fontWeight: '600', color: '#ccc' },
});
