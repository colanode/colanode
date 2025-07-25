interface FilePreviewVideoProps {
  url: string;
}

export const FilePreviewVideo = ({ url }: FilePreviewVideoProps) => {
  return <video controls src={url} className="w-full object-contain" />;
};
