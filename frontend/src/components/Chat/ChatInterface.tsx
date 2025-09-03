import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconButton } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import './ChatInterface.css';
import './ResultDisplay.css';
import ResultDisplay from './ResultDisplay';
import ApiKeySettings, { ApiSettings } from './ApiKeySettings';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments: any;
    result?: any;
  };
}

interface ChatInterfaceProps {
  onFunctionCall?: (functionName: string, args: any) => Promise<any>;
}

interface AnalysisFunction {
  name: string;
  endpoint: string;
  defaultParams: any;
  description: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onFunctionCall }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('scmopt-api-settings');
    return saved ? JSON.parse(saved) : {
      provider: 'ollama',
      ollamaModel: 'phi4:latest',
      ollamaUrl: 'http://localhost:11434'
    };
  });
  
  // 利用可能な解析機能の定義
  const availableFunctions: AnalysisFunction[] = [
    {
      name: 'abc_analysis',
      endpoint: '/api/v1/abc/analysis',
      defaultParams: {
        demand_data: [
          { date: '2023-01-01', cust: 'CustomerA', prod: 'ProductX', demand: 100 },
          { date: '2023-01-02', cust: 'CustomerB', prod: 'ProductY', demand: 200 },
          { date: '2023-01-03', cust: 'CustomerC', prod: 'ProductZ', demand: 150 }
        ],
        threshold: [0.7, 0.2, 0.1],
        agg_col: 'prod',
        value_col: 'demand',
        abc_name: 'abc',
        rank_name: 'rank'
      },
      description: 'ABC分析を実行します'
    },
    {
      name: 'treemap_visualization',
      endpoint: '/api/v1/abc/tree-map',
      defaultParams: {
        demand_data: [
          { date: '2023-01-01', cust: 'CustomerA', prod: 'ProductX', demand: 100 },
          { date: '2023-01-02', cust: 'CustomerB', prod: 'ProductY', demand: 200 }
        ]
      },
      description: '需要TreeMapを生成します'
    },
    {
      name: 'inventory_eoq',
      endpoint: '/api/v1/inventory/eoq',
      defaultParams: {
        annual_demand: 12000,
        order_cost: 100,
        holding_cost: 5,
        unit_cost: 10
      },
      description: 'EOQ（経済的発注量）を計算します'
    },
    {
      name: 'inventory_optimization',
      endpoint: '/api/v1/inventory/eoq',
      defaultParams: {
        annual_demand: 12000,
        order_cost: 100,
        holding_cost: 5,
        unit_cost: 10
      },
      description: '在庫最適化（EOQ）を実行します'
    },
    {
      name: 'wagner_whitin',
      endpoint: '/api/v1/inventory/wagner-whitin',
      defaultParams: {
        demands: [100, 150, 200, 120, 180],
        holding_cost: 2,
        setup_cost: 50
      },
      description: 'Wagner-Whitin動的計画法で在庫最適化を実行します'
    },
    {
      name: 'logistics_weiszfeld',
      endpoint: '/api/v1/logistics/weiszfeld',
      defaultParams: {
        customers: [
          { name: 'Customer1', latitude: 35.6762, longitude: 139.6503, demand: 50 },
          { name: 'Customer2', latitude: 35.6850, longitude: 139.7514, demand: 75 },
          { name: 'Customer3', latitude: 35.6586, longitude: 139.7454, demand: 100 }
        ],
        num_facilities: 2,
        max_iterations: 100,
        tolerance: 0.001
      },
      description: 'Weiszfeld法で最適施設配置を計算します'
    },
    {
      name: 'network_design',
      endpoint: '/api/v1/logistics/lnd',
      defaultParams: {
        customers: [
          { name: 'Customer1', latitude: 35.6762, longitude: 139.6503, demand: 50 },
          { name: 'Customer2', latitude: 35.6850, longitude: 139.7514, demand: 75 },
          { name: 'Customer3', latitude: 35.6586, longitude: 139.7454, demand: 100 }
        ],
        dc_candidates: [
          { name: 'DC1', latitude: 35.6895, longitude: 139.6917, fixed_cost: 1000 },
          { name: 'DC2', latitude: 35.6762, longitude: 139.7023, fixed_cost: 1200 }
        ]
      },
      description: 'ネットワーク設計と施設配置を最適化します'
    },
    {
      name: 'logistics_network_design',
      endpoint: '/api/v1/logistics/multi-source-lnd',
      defaultParams: {
        customers: [
          { name: 'Customer1', latitude: 35.6762, longitude: 139.6503, demand: 50 },
          { name: 'Customer2', latitude: 35.6850, longitude: 139.7514, demand: 75 },
          { name: 'Customer3', latitude: 35.6586, longitude: 139.7454, demand: 100 }
        ],
        dc_candidates: [
          { name: 'DC1', latitude: 35.6895, longitude: 139.6917, fixed_cost: 1000 },
          { name: 'DC2', latitude: 35.6762, longitude: 139.7023, fixed_cost: 1200 }
        ]
      },
      description: '物流ネットワーク設計を最適化します'
    },
    {
      name: 'generate_network_sample_data',
      endpoint: '/api/v1/logistics/generate-sample-data',
      defaultParams: {
        num_customers: 10,
        num_dc_candidates: 5,
        region: 'japan'
      },
      description: 'ネットワーク設計用のサンプルデータを生成します'
    }
  ];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'こんにちは！サプライチェーン最適化システムのAIアシスタントです。\n\n以下のような分析や最適化をお手伝いできます：\n\n📊 **商品分析** - どの商品が最も重要か分析します\n🚚 **配送計画** - 効率的な配送ルートを計算します\n📦 **在庫最適化** - 最適な発注量やタイミングを計算します\n🏭 **施設配置** - 倉庫や配送センターの最適な場所を見つけます\n\n例えば「在庫を最適化したい」「商品の重要度を分析して」などとお話しください。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // バックエンドAPIを直接呼び出す関数
  const executeFunction = async (functionName: string, args: any): Promise<any> => {
    const functionConfig = availableFunctions.find(f => f.name === functionName);
    if (!functionConfig) {
      return null; // 該当する機能がない場合はnullを返す
    }

    try {
      const response = await fetch(`http://localhost:8000${functionConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(functionConfig.defaultParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error(`Function execution error for ${functionName}:`, error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let response;
      let assistantResponse;

      if (apiSettings.provider === 'gemini') {
        // Gemini API呼び出し
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiSettings.geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: buildPrompt(userMessage.content, messages)
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 2048
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API error! status: ${response.status}`);
        }

        const data = await response.json();
        assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'すみません、応答を生成できませんでした。';
      } else {
        // Ollama API呼び出し
        response = await fetch(`${apiSettings.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: apiSettings.ollamaModel,
            prompt: buildPrompt(userMessage.content, messages),
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API error! status: ${response.status}`);
        }

        const data = await response.json();
        assistantResponse = data.response || 'すみません、応答を生成できませんでした。';
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      // 機能呼び出しのパターンをチェック
      const functionCall = extractFunctionCall(assistantResponse);
      if (functionCall) {
        assistantMessage.functionCall = functionCall;
        try {
          // 直接実行を試行
          const directResult = await executeFunction(functionCall.name, functionCall.arguments);
          if (directResult) {
            assistantMessage.functionCall.result = directResult;
            // ユーザーフレンドリーなメッセージに変更
            const friendlyMessages = {
              'abc_analysis': 'ABC分析を完了しました。結果をご確認ください。',
              'treemap_visualization': '需要TreeMapを生成しました。',
              'inventory_eoq': 'EOQ（経済的発注量）を計算しました。',
              'inventory_optimization': '在庫最適化を完了しました。結果をご確認ください。',
              'wagner_whitin': 'Wagner-Whitin動的計画法による在庫最適化を完了しました。',
              'logistics_weiszfeld': '最適施設配置を計算しました。',
              'network_design': 'ネットワーク設計を完了しました。結果をご確認ください。',
              'logistics_network_design': '物流ネットワーク設計を完了しました。結果をご確認ください。',
              'generate_network_sample_data': 'ネットワーク設計用のサンプルデータを生成しました。'
            };
            const friendlyMessage = friendlyMessages[functionCall.name as keyof typeof friendlyMessages] || '解析を完了しました。';
            // FUNCTION_CALL行とその前後の改行を削除
            assistantMessage.content = assistantMessage.content
              .replace(/\n*FUNCTION_CALL:.*?\)\n*/g, '')
              .replace(/^\s+|\s+$/g, '');
            assistantMessage.content += `\n\n✅ ${friendlyMessage}`;
          } 
          // フォールバック: タブ切り替え
          else if (onFunctionCall) {
            const tabResult = await onFunctionCall(functionCall.name, functionCall.arguments);
            assistantMessage.functionCall.result = tabResult;
            assistantMessage.content += `\n\n✅ 該当するタブに切り替えました。`;
          }
        } catch (error) {
          // エラー時も自然なメッセージに
          assistantMessage.content = `申し訳ございません。処理中にエラーが発生しました。\n\n別の方法で再度お試しいただくか、より具体的な条件をお知らせください。`;
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `申し訳ございません。エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}\n\n${apiSettings.provider === 'ollama' ? 'Ollamaが起動していることを確認してください。' : 'Gemini API キーが正しく設定されていることを確認してください。'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildPrompt = (userInput: string, previousMessages: Message[]): string => {
    const systemPrompt = `You are an AI assistant for a Supply Chain Management Optimization System. You help users analyze and optimize their supply chain operations.

Available Functions:
1. ABC分析 - 商品や顧客の重要度を分類
2. 需要TreeMap - 需要パターンを視覚化
3. 配送計画VRP - 配送ルートを最適化
4. 在庫最適化 - 在庫レベルを最適化（EOQ、Wagner-Whitin法）
5. 物流ネットワーク設計 - 施設配置を最適化
6. サンプルデータ生成 - ネットワーク設計用のサンプルデータを生成

When a user requests to analyze or optimize something, determine the appropriate function and respond naturally in Japanese. Include a function call in this specific format:
FUNCTION_CALL: function_name(arguments)

Examples:
- If user asks about product importance: FUNCTION_CALL: abc_analysis({"data_type": "sales"})
- If user asks about inventory optimization: FUNCTION_CALL: inventory_optimization({"method": "eoq"})
- If user specifically mentions EOQ: FUNCTION_CALL: inventory_eoq({"annual_demand": 12000})
- If user asks for network design sample data: FUNCTION_CALL: generate_network_sample_data({"num_customers": 10})

IMPORTANT RULES:
1. Always respond naturally in Japanese as if having a conversation
2. Don't mention "関数を呼び出します" or technical implementation details
3. Don't create fake user responses like "ユーザー: ..."
4. Simply explain what you're going to do and include the FUNCTION_CALL
5. Focus on being helpful and explaining the business value, not the technical process`;

    const conversationHistory = previousMessages
      .filter(msg => msg.type !== 'system')
      .slice(-5) // 最新5件のみ
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    return `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nUser: ${userInput}\nAssistant:`;
  };

  const extractFunctionCall = (response: string): { name: string; arguments: any } | null => {
    const functionCallMatch = response.match(/FUNCTION_CALL:\s*(\w+)\((.+?)\)/);
    if (functionCallMatch) {
      try {
        const functionName = functionCallMatch[1];
        const argsString = functionCallMatch[2];
        const args = JSON.parse(argsString);
        return { name: functionName, arguments: args };
      } catch (error) {
        console.error('Function call parsing error:', error);
      }
    }
    return null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (message: Message) => {
    return (
      <ReactMarkdown
        components={{
          // カスタムスタイリング用のコンポーネント
          p: ({children}) => <p style={{margin: '0.5em 0'}}>{children}</p>,
          ul: ({children}) => <ul style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ul>,
          ol: ({children}) => <ol style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>{children}</ol>,
          li: ({children}) => <li style={{marginBottom: '0.3em'}}>{children}</li>,
          strong: ({children}) => <strong style={{color: '#2563eb'}}>{children}</strong>,
          h1: ({children}) => <h1 style={{fontSize: '1.4em', margin: '1em 0 0.5em', color: '#1f2937'}}>{children}</h1>,
          h2: ({children}) => <h2 style={{fontSize: '1.2em', margin: '0.8em 0 0.4em', color: '#1f2937'}}>{children}</h2>,
          h3: ({children}) => <h3 style={{fontSize: '1.1em', margin: '0.6em 0 0.3em', color: '#1f2937'}}>{children}</h3>,
          code: ({children}) => (
            <code style={{
              backgroundColor: '#f3f4f6',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontSize: '0.9em',
              fontFamily: 'monospace'
            }}>
              {children}
            </code>
          ),
          blockquote: ({children}) => (
            <blockquote style={{
              borderLeft: '4px solid #d1d5db',
              paddingLeft: '1em',
              margin: '1em 0',
              fontStyle: 'italic',
              color: '#6b7280'
            }}>
              {children}
            </blockquote>
          )
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>アシスタント</h2>
            <p>AI-Powered Supply Chain Optimization ({apiSettings.provider === 'gemini' ? 'Gemini' : 'Ollama'})</p>
          </div>
          <IconButton onClick={() => setSettingsOpen(true)} size="small">
            <SettingsIcon />
          </IconButton>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="message-type">
                {message.type === 'user' ? '👤' : message.type === 'system' ? '🛠️' : '🤖'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {formatMessage(message)}
              {message.functionCall && message.functionCall.result && (
                <ResultDisplay 
                  result={message.functionCall.result}
                  functionName={message.functionCall.name}
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-type">🤖</span>
              <span className="message-time">思考中...</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="質問を入力してください... (Enter: 送信, Shift+Enter: 改行)"
            disabled={isLoading}
            rows={3}
          />
          <button 
            onClick={sendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      <ApiKeySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(newSettings) => {
          setApiSettings(newSettings);
          localStorage.setItem('scmopt-api-settings', JSON.stringify(newSettings));
        }}
        currentSettings={apiSettings}
      />
    </div>
  );
};

export default ChatInterface;