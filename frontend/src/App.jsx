import { useState } from 'react';
import { Layout, Menu } from 'antd';
import DatasetList from './components/DatasetList';
import ImageList from './components/ImageList';
import AnnotationView from './components/AnnotationView';
import InferenceResultViewer from './components/InferenceResultViewer';
import ResultMerger from './components/ResultMerger';
import DatasetConfigEditor from './components/DatasetConfigEditor';
import 'antd/dist/reset.css';

const { Header, Sider, Content } = Layout;

function App() {
  const [currentView, setCurrentView] = useState('dataset');
  const [currentDataset, setCurrentDataset] = useState(null);
  const [datasetConfig, setDatasetConfig] = useState(null);
  const [annotationStartImage, setAnnotationStartImage] = useState(null);

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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ padding: '16px', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          Image Label Tool
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentView]}
          items={[
            { key: 'dataset', label: 'Dataset List' },
            { key: 'config', label: 'Dataset Config', disabled: !currentDataset },
            { key: 'images', label: 'Image List', disabled: !currentDataset },
            { key: 'annotate', label: 'Annotating View', disabled: !currentDataset },
            { key: 'inference', label: 'Inference Results', disabled: !currentDataset },
            { key: 'merge', label: 'Merge Results', disabled: !currentDataset },
          ]}
          onClick={({ key }) => setCurrentView(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>
            {currentDataset ? `Dataset: ${currentDataset}` : 'No Dataset Selected'}
          </span>
        </Header>
        <Content style={{ margin: '16px', padding: '16px', background: '#fff', minHeight: 'calc(100vh - 112px)' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
