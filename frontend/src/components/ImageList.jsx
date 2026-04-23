import { useState, useEffect } from 'react';
import { Table, Button, InputNumber, Space, message, Dropdown, Select, Radio, Input, Switch } from 'antd';
import { MinusOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons';
import { imageAPI, annotationAPI } from '../services/api';
import imageCache from '../utils/imageCache';

// 图片预览组件，使用 POST 请求获取图片
function ImagePreview({ path, onAnnotateClick }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    // Check if image is already cached
    if (imageCache.has(path)) {
      const blob = imageCache.get(path);
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
      path,
      () => imageAPI.getPreview(path).then(response => response.data)
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
  }, [path]);

  return (
    <img
      src={imageUrl}
      alt="preview"
      style={{ width: 80, height: 80, objectFit: 'cover', cursor: 'pointer' }}
      onClick={() => onAnnotateClick(path)}
    />
  );
}

function ImageList({ dataset, config, onAnnotateClick }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subDir, setSubDir] = useState('');
  const [sortBy, setSortBy] = useState('file_name');
  const [annotatedOnTop, setAnnotatedOnTop] = useState(config?.annotated_on_top || 'top');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [recursive, setRecursive] = useState(true);

  useEffect(() => {
    if (dataset) {
      loadImages();
    }
  }, [dataset, subDir, sortBy, annotatedOnTop, recursive]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await imageAPI.getList(dataset, {
        sub_dir: subDir,
        sort_by: sortBy,
        annotated_on_top: annotatedOnTop,
        recursive: recursive
      });
      setImages(response.data.images || []);
    } catch (error) {
      message.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = async (record, newScore) => {
    try {
      await annotationAPI.add(dataset, {
        image_path: record.relative_path,
        score: newScore
      });
      message.success('Score updated');
      loadImages();
    } catch (error) {
      message.error('Failed to update score');
    }
  };

  const handleDelete = async (record) => {
    try {
      await imageAPI.delete(record.absolute_path);
      message.success('Image marked as deleted');
      loadImages();
    } catch (error) {
      message.error('Failed to delete image');
    }
  };

  const handleClear = async (record) => {
    try {
      await annotationAPI.remove(dataset, record.relative_path);
      message.success('Annotation cleared');
      loadImages();
    } catch (error) {
      message.error('Failed to clear annotation');
    }
  };

  const handleBatchOperation = async (operation, value = null) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select images first');
      return;
    }

    try {
      const selectedImages = images.filter(img => selectedRowKeys.includes(img.relative_path));
      
      switch (operation) {
        case 'delete':
          for (const img of selectedImages) {
            await imageAPI.delete(img.absolute_path);
          }
          message.success(`Marked ${selectedImages.length} images as deleted`);
          break;
        
        case 'clear':
          await annotationAPI.clear(dataset, selectedImages.map(img => img.relative_path));
          message.success(`Cleared ${selectedImages.length} annotations`);
          break;
        
        case 'set_score':
          for (const img of selectedImages) {
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: value
            });
          }
          message.success(`Set score for ${selectedImages.length} images`);
          break;
        
        case 'add_score':
          for (const img of selectedImages) {
            const newScore = Math.min((img.score || 0) + config.score_step, config.max_score);
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: newScore
            });
          }
          message.success(`Added score for ${selectedImages.length} images`);
          break;
        
        case 'sub_score':
          for (const img of selectedImages) {
            const newScore = Math.max((img.score || 0) - config.score_step, config.min_score);
            await annotationAPI.add(dataset, {
              image_path: img.relative_path,
              score: newScore
            });
          }
          message.success(`Subtracted score for ${selectedImages.length} images`);
          break;
      }
      
      setSelectedRowKeys([]);
      loadImages();
    } catch (error) {
      message.error('Batch operation failed');
    }
  };

  const batchMenuItems = [
    { key: 'delete', label: 'Delete Selected' },
    { key: 'clear', label: 'Clear Annotations' },
    { key: 'set_score', label: 'Set Score to...' },
    { key: 'add_score', label: 'Add Score Step' },
    { key: 'sub_score', label: 'Subtract Score Step' },
  ];

  const handleBatchMenuClick = ({ key }) => {
    if (key === 'set_score') {
      const value = prompt('Enter score value:');
      if (value !== null) {
        handleBatchOperation(key, parseFloat(value));
      }
    } else {
      handleBatchOperation(key);
    }
  };

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'absolute_path',
      key: 'preview',
      width: 120,
      render: (_, record) => (
        <ImagePreview path={record.absolute_path} onAnnotateClick={() => onAnnotateClick(record.relative_path)} />
      ),
    },
    {
      title: 'Path',
      dataIndex: 'relative_path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: 'Size',
      key: 'size',
      width: 100,
      render: (_, record) => `${record.width}x${record.height}`,
    },
    {
      title: 'Score',
      key: 'score',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() => {
              const newScore = Math.max((record.score || 0) - config.score_step, config.min_score);
              handleScoreChange(record, newScore);
            }}
          />
          <InputNumber
            size="small"
            value={record.score}
            min={config.min_score}
            max={config.max_score}
            step={config.score_step}
            onChange={(value) => handleScoreChange(record, value)}
            style={{ width: 80 }}
          />
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              const newScore = Math.min((record.score || 0) + config.score_step, config.max_score);
              handleScoreChange(record, newScore);
            }}
          />
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onAnnotateClick(record.relative_path)}>
            Annotate
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
          <Button size="small" onClick={() => handleClear(record)}>
            Clear
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Sub-directory (optional)"
          value={subDir}
          onChange={(e) => setSubDir(e.target.value)}
          style={{ width: 200 }}
        />
        <Radio.Group value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <Radio.Button value="file_name">File Name</Radio.Button>
          <Radio.Button value="byte_size">File Size</Radio.Button>
        </Radio.Group>
        <Select
          value={annotatedOnTop}
          onChange={setAnnotatedOnTop}
          style={{ width: 150 }}
        >
          <Select.Option value="top">Annotated on Top</Select.Option>
          <Select.Option value="bottom">Annotated on Bottom</Select.Option>
          <Select.Option value="not_set">Not Set</Select.Option>
        </Select>
        <Space>
          <span>Recursive:</span>
          <Switch checked={recursive} onChange={setRecursive} />
        </Space>
        <Dropdown
          menu={{ items: batchMenuItems, onClick: handleBatchMenuClick }}
          disabled={selectedRowKeys.length === 0}
        >
          <Button>
            Batch Operations <DownOutlined />
          </Button>
        </Dropdown>
      </Space>

      <Table
        rowKey="relative_path"
        columns={columns}
        dataSource={images}
        loading={loading}
        rowSelection={rowSelection}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}

export default ImageList;
