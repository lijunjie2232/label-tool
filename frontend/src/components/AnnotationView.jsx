import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  Stack,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack as PreviousIcon,
  ArrowForward as NextIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import ImageViewer from './ImageViewer';
import { imageAPI, annotationAPI } from '../services/api';
import imageCache from '../utils/imageCache';
import useToast from '../hooks/useToast';
import Toast from './Toast';
import NumberField from './NumberField';

function AnnotationView({ dataset, config, initialImagePath, onBack }) {
  const { success, error, info, toastOpen, toastMessage, toastSeverity, hideToast } = useToast();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(null);
  const [sortBy, setSortBy] = useState('file_name');
  const [hideAnnotated, setHideAnnotated] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (dataset) {
      loadImages();
    }
  }, [dataset, sortBy, initialImagePath]);

  useEffect(() => {
    // Filter images based on hideAnnotated setting
    if (hideAnnotated) {
      const filtered = images.filter(img => !img.is_annotated);
      setFilteredImages(filtered);
      // Adjust current index if needed
      if (currentIndex >= filtered.length && filtered.length > 0) {
        setCurrentIndex(filtered.length - 1);
      } else if (filtered.length === 0) {
        setCurrentIndex(0);
      }
    } else {
      setFilteredImages(images);
    }
  }, [images, hideAnnotated]);

  useEffect(() => {
    if (filteredImages.length > 0 && currentIndex < filteredImages.length) {
      setScore(filteredImages[currentIndex].score);
      // 自动聚焦到输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [currentIndex, filteredImages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
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
          handleSubmit();
          e.preventDefault();
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
      let targetIndex = 0;
      if (initialImagePath && loadedImages.length > 0) {
        const initialIndex = loadedImages.findIndex(img => img.relative_path === initialImagePath);
        if (initialIndex !== -1) {
          targetIndex = initialIndex;
        }
      }
      
      // Apply filtering after loading
      if (hideAnnotated) {
        const filtered = loadedImages.filter(img => !img.is_annotated);
        setFilteredImages(filtered);
        // Find the target image in filtered list
        if (initialImagePath && filtered.length > 0) {
          const filteredIndex = filtered.findIndex(img => img.relative_path === initialImagePath);
          setCurrentIndex(filteredIndex !== -1 ? filteredIndex : 0);
        } else {
          setCurrentIndex(0);
        }
      } else {
        setFilteredImages(loadedImages);
        setCurrentIndex(targetIndex);
      }
    } catch (error) {
      message.error('Failed to load images');
    }
  };

  const handleSubmit = async () => {
    // Skip if score is null, undefined, or out of bounds
    if (score === null || score === undefined) {
      info('Skipped - no score entered');
      handleNext();
      return;
    }

    if (score < config.min_score || score > config.max_score) {
      info(`Skipped - score ${score} is out of range (${config.min_score}-${config.max_score})`);
      handleNext();
      return;
    }

    try {
      await annotationAPI.add(dataset, {
        image_path: filteredImages[currentIndex].relative_path,
        score: score
      });
      success('Annotation saved');
      
      // If hiding annotated images, we need to reload or refilter
      if (hideAnnotated) {
        // Update the current image's annotation status
        const updatedImages = images.map(img => 
          img.relative_path === filteredImages[currentIndex].relative_path 
            ? { ...img, is_annotated: true, score: score }
            : img
        );
        setImages(updatedImages);
        
        // Remove current image from filtered list and move to next
        const newFiltered = updatedImages.filter(img => !img.is_annotated);
        setFilteredImages(newFiltered);
        
        // Stay at same index (which is now the next unannotated image)
        if (newFiltered.length === 0) {
          info('All images have been annotated!');
        } else if (currentIndex >= newFiltered.length) {
          setCurrentIndex(Math.max(0, newFiltered.length - 1));
        }
      } else {
        handleNext();
      }
    } catch (error) {
      error('Failed to save annotation');
    }
  };

  const handleRefresh = async () => {
    try {
      const imagePath = currentImage.absolute_path;
      
      // Clear the current image blob URL
      if (currentImage && blobUrlsRef.current[imagePath]) {
        URL.revokeObjectURL(blobUrlsRef.current[imagePath]);
        delete blobUrlsRef.current[imagePath];
        
        setImageBlobUrls(prev => {
          const updated = { ...prev };
          delete updated[imagePath];
          return updated;
        });
      }
      
      // Reload the current image (bypass cache)
      const response = await imageAPI.getPreview(imagePath);
      const url = URL.createObjectURL(response.data);
      
      blobUrlsRef.current[imagePath] = url;
      setImageBlobUrls(prev => ({
        ...prev,
        [imagePath]: url
      }));
      
      success('Image refreshed');
    } catch (error) {
      error('Failed to refresh image');
      console.error('Failed to refresh image:', error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      info('Already at first image');
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      info('Already at last image');
    }
  };

  const handleAddStep = () => {
    const newScore = Math.min((score || config.min_score) + config.score_step, config.max_score);
    setScore(newScore);
  };

  const handleSubStep = () => {
    const newScore = Math.max((score || config.min_score) - config.score_step, config.min_score);
    setScore(newScore);
  };

  const [imageBlobUrls, setImageBlobUrls] = useState({});
  const blobUrlsRef = useRef({});

  useEffect(() => {
    if (filteredImages.length === 0) return;

    // Determine which images to load: current, previous, and next
    const indicesToKeep = new Set();
    indicesToKeep.add(currentIndex);
    if (currentIndex > 0) indicesToKeep.add(currentIndex - 1);
    if (currentIndex < filteredImages.length - 1) indicesToKeep.add(currentIndex + 1);

    const pathsToKeep = new Set();
    indicesToKeep.forEach(index => {
      pathsToKeep.add(filteredImages[index].absolute_path);
    });

    // Filter out images that are already loaded
    const imagesToLoad = [];
    indicesToKeep.forEach(index => {
      const imagePath = filteredImages[index].absolute_path;
      if (!blobUrlsRef.current[imagePath]) {
        imagesToLoad.push({ index, image: filteredImages[index] });
      }
    });

    // Cleanup URLs not in sliding window to prevent memory leaks
    const currentPaths = Object.keys(blobUrlsRef.current);
    currentPaths.forEach(path => {
      if (!pathsToKeep.has(path)) {
        URL.revokeObjectURL(blobUrlsRef.current[path]);
        delete blobUrlsRef.current[path];
      }
    });

    // If there are no new images to load, just update the state with current sliding window
    if (imagesToLoad.length === 0) {
      setImageBlobUrls({ ...blobUrlsRef.current });
      return;
    }

    let isMounted = true;

    // Load images using the global cache
    Promise.all(
      imagesToLoad.map(async ({ index, image }) => {
        try {
          // Use the global cache to fetch and cache the image
          const blob = await imageCache.fetchAndCache(
            image.absolute_path,
            () => imageAPI.getPreview(image.absolute_path).then(response => response.data)
          );
          
          // Create object URL for display
          const url = URL.createObjectURL(blob);
          return { path: image.absolute_path, url, index };
        } catch (error) {
          console.error(`Failed to load image ${image.absolute_path}:`, error);
          return null;
        }
      })
    ).then(results => {
      if (isMounted) {
        results.forEach(result => {
          if (result) {
            blobUrlsRef.current[result.path] = result.url;
          }
        });
        setImageBlobUrls({ ...blobUrlsRef.current });
      } else {
        // If component unmounted while loading, revoke these URLs
        results.forEach(result => {
          if (result) URL.revokeObjectURL(result.url);
        });
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [currentIndex, filteredImages]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  if (filteredImages.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          {hideAnnotated ? 'No unannotated images available' : 'No images to annotate'}
        </Alert>
      </Box>
    );
  }

  const currentImage = filteredImages[currentIndex];
  const imageUrl = currentImage ? (imageBlobUrls[currentImage.absolute_path] || null) : null;
  const annotatedCount = images.filter(img => img.is_annotated).length;
  const completionRate = images.length > 0 ? ((annotatedCount / images.length) * 100).toFixed(1) : 0;

  return (
    <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 140px)' }}>
      {/* Left side - Image Viewer */}
      <Paper sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <ImageViewer imageUrl={imageUrl} />
      </Paper>

      {/* Right side - Control Panel */}
      <Paper sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
        {/* Current Image Info */}
        <Box>
          <Typography variant="h6" gutterBottom>Current Image</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#666', mb: 2 }}>
            {currentImage.relative_path}
          </Typography>
          
          {/* Progress Information */}
          <Box sx={{ 
            p: 2, 
            background: '#f5f5f5', 
            borderRadius: 1,
          }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Progress:</strong> {currentIndex + 1} / {images.length}
                {hideAnnotated && (
                  <Chip 
                    label="viewing unannotated only" 
                    size="small" 
                    sx={{ ml: 1, backgroundColor: '#e3f2fd', color: '#1976d2' }}
                  />
                )}
              </Typography>
            </Box>
            
            {/* Progress Bar */}
            <LinearProgress 
              variant="determinate" 
              value={parseFloat(completionRate)}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                mb: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
                }
              }}
            />
            
            {/* Detailed Statistics */}
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Total Images:</Typography>
                <Typography variant="caption" fontWeight="bold">{images.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Annotated:</Typography>
                <Typography variant="caption" fontWeight="bold" color="success.main">
                  {annotatedCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Remaining:</Typography>
                <Typography variant="caption" fontWeight="bold" color="warning.main">
                  {images.length - annotatedCount}
                </Typography>
              </Box>
              {hideAnnotated && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  pt: 1, 
                  borderTop: '1px solid #ddd'
                }}>
                  <Typography variant="caption">Completion Rate:</Typography>
                  <Typography variant="caption" fontWeight="bold" color="primary">
                    {completionRate}%
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Score Input */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Score Annotation
          </Typography>
          <Stack spacing={2}>
            <NumberField
              inputRef={inputRef}
              value={score}
              onChange={setScore}
              min={config.min_score}
              max={config.max_score}
              step={config.score_step}
              size="large"
            />
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              fullWidth 
              size="large"
              sx={{ py: 1.5 }}
            >
              Submit (Enter)
            </Button>
          </Stack>
        </Box>

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={1}>
          <Button 
            startIcon={<PreviousIcon />} 
            onClick={handlePrevious}
            variant="outlined"
          >
            Previous
          </Button>
          <Button 
            endIcon={<NextIcon />} 
            onClick={handleNext}
            variant="outlined"
          >
            Next
          </Button>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            variant="outlined"
          >
            Refresh
          </Button>
        </Stack>

        {/* Settings */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Settings
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="file_name">File Name</MenuItem>
                <MenuItem value="random">Random</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch 
                  checked={hideAnnotated} 
                  onChange={(e) => setHideAnnotated(e.target.checked)}
                />
              }
              label="Hide annotated images"
            />
          </Stack>
        </Box>

        {/* Back Button */}
        <Box sx={{ mt: 'auto' }}>
          <Button onClick={onBack} fullWidth variant="outlined">
            Back to Image List
          </Button>
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

export default AnnotationView;
