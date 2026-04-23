import { useState, useEffect } from 'react';
import { Select, Button, Space, message, InputNumber } from 'antd';
import { inferenceAPI, annotationAPI, imageAPI } from '../services/api';
import imageCache from '../utils/imageCache';

function ResultMerger({ dataset, config }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (dataset) {
      loadFiles();
    }
  }, [dataset]);

  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    if (results.length > 0 && currentIndex < results.length) {
      setScore(results[currentIndex].score);
      
      // Construct full image path
      const imagePath = `${dataset}/${results[currentIndex].image_path}`;
      
      // Check if image is already cached
      if (imageCache.has(imagePath)) {
        const blob = imageCache.get(imagePath);
        const url = URL.createObjectURL(blob);
        createdUrl = url;
        if (isMounted) {
          setCurrentImageUrl(url);
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
            setCurrentImageUrl(url);
          }
        })
        .catch(error => {
          console.error('Failed to load image:', error);
        });
    }
    
    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [currentIndex, results, dataset]);

  const loadFiles = async () => {
    try {
      const response = await inferenceAPI.listFiles(dataset);
      setFiles(response.data.files || []);
    } catch (error) {
      message.error('Failed to load inference files');
    }
  };

  const handleFileChange = async (filename) => {
    setSelectedFile(filename);
    try {
      const response = await inferenceAPI.getResult(dataset, filename);
      setResults(response.data.results || []);
      setCurrentIndex(0);
    } catch (error) {
      message.error('Failed to load results');
    }
  };

  const handleSubmit = async () => {
    if (score === null || score === undefined) {
      message.warning('Please enter a score');
      return;
    }

    try {
      await annotationAPI.add(dataset, {
        image_path: results[currentIndex].image_path,
        score: score
      });
      message.success('Annotation saved');
      
      // 更新本地结果
      const updatedResults = [...results];
      updatedResults[currentIndex].score = score;
      setResults(updatedResults);
      
      // 自动跳到下一个
      if (currentIndex < results.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      message.error('Failed to save annotation');
    }
  };

  const handleMergeAll = async () => {
    if (!selectedFile) {
      message.warning('Please select a file first');
      return;
    }

    try {
      const response = await inferenceAPI.merge(dataset, selectedFile);
      message.success(`Merged ${response.data.count} annotations`);
    } catch (error) {
      message.error('Failed to merge results');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (results.length === 0) {
    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <span>Select Inference File:</span>
          <Select
            value={selectedFile}
            onChange={handleFileChange}
            style={{ width: 300 }}
            options={files.map(f => ({ label: f, value: f }))}
            placeholder="Select a file"
          />
        </Space>
        <p>No results loaded. Please select an inference file.</p>
      </div>
    );
  }

  const currentResult = results[currentIndex];
  const imageUrl = currentImageUrl || '';

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)' }}>
      {/* 左侧图像 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <img
          src={imageUrl}
          alt="Current"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>

      {/* 右侧控制面板 */}
      <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3>Merge Inference Results</h3>
          <p>File: {selectedFile}</p>
          <p>Progress: {currentIndex + 1} / {results.length}</p>
          <p style={{ wordBreak: 'break-all', fontSize: 12 }}>
            {currentResult.image_path}
          </p>
        </div>

        <div>
          <h4>Inferred Score</h4>
          <InputNumber
            value={score}
            onChange={setScore}
            min={config.min_score}
            max={config.max_score}
            step={config.score_step}
            style={{ width: '100%' }}
            size="large"
          />
        </div>

        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button type="primary" onClick={handleSubmit} block>
            Submit & Next
          </Button>
          <Space>
            <Button onClick={handlePrevious} disabled={currentIndex === 0}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={currentIndex === results.length - 1}>
              Next
            </Button>
          </Space>
        </Space>

        <div style={{ marginTop: 'auto' }}>
          <Button type="primary" onClick={handleMergeAll} block danger>
            Merge All to Annotations
          </Button>
          <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            Warning: This will overwrite existing annotations
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResultMerger;
