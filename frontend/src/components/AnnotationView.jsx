import { useState, useEffect, useRef } from 'react';
import { Button, InputNumber, Space, message, Select } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ImageViewer from './ImageViewer';
import { imageAPI, annotationAPI } from '../services/api';

function AnnotationView({ dataset, config, initialImagePath, onBack }) {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(null);
  const [sortBy, setSortBy] = useState('file_name');
  const inputRef = useRef(null);

  useEffect(() => {
    if (dataset) {
      loadImages();
    }
  }, [dataset, sortBy, initialImagePath]);

  useEffect(() => {
    if (images.length > 0 && currentIndex < images.length) {
      setScore(images[currentIndex].score);
      // 自动聚焦到输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentIndex, images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if focus is on input element
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                             document.activeElement?.className?.includes('ant-input-number-input');

      switch (e.key) {
        case 'PageUp':
        case 'ArrowUp':
          handlePrevious();
          e.preventDefault();
          break;
        case 'PageDown':
        case 'ArrowDown':
          handleNext();
          e.preventDefault();
          break;
        case 'Backspace':
          if (inputRef.current) {
            inputRef.current.focus();
            // Select all text after focus
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.select();
              }
            }, 0);
          }
          e.preventDefault();
          break;
        case '+':
        case '=': // Some keyboard layouts require Shift for '+', while '=' is direct
          handleAddStep();
          e.preventDefault();
          break;
        case '-':
        case '_':
          handleSubStep();
          e.preventDefault();
          break;
        case 'Enter':
          // Only handle Enter if not already in an input that needs it for other purposes
          if (!isInputFocused || document.activeElement === inputRef.current) {
            handleSubmit();
            e.preventDefault();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, score, images]);

  const loadImages = async () => {
    try {
      const response = await imageAPI.getList(dataset, {
        sub_dir: '',
        sort_by: sortBy,
        annotated_on_top: 'not_set',
        recursive: true
      });
      const loadedImages = response.data.images || [];
      setImages(loadedImages);
      
      // If an initial image path is provided, find its index
      if (initialImagePath && loadedImages.length > 0) {
        const initialIndex = loadedImages.findIndex(img => img.relative_path === initialImagePath);
        if (initialIndex !== -1) {
          setCurrentIndex(initialIndex);
        } else {
          setCurrentIndex(0);
        }
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      message.error('Failed to load images');
    }
  };

  const handleSubmit = async () => {
    // Skip if score is null, undefined, or out of bounds
    if (score === null || score === undefined) {
      message.info('Skipped - no score entered');
      handleNext();
      return;
    }

    if (score < config.min_score || score > config.max_score) {
      message.info(`Skipped - score ${score} is out of range (${config.min_score}-${config.max_score})`);
      handleNext();
      return;
    }

    try {
      await annotationAPI.add(dataset, {
        image_path: images[currentIndex].relative_path,
        score: score
      });
      message.success('Annotation saved');
      handleNext();
    } catch (error) {
      message.error('Failed to save annotation');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      message.info('Already at first image');
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      message.info('Already at last image');
    }
  };

  const handleAddStep = () => {
    const newScore = Math.min((score || 0) + config.score_step, config.max_score);
    setScore(newScore);
  };

  const handleSubStep = () => {
    const newScore = Math.max((score || 0) - config.score_step, config.min_score);
    setScore(newScore);
  };

  // Handle keyboard events specifically for the score input
  const handleInputKeyDown = (e) => {
    switch (e.key) {
      case 'PageUp':
      case 'ArrowUp':
        handlePrevious();
        e.preventDefault();
        break;
      case 'PageDown':
      case 'ArrowDown':
        handleNext();
        e.preventDefault();
        break;
      case 'Backspace':
        // Select all text when Backspace is pressed
        if (inputRef.current?.input) {
          inputRef.current.input.select();
        }
        e.preventDefault();
        break;
      case '+':
      case '=':
        handleAddStep();
        e.preventDefault();
        break;
      case '-':
      case '_':
        handleSubStep();
        e.preventDefault();
        break;
      case 'Enter':
        handleSubmit();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const [imageBlobUrls, setImageBlobUrls] = useState({});

  useEffect(() => {
    if (images.length === 0) return;

    // 确定需要加载的图片索引：当前、前一张、后一张
    const indicesToLoad = new Set();
    indicesToLoad.add(currentIndex);
    if (currentIndex > 0) indicesToLoad.add(currentIndex - 1);
    if (currentIndex < images.length - 1) indicesToLoad.add(currentIndex + 1);

    // 过滤出尚未加载的图片
    const imagesToLoad = [];
    indicesToLoad.forEach(index => {
      if (!imageBlobUrls[images[index].absolute_path]) {
        imagesToLoad.push({ index, image: images[index] });
      }
    });

    if (imagesToLoad.length === 0) return;

    // 并行加载所有需要的图片
    Promise.all(
      imagesToLoad.map(({ index, image }) => 
        imageAPI.getPreview(image.absolute_path)
          .then(response => {
            const url = URL.createObjectURL(response.data);
            return { path: image.absolute_path, url, index };
          })
          .catch(error => {
            console.error(`Failed to load image ${image.absolute_path}:`, error);
            return null;
          })
      )
    ).then(results => {
      setImageBlobUrls(prev => {
        const updated = { ...prev };
        results.forEach(result => {
          if (result) {
            updated[result.path] = result.url;
          }
        });
        return updated;
      });
    });
    
    return () => {
      // 清理不在视野范围内的图片 URL
      const visiblePaths = new Set();
      for (let i = Math.max(0, currentIndex - 1); i <= Math.min(images.length - 1, currentIndex + 1); i++) {
        visiblePaths.add(images[i].absolute_path);
      }
      
      Object.keys(imageBlobUrls).forEach(path => {
        if (!visiblePaths.has(path)) {
          URL.revokeObjectURL(imageBlobUrls[path]);
          delete imageBlobUrls[path];
        }
      });
    };
  }, [currentIndex, images]);

  if (images.length === 0) {
    return <div>No images to annotate</div>;
  }

  const currentImage = images[currentIndex];
  const imageUrl = currentImage ? (imageBlobUrls[currentImage.absolute_path] || '') : '';

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)' }}>
      {/* 左侧图像查看器 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <ImageViewer imageUrl={imageUrl} />
      </div>

      {/* 右侧控制面板 */}
      <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3>Current Image</h3>
          <p style={{ fontSize: 12, wordBreak: 'break-all' }}>{currentImage.relative_path}</p>
          <p>Progress: {currentIndex + 1} / {images.length}</p>
        </div>

        <div>
          <h4>Score Annotation</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            <InputNumber
              ref={inputRef}
              value={score}
              onChange={setScore}
              onKeyDown={handleInputKeyDown}
              min={config.min_score}
              max={config.max_score}
              step={config.score_step}
              style={{ width: '100%' }}
              size="large"
            />
            <Button type="primary" onClick={handleSubmit} block size="large">
              Submit (Enter)
            </Button>
          </Space>
        </div>

        <Space>
          <Button icon={<LeftOutlined />} onClick={handlePrevious}>
            Previous (↑)
          </Button>
          <Button icon={<RightOutlined />} onClick={handleNext}>
            Next (↓)
          </Button>
        </Space>

        <div>
          <h4>Settings</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span>Sort by: </span>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120 }}
                size="small"
              >
                <Select.Option value="file_name">File Name</Select.Option>
                <Select.Option value="random">Random</Select.Option>
              </Select>
            </div>
          </Space>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button onClick={onBack} block>
            Back to Image List
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AnnotationView;
