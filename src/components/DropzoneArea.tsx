import { Box, Image, Text } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type PreviewFile = File & {
  preview: string;
};

export type DropzoneProps = {
  multiple?: boolean;
  onChange: (files: PreviewFile[]) => void;
};

const DropzoneArea: FC<DropzoneProps> = ({ multiple, onChange }) => {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [errors, setErrors] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept: 'image/*',
    onDragEnter: () => {
      setErrors('');
    },
    onDrop: (acceptedFiles, fileRejections) => {
      setErrors('');

      fileRejections.forEach((file) => {
        file.errors.forEach((err) => {
          if (err.code === 'file-too-large') {
            setErrors(`Error: ${err.message}`);
          }

          if (err.code === 'file-invalid-type') {
            setErrors(`Error: ${err.message}`);
          }
        });
      });

      const fileUrls = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles((state) => [...state, ...fileUrls]);
    },
  });

  const removeFile = (file: PreviewFile) => {
    setFiles(files.filter((item) => item.preview !== file.preview));
  };

  useEffect(() => {
    onChange(files);
  }, [files]);

  return (
    <>
      <Box
        {...getRootProps()}
        width={'full'}
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        p={4}
        border="1px"
        borderColor={'gray.300'}
        borderRadius={'md'}
      >
        <input {...getInputProps()} />
        {multiple ? (
          <>
            {isDragActive ? (
              <Text>Drop the files here ...</Text>
            ) : (
              <Text>Drag n drop some files here, or click to select files</Text>
            )}
            {errors && <Text>{errors}</Text>}
          </>
        ) : (
          <>
            {files.length > 0 ? (
              <Box
                onClick={() => removeFile(files[0])}
                _hover={{
                  filter: 'contrast(20%)',
                  backgroundColor: 'rgba(255, 0, 0, 0.3)',
                  cursor: 'no-drop',
                }}
              >
                <Image
                  src={files[0]?.preview}
                  alt=""
                  width={100}
                  height={100}
                  objectFit={'contain'}
                />
              </Box>
            ) : (
              <Text>Drag n drop some files here, or click to select files</Text>
            )}
          </>
        )}
      </Box>

      {files.length > 0 && !!multiple && (
        <Box display={'flex'} gap={4} width={'full'} overflow={'auto'}>
          {files.map((file) => (
            <Box
              key={file.name}
              onClick={() => removeFile(file)}
              _hover={{
                filter: 'contrast(20%)',
                backgroundColor: 'rgba(255, 0, 0, 0.3)',
                cursor: 'no-drop',
              }}
            >
              <Image
                src={file.preview}
                alt=""
                width={100}
                height={100}
                objectFit={'contain'}
              />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default DropzoneArea;
