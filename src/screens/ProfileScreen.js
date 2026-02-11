import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const StatBox = ({ icon, value, label, color }) => (
    <View style={styles.statBox}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Text style={styles.statBoxValue}>{value}</Text>
        <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
);

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get('/users/profile');
            setProfile(res.data.user);
        } catch (e) {
            console.log('Profile fetch error, using local user');
            setProfile(user);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const p = profile || user || {};
    const stats = p.stats || {};

    const formatArea = (v) => {
        if (!v) return '0 m²';
        if (v >= 1000) return `${(v / 1000).toFixed(1)}k m²`;
        return `${v.toFixed(0)} m²`;
    };
    const formatDist = (v) => {
        if (!v) return '0 m';
        if (v >= 1000) return `${(v / 1000).toFixed(1)} km`;
        return `${v.toFixed(0)} m`;
    };

    const achievements = p.achievements || [];

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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ width: 22 }} />
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
                        <Ionicons name="settings-outline" size={22} color="#7C83ED" />
                    </TouchableOpacity>
                </View>

                {/* Avatar & Username */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarOuter}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={44} color="#7C83ED" />
                        </View>
                        <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.username}>{p.username || 'Player'}</Text>
                    <Text style={styles.userTeam}>
                        {p.email || 'Adventurer'} • Level {Math.floor((stats.totalPoints || 0) / 100) + 1}
                    </Text>
                </View>

                {/* Health Score */}
                <View style={styles.healthCard}>
                    <View style={styles.healthHeader}>
                        <MaterialCommunityIcons name="heart-pulse" size={18} color="#E53935" />
                        <Text style={styles.healthTitle}>Health Score</Text>
                        <Text style={styles.healthValue}>{stats.healthScore || 50}/100</Text>
                    </View>
                    <View style={styles.healthBarBg}>
                        <View style={[styles.healthBarFill, { width: `${stats.healthScore || 50}%` }]} />
                    </View>
                </View>

                {/* Key Statistics */}
                <Text style={styles.sectionTitle}>Key Statistics</Text>
                <View style={styles.statsGrid}>
                    <StatBox icon="vector-polygon" value={formatArea(stats.totalArea)} label="Total Area" color="#5B63D3" />
                    <StatBox icon="run-fast" value={formatDist(stats.totalDistance)} label="Total Distance" color="#E8A838" />
                    <StatBox icon="fire" value={`${(stats.caloriesBurned || 0).toLocaleString()}`} label="Calories" color="#E53935" />
                    <StatBox icon="chart-line" value={`${stats.streak || 0} days`} label="Best Streak" color="#2dd06e" />
                </View>

                {/* Achievements */}
                <Text style={styles.sectionTitle}>Achievements ({achievements.length})</Text>
                <View style={styles.achievementsList}>
                    {achievements.length > 0 ? achievements.map((ach, i) => (
                        <View key={i} style={styles.achievementCard}>
                            <View style={[styles.achievementIcon, { backgroundColor: 'rgba(91,99,211,0.15)' }]}>
                                <Ionicons name={ach.icon || 'trophy'} size={20} color="#5B63D3" />
                            </View>
                            <View style={styles.achievementInfo}>
                                <Text style={styles.achievementTitle}>{ach.title}</Text>
                                <Text style={styles.achievementDesc}>{ach.description}</Text>
                            </View>
                            <Ionicons name="checkmark-circle" size={20} color="#2dd06e" />
                        </View>
                    )) : (
                        <Text style={{ color: '#666', textAlign: 'center', padding: 20, fontSize: 13 }}>
                            Complete captures to earn achievements!
                        </Text>
                    )}
                </View>

                {/* Connected Devices */}
                <Text style={styles.sectionTitle}>Connected Devices</Text>
                {(p.connectedDevices || []).length > 0 ? p.connectedDevices.map((dev, i) => (
                    <View key={i} style={styles.deviceCard}>
                        <MaterialCommunityIcons name={dev.type === 'watch' ? 'watch' : 'cellphone'} size={22} color="#5B63D3" />
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceName}>{dev.name}</Text>
                            <Text style={styles.deviceStatus}>Connected</Text>
                        </View>
                        <View style={styles.connectedBadge}>
                            <Text style={styles.connectedBadgeText}>Active</Text>
                        </View>
                    </View>
                )) : (
                    <View style={styles.deviceCard}>
                        <MaterialCommunityIcons name="cellphone" size={22} color="#5B63D3" />
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceName}>This Device</Text>
                            <Text style={styles.deviceStatus}>Primary Device</Text>
                        </View>
                        <View style={styles.connectedBadge}>
                            <Text style={styles.connectedBadgeText}>Active</Text>
                        </View>
                    </View>
                )}

                {/* Settings & Appeals */}
                <Text style={styles.sectionTitle}>Settings & Appeals</Text>
                <View style={styles.settingsCard}>
                    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="notifications-outline" size={20} color="#7C83ED" />
                        <Text style={styles.settingsText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="lock-closed-outline" size={20} color="#7C83ED" />
                        <Text style={styles.settingsText}>Privacy Settings</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="flag-outline" size={20} color="#7C83ED" />
                        <Text style={styles.settingsText}>Appeals & Support</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={20} color="#7C83ED" />
                        <Text style={styles.settingsText}>All Settings</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                {/* Career Timeline */}
                <Text style={styles.sectionTitle}>Career Timeline Map</Text>
                <View style={styles.timelineMap}>
                    <MaterialCommunityIcons name="map-clock-outline" size={50} color="rgba(91,99,211,0.3)" />
                    <Text style={styles.timelineText}>Activity history heatmap</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 100, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    profileSection: { alignItems: 'center', marginBottom: 20 },
    avatarOuter: { position: 'relative', marginBottom: 10 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(91,99,211,0.15)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#5B63D3',
    },
    onlineDot: {
        width: 16, height: 16, borderRadius: 8, backgroundColor: '#2dd06e',
        position: 'absolute', bottom: 2, right: 2, borderWidth: 3, borderColor: '#0a0e1a',
    },
    username: { fontSize: 22, fontWeight: '800', color: '#fff' },
    userTeam: { fontSize: 13, color: '#888daf', marginTop: 2 },
    healthCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    healthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    healthTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
    healthValue: { fontSize: 15, fontWeight: '700', color: '#2dd06e' },
    healthBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
    healthBarFill: { height: 6, backgroundColor: '#2dd06e', borderRadius: 3 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
    },
    statBox: {
        width: '47%', backgroundColor: '#111528', borderRadius: 14, padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    statBoxValue: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 6 },
    statBoxLabel: { fontSize: 11, color: '#888daf', marginTop: 2 },
    achievementsList: { marginBottom: 20 },
    achievementCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111528',
        borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    achievementIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    achievementInfo: { flex: 1 },
    achievementTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
    achievementDesc: { fontSize: 11, color: '#888daf', marginTop: 1 },
    deviceCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111528',
        borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    deviceInfo: { flex: 1 },
    deviceName: { fontSize: 14, fontWeight: '600', color: '#fff' },
    deviceStatus: { fontSize: 11, color: '#888daf', marginTop: 1 },
    connectedBadge: {
        backgroundColor: 'rgba(45,208,110,0.15)', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    connectedBadgeText: { color: '#2dd06e', fontSize: 11, fontWeight: '600' },
    settingsCard: { backgroundColor: '#111528', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)' },
    settingsItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
        gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(91,99,211,0.06)',
    },
    settingsText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#ccc' },
    timelineMap: {
        height: 120, backgroundColor: '#111528', borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    timelineText: { color: '#555', fontSize: 12, marginTop: 6 },
});
