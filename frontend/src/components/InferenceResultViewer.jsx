import { useState, useEffect } from 'react';
import { Table, Select, Button, Space, message } from 'antd';
import { inferenceAPI, imageAPI } from '../services/api';
import imageCache from '../utils/imageCache';

// 图片预览组件，使用 POST 请求获取图片
function ImagePreview({ dataset, path }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    // Construct full image path
    const imagePath = `${dataset}/${path}`;
    
    // Check if image is already cached
    if (imageCache.has(imagePath)) {
      const blob = imageCache.get(imagePath);
      const url = URL.createObjectURL(blob);
      createdUrl = url;
      if (isMounted) {
        setImageUrl(url);
      }
      return () => {
        if (createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      };
    }

    // Use the global cache to fetch and cache the image
    imageCache.fetchAndCache(
      imagePath,
      () => imageAPI.getPreview(imagePath).then(response => response.data)
    )
      .then(blob => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          createdUrl = url;
          setImageUrl(url);
        }
      })
      .catch(error => {
        console.error('Failed to load image:', error);
      });
    
    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [dataset, path]);

  return (
    <img
      src={imageUrl || ''}
      alt="preview"
      style={{ width: 80, height: 80, objectFit: 'cover' }}
    />
  );
}

function InferenceResultViewer({ dataset, config }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dataset) {
      loadFiles();
    }
  }, [dataset]);

  const loadFiles = async () => {
    try {
      const response = await inferenceAPI.listFiles(dataset);
      setFiles(response.data.files || []);
      if (response.data.files?.length > 0) {
        setSelectedFile(response.data.files[0]);
        loadResults(response.data.files[0]);
      }
    } catch (error) {
      message.error('Failed to load inference files');
    }
  };

  const loadResults = async (filename) => {
    setLoading(true);
    try {
      const response = await inferenceAPI.getResult(dataset, filename);
      setResults(response.data.results || []);
    } catch (error) {
      message.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (filename) => {
    setSelectedFile(filename);
    loadResults(filename);
  };

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'image_path',
      key: 'preview',
      width: 120,
      render: (path) => (
        <ImagePreview dataset={dataset} path={path} />
      ),
    },
    {
      title: 'Path',
      dataIndex: 'image_path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>Select Inference File:</span>
        <Select
          value={selectedFile}
          onChange={handleFileChange}
          style={{ width: 300 }}
          options={files.map(f => ({ label: f, value: f }))}
        />
      </Space>

      <Table
        rowKey="image_path"
        columns={columns}
        dataSource={results}
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}

export default InferenceResultViewer;
