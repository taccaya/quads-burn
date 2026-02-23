import type { Ref } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

type ScreenProps = ScrollViewProps & {
  scrollRef?: Ref<ScrollView | null>;
};

export function Screen({ contentContainerStyle, scrollRef, ...props }: ScreenProps) {
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  content: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24
  }
});
