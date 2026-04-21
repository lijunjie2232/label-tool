import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';

function ImageViewer({ imageUrl }) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.1}
      maxScale={5}
      centerOnInit={true}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          <Space style={{ marginBottom: 8 }}>
            <Button icon={<ZoomInOutlined />} onClick={() => zoomIn()} size="small">
              Zoom In
            </Button>
            <Button icon={<ZoomOutOutlined />} onClick={() => zoomOut()} size="small">
              Zoom Out
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => resetTransform()} size="small">
              Reset
            </Button>
          </Space>
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: 'calc(100vh - 280px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
            contentStyle={{
              width: 'auto',
              height: 'auto',
            }}
          >
            <img
              src={imageUrl}
              alt="Preview"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
}

export default ImageViewer;
