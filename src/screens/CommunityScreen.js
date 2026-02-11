import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CHALLENGES = [
    { id: '1', title: 'Weekend Warrior', desc: 'Capture 5 territories this weekend', reward: '500 pts', icon: 'sword-cross', progress: 60 },
    { id: '2', title: 'Marathon Runner', desc: 'Cover 42km in a week', reward: '1000 pts', icon: 'run-fast', progress: 35 },
    { id: '3', title: 'Team Spirit', desc: 'Win 3 team battles', reward: '750 pts', icon: 'account-group', progress: 80 },
];

const SOCIAL_FEED = [
    {
        id: '1',
        user: 'RunnerX',
        time: '2h ago',
        text: 'Just captured a massive 15k m² territory downtown! New personal record! 🏆',
        likes: 24,
        comments: 8,
    },
    {
        id: '2',
        user: 'GeoMaster',
        time: '5h ago',
        text: "Our team Alpha Wolves just defended 3 territories in a row. Nobody's touching our turf! 🐺",
        likes: 45,
        comments: 12,
    },
    {
        id: '3',
        user: 'TrailBlazer',
        time: '8h ago',
        text: 'Morning run turned into a 25-minute capture session. Love how this game makes exercise fun! 💪',
        likes: 31,
        comments: 5,
    },
];

export default function CommunityScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Community</Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Community Challenges */}
                <Text style={styles.sectionTitle}>Community Challenges</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.challengeScroll}>
                    {CHALLENGES.map((ch) => (
                        <View key={ch.id} style={styles.challengeCard}>
                            <View style={styles.challengeIconWrap}>
                                <MaterialCommunityIcons name={ch.icon} size={24} color="#5B63D3" />
                            </View>
                            <Text style={styles.challengeTitle}>{ch.title}</Text>
                            <Text style={styles.challengeDesc}>{ch.desc}</Text>
                            <View style={styles.challengeProgressBg}>
                                <View style={[styles.challengeProgressFill, { width: `${ch.progress}%` }]} />
                            </View>
                            <Text style={styles.challengeReward}>{ch.reward}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Team Hub */}
                <Text style={styles.sectionTitle}>Team Hub</Text>
                <View style={styles.teamCard}>
                    <View style={styles.teamHeader}>
                        <View style={styles.teamAvatar}>
                            <MaterialCommunityIcons name="shield-account" size={28} color="#5B63D3" />
                        </View>
                        <View style={styles.teamInfo}>
                            <Text style={styles.teamName}>Alpha Wolves</Text>
                            <Text style={styles.teamMembers}>24 members • Rank #3 Local</Text>
                        </View>
                    </View>
                    <View style={styles.teamActions}>
                        <TouchableOpacity style={styles.teamActionBtn} activeOpacity={0.8}>
                            <Text style={styles.teamActionText}>My Team</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.teamActionBtnOutline} activeOpacity={0.8}>
                            <Text style={styles.teamActionOutlineText}>Create</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.teamActionBtnOutline} activeOpacity={0.8}>
                            <Text style={styles.teamActionOutlineText}>Find Teams</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Social Feed */}
                <Text style={styles.sectionTitle}>Social Feed</Text>
                {SOCIAL_FEED.map((post) => (
                    <View key={post.id} style={styles.feedCard}>
                        <View style={styles.feedHeader}>
                            <View style={styles.feedAvatar}>
                                <Ionicons name="person" size={18} color="#7C83ED" />
                            </View>
                            <View style={styles.feedUserInfo}>
                                <Text style={styles.feedUsername}>{post.user}</Text>
                                <Text style={styles.feedTime}>{post.time}</Text>
                            </View>
                            <TouchableOpacity activeOpacity={0.7}>
                                <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.feedText}>{post.text}</Text>
                        <View style={styles.feedActions}>
                            <TouchableOpacity style={styles.feedActionBtn} activeOpacity={0.7}>
                                <Ionicons name="heart-outline" size={18} color="#888" />
                                <Text style={styles.feedActionCount}>{post.likes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.feedActionBtn} activeOpacity={0.7}>
                                <Ionicons name="chatbubble-outline" size={16} color="#888" />
                                <Text style={styles.feedActionCount}>{post.comments}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.feedActionBtn} activeOpacity={0.7}>
                                <Ionicons name="share-social-outline" size={18} color="#888" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Support & Settings */}
                <Text style={styles.sectionTitle}>Support & Settings</Text>
                <View style={styles.supportCard}>
                    <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
                        <Ionicons name="help-circle-outline" size={20} color="#7C83ED" />
                        <Text style={styles.supportText}>Help Center</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7C83ED" />
                        <Text style={styles.supportText}>Feedback</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
                        <Ionicons name="document-text-outline" size={20} color="#7C83ED" />
                        <Text style={styles.supportText}>Community Guidelines</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 100, paddingHorizontal: 16 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
        paddingHorizontal: 4,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerIcons: { flexDirection: 'row', gap: 8 },
    headerIconBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#111528',
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12, paddingHorizontal: 4 },
    challengeScroll: { marginBottom: 20 },
    challengeCard: {
        width: 180, backgroundColor: '#111528', borderRadius: 16, padding: 16, marginRight: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    challengeIconWrap: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(91,99,211,0.12)', justifyContent: 'center', alignItems: 'center',
        marginBottom: 10,
    },
    challengeTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
    challengeDesc: { fontSize: 11, color: '#888daf', lineHeight: 15, marginBottom: 10 },
    challengeProgressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 8 },
    challengeProgressFill: { height: 4, backgroundColor: '#5B63D3', borderRadius: 2 },
    challengeReward: { fontSize: 13, fontWeight: '700', color: '#E8A838' },
    teamCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    teamAvatar: {
        width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(91,99,211,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    teamInfo: { flex: 1 },
    teamName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    teamMembers: { fontSize: 12, color: '#888daf', marginTop: 2 },
    teamActions: { flexDirection: 'row', gap: 8 },
    teamActionBtn: {
        flex: 1, backgroundColor: '#5B63D3', borderRadius: 10, paddingVertical: 10,
        alignItems: 'center',
    },
    teamActionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    teamActionBtnOutline: {
        flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.3)',
    },
    teamActionOutlineText: { color: '#7C83ED', fontSize: 13, fontWeight: '600' },
    feedCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    feedAvatar: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(91,99,211,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    feedUserInfo: { flex: 1 },
    feedUsername: { fontSize: 14, fontWeight: '600', color: '#fff' },
    feedTime: { fontSize: 11, color: '#777' },
    feedText: { fontSize: 14, color: '#d0d3e8', lineHeight: 20, marginBottom: 12 },
    feedActions: { flexDirection: 'row', gap: 20 },
    feedActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    feedActionCount: { fontSize: 13, color: '#888', fontWeight: '500' },
    supportCard: {
        backgroundColor: '#111528', borderRadius: 16, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    supportItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
        gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(91,99,211,0.06)',
    },
    supportText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#ccc' },
});
