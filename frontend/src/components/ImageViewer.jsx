import { useEffect, useRef } from 'react';
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
    <div 
      style={{ 
        width: '100%', 
        height: 'calc(100vh - 280px)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
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
    </div>
  );
}

export default ImageViewer;
