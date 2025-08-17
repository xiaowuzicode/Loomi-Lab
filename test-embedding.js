#!/usr/bin/env node

/**
 * OpenAI Embedding API 测试工具
 * 用于测试不同的embedding模型是否可用
 */

const OpenAI = require('openai');

// 手动读取.env文件
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    });
  } catch (error) {
    console.warn('⚠️ 无法读取.env文件，使用系统环境变量');
  }
}

// 加载环境变量
loadEnvFile();

// 读取环境变量
const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

console.log('🔧 OpenAI API 测试配置:');
console.log(`API Key: ${apiKey ? `${apiKey.slice(0, 10)}...` : '未设置'}`);
console.log(`Base URL: ${baseURL}`);
console.log(`当前环境变量中的模型: ${process.env.OPENAI_EMBEDDING_MODEL}`);
console.log('='.repeat(50));

// 创建OpenAI客户端
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL
});

// 测试的embedding模型列表
const modelsToTest = [
  'text-embedding-ada-002',
  'text-embedding-3-small', 
  'text-embedding-3-large',
  'text-embedding-v4'
];

// 测试用文本
const testText = '这是一个测试文本，用于验证embedding模型是否正常工作。';

async function testEmbeddingModel(modelName) {
  console.log(`\n🧪 测试模型: ${modelName}`);
  
  try {
    const startTime = Date.now();
    
    const response = await openai.embeddings.create({
      model: modelName,
      input: testText,
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.data && response.data[0] && response.data[0].embedding) {
      const embedding = response.data[0].embedding;
      console.log(`✅ ${modelName} - 成功!`);
      console.log(`   向量维度: ${embedding.length}`);
      console.log(`   响应时间: ${duration}ms`);
      console.log(`   前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      return true;
    } else {
      console.log(`❌ ${modelName} - 响应格式异常`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${modelName} - 失败:`);
    console.log(`   错误类型: ${error.constructor.name}`);
    console.log(`   状态码: ${error.status || 'N/A'}`);
    console.log(`   错误信息: ${error.message}`);
    
    if (error.error) {
      console.log(`   详细错误: ${JSON.stringify(error.error, null, 2)}`);
    }
    
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 开始测试所有embedding模型...\n');
  
  const results = {};
  
  for (const model of modelsToTest) {
    results[model] = await testEmbeddingModel(model);
    // 在测试之间稍等一下避免API限流
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(50));
  
  const successModels = [];
  const failedModels = [];
  
  for (const [model, success] of Object.entries(results)) {
    if (success) {
      successModels.push(model);
      console.log(`✅ ${model} - 可用`);
    } else {
      failedModels.push(model);
      console.log(`❌ ${model} - 不可用`);
    }
  }
  
  console.log(`\n🎯 推荐配置:`);
  if (successModels.length > 0) {
    console.log(`建议在.env中设置: OPENAI_EMBEDDING_MODEL=${successModels[0]}`);
  } else {
    console.log(`⚠️ 所有模型都不可用，建议:`);
    console.log(`1. 检查VPN连接`);
    console.log(`2. 联系API网关管理员`);
    console.log(`3. 暂时使用模拟向量 (注释掉OPENAI_API_KEY)`);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testEmbeddingModel, runAllTests };
