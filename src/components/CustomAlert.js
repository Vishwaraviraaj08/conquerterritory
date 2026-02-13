import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

const ICON_MAP = {
    success: { name: 'checkmark-circle', color: '#2dd06e' },
    error: { name: 'alert-circle', color: '#ff4444' },
    warning: { name: 'warning', color: '#E8A838' },
    info: { name: 'information-circle', color: '#5B63D3' },
    confirm: { name: 'help-circle', color: '#7C83ED' },
    logout: { name: 'log-out-outline', color: '#ff4444' },
    delete: { name: 'trash-outline', color: '#ff4444' },
};

export default function CustomAlert({
    visible = false,
    type = 'info',
    title = '',
    message = '',
    buttons = [],
    onClose,
}) {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            ]).start();
        } else {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const iconDef = ICON_MAP[type] || ICON_MAP.info;

    const resolvedButtons = buttons.length > 0
        ? buttons
        : [{ text: 'OK', onPress: onClose }];

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: `${iconDef.color}18` }]}>
                        <Ionicons name={iconDef.name} size={36} color={iconDef.color} />
                    </View>

                    {/* Title */}
                    {title ? <Text style={styles.title}>{title}</Text> : null}

                    {/* Message */}
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        {resolvedButtons.map((btn, i) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';
                            const isPrimary = !isDestructive && !isCancel;

                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.button,
                                        isPrimary && styles.primaryBtn,
                                        isDestructive && styles.destructiveBtn,
                                        isCancel && styles.cancelBtn,
                                        resolvedButtons.length === 1 && { flex: 1 },
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        if (onClose) onClose();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isDestructive && styles.destructiveBtnText,
                                        isCancel && styles.cancelBtnText,
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    card: {
        width: Math.min(SCREEN_W - 48, 360),
        backgroundColor: '#15192d',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(91,99,211,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 20,
    },
    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#a0a3bd',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: '#5B63D3',
    },
    destructiveBtn: {
        backgroundColor: 'rgba(255,68,68,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.3)',
    },
    cancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    destructiveBtnText: {
        color: '#ff4444',
    },
    cancelBtnText: {
        color: '#a0a3bd',
    },
});
