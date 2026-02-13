import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useNotifications } from '../context/NotificationContext';

export default function FriendRequestsModal({ visible, onClose }) {
    const { refreshNotifications, markAsViewed } = useNotifications();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (visible) {
            fetchRequests();
            markAsViewed();
        }
    }, [visible]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/friends/requests');
            setRequests(res.data.requests || []);
        } catch (e) {
            console.log('Fetch requests error:', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        setProcessingId(userId);
        try {
            if (action === 'accept') {
                await api.post(`/friends/accept/${userId}`);
            } else {
                await api.post(`/friends/reject/${userId}`);
            }

            // Remove from list locally
            setRequests(prev => prev.filter(r => r.from._id !== userId));
            // Trigger refresh in context
            refreshNotifications();
        } catch (e) {
            Alert.alert('Error', `Failed to ${action} request`);
        } finally {
            setProcessingId(null);
        }
    };

    const renderItem = ({ item }) => {
        const user = item.from;
        return (
            <View style={styles.requestItem}>
                <View style={styles.userInfo}>
                    {user.profileImage ? (
                        <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#7C83ED" />
                        </View>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.username}>{user.username}</Text>
                        <Text style={styles.timeText}>
                            Sent {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    {processingId === user._id ? (
                        <ActivityIndicator size="small" color="#5B63D3" />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.btn, styles.rejectBtn]}
                                onPress={() => handleAction(user._id, 'reject')}
                            >
                                <Ionicons name="close" size={18} color="#ff4444" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.acceptBtn]}
                                onPress={() => handleAction(user._id, 'accept')}
                            >
                                <Ionicons name="checkmark" size={18} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Friend Requests</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#5B63D3" />
                        </View>
                    ) : requests.length > 0 ? (
                        <FlatList
                            data={requests}
                            keyExtractor={item => item.from._id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.center}>
                            <Ionicons name="mail-open-outline" size={48} color="rgba(91,99,211,0.3)" />
                            <Text style={styles.emptyText}>No pending requests</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111528',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        padding: 20,
        borderTopWidth: 1,
        borderColor: 'rgba(91,99,211,0.3)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        paddingBottom: 20,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#1a1e2e',
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(91,99,211,0.3)',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(91,99,211,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(91,99,211,0.3)',
    },
    textContainer: {
        flex: 1,
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    timeText: {
        fontSize: 11,
        color: '#888',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    btn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#2dd06e',
    },
    rejectBtn: {
        backgroundColor: 'rgba(255,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.3)',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    emptyText: {
        color: '#666',
        marginTop: 12,
        fontSize: 16,
    }
});
