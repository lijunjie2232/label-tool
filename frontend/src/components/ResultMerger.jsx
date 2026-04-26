import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Stack,
  Typography,
  Paper,
  TextField,
} from '@mui/material';
import { inferenceAPI, annotationAPI, imageAPI } from '../services/api';
import imageCache from '../utils/imageCache';
import useToast from '../hooks/useToast';
import Toast from './Toast';

function ResultMerger({ dataset, config }) {
  const { success, error, warning, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
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
      error('Failed to load inference files');
    }
  };

  const handleFileChange = async (filename) => {
    setSelectedFile(filename);
    try {
      const response = await inferenceAPI.getResult(dataset, filename);
      setResults(response.data.results || []);
      setCurrentIndex(0);
    } catch (error) {
      error('Failed to load results');
    }
  };

  const handleSubmit = async () => {
    if (score === null || score === undefined) {
      warning('Please enter a score');
      return;
    }

    try {
      await annotationAPI.add(dataset, {
        image_path: results[currentIndex].image_path,
        score: score
      });
      success('Annotation saved');
      
      // 更新本地结果
      const updatedResults = [...results];
      updatedResults[currentIndex].score = score;
      setResults(updatedResults);
      
      // 自动跳到下一个
      if (currentIndex < results.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      error('Failed to save annotation');
    }
  };

  const handleMergeAll = async () => {
    if (!selectedFile) {
      warning('Please select a file first');
      return;
    }

    try {
      const response = await inferenceAPI.merge(dataset, selectedFile);
      success(`Merged ${response.data.count} annotations`);
    } catch (error) {
      error('Failed to merge results');
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
      <Box>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight="bold">
              Merge Inference Results
            </Typography>
            <FormControl sx={{ minWidth: 300 }} size="small">
              <InputLabel>Select Inference File</InputLabel>
              <Select
                value={selectedFile || ''}
                label="Select Inference File"
                onChange={(e) => handleFileChange(e.target.value)}
              >
                {files.map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography color="text.secondary">
              No results loaded. Please select an inference file.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const currentResult = results[currentIndex];
  const imageUrl = currentImageUrl || '';

  return (
    <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
      {/* Left side - Image */}
      <Paper sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src={imageUrl}
          alt="Current"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </Paper>

      {/* Right side - Control Panel */}
      <Paper sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Merge Inference Results
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            File: <strong>{selectedFile}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progress: {currentIndex + 1} / {results.length}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ wordBreak: 'break-all', display: 'block', mt: 1, color: '#666' }}
          >
            {currentResult.image_path}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Inferred Score
          </Typography>
          <TextField
            type="number"
            value={score || ''}
            onChange={(e) => setScore(e.target.value === '' ? null : Number(e.target.value))}
            inputProps={{
              min: config.min_score,
              max: config.max_score,
              step: config.score_step,
            }}
            fullWidth
            size="large"
            variant="outlined"
          />
        </Box>

        <Stack spacing={2}>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            fullWidth
            size="large"
          >
            Submit & Next
          </Button>
          <Stack direction="row" spacing={1}>
            <Button 
              onClick={handlePrevious} 
              disabled={currentIndex === 0}
              fullWidth
            >
              Previous
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={currentIndex === results.length - 1}
              fullWidth
            >
              Next
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ mt: 'auto' }}>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleMergeAll} 
            fullWidth
            size="large"
          >
            Merge All to Annotations
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Warning: This will overwrite existing annotations
          </Typography>
        </Box>
      </Paper>

      {/* Toast Notification */}
      <Toast 
        open={toastOpen} 
        message={toastMessage} 
        severity={toastSeverity} 
        onClose={hideToast} 
      />
    </Box>
  );
}

export default ResultMerger;
