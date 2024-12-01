import { AvatarUpload } from '@/renderer/components/avatars/avatar-upload';
import { EmojiPicker } from '@/renderer/components/emojis/emoji-picker';
import { IconPicker } from '@/renderer/components/icons/icon-picker';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/renderer/components/ui/tabs';

interface AvatarPickerProps {
  onPick: (avatar: string) => void;
}

export const AvatarPicker = ({ onPick }: AvatarPickerProps) => {
  return (
    <Tabs defaultValue="emojis" className="p-1">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="emojis">Emojis</TabsTrigger>
        <TabsTrigger value="icons">Icons</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>
      <TabsContent value="emojis">
        <EmojiPicker
          onPick={(emoji, skinTone) => {
            const skin = emoji.skins[skinTone];
            if (skin) {
              onPick(skin.id);
            }
          }}
        />
      </TabsContent>
      <TabsContent value="icons">
        <IconPicker
          onPick={(icon) => {
            onPick(icon.id);
          }}
        />
      </TabsContent>
      <TabsContent value="custom">
        <AvatarUpload
          onUpload={(id) => {
            onPick(id);
          }}
        />
      </TabsContent>
    </Tabs>
  );
};
