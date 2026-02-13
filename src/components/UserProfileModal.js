import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';

export default function UserProfileModal({ visible, userId, onClose }) {
    const [profile, setProfile] = useState(null);
    const [relationship, setRelationship] = useState('none');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const scale = useRef(new Animated.Value(0.8)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && userId) {
            fetchProfile();
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            scale.setValue(0.8);
            opacity.setValue(0);
            setProfile(null);
            setLoading(true);
        }
    }, [visible, userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/users/${userId}`);
            setProfile(res.data.user);
            setRelationship(res.data.relationship);
        } catch (e) {
            console.log('Profile fetch error:', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendAction = async (action) => {
        setActionLoading(true);
        try {
            if (action === 'add') {
                await api.post(`/friends/request/${userId}`);
                setRelationship('pending_sent');
            } else if (action === 'accept') {
                await api.post(`/friends/accept/${userId}`);
                setRelationship('friends');
            } else if (action === 'reject') {
                await api.post(`/friends/reject/${userId}`);
                setRelationship('none');
            } else if (action === 'unfriend') {
                await api.delete(`/friends/${userId}`);
                setRelationship('none');
            }
        } catch (e) {
            console.log('Friend action error:', e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return 'Unknown';
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatArea = (v) => {
        if (!v) return '0 m²';
        if (v >= 1000) return `${(v / 1000).toFixed(1)}k m²`;
        return `${v.toFixed(0)} m²`;
    };

    const stats = profile?.stats || {};

    const renderFriendButton = () => {
        if (actionLoading) {
            return (
                <View style={styles.friendBtn}>
                    <ActivityIndicator size="small" color="#fff" />
                </View>
            );
        }
        switch (relationship) {
            case 'friends':
                return (
                    <TouchableOpacity style={[styles.friendBtn, styles.friendBtnOutline]} onPress={() => handleFriendAction('unfriend')} activeOpacity={0.8}>
                        <Ionicons name="person-remove-outline" size={16} color="#E53935" />
                        <Text style={[styles.friendBtnText, { color: '#E53935' }]}>Unfriend</Text>
                    </TouchableOpacity>
                );
            case 'pending_sent':
                return (
                    <View style={[styles.friendBtn, styles.friendBtnPending]}>
                        <Ionicons name="time-outline" size={16} color="#E8A838" />
                        <Text style={[styles.friendBtnText, { color: '#E8A838' }]}>Pending</Text>
                    </View>
                );
            case 'pending_received':
                return (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.friendBtn} onPress={() => handleFriendAction('accept')} activeOpacity={0.8}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.friendBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnOutline]} onPress={() => handleFriendAction('reject')} activeOpacity={0.8}>
                            <Ionicons name="close" size={16} color="#E53935" />
                            <Text style={[styles.friendBtnText, { color: '#E53935' }]}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return (
                    <TouchableOpacity style={styles.friendBtn} onPress={() => handleFriendAction('add')} activeOpacity={0.8}>
                        <Ionicons name="person-add-outline" size={16} color="#fff" />
                        <Text style={styles.friendBtnText}>Add Friend</Text>
                    </TouchableOpacity>
                );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { opacity }]}>
                <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
                <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={22} color="#888" />
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#5B63D3" />
                        </View>
                    ) : profile ? (
                        <>
                            {/* Avatar */}
                            <View style={styles.avatarSection}>
                                <View style={styles.avatarOuter}>
                                    {profile.profileImage ? (
                                        <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarCircle}>
                                            <Ionicons name="person" size={40} color="#7C83ED" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.username}>{profile.username}</Text>
                                <Text style={styles.joinDate}>
                                    Joined {formatDate(profile.createdAt)} • {profile.friendsCount || 0} friends
                                </Text>
                            </View>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="star" size={18} color="#E8A838" />
                                    <Text style={styles.statValue}>{(stats.totalPoints || 0).toLocaleString()}</Text>
                                    <Text style={styles.statLabel}>Points</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="vector-polygon" size={18} color="#5B63D3" />
                                    <Text style={styles.statValue}>{formatArea(stats.totalArea)}</Text>
                                    <Text style={styles.statLabel}>Area</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons name="map-marker-check" size={18} color="#2dd06e" />
                                    <Text style={styles.statValue}>{stats.totalCaptures || 0}</Text>
                                    <Text style={styles.statLabel}>Captures</Text>
                                </View>
                            </View>

                            {/* Friend Action */}
                            <View style={styles.friendSection}>
                                {renderFriendButton()}
                            </View>
                        </>
                    ) : (
                        <Text style={{ color: '#888', textAlign: 'center', padding: 30 }}>User not found</Text>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center', alignItems: 'center', padding: 30,
    },
    overlayTouch: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    modal: {
        width: '100%', maxWidth: 340,
        backgroundColor: '#111528', borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.2)',
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    loadingContainer: {
        height: 200, justifyContent: 'center', alignItems: 'center',
    },
    avatarSection: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
    avatarOuter: { marginBottom: 12 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(91,99,211,0.15)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#5B63D3',
    },
    avatarImage: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 3, borderColor: '#5B63D3',
    },
    username: { fontSize: 20, fontWeight: '800', color: '#fff' },
    joinDate: { fontSize: 12, color: '#888daf', marginTop: 4 },
    statsGrid: {
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: 'rgba(91,99,211,0.06)', borderRadius: 14,
        paddingVertical: 14, marginBottom: 20,
    },
    statItem: { alignItems: 'center', gap: 4 },
    statValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: '#888daf' },
    friendSection: { alignItems: 'center' },
    friendBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#5B63D3', borderRadius: 12,
        paddingHorizontal: 24, paddingVertical: 12,
    },
    friendBtnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)',
    },
    friendBtnPending: {
        backgroundColor: 'rgba(232,168,56,0.12)',
    },
    friendBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
