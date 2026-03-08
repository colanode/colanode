import Feather from '@expo/vector-icons/Feather';
import { getIdType, IdType } from '@colanode/core';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Workspace } from '@colanode/client/types/workspaces';
import { UserAvatar } from '@colanode/mobile/components/avatars/avatar';
import { useTheme } from '@colanode/mobile/contexts/theme';
import { useLiveQuery } from '@colanode/mobile/hooks/use-live-query';

interface WorkspaceSwitcherSheetProps {
  visible: boolean;
  currentUserId: string;
  onSelectWorkspace: (userId: string) => void;
  onCreateWorkspace: () => void;
  onClose: () => void;
}

export const WorkspaceSwitcherSheet = ({
  visible,
  currentUserId,
  onSelectWorkspace,
  onCreateWorkspace,
  onClose,
}: WorkspaceSwitcherSheetProps) => {
  const { data: workspaces } = useLiveQuery({ type: 'workspace.list' });
  const { data: radarData } = useLiveQuery({ type: 'radar.data.get' });
  const { colors } = useTheme();

  const getUnreadCount = (workspace: Workspace): number => {
    const workspaceRadar = radarData?.[workspace.userId];
    if (!workspaceRadar) return 0;

    let count = 0;
    for (const [id, nodeState] of Object.entries(workspaceRadar.nodeStates)) {
      if (getIdType(id) === IdType.Chat && nodeState.unreadCount > 0) {
        count += nodeState.unreadCount;
      }
    }
    return count;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />
          <Text style={[styles.title, { color: colors.text }]}>Switch Workspace</Text>

          <ScrollView style={styles.list}>
            {workspaces?.map((ws) => {
              const isActive = ws.userId === currentUserId;
              const unread = isActive ? 0 : getUnreadCount(ws);

              return (
                <Pressable
                  key={ws.userId}
                  style={({ pressed }) => [
                    styles.row,
                    isActive && { backgroundColor: colors.surfaceHover },
                    pressed && { backgroundColor: colors.surfaceHover },
                  ]}
                  onPress={() => {
                    if (!isActive) {
                      onSelectWorkspace(ws.userId);
                    }
                    onClose();
                  }}
                >
                  <UserAvatar
                    name={ws.name}
                    avatar={ws.avatar ?? null}
                    size={40}
                  />
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                      {ws.name}
                    </Text>
                    <Text style={[styles.rowRole, { color: colors.textMuted }]}>
                      {ws.role.charAt(0).toUpperCase() + ws.role.slice(1)}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={[styles.badgeText, { color: colors.text }]}>{unread}</Text>
                    </View>
                  )}
                  {isActive && (
                    <Feather name="check" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              styles.createRow,
              { borderTopColor: colors.border },
              pressed && { backgroundColor: colors.surfaceHover },
            ]}
            onPress={() => {
              onClose();
              onCreateWorkspace();
            }}
          >
            <View style={[styles.createIcon, { backgroundColor: colors.surfaceAccent }]}>
              <Feather name="plus" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.createText, { color: colors.primary }]}>Create Workspace</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    paddingTop: 8,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRole: {
    fontSize: 13,
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
    borderTopWidth: 1,
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
