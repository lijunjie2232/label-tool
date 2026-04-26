import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Container,
  Chip,
  IconButton,
  Button,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Clear as ClearIcon,
  Dataset as DatasetIcon,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Analytics as AnalyticsIcon,
  MergeType as MergeIcon,
} from '@mui/icons-material';
import DatasetList from './components/DatasetList';
import ImageList from './components/ImageList';
import AnnotationView from './components/AnnotationView';
import InferenceResultViewer from './components/InferenceResultViewer';
import ResultMerger from './components/ResultMerger';
import DatasetConfigEditor from './components/DatasetConfigEditor';
import imageCacheManager from './utils/imageCacheManager';

const drawerWidth = 240;

function App() {
  const [currentView, setCurrentView] = useState('dataset');
  const [currentDataset, setCurrentDataset] = useState(null);
  const [datasetConfig, setDatasetConfig] = useState(null);
  const [annotationStartImage, setAnnotationStartImage] = useState(null);
  const [cacheStats, setCacheStats] = useState({ size: 0, maxSize: 100, loading: 0 });

  useEffect(() => {
    // Update cache stats periodically
    const interval = setInterval(() => {
      setCacheStats(imageCacheManager.getStats());
    }, 2000);
    
    // Initial update
    setCacheStats(imageCacheManager.getStats());
    
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    imageCacheManager.clear();
    setCacheStats(imageCacheManager.getStats());
  };

  const handleDatasetSelect = (dataset, config, editMode = false) => {
    setCurrentDataset(dataset);
    setDatasetConfig(config);
    setCurrentView(editMode ? 'config' : 'images');
  };

  const handleConfigSave = (updatedConfig) => {
    setDatasetConfig(updatedConfig);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dataset':
        return <DatasetList onDatasetSelect={handleDatasetSelect} />;
      case 'images':
        return (
          <ImageList
            dataset={currentDataset}
            config={datasetConfig}
            onAnnotateClick={(imagePath) => {
              setAnnotationStartImage(imagePath);
              setCurrentView('annotate');
            }}
          />
        );
      case 'annotate':
        return (
          <AnnotationView
            dataset={currentDataset}
            config={datasetConfig}
            initialImagePath={annotationStartImage}
            onBack={() => {
              setAnnotationStartImage(null);
              setCurrentView('images');
            }}
          />
        );
      case 'inference':
        return <InferenceResultViewer dataset={currentDataset} config={datasetConfig} />;
      case 'merge':
        return <ResultMerger dataset={currentDataset} config={datasetConfig} />;
      case 'config':
        return (
          <DatasetConfigEditor 
            dataset={currentDataset} 
            config={datasetConfig} 
            onSave={handleConfigSave}
            onCancel={() => setCurrentView('images')}
          />
        );
      default:
        return <DatasetList onDatasetSelect={handleDatasetSelect} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Image Label Tool
          </Typography>
          {currentDataset && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`Cache: ${cacheStats.size}/${cacheStats.maxSize}`}
                size="small"
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Badge badgeContent={cacheStats.loading} color="secondary">
                <IconButton size="small" onClick={handleClearCache} sx={{ color: 'white' }}>
                  <ClearIcon />
                </IconButton>
              </Badge>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1a1a2e',
            color: 'white',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {[
              { key: 'dataset', label: 'Dataset List', icon: <DatasetIcon /> },
              { key: 'config', label: 'Dataset Config', icon: <SettingsIcon />, disabled: !currentDataset },
              { key: 'images', label: 'Image List', icon: <ImageIcon />, disabled: !currentDataset },
              { key: 'annotate', label: 'Annotating View', icon: <EditIcon />, disabled: !currentDataset },
              { key: 'inference', label: 'Inference Results', icon: <AnalyticsIcon />, disabled: !currentDataset },
              { key: 'merge', label: 'Merge Results', icon: <MergeIcon />, disabled: !currentDataset },
            ].map((item) => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={currentView === item.key}
                  disabled={item.disabled}
                  onClick={() => setCurrentView(item.key)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.5)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ mr: 2, color: currentView === item.key ? '#667eea' : 'inherit' }}>
                    {item.icon}
                  </Box>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: currentView === item.key ? 'bold' : 'normal',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Container maxWidth="xl">
          {currentDataset && (
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#666' }}>
              Dataset: <strong>{currentDataset}</strong>
            </Typography>
          )}
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
}

export default App;
