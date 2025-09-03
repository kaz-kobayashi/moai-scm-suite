import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';

interface ApiKeySettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: ApiSettings) => void;
  currentSettings: ApiSettings;
}

export interface ApiSettings {
  provider: 'ollama' | 'gemini';
  geminiApiKey?: string;
  ollamaModel: string;
  ollamaUrl: string;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  open,
  onClose,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<ApiSettings>(currentSettings);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const validateSettings = (): boolean => {
    const newErrors: string[] = [];

    if (settings.provider === 'gemini' && !settings.geminiApiKey?.trim()) {
      newErrors.push('Gemini API キーが必要です');
    }

    if (settings.provider === 'ollama') {
      if (!settings.ollamaUrl?.trim()) {
        newErrors.push('Ollama URLが必要です');
      }
      if (!settings.ollamaModel?.trim()) {
        newErrors.push('Ollamaモデル名が必要です');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (validateSettings()) {
      onSave(settings);
      onClose();
    }
  };

  const handleProviderChange = (provider: 'ollama' | 'gemini') => {
    setSettings(prev => ({
      ...prev,
      provider
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI設定</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {errors.length > 0 && (
            <Alert severity="error">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>AIプロバイダー</InputLabel>
            <Select
              value={settings.provider}
              onChange={(e) => handleProviderChange(e.target.value as 'ollama' | 'gemini')}
              label="AIプロバイダー"
            >
              <MenuItem value="ollama">Ollama (ローカル)</MenuItem>
              <MenuItem value="gemini">Google Gemini</MenuItem>
            </Select>
          </FormControl>

          {settings.provider === 'gemini' && (
            <Box>
              <TextField
                fullWidth
                label="Gemini API Key"
                type="password"
                value={settings.geminiApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="AIzaSy..."
                helperText="Google AI Studio (https://aistudio.google.com) で取得できます"
              />
            </Box>
          )}

          {settings.provider === 'ollama' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Ollama URL"
                value={settings.ollamaUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                placeholder="http://localhost:11434"
                helperText="Ollamaサーバーが起動している必要があります"
              />
              <TextField
                fullWidth
                label="モデル名"
                value={settings.ollamaModel}
                onChange={(e) => setSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                placeholder="phi4:latest"
                helperText="利用可能なモデル名を入力してください"
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            設定は브라ウザのローカルストレージに保存されます。
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApiKeySettings;