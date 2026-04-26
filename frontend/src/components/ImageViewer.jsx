import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

function ImageViewer({ imageUrl }) {
  const imageRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (imageRef.current && imageUrl) {
      // Destroy existing viewer if it exists
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }

      // Create new Viewer instance in modal mode
      viewerRef.current = new Viewer(imageRef.current, {
        inline: false,
        button: true,
        navbar: true,
        title: true,
        toolbar: {
          zoomIn: true,
          zoomOut: true,
          oneToOne: true,
          reset: true,
          prev: false,
          play: false,
          next: false,
          rotateLeft: false,
          rotateRight: false,
          flipHorizontal: false,
          flipVertical: false,
        },
        keyboard: true,
        backdrop: true,
        loop: false,
        viewed() {
          // Zoom to fit when image is viewed
          viewerRef.current.zoomTo(1);
        },
      });
    }

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [imageUrl]);

  const handleClick = () => {
    if (viewerRef.current) {
      viewerRef.current.show();
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        borderRadius: 1,
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
      }}
      onClick={handleClick}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Preview"
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}

export default ImageViewer;
