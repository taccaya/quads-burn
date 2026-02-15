import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';

type ButtonProps = Omit<PressableProps, 'style'> & {
  children: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({ children, style, textStyle, disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.root,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
      {...props}
    >
      <Text style={[styles.text, disabled && styles.textDisabled, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  pressed: {
    opacity: 0.88
  },
  disabled: {
    backgroundColor: '#64748b'
  },
  text: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600'
  },
  textDisabled: {
    color: '#e2e8f0'
  }
});
