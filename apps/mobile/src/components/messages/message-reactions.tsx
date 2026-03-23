import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NodeReaction } from '@colanode/client/types/nodes';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { impactLight } from '@colanode/mobile/lib/haptics';

interface MessageReactionsProps {
  reactions: NodeReaction[];
  currentUserId: string;
  onToggleReaction: (reaction: string) => void;
}

interface GroupedReaction {
  reaction: string;
  count: number;
  hasOwnReaction: boolean;
}

export const MessageReactions = ({
  reactions,
  currentUserId,
  onToggleReaction,
}: MessageReactionsProps) => {
  const { colors } = useTheme();

  if (reactions.length === 0) return null;

  const grouped = reactions.reduce<Record<string, GroupedReaction>>(
    (acc, r) => {
      if (!acc[r.reaction]) {
        acc[r.reaction] = {
          reaction: r.reaction,
          count: 0,
          hasOwnReaction: false,
        };
      }
      acc[r.reaction]!.count++;
      if (r.collaboratorId === currentUserId) {
        acc[r.reaction]!.hasOwnReaction = true;
      }
      return acc;
    },
    {}
  );

  return (
    <View style={styles.container}>
      {Object.values(grouped).map((g) => (
        <Pressable
          key={g.reaction}
          style={[
            styles.badge,
            { backgroundColor: colors.surfaceHover, borderColor: colors.border },
            g.hasOwnReaction && { borderColor: colors.primary, backgroundColor: colors.surfaceAccent },
          ]}
          onPress={() => {
            impactLight();
            onToggleReaction(g.reaction);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${g.reaction}, ${g.count} ${g.count === 1 ? 'reaction' : 'reactions'}${g.hasOwnReaction ? ', you reacted' : ''}`}
        >
          <Text style={styles.emoji}>{g.reaction}</Text>
          <Text
            style={[styles.count, { color: colors.textSecondary }, g.hasOwnReaction && { color: colors.primaryLight }]}
          >
            {g.count}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
  },
});
