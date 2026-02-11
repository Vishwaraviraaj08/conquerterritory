import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Switch,
    StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SCOPE_FILTERS = ['Local', 'State', 'Country', 'Global', 'Team'];

const DUMMY_LEADERBOARD = [
    { rank: 1, username: 'TerraKing', team: 'Alpha Wolves', area: '125.3k m²', streak: '45 days', color: '#FFD700' },
    { rank: 2, username: 'RunnerX', team: 'Night Hawks', area: '98.7k m²', streak: '38 days', color: '#C0C0C0' },
    { rank: 3, username: 'GeoMaster', team: 'Storm Riders', area: '87.2k m²', streak: '32 days', color: '#CD7F32' },
    { rank: 4, username: 'PathFinder', team: 'Alpha Wolves', area: '76.5k m²', streak: '28 days', color: '#5B63D3' },
    { rank: 5, username: 'TrailBlazer', team: 'Lone Wolves', area: '65.1k m²', streak: '25 days', color: '#5B63D3' },
    { rank: 6, username: 'ConquestPro', team: 'Night Hawks', area: '58.9k m²', streak: '22 days', color: '#5B63D3' },
    { rank: 7, username: 'ZoneRunner', team: 'Storm Riders', area: '52.4k m²', streak: '19 days', color: '#5B63D3' },
    { rank: 8, username: 'MapWalker', team: 'Alpha Wolves', area: '48.8k m²', streak: '17 days', color: '#5B63D3' },
    { rank: 9, username: 'TurfClaimer', team: 'Lone Wolves', area: '42.1k m²', streak: '15 days', color: '#5B63D3' },
    { rank: 10, username: 'LandLord', team: 'Night Hawks', area: '38.6k m²', streak: '12 days', color: '#5B63D3' },
];

const LeaderItem = ({ item }) => (
    <View style={styles.leaderCard}>
        <View style={[styles.rankCircle, item.rank <= 3 && { borderColor: item.color, borderWidth: 2 }]}>
            <Text style={[styles.rankText, item.rank <= 3 && { color: item.color }]}>{item.rank}</Text>
        </View>
        <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#7C83ED" />
        </View>
        <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{item.username}</Text>
            <Text style={styles.leaderTeam}>{item.team}</Text>
        </View>
        <View style={styles.leaderStats}>
            <View style={styles.leaderStatItem}>
                <MaterialCommunityIcons name="vector-polygon" size={14} color="#5B63D3" />
                <Text style={styles.leaderStatValue}>{item.area}</Text>
            </View>
            <View style={styles.leaderStatItem}>
                <MaterialCommunityIcons name="fire" size={14} color="#E8A838" />
                <Text style={styles.leaderStatValue}>{item.streak}</Text>
            </View>
        </View>
    </View>
);

export default function LeaderboardsScreen() {
    const [activeScope, setActiveScope] = useState('Local');
    const [friendsOnly, setFriendsOnly] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leaderboards</Text>
                <Ionicons name="trophy-outline" size={22} color="#E8A838" />
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
                    <Text style={styles.timeWindowText}>This Week</Text>
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
            <FlatList
                data={DUMMY_LEADERBOARD}
                keyExtractor={(item) => item.rank.toString()}
                renderItem={({ item }) => <LeaderItem item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
