interface FilePreviewImageProps {
  url: string;
  name: string;
}

export const FilePreviewImage = ({ url, name }: FilePreviewImageProps) => {
  return (
    <img
      src={url}
      alt={name}
      className="max-h-full max-w-full object-contain"
    />
  );
};
