interface FilePreviewAudioProps {
  url: string;
  name?: string;
}

export const FilePreviewAudio = ({ url, name }: FilePreviewAudioProps) => {
  return (
    <audio
      controls
      src={url}
      className="w-full max-w-3xl"
      aria-label={name ? `Audio file: ${name}` : 'Audio file'}
    >
      Your browser does not support the audio element.
    </audio>
  );
};
