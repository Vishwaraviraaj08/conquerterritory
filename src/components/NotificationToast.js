import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationToast({ message, onHide }) {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    // We can try to use safe area insets if available, but for now 
    // simply adding some padding for status bar
    const topPadding = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10;

    useEffect(() => {
        // Slide in
        Animated.spring(slideAnim, {
            toValue: topPadding,
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();

        // Auto hide after 4 seconds
        const timer = setTimeout(() => {
            handleHide();
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const handleHide = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            if (onHide) onHide();
        });
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.content} onPress={handleHide} activeOpacity={0.9}>
                <Ionicons name="notifications" size={24} color="#fff" />
                <Text style={styles.message} numberOfLines={2}>
                    {message}
                </Text>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5B63D3',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 12,
        width: '100%',
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    }
});
