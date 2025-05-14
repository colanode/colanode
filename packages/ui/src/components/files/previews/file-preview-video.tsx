interface FilePreviewVideoProps {
  url: string;
}

export const FilePreviewVideo = ({ url }: FilePreviewVideoProps) => {
  return <video controls src={url} className="h-full w-full object-contain" />;
};
